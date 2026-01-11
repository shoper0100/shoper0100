const hre = require("hardhat");

/**
 * Show Upgrade Costs for All Levels
 */

async function main() {
    console.log("💰 FiveDollarRide BNB - Upgrade Costs\n");

    const MAIN_CONTRACT = "0x2d42fbDBEE79089b78D49D92a81680fBf5FECEb2";
    const contract = await hre.ethers.getContractAt("FiveDollarRide_BNB", MAIN_CONTRACT);

    // Get current BNB price
    const bnbPrice = await contract.cachedBNBPrice();
    console.log(`Current BNB Price: $${Number(bnbPrice) / 1e8}\n`);

    // Show registration cost
    const [regUSD, regBNB] = await contract.getRegistrationCost();
    console.log("📝 Registration (Level 1):");
    console.log(`   USD: $${Number(regUSD) / 1e18}`);
    console.log(`   BNB: ${Number(regBNB) / 1e18}\n`);

    // Show upgrade costs for 1-12 levels
    console.log("⬆️  Upgrade Costs:");
    console.log("═".repeat(60));
    console.log("Levels | USD Cost  | BNB Cost");
    console.log("═".repeat(60));

    for (let i = 1; i <= 12; i++) {
        try {
            const [usd, bnb] = await contract.getUpgradeCostFor(i);
            const usdValue = (Number(usd) / 1e18).toFixed(2);
            const bnbValue = (Number(bnb) / 1e18).toFixed(6);
            console.log(`${i.toString().padStart(6)} | $${usdValue.padStart(8)} | ${bnbValue.padStart(10)} BNB`);
        } catch (error) {
            console.log(`${i.toString().padStart(6)} | Error getting cost`);
        }
    }
    console.log("═".repeat(60));

    // Show all level costs
    console.log("\n📊 Individual Level Costs:");
    console.log("═".repeat(60));
    console.log("Level  | USD Cost  | BNB Cost");
    console.log("═".repeat(60));

    const allCosts = await contract.getAllLevelCosts();
    for (let i = 0; i < allCosts[0].length; i++) {
        const level = i + 1;
        const usdValue = (Number(allCosts[0][i]) / 1e18).toFixed(2);
        const bnbValue = (Number(allCosts[1][i]) / 1e18).toFixed(6);
        console.log(`${level.toString().padStart(5)} | $${usdValue.padStart(8)} | ${bnbValue.padStart(10)} BNB`);
    }
    console.log("═".repeat(60));

    console.log("\n💡 Note: Upgrade costs are cumulative (sum of all levels)");
    console.log("Example: Upgrading from L1 → L3 = L2 cost + L3 cost\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
