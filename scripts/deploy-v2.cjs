const { ethers } = require("hardhat");

/**
 * Deploy FiveDollarRide contract to BSC Testnet with all security fixes applied
 * 
 * Fixes included:
 * - Pause mechanism for emergencies
 * - Root fallback income events for transparency
 * - Level cost ascending validation
 * - getUpgradeCostFor() BSCScan-friendly function
 */

async function main() {
    console.log("\n" + "=".repeat(70));
    console.log("🚀 DEPLOYING FIVEDOLLARRIDE V2 - SECURITY HARDENED");
    console.log("=".repeat(70) + "\n");

    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log(`💼 Deploying from: ${deployer.address}`);

    // Check deployer balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰  Deployer BNB Balance: ${ethers.formatEther(balance)} BNB\n`);

    if (balance < ethers.parseEther("0.1")) {
        console.log("⚠️  WARNING: Low BNB balance. Deployment may fail.");
        console.log(`   Need at least 0.1 BNB for deployment + verification\n`);
    }

    // Configuration
    const config = {
        feeReceiver: process.env.FEE_RECEIVER || deployer.address,
        usdtAddress: process.env.USDT_BSC_TESTNET || "0x7F86d4EE5a9dAC4129e01DD91b63F120323bb26e",
        rootUserAddress: deployer.address,
        rootUserId: 73928,  // Same as before for continuity
    };

    console.log("📋 Deployment Configuration:");
    console.log(`   Fee Receiver: ${config.feeReceiver}`);
    console.log(`   USDT Address: ${config.usdtAddress}`);
    console.log(`   Root User: ${config.rootUserAddress}`);
    console.log(`   Root User ID: ${config.rootUserId}\n`);

    // Deploy Royalty Contract first
    console.log("📦 Step 1/3: Deploying Royalty Contract...");
    const Royalty = await ethers.getContractFactory("FiveDollarRideRoyalty");
    const royalty = await Royalty.deploy(
        deployer.address,
        config.rootUserId,
        config.usdtAddress
    );
    await royalty.waitForDeployment();
    const royaltyAddress = await royalty.getAddress();
    console.log(`✅ Royalty deployed at: ${royaltyAddress}\n`);

    // Deploy FiveDollarRide
    console.log("📦 Step 2/3: Deploying FiveDollarRide Contract...");
    const FiveDollarRide = await ethers.getContractFactory("FiveDollarRide");
    const contract = await FiveDollarRide.deploy(
        config.feeReceiver,
        royaltyAddress,
        config.rootUserAddress,
        config.rootUserId,
        config.usdtAddress
    );
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    console.log(`✅ FiveDollarRide deployed at: ${contractAddress}\n`);

    // Connect contracts
    console.log("🔗 Step 3/3: Connecting contracts...");
    const tx = await royalty.setFiveDollarRideContract(contractAddress);
    await tx.wait();
    console.log(`✅ Contracts connected!\n`);

    // Verify deployment
    console.log("🔍 Verifying deployment...");
    const totalUsers = await contract.totalUsers();
    const maxLevels = await contract.MAX_LEVELS();
    const isPaused = await contract.paused();

    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Max Levels: ${maxLevels}`);
    console.log(`   Contract Paused: ${isPaused}`);
    console.log(`   Autonomous: ${await contract.isAutonomous()}\n`);

    // Summary
    console.log("=".repeat(70));
    console.log("✅ DEPLOYMENT COMPLETE!");
    console.log("=".repeat(70));
    console.log(`\n📝 Contract Addresses:`);
    console.log(`   FiveDollarRide: ${contractAddress}`);
    console.log(`   Royalty: ${royaltyAddress}`);
    console.log(`   USDT: ${config.usdtAddress}\n`);

    console.log(`🔐 Security Features Enabled:`);
    console.log(`   ✅ Pause Mechanism`);
    console.log(`   ✅ Root Fallback Events`);
    console.log(`   ✅ Level Cost Validation`);
    console.log(`   ✅ BSCScan-Friendly Functions\n`);

    console.log(`📋 Next Steps:`);
    console.log(`   1. Verify contracts on BSCScan:`);
    console.log(`      npx hardhat verify --network bscTestnet ${contractAddress} "${config.feeReceiver}" "${royaltyAddress}" "${config.rootUserAddress}" ${config.rootUserId} "${config.usdtAddress}"`);
    console.log(`      npx hardhat verify --network bscTestnet ${royaltyAddress} "${deployer.address}" ${config.rootUserId} "${config.usdtAddress}"`);
    console.log(`   2. Test basic operations`);
    console.log(`   3. Update environment variables\n`);

    console.log(`💾 Save these to .env:`);
    console.log(`   FIVEDOLLARRIDE_BSC_TESTNET=${contractAddress}`);
    console.log(`   ROYALTY_BSC_TESTNET=${royaltyAddress}\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
