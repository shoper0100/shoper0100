const hre = require("hardhat");

/**
 * Fixed deployment script for FiveDollarRide_BNB and FiveDollarRideRoyalty_BNB
 * BSC Testnet & Mainnet compatible
 * 
 * Deploy order:
 * 1. Deploy Royalty (with zero address for main contract)
 * 2. Deploy Main Contract (with royalty address)
 * 3. Set main contract address in royalty
 */

async function main() {
    console.log("🚀 Starting BNB contracts deployment...\n");

    // Get deployer address
    const [deployer] = await hre.ethers.getSigners();
    const DEPLOYER_ADDRESS = await deployer.getAddress();

    // Configuration
    const FEE_RECEIVER = process.env.FEE_RECEIVER || "0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0"; // Fee receiver (different)
    const ROOT_USER_ADDRESS = DEPLOYER_ADDRESS; // Root user is deployer
    const ROOT_USER_ID = 73928; // User's root ID

    // Chainlink BNB/USD Price Feed addresses
    const PRICE_FEEDS = {
        bscTestnet: "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526",
        bsc: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE",
        opbnbTestnet: "0x73110e8602930f01bb584Bc683C5Aa2Fb4D42419",
        opbnb: DEPLOYER_ADDRESS // Dummy address - manual price updates only
    };

    const network = hre.network.name;
    const PRICE_FEED = PRICE_FEEDS[network] || PRICE_FEEDS.bscTestnet;

    console.log("📋 Deployment Configuration:");
    console.log(`   Network: ${network}`);
    console.log(`   Deployer (Owner): ${DEPLOYER_ADDRESS}`);
    console.log(`   Fee Receiver: ${FEE_RECEIVER}`);
    console.log(`   Root User: ${ROOT_USER_ADDRESS}`);
    console.log(`   Root ID: ${ROOT_USER_ID}`);
    console.log(`   Price Feed: ${PRICE_FEED}\n`);

    // Deploy Royalty Contract First (with zero address for main contract)
    console.log("📦 Step 1: Deploying FiveDollarRideRoyalty_BNB...");
    const Royalty = await hre.ethers.getContractFactory("FiveDollarRideRoyalty_BNB");

    const royalty = await Royalty.deploy(
        DEPLOYER_ADDRESS,                // owner (deployer, not fee receiver!)
        ROOT_USER_ADDRESS,               // defaultRefer
        "0x0000000000000000000000000000000000000000"  // Zero address initially
    );
    await royalty.waitForDeployment();
    const royaltyAddress = await royalty.getAddress();

    console.log(`✅ Royalty deployed to: ${royaltyAddress}\n`);

    // Deploy Main Contract
    console.log("📦 Step 2: Deploying FiveDollarRide_BNB...");
    const FiveDollarRide = await hre.ethers.getContractFactory("FiveDollarRide_BNB");

    const mainContract = await FiveDollarRide.deploy(
        FEE_RECEIVER,
        PRICE_FEED,
        royaltyAddress,
        ROOT_USER_ADDRESS,
        ROOT_USER_ID
    );
    await mainContract.waitForDeployment();
    const mainAddress = await mainContract.getAddress();

    console.log(`✅ Main contract deployed to: ${mainAddress}\n`);

    // Set main contract address in royalty
    console.log("📦 Step 3: Linking contracts...");
    const setTx = await royalty.setMainContract(mainAddress);
    await setTx.wait();
    console.log(`✅ Main contract set in royalty`);

    // Initialize royalty for root user
    console.log("📦 Step 4: Initializing royalty...");
    const initTx = await mainContract.initializeRoyalty();
    await initTx.wait();
    console.log(`✅ Royalty initialized\n`);

    // Verify deployment
    console.log("🔍 Verifying deployment...");
    const owner = await mainContract.owner();
    const cachedPrice = await mainContract.cachedBNBPrice();
    const totalUsers = await mainContract.totalUsers();
    const royaltyMainContract = await royalty.MAIN_CONTRACT();

    console.log(`   Owner: ${owner}`);
    console.log(`   Initial BNB Price: $${(Number(cachedPrice) / 1e8).toFixed(2)}`);
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Royalty Main Contract: ${royaltyMainContract}`);
    console.log(`   Contracts Linked: ${royaltyMainContract === mainAddress ? '✅' : '❌'}\n`);

    // Save deployment info
    const deploymentInfo = {
        network: network,
        timestamp: new Date().toISOString(),
        contracts: {
            main: mainAddress,
            royalty: royaltyAddress
        },
        config: {
            feeReceiver: FEE_RECEIVER,
            priceFeed: PRICE_FEED,
            rootUser: ROOT_USER_ADDRESS,
            rootId: ROOT_USER_ID
        },
        status: {
            contractsLinked: royaltyMainContract === mainAddress,
            initialPrice: (Number(cachedPrice) / 1e8).toFixed(2),
            rootUserCreated: Number(totalUsers) === 1
        }
    };

    console.log("📝 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    console.log("\n⚠️  IMPORTANT NEXT STEPS:");
    console.log("1. Update .env with new contract addresses:");
    console.log(`   FIVEDOLLARRIDE_BNB_${network.toUpperCase()}=${mainAddress}`);
    console.log(`   ROYALTY_BNB_${network.toUpperCase()}=${royaltyAddress}`);
    console.log("\n2. Verify contracts on BSCScan:");
    console.log(`   npx hardhat verify --network ${network} ${mainAddress} "${FEE_RECEIVER}" "${PRICE_FEED}" "${royaltyAddress}" "${ROOT_USER_ADDRESS}" ${ROOT_USER_ID}`);
    console.log(`   npx hardhat verify --network ${network} ${royaltyAddress} "${FEE_RECEIVER}" "${ROOT_USER_ADDRESS}" "0x0000000000000000000000000000000000000000"`);
    console.log("\n✅ Deployment complete!\\n");

    return deploymentInfo;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
