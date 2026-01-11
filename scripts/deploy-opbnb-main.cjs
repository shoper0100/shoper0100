const hre = require("hardhat");

/**
 * Deploy only Main Contract for opBNB (Royalty already deployed)
 */

async function main() {
    console.log("🚀 Deploying Main Contract only to opBNB...\n");

    const [deployer] = await hre.ethers.getSigners();
    const DEPLOYER_ADDRESS = await deployer.getAddress();

    // Configuration
    const FEE_RECEIVER = "0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0";
    const ROOT_USER_ADDRESS = DEPLOYER_ADDRESS;
    const ROOT_USER_ID = 73928;

    const ROYALTY_ADDRESS = "0xC28bff8879F5693227D1D14cdf4f174F876b9fb4"; // Already deployed
    const PRICE_FEED = "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526"; // opBNB Testnet

    console.log("📋 Configuration:");
    console.log(`   Network: ${hre.network.name}`);
    console.log(`   Deployer: ${DEPLOYER_ADDRESS}`);
    console.log(`   Fee Receiver: ${FEE_RECEIVER}`);
    console.log(`   Royalty: ${ROYALTY_ADDRESS}`);
    console.log(`   Price Feed: ${PRICE_FEED}\n`);

    // Deploy Main Contract
    console.log("📦 Deploying FiveDollarRide_BNB...");
    const FiveDollarRide = await hre.ethers.getContractFactory("FiveDollarRide_BNB");

    const mainContract = await FiveDollarRide.deploy(
        FEE_RECEIVER,
        PRICE_FEED,
        ROYALTY_ADDRESS,
        ROOT_USER_ADDRESS,
        ROOT_USER_ID
    );
    await mainContract.waitForDeployment();
    const mainAddress = await mainContract.getAddress();

    console.log(`✅ Main contract deployed to: ${mainAddress}\n`);

    // Link contracts
    console.log("📦 Linking contracts...");
    const royalty = await hre.ethers.getContractAt("FiveDollarRideRoyalty_BNB", ROYALTY_ADDRESS);
    const setTx = await royalty.setMainContract(mainAddress);
    await setTx.wait();
    console.log(`✅ Main contract set in royalty`);

    // Initialize royalty
    console.log("📦 Initializing royalty...");
    const initTx = await mainContract.initializeRoyalty();
    await initTx.wait();
    console.log(`✅ Royalty initialized\n`);

    console.log("📝 Deployment Summary:");
    console.log(`   Royalty: ${ROYALTY_ADDRESS}`);
    console.log(`   Main: ${mainAddress}`);
    console.log(`   Owner: ${DEPLOYER_ADDRESS}\n`);

    console.log("✅ Deployment complete!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
