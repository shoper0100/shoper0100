require("dotenv").config();
const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying RideBNB with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Get deployment parameters from .env
    const feeReceiver = process.env.FEE_RECEIVER_ADDRESS;
    const royaltyAddress = process.env.ROYALTY_ADDRESS;
    const ownerAddress = process.env.OWNER_ADDRESS;
    const defaultRefer = parseInt(process.env.DEFAULT_REFER || "73928");

    console.log("\nDeployment Parameters:");
    console.log("Fee Receiver:", feeReceiver);
    console.log("Royalty Contract:", royaltyAddress);
    console.log("Owner:", ownerAddress);
    console.log("Default Refer (Root User ID):", defaultRefer);

    // Validate addresses
    if (!feeReceiver || !royaltyAddress || !ownerAddress) {
        throw new Error(
            "Missing required environment variables. Please check .env file:\n" +
            "FEE_RECEIVER_ADDRESS, ROYALTY_ADDRESS, OWNER_ADDRESS"
        );
    }

    console.log("\nDeploying RideBNB contract...");

    const RideBNB = await hre.ethers.getContractFactory("RideBNB");
    const rideBNB = await RideBNB.deploy(
        feeReceiver,
        royaltyAddress,
        ownerAddress,
        defaultRefer
    );

    await rideBNB.deployed();

    console.log("\n✅ RideBNB deployed successfully!");
    console.log("Contract address:", rideBNB.address);
    console.log("\n📋 Deployment Summary:");
    console.log("====================");
    console.log("Network:", hre.network.name);
    console.log("RideBNB Contract:", rideBNB.address);
    console.log("Fee Receiver:", feeReceiver);
    console.log("Royalty Contract:", royaltyAddress);
    console.log("Owner:", ownerAddress);
    console.log("Root User ID:", defaultRefer);

    console.log("\n⚠️  IMPORTANT NEXT STEPS:");
    console.log("1. Save the contract address:", rideBNB.address);
    console.log("2. Call setRideBNBContract(" + rideBNB.address + ") on Royalty contract");
    console.log("3. Verify contract on block explorer");
    console.log("4. Update frontend with contract address");

    // Wait for a few block confirmations
    console.log("\nWaiting for block confirmations...");
    await rideBNB.deployTransaction.wait(5);
    console.log("✅ Confirmed!");

    console.log("\n📝 Verification command:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${rideBNB.address} "${feeReceiver}" "${royaltyAddress}" "${ownerAddress}" ${defaultRefer}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
