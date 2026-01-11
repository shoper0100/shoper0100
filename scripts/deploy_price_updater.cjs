const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying Chainlink Price Updater to BSC Mainnet...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // BSC Mainnet Chainlink BNB/USD Price Feed
    const CHAINLINK_BNB_USD_BSC = "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE";

    // Your Main Contract Address
    const MAIN_CONTRACT = "0xb450B0EAD1412DA25a83e57f97269eDFE5e7820b";

    console.log("\n📋 Configuration:");
    console.log("Chainlink Feed:", CHAINLINK_BNB_USD_BSC);
    console.log("Main Contract:", MAIN_CONTRACT);

    console.log("\n=== Deploying Price Updater ===");
    const UpdaterFactory = await hre.ethers.getContractFactory("ChainlinkPriceUpdater");
    const updater = await UpdaterFactory.deploy(
        CHAINLINK_BNB_USD_BSC,
        MAIN_CONTRACT
    );
    await updater.waitForDeployment();
    const updaterAddress = await updater.getAddress();

    console.log("✓ Price Updater deployed to:", updaterAddress);

    // Get initial price
    const currentPrice = await updater.getLatestPrice();
    console.log("\n=== Initial Setup ===");
    console.log("Current BNB Price:", hre.ethers.formatEther(currentPrice), "USD");

    console.log("\n=== 🎉 DEPLOYMENT SUMMARY 🎉 ===");
    console.log("Price Updater:", updaterAddress);
    console.log("Chainlink Feed:", CHAINLINK_BNB_USD_BSC);
    console.log("Main Contract:", MAIN_CONTRACT);
    console.log("Min Update Interval: 1 hour");
    console.log("Price Deviation Threshold: 5%");

    console.log("\n=== Verification Command ===");
    console.log(`npx hardhat verify --network bsc ${updaterAddress} "${CHAINLINK_BNB_USD_BSC}" "${MAIN_CONTRACT}"`);

    console.log("\n=== Next Steps ===");
    console.log("1. Verify contract on BscScan");
    console.log("2. Transfer updater ownership to main contract owner");
    console.log("3. Test price update: await updater.updatePrice()");
    console.log("4. Set up automated cron job to call updatePrice() periodically");

    // Save deployment info
    const fs = require('fs');
    const deployment = {
        network: "BSC Mainnet",
        timestamp: new Date().toISOString(),
        updaterContract: updaterAddress,
        chainlinkFeed: CHAINLINK_BNB_USD_BSC,
        mainContract: MAIN_CONTRACT,
        currentBNBPrice: hre.ethers.formatEther(currentPrice)
    };
    fs.writeFileSync('deployment-price-updater.json', JSON.stringify(deployment, null, 2));
    console.log("\n✓ Deployment info saved to deployment-price-updater.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
