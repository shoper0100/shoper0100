require('dotenv').config();
const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying Test USDT to BSC Testnet...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "wei\n");

    const INITIAL_SUPPLY = 50000; // 50,000 USDT

    console.log("📦 Deploying TestUSDT contract...");
    console.log("Initial Supply:", INITIAL_SUPPLY, "USDT");

    const TestUSDT = await hre.ethers.getContractFactory("TestUSDT");
    const usdt = await TestUSDT.deploy(INITIAL_SUPPLY);

    await usdt.waitForDeployment();
    const usdtAddress = await usdt.getAddress();

    console.log("✅ TestUSDT deployed to:", usdtAddress);
    console.log("");

    const balance = await usdt.balanceOf(deployer.address);
    console.log("📊 Deployer USDT balance:", hre.ethers.formatEther(balance), "USDT");
    console.log("");

    console.log("⏳ Waiting 30 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    if (process.env.BSCSCAN_API_KEY) {
        console.log("🔍 Verifying contract on BscScan...");
        try {
            await hre.run("verify:verify", {
                address: usdtAddress,
                constructorArguments: [INITIAL_SUPPLY],
            });
            console.log("✅ Contract verified successfully!");
        } catch (error) {
            console.log("⚠️ Verification failed:", error.message);
        }
    }

    console.log("\n🎉 Deployment Complete!");
    console.log("\n📋 TestUSDT Details:");
    console.log("Address:", usdtAddress);
    console.log("Total Supply:", INITIAL_SUPPLY, "USDT");
    console.log("Your Balance:", hre.ethers.formatEther(balance), "USDT");
    console.log("\n📋 To use with FiveDollarRide:");
    console.log("Update .env: USDT_BSC_TESTNET=" + usdtAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
