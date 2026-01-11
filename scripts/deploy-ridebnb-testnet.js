import hre from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("🚀 Deploying RideBNB Contract...\n");
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Get deployment parameters
    const feeReceiver = process.env.FEE_RECEIVER_ADDRESS;
    const royaltyAddress = process.env.ROYALTY_ADDRESS || "0xB07ccB285B78bd9e8cf35BDe865DBeEBB6106b52";
    const ownerAddress = process.env.OWNER_ADDRESS;
    const defaultRefer = parseInt(process.env.ROOT_USER_ID || "73928");

    console.log("\nConfiguration:");
    console.log("- Fee Receiver:", feeReceiver);
    console.log("- Royalty Contract:", royaltyAddress);
    console.log("- Owner:", ownerAddress);
    console.log("- Root User ID:", defaultRefer);

    if (!feeReceiver || !royaltyAddress || !ownerAddress) {
        throw new Error("Missing required environment variables!");
    }

    console.log("\nDeploying RideBNB contract...");

    const RideBNB = await hre.ethers.getContractFactory("RideBNB");
    const rideBNB = await RideBNB.deploy(
        feeReceiver,
        royaltyAddress,
        ownerAddress,
        defaultRefer
    );

    await rideBNB.waitForDeployment ? await rideBNB.waitForDeployment() : await rideBNB.deployed();

    const rideBNBAddress = rideBNB.address || rideBNB.target;

    console.log("\n✅ RideBNB deployed to:", rideBNBAddress);

    console.log("\n📋 Deployment Summary:");
    console.log("==================================================");
    console.log("RideBNB Contract:", rideBNBAddress);
    console.log("Royalty Contract:", royaltyAddress);
    console.log("Network:", hre.network.name);
    console.log("==================================================");

    console.log("\n⚠️  NEXT STEPS:");
    console.log("1. Call setRideBNBContract(" + rideBNBAddress + ") on Royalty");
    console.log("2. Verify contracts");
    console.log("3. Test registration");

    console.log("\n📝 Verification command:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${rideBNBAddress} "${feeReceiver}" "${royaltyAddress}" "${ownerAddress}" ${defaultRefer}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
