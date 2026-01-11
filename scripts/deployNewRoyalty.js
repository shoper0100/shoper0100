import hre from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("🚀 Deploying New Royalty Contract...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

    // Configuration
    const OWNER_ADDRESS = process.env.OWNER_ADDRESS || deployer.address;
    const DEFAULT_REFER = process.env.DEFAULT_REFER || "73928";

    console.log("Configuration:");
    console.log("- Owner:", OWNER_ADDRESS);
    console.log("- Default Refer ID:", DEFAULT_REFER, "\n");

    // Deploy Royalty contract
    console.log("Deploying Royalty contract...");
    const Royalty = await hre.ethers.getContractFactory("Royalty");
    const royalty = await Royalty.deploy(OWNER_ADDRESS, DEFAULT_REFER);
    await royalty.waitForDeployment();

    const royaltyAddress = await royalty.getAddress();
    console.log("✅ Royalty deployed to:", royaltyAddress, "\n");

    // Display configuration
    const royaltyPercents = await royalty.getRoyaltyPercents();
    const royaltyLevels = await royalty.getRoyaltyLevels();
    console.log("Royalty Tiers:");
    for (let i = 0; i < 4; i++) {
        console.log(`- Tier ${i}: Level ${royaltyLevels[i]} = ${royaltyPercents[i]}%`);
    }

    console.log("\n📋 Deployment Summary:");
    console.log("=".repeat(50));
    console.log("Royalty Contract:", royaltyAddress);
    console.log("Network:", hre.network.name);
    console.log("Owner:", OWNER_ADDRESS);
    console.log("=".repeat(50));

    console.log("\n⚠️  IMPORTANT: Save this address!");
    console.log("Add to your .env file:");
    console.log(`ROYALTY_ADDRESS=${royaltyAddress}`);

    console.log("\n🎉 Deployment complete!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
