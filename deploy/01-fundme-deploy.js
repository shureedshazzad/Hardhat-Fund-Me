//import
//main function
//calling for main function

const { network } = require("hardhat");
const { verify } = require("../utils/verify")

// function deployFunc()
// {
//     console.log("Hi!");
// }
// module.exports.default = deployFunc

const {networkConfig,developmentChains} = require("../helper-hardhat-config");

 

module.exports = async({getNamedAccounts,deployments}) =>{
    const {deploy,log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId

    //if chainId is X use address y
    //if chainId is Z use address A

    //const ethUsdPriceFeedAdress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    if (chainId == 31337) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    //if the contract doesn't exist ,we deploy a minimal version of 
    //for our local testing

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("----------------------------------")

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, [ethUsdPriceFeedAddress])
    }

   

}

module.exports.tags = ["all", "fundme"]