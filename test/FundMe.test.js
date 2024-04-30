const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
describe("FundMe", async function () {
    let fundMe
    let deployer
    let mockV3Aggregator
    const sendValue = "1000000000000000000"//1 eth
    beforeEach(async function () {
      deployer = (await getNamedAccounts()).deployer;
      const contracts = await deployments.fixture(["all"]);
      const signer = await ethers.getSigner(deployer);
      const fundMeAddress = contracts["FundMe"].address;
      fundMe = await ethers.getContractAt("FundMe", fundMeAddress, signer);
      mockV3Aggregator = contracts["MockV3Aggregator"];
    });
     describe("constructor", async function () {
         it("sets the aggregator addresses correctly", async function () {
             const response = await fundMe.getPriceFeed()
             assert.equal(response, mockV3Aggregator.address)
         })
    })
    describe("fund", async function(){
        it("Fails if you don't send enough ETH",async function(){
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            )
        })
        it("updated the amount funded ds",async function(){
            await fundMe.fund({value: sendValue})
            const response = await fundMe.getAddressToAmountFunded(
                deployer
            )
            assert.equal(response.toString(), sendValue.toString())
        })
        it("Adds funder to array of funders",async function(){
            await fundMe.fund({value:sendValue});
            const funder =  await fundMe.getFunder(0);
            assert.equal(funder,deployer);
        })
    })


    describe("withdraw", async function () {
        beforeEach(async function () {
            await fundMe.fund({ value: sendValue });
        });

        it("Withdraw ETH from a single founder", async function () {
            // Arrange
            const startingFundMeBalance = await ethers.provider.getBalance(
                fundMe.target,
            );
            const startingDeployerBalance =
                await ethers.provider.getBalance(deployer);

            // Act
            const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            // Get the Gas price used
            const { gasUsed, gasPrice } = transactionReceipt;
            const gasCost = gasUsed * gasPrice;

            const endingFundMeBalance = await ethers.provider.getBalance(
                fundMe.target,
            );
            const endingDeployerBalance =
                await ethers.provider.getBalance(deployer);

            // Assert
            assert.equal(endingFundMeBalance, 0);
            assert.equal(
                startingFundMeBalance + startingDeployerBalance,
                endingDeployerBalance + gasCost,
            );
        });
    });
    
})