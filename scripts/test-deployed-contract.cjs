const { ethers } = require("hardhat");

/**
 * Test script for DEPLOYED FiveDollarRide contract on BSC TESTNET with 50 users
 * Contract Address: 0xD295CA7BE4C6bcD65228189D8B90237b25D11625
 */

async function main() {
    // Configuration from .env
    const DEPLOYED_CONTRACT = process.env.FIVEDOLLARRIDE_BSC_TESTNET || "0xD295CA7BE4C6bcD65228189D8B90237b25D11625";
    const USDT_ADDRESS = process.env.USDT_BSC_TESTNET; // TestUSDT on BSC Testnet
    const NUM_USERS = 50;

    console.log("\n" + "=".repeat(70));
    console.log("🧪 Testing Deployed FiveDollarRide Contract on BSC TESTNET");
    console.log("=".repeat(70));
    console.log(`📍 Contract: ${DEPLOYED_CONTRACT}`);
    console.log(`💰 USDT: ${USDT_ADDRESS || "Not set in .env"}`);
    console.log(`👥 Test Users: ${NUM_USERS}\n`);

    // Get signers
    const [deployer, ...testUsers] = await ethers.getSigners();
    const users = testUsers.slice(0, Math.min(NUM_USERS, testUsers.length));

    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`✅ Loaded ${users.length} test accounts\n`);

    // Connect to deployed contract
    console.log("🔗 Connecting to deployed contract...");
    const RideBNB = await ethers.getContractFactory("FiveDollarRide");
    const rideBNB = RideBNB.attach(DEPLOYED_CONTRACT);

    let usdt;
    if (USDT_ADDRESS) {
        const USDT = await ethers.getContractFactory("TestUSDT");
        usdt = USDT.attach(USDT_ADDRESS);
        console.log("✅ Connected to USDT contract\n");
    }

    // Get contract info
    console.log("=".repeat(70));
    console.log("📊 CONTRACT INFO");
    console.log("=".repeat(70));

    try {
        const totalUsers = await rideBNB.totalUsers();
        console.log(`Total Users: ${totalUsers}`);

        const maxLevels = await rideBNB.MAX_LEVELS();
        console.log(`Max Levels: ${maxLevels}`);

        const adminFee = await rideBNB.ADMIN_FEE_PERCENT();
        console.log(`Admin Fee: ${adminFee}%`);

        const royaltyFee = await rideBNB.ROYALTY_FUND_PERCENT();
        console.log(`Royalty Fee: ${royaltyFee}%`);

        const regCost = await rideBNB.getRegistrationCost();
        console.log(`\n💵 Registration Cost:`);
        console.log(`   Level Cost: ${ethers.formatUnits(regCost.levelCost, 18)} USDT`);
        console.log(`   Admin Fee: ${ethers.formatUnits(regCost.adminFee, 18)} USDT`);
        console.log(`   Total: ${ethers.formatUnits(regCost.cost, 18)} USDT`);

        // Get all level costs
        console.log(`\n📊 ALL LEVEL COSTS:`);
        const costs = await rideBNB.getAllLevelCosts();
        for (let i = 0; i < 13; i++) {
            console.log(`   L${i + 1}: ${ethers.formatUnits(costs.costs[i], 18)} USDT (fee: ${ethers.formatUnits(costs.fees[i], 18)} = total: ${ethers.formatUnits(costs.totals[i], 18)})`);
        }

        console.log("\n" + "=".repeat(70));
        console.log("👥 TESTING USER OPERATIONS");
        console.log("=".repeat(70) + "\n");

        // Test with first 10 users
        let registered = 0;
        let alreadyRegistered = 0;

        for (let i = 0; i < Math.min(users.length, 10); i++) {
            const user = users[i];

            try {
                console.log(`\n👤 User ${i + 1}: ${user.address}`);

                // Check if already registered
                const userId = await rideBNB.id(user.address);

                if (userId == 0) {
                    console.log(`   Status: Not registered`);

                    if (usdt) {
                        // Check USDT balance
                        const balance = await usdt.balanceOf(user.address);
                        console.log(`   USDT Balance: ${ethers.formatUnits(balance, 18)} USDT`);

                        // Check allowance
                        const allowance = await usdt.allowance(user.address, DEPLOYED_CONTRACT);
                        console.log(`   USDT Allowance: ${ethers.formatUnits(allowance, 18)} USDT`);

                        const needed = regCost.cost;
                        console.log(`   Required: ${ethers.formatUnits(needed, 18)} USDT`);

                        if (balance >= needed && allowance >= needed) {
                            console.log(`   ✅ Can register (has balance + approval)`);
                        } else {
                            console.log(`   ⚠️  Cannot register:`);
                            if (balance < needed) console.log(`      - Need more USDT balance`);
                            if (allowance < needed) console.log(`      - Need to approve USDT on BSCScan first`);
                        }
                    }
                } else {
                    alreadyRegistered++;
                    // Get user info
                    const userInfo = await rideBNB.userInfo(userId);
                    const userIncome = await rideBNB.userIncome(userId);

                    console.log(`   Status: REGISTERED ✅`);
                    console.log(`   User ID: ${userId}`);
                    console.log(`   Level: ${userInfo.level}`);
                    console.log(`   Referrer: ${userInfo.referrer}`);
                    console.log(`   Direct Team: ${userInfo.directTeam}`);
                    console.log(`   Total Team: ${userInfo.team}`);
                    console.log(`   Total Income: ${ethers.formatUnits(userIncome.totalIncome, 18)} USDT`);
                    console.log(`   Total Deposit: ${ethers.formatUnits(userIncome.totalDeposit, 18)} USDT`);

                    // Check if can upgrade
                    if (userInfo.level < maxLevels) {
                        try {
                            const upgradeCost = await rideBNB.connect(user).getUpgradeCost(1);
                            console.log(`   \n   ⬆️  Upgrade to L${Number(userInfo.level) + 1}:`);
                            console.log(`      Cost: ${ethers.formatUnits(upgradeCost.totalCost, 18)} USDT`);

                            if (usdt) {
                                const balance = await usdt.balanceOf(user.address);
                                const allowance = await usdt.allowance(user.address, DEPLOYED_CONTRACT);

                                if (balance >= upgradeCost.totalCost && allowance >= upgradeCost.totalCost) {
                                    console.log(`      ✅ Can upgrade! (has balance + approval)`);
                                } else {
                                    console.log(`      ⚠️  Cannot upgrade:`);
                                    if (balance < upgradeCost.totalCost) console.log(`         - Need ${ethers.formatUnits(upgradeCost.totalCost - balance, 18)} more USDT`);
                                    if (allowance < upgradeCost.totalCost) console.log(`         - Need to approve USDT on BSCScan`);
                                }
                            }
                        } catch (e) {
                            console.log(`      Error checking upgrade: ${e.message}`);
                        }
                    }
                }

            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
            }
        }

        console.log("\n" + "=".repeat(70));
        console.log("📊 SUMMARY");
        console.log("=".repeat(70));
        console.log(`Total Users in Contract: ${totalUsers}`);
        console.log(`Users Checked: ${Math.min(users.length, 10)}`);
        console.log(`Already Registered: ${alreadyRegistered}`);
        console.log(`Not Registered: ${Math.min(users.length, 10) - alreadyRegistered}`);
        console.log("=".repeat(70));

        console.log("\n✅ Test complete!\n");
        console.log("📝 To interact with the contract:");
        console.log("   1. Approve USDT on BSCScan: https://testnet.bscscan.com/address/" + USDT_ADDRESS);
        console.log("   2. Register: rideBNB.registerMe(referrerAddress)");
        console.log("   3. Upgrade: rideBNB.upgradeMe(1) or upgradeMe(3) etc.");
        console.log("");

    } catch (error) {
        console.error("\n❌ Error connecting to contract:");
        console.error(error.message);
        console.error("\nMake sure:");
        console.error("1. Contract address is correct");
        console.error("2. You're connected to BSC Testnet");
        console.error("3. Contract is deployed and verified\n");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
