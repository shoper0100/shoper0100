// Check Contract Connection Status
// Run this to verify if contracts are properly linked

const hre = require("hardhat");

async function main() {
    console.log("🔍 Checking contract connection status...\n");

    const MAIN_ADDRESS = "0x2A6E31141D1f4F029A65E1493C9A7ed9B6d99b27";
    const ROYALTY_ADDRESS = "0x9F4fE3F3dD5B79B7729145023A7F66E654237505";

    // Get contract instances
    const mainContract = await hre.ethers.getContractAt("FiveDollarRide_BNB", MAIN_ADDRESS);
    const royaltyContract = await hre.ethers.getContractAt("FiveDollarRideRoyalty_BNB", ROYALTY_ADDRESS);

    console.log("📋 Main Contract:");
    console.log(`   Address: ${MAIN_ADDRESS}`);
    const mainRoyalty = await mainContract.ROYALTY_ADDR();
    console.log(`   Points to Royalty: ${mainRoyalty}`);
    console.log(`   Correct: ${mainRoyalty === ROYALTY_ADDRESS ? '✅' : '❌'}\n`);

    console.log("📋 Royalty Contract:");
    console.log(`   Address: ${ROYALTY_ADDRESS}`);
    const royaltyMain = await royaltyContract.MAIN_CONTRACT();
    console.log(`   Points to Main: ${royaltyMain}`);
    console.log(`   Correct: ${royaltyMain === MAIN_ADDRESS ? '✅' : '❌'}`);
    console.log(`   Connected: ${royaltyMain !== '0x0000000000000000000000000000000000000000' ? '✅' : '❌'}\n`);

    console.log("📋 Royalty Initialization:");
    const royaltyInitialized = await mainContract.royaltyInitialized();
    console.log(`   Initialized: ${royaltyInitialized ? '✅' : '❌'}\n`);

    // Summary
    const allConnected =
        mainRoyalty === ROYALTY_ADDRESS &&
        royaltyMain === MAIN_ADDRESS &&
        royaltyInitialized;

    console.log("═".repeat(50));
    if (allConnected) {
        console.log("✅ ALL CONTRACTS FULLY CONNECTED AND READY!");
    } else {
        console.log("⚠️  MANUAL CONNECTION REQUIRED:");
        console.log("\n1. Royalty → Main Connection:");
        if (royaltyMain !== MAIN_ADDRESS) {
            console.log("   ❌ NOT CONNECTED");
            console.log("   → Go to Royalty contract on BSCScan");
            console.log("   → Write Contract → setMainContract");
            console.log(`   → Enter: ${MAIN_ADDRESS}`);
        } else {
            console.log("   ✅ Connected");
        }

        console.log("\n2. Royalty Initialization:");
        if (!royaltyInitialized) {
            console.log("   ❌ NOT INITIALIZED");
            console.log("   → Go to Main contract on BSCScan");
            console.log("   → Write Contract → initializeRoyalty");
            console.log("   → Click Write");
        } else {
            console.log("   ✅ Initialized");
        }
    }
    console.log("═".repeat(50));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
