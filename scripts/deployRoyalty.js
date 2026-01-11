import hre from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("Deploying SimpleRoyaltyReceiver contract...");

    const feeReceiver = process.env.FEE_RECEIVER_ADDRESS;

    if (!feeReceiver) {
        throw new Error("FEE_RECEIVER_ADDRESS not found in .env file");
    }

    console.log("\nDeployment Parameters:");
    console.log("----------------------");
    console.log("Fee Receiver:", feeReceiver);
    console.log("");

    // Deploy the royalty receiver
    const SimpleRoyaltyReceiver = await hre.ethers.getContractFactory("SimpleRoyaltyReceiver");
    const royaltyReceiver = await SimpleRoyaltyReceiver.deploy(feeReceiver);

    await royaltyReceiver.waitForDeployment();

    const royaltyAddress = await royaltyReceiver.getAddress();

    console.log("\n✅ SimpleRoyaltyReceiver deployed successfully!");
    console.log("==============================================");
    console.log("Royalty Contract Address:", royaltyAddress);
    console.log("Fee Receiver Address:", feeReceiver);
    console.log("Network: opBNB Mainnet (Chain ID: 204)");
    console.log("Explorer:", `https://opbnb.bscscan.com/address/${royaltyAddress}`);
    console.log("\n⚠️  IMPORTANT: Save this address!");
    console.log("Add to your .env file:");
    console.log(`ROYALTY_ADDRESS=${royaltyAddress}`);
    console.log("\nNow you can deploy the main RideBNB contract using:");
    console.log("npx hardhat run scripts/deploy.js --network opbnb");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
