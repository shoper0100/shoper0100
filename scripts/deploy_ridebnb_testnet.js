const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying RideBNB_USDT to opBNB Testnet...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "BNB");

    if (balance == 0n) {
        console.log("\n❌ ERROR: No BNB in account!");
        console.log("Get testnet BNB from: https://testnet.bnbchain.org/faucet-smart");
        process.exit(1);
    }

    // Constructor parameters
    const feeReceiver = process.env.FEE_RECEIVER || deployer.address;
    const royaltyAddress = process.env.ROYALTY_ADDRESS;
    const rootUserAddress = process.env.ROOT_USER_ADDRESS || deployer.address;
    const rootUserId = process.env.ROOT_USER_ID || "73928";
    const usdtAddress = process.env.USDT_OPBNB_TESTNET || "0x0000000000000000000000000000000000000000";

    // Validation
    if (!royaltyAddress || royaltyAddress === "0x0000000000000000000000000000000000000000") {
        console.log("\n❌ ERROR: ROYALTY_ADDRESS not set in .env!");
        console.log("Deploy Royalty contract first, then set ROYALTY_ADDRESS in .env");
        process.exit(1);
    }

    if (usdtAddress === "0x0000000000000000000000000000000000000000") {
        console.log("\n⚠️  WARNING: USDT_OPBNB_TESTNET not set in .env");
        console.log("Using placeholder address - contract will deploy but won't work!");
    }

    console.log("\n📋 Deployment Parameters:");
    console.log("   Fee Receiver:", feeReceiver);
    console.log("   Royalty Contract:", royaltyAddress);
    console.log("   Root User Address:", rootUserAddress);
    console.log("   Root User ID:", rootUserId);
    console.log("   USDT Address:", usdtAddress);

    console.log("\n⏳ Deploying contract...");

    const RideBNB = await hre.ethers.getContractFactory("RideBNB_USDT");
    const rideBNB = await RideBNB.deploy(
        feeReceiver,
        royaltyAddress,
        rootUserAddress,
        rootUserId,
        usdtAddress
    );

    await rideBNB.waitForDeployment();
    const address = await rideBNB.getAddress();

    console.log("\n✅ RideBNB_USDT deployed successfully!");
    console.log("📍 Contract Address:", address);
    console.log("🔗 View on Explorer:", `https://opbnb-testnet.bscscan.com/address/${address}`);

    console.log("\n📝 NEXT STEPS:");
    console.log("1. Add to .env file:");
    console.log(`   RIDEBNB_ADDRESS=${address}`);
    console.log("2. Wait 30 seconds for indexing");
    console.log("3. Run connect_contracts_testnet.js");

    // Wait for confirmations
    console.log("\n⏳ Waiting for 5 block confirmations...");
    await rideBNB.deploymentTransaction().wait(5);
    console.log("✅ Confirmed!");

    return address;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
