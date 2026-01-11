import hre from "hardhat";

async function main() {
    console.log("🚀 Deploying RideBNB System to opBNB Testnet...\n");

    // Get deployment parameters from environment
    const feeReceiver = process.env.FEE_RECEIVER_ADDRESS;
    const ownerAddress = process.env.OWNER_ADDRESS;
    const defaultRefer = process.env.DEFAULT_REFER_ID || "73928";

    // Validate required parameters
    if (!feeReceiver || !ownerAddress) {
        throw new Error(
            "Missing required environment variables. Please check .env file:\n" +
            "- FEE_RECEIVER_ADDRESS\n" +
            "- OWNER_ADDRESS\n" +
            "- PRIVATE_KEY\n" +
            "- DEFAULT_REFER_ID (optional, defaults to 73928)"
        );
    }

    console.log("📋 Deployment Parameters:");
    console.log("==========================");
    console.log("Fee Receiver:", feeReceiver);
    console.log("Owner Address:", ownerAddress);
    console.log("Root User ID:", defaultRefer);
    console.log("");

    // Step 1: Deploy Royalty Contract
    console.log("1️⃣  Deploying Royalty Contract...");
    const Royalty = await hre.ethers.getContractFactory("Royalty");
    const royalty = await Royalty.deploy(ownerAddress, defaultRefer);
    await royalty.waitForDeployment();
    const royaltyAddress = await royalty.getAddress();
    console.log("✅ Royalty deployed at:", royaltyAddress);
    console.log("");

    // Step 2: Deploy RideBNB Contract
    console.log("2️⃣  Deploying RideBNB Contract...");
    const RideBNB = await hre.ethers.getContractFactory("RideBNB");
    const rideBNB = await RideBNB.deploy(
        feeReceiver,
        royaltyAddress,
        ownerAddress,
        defaultRefer
    );
    await rideBNB.waitForDeployment();
    const rideBNBAddress = await rideBNB.getAddress();
    console.log("✅ RideBNB deployed at:", rideBNBAddress);
    console.log("");

    // Step 3: Connect Contracts
    console.log("3️⃣  Connecting Contracts...");
    const tx = await royalty.setRideBNBContract(rideBNBAddress);
    await tx.wait();
    console.log("✅ Contracts connected!");
    console.log("");

    // Get network info
    const network = await hre.ethers.provider.getNetwork();
    const chainId = Number(network.chainId);
    const isTestnet = chainId === 5611;
    const networkName = isTestnet ? "opBNB Testnet" : "opBNB Mainnet";
    const explorerBase = isTestnet ? "https://opbnb-testnet.bscscan.com" : "https://opbnb.bscscan.com";

    // Summary
    console.log("\n🎉 Deployment Complete!");
    console.log("======================");
    console.log(`Network: ${networkName} (Chain ID: ${chainId})`);
    console.log("");
    console.log("📝 Deployed Contracts:");
    console.log("----------------------");
    console.log("Royalty:", royaltyAddress);
    console.log(`  → ${explorerBase}/address/${royaltyAddress}`);
    console.log("");
    console.log("RideBNB:", rideBNBAddress);
    console.log(`  → ${explorerBase}/address/${rideBNBAddress}`);
    console.log("");
    console.log("Root User ID:", defaultRefer);
    console.log("");

    console.log("📋 Next Steps:");
    console.log("==============");
    console.log("1. Update .env.local with new addresses:");
    console.log(`   NEXT_PUBLIC_RIDEBNB_ADDRESS=${rideBNBAddress}`);
    console.log(`   NEXT_PUBLIC_ROYALTY_ADDRESS=${royaltyAddress}`);
    console.log(`   NEXT_PUBLIC_DEFAULT_REFER=${defaultRefer}`);
    console.log("");
    console.log("2. Verify contracts (optional):");
    console.log(`   npx hardhat verify --network opbnbTestnet ${royaltyAddress} "${ownerAddress}" "${defaultRefer}"`);
    console.log(`   npx hardhat verify --network opbnbTestnet ${rideBNBAddress} "${feeReceiver}" "${royaltyAddress}" "${ownerAddress}" "${defaultRefer}"`);
    console.log("");
    console.log("✨ Features Enabled:");
    console.log("   ✅ Recurring royalty claims");
    console.log("   ✅ Root user at L13 in all tiers");
    console.log("   ✅ 150% dynamic income cap");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
