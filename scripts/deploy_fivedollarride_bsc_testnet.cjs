require('dotenv').config();
const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying FiveDollarRide to BSC Testnet...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "wei\n");

    const FEE_RECEIVER = process.env.FEE_RECEIVER;
    const ROOT_USER_ADDRESS = process.env.ROOT_USER_ADDRESS;
    const ROOT_USER_ID = process.env.ROOT_USER_ID || "73928";
    const USDT_ADDRESS = process.env.USDT_BSC_TESTNET;
    const ROYALTY_ADDRESS = process.env.FIVEDOLLARRIDE_ROYALTY_BSC_TESTNET;

    if (!FEE_RECEIVER) throw new Error("❌ FEE_RECEIVER not set in .env!");
    if (!ROOT_USER_ADDRESS) throw new Error("❌ ROOT_USER_ADDRESS not set in .env!");
    if (!USDT_ADDRESS) throw new Error("❌ USDT_BSC_TESTNET not set in .env!");
    if (!ROYALTY_ADDRESS) throw new Error("❌ FIVEDOLLARRIDE_ROYALTY_BSC_TESTNET not set in .env! Deploy Royalty first.");

    console.log("📋 Deployment Configuration:");
    console.log("├─ Fee Receiver:", FEE_RECEIVER);
    console.log("├─ Root User Address:", ROOT_USER_ADDRESS);
    console.log("├─ Root User ID:", ROOT_USER_ID);
    console.log("├─ USDT Address:", USDT_ADDRESS);
    console.log("└─ Royalty Address:", ROYALTY_ADDRESS);
    console.log("");

    console.log("📦 Deploying FiveDollarRide contract...");
    const FiveDollarRide = await hre.ethers.getContractFactory("FiveDollarRide");
    const fiveDollarRide = await FiveDollarRide.deploy(
        FEE_RECEIVER,
        ROYALTY_ADDRESS,
        ROOT_USER_ADDRESS,
        ROOT_USER_ID,
        USDT_ADDRESS
    );

    await fiveDollarRide.waitForDeployment();
    const fiveDollarRideAddress = await fiveDollarRide.getAddress();

    console.log("✅ FiveDollarRide deployed to:", fiveDollarRideAddress);
    console.log("");

    const deploymentInfo = {
        network: "BSC Testnet",
        chainId: 97,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            FiveDollarRide: fiveDollarRideAddress,
            FiveDollarRideRoyalty: ROYALTY_ADDRESS
        },
        config: {
            feeReceiver: FEE_RECEIVER,
            rootUserAddress: ROOT_USER_ADDRESS,
            rootUserId: ROOT_USER_ID,
            usdt: USDT_ADDRESS
        }
    };

    console.log("📝 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    console.log("");

    console.log("⏳ Waiting 30 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    if (process.env.BSCSCAN_API_KEY) {
        console.log("🔍 Verifying contract on BscScan...");
        try {
            await hre.run("verify:verify", {
                address: fiveDollarRideAddress,
                constructorArguments: [
                    FEE_RECEIVER,
                    ROYALTY_ADDRESS,
                    ROOT_USER_ADDRESS,
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
        console.log("⚠️ BSCSCAN_API_KEY not set, skipping verification");
    }

    console.log("\n🎉 Deployment Complete!");
    console.log("\n📋 Next Steps:");
    console.log("1. Save the FiveDollarRide address:", fiveDollarRideAddress);
    console.log("2. Add to .env: FIVEDOLLARRIDE_BSC_TESTNET=" + fiveDollarRideAddress);
    console.log("3. Run: node scripts/connect_contracts_bsc_testnet.cjs");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
