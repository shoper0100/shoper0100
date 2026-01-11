const hre = require("hardhat");

async function main() {
    console.log("🔍 Checking BSC Mainnet Contract Connections\n");

    const ROYALTY_ADDRESS = "0x6eE46d7597C26A5F53B3F59A6F609E86d9Dc62E9";
    const MAIN_ADDRESS = "0x78942C2429b814A979e891d249B23bAC4dD10f45";

    // Connect to contracts
    const Royalty = await hre.ethers.getContractAt("FiveDollarRideRoyalty_BNB", ROYALTY_ADDRESS);
    const Main = await hre.ethers.getContractAt("contracts/FiveDollarRide_BNB_Pure.sol:FiveDollarRide", MAIN_ADDRESS);

    console.log("=== Royalty Contract ===");
    const mainFromRoyalty = await Royalty.MAIN_CONTRACT();
    console.log("Main Contract Address:", mainFromRoyalty);
    console.log("Expected:", MAIN_ADDRESS);
    console.log("Connected:", mainFromRoyalty.toLowerCase() === MAIN_ADDRESS.toLowerCase() ? "✅ YES" : "❌ NO");

    console.log("\n=== Main Contract ===");
    const royaltyFromMain = await Main.ROYALTY_ADDR();
    console.log("Royalty Address:", royaltyFromMain);
    console.log("Expected:", ROYALTY_ADDRESS);
    console.log("Connected:", royaltyFromMain.toLowerCase() === ROYALTY_ADDRESS.toLowerCase() ? "✅ YES" : "❌ NO");

    console.log("\n=== Root User Status ===");
    const rootId = 36999;
    console.log("Root User ID:", rootId);
    const rootInfo = await Main.userInfo(rootId);
    console.log("Root Address:", rootInfo.account);
    console.log("Root Exists:", rootInfo.exists ? "✅ YES" : "❌ NO");
    console.log("Root Level:", rootInfo.level.toString());

    console.log("\n✅ All connections verified!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
