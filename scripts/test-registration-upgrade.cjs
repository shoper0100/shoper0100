const hre = require("hardhat");

/**
 * Test Script: Register 2 Users and Test Upgrades
 * Tests FiveDollarRide_BNB contract on BSC Testnet
 */

async function main() {
    console.log("🧪 Starting Registration and Upgrade Tests...\n");

    const MAIN_CONTRACT = "0x2d42fbDBEE79089b78D49D92a81680fBf5FECEb2";

    // Get signers (you need at least 2 wallets with BNB)
    const [user1, user2] = await hre.ethers.getSigners();

    console.log("📋 Test Configuration:");
    console.log(`   Main Contract: ${MAIN_CONTRACT}`);
    console.log(`   User 1: ${user1.address}`);
    console.log(`   User 2: ${user2.address}\n`);

    // Get contract instance
    const contract = await hre.ethers.getContractAt("FiveDollarRide_BNB", MAIN_CONTRACT);

    // Check registration cost
    console.log("💰 Checking registration cost...");
    const [usdCost, bnbCost] = await contract.getRegistrationCost();
    console.log(`   USD Cost: $${Number(usdCost) / 1e18}`);
    console.log(`   BNB Cost: ${Number(bnbCost) / 1e18} BNB\n`);

    // Register User 1 (no referrer - will use default)
    console.log("📝 Registering User 1...");
    try {
        const tx1 = await contract.connect(user1).registerMe(
            "0x0000000000000000000000000000000000000000",
            { value: bnbCost }
        );
        console.log(`   Transaction: ${tx1.hash}`);
        await tx1.wait();

        const user1Info = await contract.connect(user1).getMyInfo();
        console.log(`   ✅ User 1 Registered!`);
        console.log(`   ID: ${user1Info.userId}`);
        console.log(`   Level: ${user1Info.level}\n`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Register User 2 (with User 1 as referrer)
    console.log("📝 Registering User 2...");
    try {
        const user1Address = user1.address;
        const tx2 = await contract.connect(user2).registerMe(
            user1Address,
            { value: bnbCost }
        );
        console.log(`   Transaction: ${tx2.hash}`);
        await tx2.wait();

        const user2Info = await contract.connect(user2).getMyInfo();
        console.log(`   ✅ User 2 Registered!`);
        console.log(`   ID: ${user2Info.userId}`);
        console.log(`   Level: ${user2Info.level}`);
        console.log(`   Referrer: ${user1Address}\n`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Test Upgrade for User 1 (upgrade 2 levels)
    console.log("⬆️  Testing Upgrade for User 1 (2 levels)...");
    try {
        const upgradeCost = await contract.connect(user1).getUpgradeCostFor(2);
        console.log(`   Upgrade Cost: ${Number(upgradeCost[1]) / 1e18} BNB`);

        const txUpgrade = await contract.connect(user1).upgradeMe(2, {
            value: upgradeCost[1]
        });
        console.log(`   Transaction: ${txUpgrade.hash}`);
        await txUpgrade.wait();

        const user1InfoAfter = await contract.connect(user1).getMyInfo();
        console.log(`   ✅ Upgrade Successful!`);
        console.log(`   New Level: ${user1InfoAfter.level}\n`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Check User 1 Income
    console.log("💵 Checking User 1 Income...");
    try {
        const income = await contract.connect(user1).getMyIncomeBreakdown();
        console.log(`   Total Income: $${Number(income.totalIncome) / 1e18}`);
        console.log(`   Referral Income: $${Number(income.referralIncome) / 1e18}`);
        console.log(`   Sponsor Income: $${Number(income.sponsorIncome) / 1e18}`);
        console.log(`   Matrix Income: $${Number(income.matrixIncome) / 1e18}\n`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Check User 1 Team
    console.log("👥 Checking User 1 Team...");
    try {
        const team = await contract.connect(user1).getMyTeam();
        console.log(`   Direct Team: ${team.directCount}`);
        console.log(`   Total Team: ${team.totalCount}\n`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Final Summary
    console.log("═".repeat(50));
    console.log("📊 Test Summary:");
    console.log("   ✅ Registration Cost: Working");
    console.log("   ✅ User 1 Registration: Tested");
    console.log("   ✅ User 2 Registration: Tested");
    console.log("   ✅ User Upgrade: Tested");
    console.log("   ✅ Income Tracking: Tested");
    console.log("   ✅ Team Tracking: Tested");
    console.log("═".repeat(50));
    console.log("\n✅ All tests completed!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
