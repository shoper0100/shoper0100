require('dotenv').config();
const hre = require("hardhat");

async function main() {
    console.log("🔗 Connecting contracts on BSC Testnet...\n");

    const ROYALTY_ADDRESS = process.env.FIVEDOLLARRIDE_ROYALTY_BSC_TESTNET;
    const FIVEDOLLARRIDE_ADDRESS = process.env.FIVEDOLLARRIDE_BSC_TESTNET;

    if (!ROYALTY_ADDRESS) throw new Error("❌ FIVEDOLLARRIDE_ROYALTY_BSC_TESTNET not set!");
    if (!FIVEDOLLARRIDE_ADDRESS) throw new Error("❌ FIVEDOLLARRIDE_BSC_TESTNET not set!");

    console.log("📋 Contract Addresses:");
    console.log("├─ Royalty:", ROYALTY_ADDRESS);
    console.log("└─ FiveDollarRide:", FIVEDOLLARRIDE_ADDRESS);
    console.log("");

    const Royalty = await hre.ethers.getContractAt("FiveDollarRideRoyalty", ROYALTY_ADDRESS);

    console.log("1️⃣ Setting FiveDollarRide contract in Royalty...");
    const tx1 = await Royalty.setFiveDollarRideContract(FIVEDOLLARRIDE_ADDRESS);
    await tx1.wait();
    console.log("✅ FiveDollarRide contract set in Royalty");
    console.log("   Tx:", tx1.hash);
    console.log("");

    console.log("🔍 Verifying connection...");
    const connected = await Royalty.fiveDollarRideContract();

    if (connected.toLowerCase() === FIVEDOLLARRIDE_ADDRESS.toLowerCase()) {
        console.log("✅ Contracts connected successfully!");
    } else {
        console.log("❌ Connection failed!");
        console.log("   Expected:", FIVEDOLLARRIDE_ADDRESS);
        console.log("   Got:", connected);
        process.exit(1);
    }

    console.log("\n🎉 Connection Complete!");
    console.log("\n📋 Contract Setup:");
    console.log("✅ FiveDollarRideRoyalty:", ROYALTY_ADDRESS);
    console.log("✅ FiveDollarRide:", FIVEDOLLARRIDE_ADDRESS);
    console.log("✅ Contracts linked");
    console.log("\n🚀 FiveDollarRide System is LIVE on BSC Testnet!");

    console.log("\n📋 Important URLs:");
    console.log("Royalty Contract:", `https://testnet.bscscan.com/address/${ROYALTY_ADDRESS}`);
    console.log("FiveDollarRide Contract:", `https://testnet.bscscan.com/address/${FIVEDOLLARRIDE_ADDRESS}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Connection failed:", error);
        process.exit(1);
    });
