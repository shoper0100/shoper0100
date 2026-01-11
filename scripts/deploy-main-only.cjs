const hre = require("hardhat");

/**
 * Deploy only Main Contract (Royalty already deployed)
 */

async function main() {
    console.log("🚀 Deploying Main Contract only...\n");

    // Configuration - YOUR ADDRESS
    const FEE_RECEIVER = "0xd9a3044CD5a329b16d5e1E02b0E64FBE18E6bf12";
    const ROOT_USER_ADDRESS = FEE_RECEIVER;
    const ROOT_USER_ID = 73928;

    const ROYALTY_ADDRESS = "0xf184d877157e24E0A03A35BDd15314F0E5884144"; // Already deployed

    const PRICE_FEEDS = {
        bscTestnet: "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526",
        bsc: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE"
    };

    const network = hre.network.name;
    const PRICE_FEED = PRICE_FEEDS[network] || PRICE_FEEDS.bscTestnet;

    console.log("📋 Configuration:");
    console.log(`   Network: ${network}`);
    console.log(`   Fee Receiver: ${FEE_RECEIVER}`);
    console.log(`   Root User: ${ROOT_USER_ADDRESS}`);
    console.log(`   Root ID: ${ROOT_USER_ID}`);
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

    // Verify deployment
    const owner = await mainContract.owner();
    const cachedPrice = await mainContract.cachedBNBPrice();
    const royaltyMain = await royalty.MAIN_CONTRACT();

    console.log("🔍 Verification:");
    console.log(`   Owner: ${owner}`);
    console.log(`   BNB Price: $${(Number(cachedPrice) / 1e8).toFixed(2)}`);
    console.log(`   Linked: ${royaltyMain === mainAddress ? '✅' : '❌'}\n`);

    console.log("📝 Deployment Summary:");
    console.log(`   Royalty: ${ROYALTY_ADDRESS}`);
    console.log(`   Main: ${mainAddress}`);
    console.log(`   Owner: ${FEE_RECEIVER}`);
    console.log(`   Root ID: ${ROOT_USER_ID}\n`);

    console.log("✅ Deployment complete!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
