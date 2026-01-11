require('dotenv').config();
const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying FiveDollarRideRoyalty to opBNB Testnet...\n");

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "wei\n");

    // Configuration from .env
    const OWNER_ADDRESS = process.env.OWNER_ADDRESS || deployer.address;
    const ROOT_USER_ID = process.env.ROOT_USER_ID || "73928";
    const USDT_ADDRESS = process.env.USDT_OPBNB_TESTNET;

    if (!USDT_ADDRESS) {
        throw new Error("❌ USDT_OPBNB_TESTNET not set in .env file!");
    }

    console.log("📋 Deployment Configuration:");
    console.log("├─ Owner:", OWNER_ADDRESS);
    console.log("├─ Root User ID:", ROOT_USER_ID);
    console.log("└─ USDT Address:", USDT_ADDRESS);
    console.log("");

    // Deploy FiveDollarRideRoyalty
    console.log("📦 Deploying FiveDollarRideRoyalty contract...");
    const Royalty = await hre.ethers.getContractFactory("FiveDollarRideRoyalty");
    const royalty = await Royalty.deploy(
        OWNER_ADDRESS,
        ROOT_USER_ID,
        USDT_ADDRESS
    );

    await royalty.waitForDeployment();
    const royaltyAddress = await royalty.getAddress();

    console.log("✅ FiveDollarRideRoyalty deployed to:", royaltyAddress);
    console.log("");

    // Save deployment info
    const deploymentInfo = {
        network: "opBNB Testnet",
        chainId: 5611,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            FiveDollarRideRoyalty: royaltyAddress
        },
        config: {
            owner: OWNER_ADDRESS,
            rootUserId: ROOT_USER_ID,
            usdt: USDT_ADDRESS
        }
    };

    console.log("📝 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    console.log("");

    console.log("⏳ Waiting 30 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Verify on opBNBScan
    if (process.env.OPBNBSCAN_API_KEY) {
        console.log("🔍 Verifying contract on opBNBScan Testnet...");
        try {
            await hre.run("verify:verify", {
                address: royaltyAddress,
                constructorArguments: [
                    OWNER_ADDRESS,
                    ROOT_USER_ID,
                    USDT_ADDRESS
                ],
            });
            console.log("✅ Contract verified successfully!");
        } catch (error) {
            console.log("⚠️ Verification failed:", error.message);
            console.log("You can verify manually later");
        }
    } else {
        console.log("⚠️ OPBNBSCAN_API_KEY not set, skipping verification");
    }

    console.log("\n🎉 Deployment Complete!");
    console.log("\n📋 Next Steps:");
    console.log("1. Save the FiveDollarRideRoyalty address:", royaltyAddress);
    console.log("2. Add to .env: FIVEDOLLARRIDE_ROYALTY_TESTNET=" + royaltyAddress);
    console.log("3. Run: node scripts/deploy_fivedollarride_testnet.js");
    console.log("4. Then: node scripts/connect_contracts_testnet.js");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
