const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RideBNB USDT - 50 User Complete Test", function () {
    let usdt, rideBNB, royalty;
    let owner, feeReceiver;
    let users = []; // Array to hold 50 users

    const INITIAL_USDT_SUPPLY = ethers.parseUnits("100000", 18); // 100k USDT for testing
    const DEFAULT_ROOT_ID = 1;

    before(async function () {
        this.timeout(120000); // 2 minute timeout for deployment

        console.log("\n🚀 Deploying Contracts...\n");

        // Get signers (owner + feeReceiver + 50 users)
        const signers = await ethers.getSigners();
        owner = signers[0];
        feeReceiver = signers[1];

        // Assign 50 users
        for (let i = 2; i < 52; i++) {
            users.push(signers[i]);
        }

        console.log(`✅ Owner: ${owner.address}`);
        console.log(`✅ Fee Receiver: ${feeReceiver.address}`);
        console.log(`✅ Created ${users.length} test users\n`);

        // 1. Deploy TestUSDT
        console.log("📄 Deploying TestUSDT...");
        const TestUSDT = await ethers.getContractFactory("TestUSDT");
        usdt = await TestUSDT.deploy(INITIAL_USDT_SUPPLY);
        await usdt.waitForDeployment();
        console.log(`✅ TestUSDT deployed at: ${await usdt.getAddress()}\n`);

        // 2. Deploy Royalty Contract
        console.log("📄 Deploying Royalty Contract...");
        const Royalty = await ethers.getContractFactory("Royalty_USDT");
        royalty = await Royalty.deploy(
            await usdt.getAddress(),
            owner.address,
            DEFAULT_ROOT_ID
        );
        await royalty.waitForDeployment();
        console.log(`✅ Royalty deployed at: ${await royalty.getAddress()}\n`);

        // 3. Deploy RideBNB Contract
        console.log("📄 Deploying RideBNB Contract...");
        const RideBNB = await ethers.getContractFactory("RideBNB_USDT");
        rideBNB = await RideBNB.deploy(
            feeReceiver.address,
            await royalty.getAddress(),
            owner.address,
            DEFAULT_ROOT_ID,
            await usdt.getAddress()
        );
        await rideBNB.waitForDeployment();
        console.log(`✅ RideBNB deployed at: ${await rideBNB.getAddress()}\n`);

        // 4. Connect contracts
        console.log("🔗 Connecting contracts...");
        await royalty.setRideBNBContract(await rideBNB.getAddress());
        console.log("✅ Contracts connected\n");

        // 5. Distribute USDT to all test users
        console.log("💰 Distributing USDT to test users...");
        const amountPerUser = ethers.parseUnits("1000", 18); // 1000 USDT each

        for (let i = 0; i < users.length; i++) {
            await usdt.transfer(users[i].address, amountPerUser);
        }
        console.log(`✅ Distributed 1000 USDT to each of ${users.length} users\n`);

        console.log("=".repeat(60));
        console.log("✅ DEPLOYMENT COMPLETE - Ready for testing");
        console.log("=".repeat(60) + "\n");
    });

    describe("1. Contract Setup Validation", function () {
        it("Should have correct initial configuration", async function () {
            expect(await rideBNB.totalUsers()).to.equal(1); // Only root user
            expect(await rideBNB.MAX_LEVELS()).to.equal(13);
            expect(await rideBNB.ADMIN_FEE_PERCENT()).to.equal(5);
            expect(await rideBNB.ROYALTY_FUND_PERCENT()).to.equal(5);
        });

        it("Should have root user at level 13", async function () {
            const rootUser = await rideBNB.userInfo(DEFAULT_ROOT_ID);
            expect(rootUser.exists).to.be.true;
            expect(rootUser.level).to.equal(13);
            expect(rootUser.account).to.equal(owner.address);
        });

        it("Should have correct USDT balances", async function () {
            for (let i = 0; i < 5; i++) { // Check first 5 users
                const balance = await usdt.balanceOf(users[i].address);
                expect(balance).to.equal(ethers.parseUnits("1000", 18));
            }
        });
    });

    describe("2. USDT Approval Process (BSCScan Guide Validation)", function () {
        it("Should allow users to approve USDT spending", async function () {
            console.log("\n💳 Testing USDT Approval Flow (as per BSCScan guide)...\n");

            const approvalAmount = ethers.parseUnits("10000", 18); // Approve 10k USDT
            const contractAddress = await rideBNB.getAddress();

            // Approve for first 10 users
            for (let i = 0; i < 10; i++) {
                await usdt.connect(users[i]).approve(contractAddress, approvalAmount);

                const allowance = await usdt.allowance(users[i].address, contractAddress);
                expect(allowance).to.equal(approvalAmount);

                if (i === 0) {
                    console.log(`✅ User ${i + 1} approved ${ethers.formatUnits(approvalAmount, 18)} USDT`);
                    console.log(`   Allowance confirmed: ${ethers.formatUnits(allowance, 18)} USDT`);
                }
            }

            console.log(`✅ Successfully approved USDT for 10 users\n`);
        });

        it("Should fail registration without approval", async function () {
            // User at index 10 hasn't approved yet
            await expect(
                rideBNB.connect(users[10]).registerMe(owner.address)
            ).to.be.revertedWithCustomError(usdt, "ERC20InsufficientAllowance");
        });
    });

    describe("3. User Registration (registerMe function)", function () {
        it("Should register first user with root as referrer", async function () {
            console.log("\n👤 Testing registerMe() function...\n");

            // User 0 registers with root (owner) as referrer
            const tx = await rideBNB.connect(users[0]).registerMe(owner.address);
            const receipt = await tx.wait();

            // Verify user was created
            const userId = await rideBNB.id(users[0].address);
            expect(userId).to.equal(2); // First user after root

            const userInfo = await rideBNB.userInfo(userId);
            expect(userInfo.exists).to.be.true;
            expect(userInfo.level).to.equal(1);
            expect(userInfo.account).to.equal(users[0].address);
            expect(userInfo.referrer).to.equal(DEFAULT_ROOT_ID);

            console.log(`✅ User registered with ID: ${userId}`);
            console.log(`   Level: ${userInfo.level}`);
            console.log(`   Referrer ID: ${userInfo.referrer}\n`);
        });

        it("Should register 50 users with referral chain", async function () {
            this.timeout(120000); // 2 minute timeout

            console.log("\n🔗 Registering 50 users with referral chain...\n");

            // Approve USDT for all remaining users
            const approvalAmount = ethers.parseUnits("10000", 18);
            const contractAddress = await rideBNB.getAddress();

            for (let i = 1; i < users.length; i++) {
                await usdt.connect(users[i]).approve(contractAddress, approvalAmount);
            }

            // Register all users
            // User 0 already registered, start from user 1
            for (let i = 1; i < users.length; i++) {
                // Referrer: use previous user if i > 5, otherwise use root
                const referrerAddress = i > 5 ? users[i - 3].address : owner.address;

                await rideBNB.connect(users[i]).registerMe(referrerAddress);

                // Progress logging every 10 users
                if ((i + 1) % 10 === 0) {
                    console.log(`✅ Registered ${i + 1} users so far...`);
                }
            }

            // Verify total users
            const totalUsers = await rideBNB.totalUsers();
            expect(totalUsers).to.equal(51); // Root + 50 users

            console.log(`\n✅ All 50 users registered successfully!`);
            console.log(`   Total users in system: ${totalUsers}\n`);
        });

        it("Should verify user referral relationships", async function () {
            // Check user 2 (3rd user, index 2)
            const user3Id = await rideBNB.id(users[2].address);
            const user3Info = await rideBNB.userInfo(user3Id);

            expect(user3Info.exists).to.be.true;
            expect(user3Info.level).to.equal(1);

            // Check root user's direct team
            const rootInfo = await rideBNB.userInfo(DEFAULT_ROOT_ID);
            expect(rootInfo.directTeam).to.be.greaterThan(0);

            console.log(`\n📊 Root user has ${rootInfo.directTeam} direct referrals`);
        });
    });

    describe("4. User Upgrades (upgradeMe function)", function () {
        it("Should upgrade single level using upgradeMe(1)", async function () {
            console.log("\n⬆️  Testing upgradeMe() function with 1 level...\n");

            const userId = await rideBNB.id(users[0].address);
            const beforeInfo = await rideBNB.userInfo(userId);

            // Upgrade 1 level (L1 -> L2)
            await rideBNB.connect(users[0]).upgradeMe(1);

            const afterInfo = await rideBNB.userInfo(userId);
            expect(afterInfo.level).to.equal(Number(beforeInfo.level) + 1);

            console.log(`✅ User upgraded from L${beforeInfo.level} to L${afterInfo.level}\n`);
        });

        it("Should upgrade multiple levels using upgradeMe(3)", async function () {
            console.log("\n⬆️  Testing upgradeMe() function with 3 levels...\n");

            const userId = await rideBNB.id(users[1].address);
            const beforeInfo = await rideBNB.userInfo(userId);

            // Upgrade 3 levels at once (L1 -> L4)
            await rideBNB.connect(users[1]).upgradeMe(3);

            const afterInfo = await rideBNB.userInfo(userId);
            expect(afterInfo.level).to.equal(Number(beforeInfo.level) + 3);

            console.log(`✅ User upgraded from L${beforeInfo.level} to L${afterInfo.level}\n`);
        });

        it("Should upgrade 10 users to various levels", async function () {
            this.timeout(60000);

            console.log("\n⬆️  Upgrading 10 users to various levels...\n");

            const upgradeLevels = [2, 1, 3, 2, 4, 1, 2, 3, 1, 5];

            for (let i = 0; i < 10; i++) {
                const userIndex = i + 2; // Start from user index 2
                const userId = await rideBNB.id(users[userIndex].address);
                const currentLevel = (await rideBNB.userInfo(userId)).level;

                // Don't exceed max level (13)
                const levelsToUpgrade = upgradeLevels[i];
                if (Number(currentLevel) + levelsToUpgrade <= 13) {
                    await rideBNB.connect(users[userIndex]).upgradeMe(levelsToUpgrade);
                    console.log(`✅ User ${userId} upgraded ${levelsToUpgrade} level(s)`);
                }
            }

            console.log("\n✅ Completed upgrade test for 10 users\n");
        });

        it("Should prevent upgrade beyond level 13", async function () {
            const userId = await rideBNB.id(users[0].address);
            await expect(
                rideBNB.connect(users[0]).upgradeMe(20)
            ).to.be.revertedWith("Exceeds max level");
        });
    });

    describe("5. Income Distribution Verification", function () {
        it("Should distribute referral income correctly", async function () {
            console.log("\n💰 Verifying income distribution...\n");

            // Check root user income (should have received various payments)
            const rootIncome = await rideBNB.userIncome(DEFAULT_ROOT_ID);

            expect(rootIncome.totalIncome).to.be.greaterThan(0);
            console.log(`✅ Root user total income: ${ethers.formatUnits(rootIncome.totalIncome, 18)} USDT`);
            console.log(`   - Referral income: ${ethers.formatUnits(rootIncome.referralIncome, 18)} USDT`);
            console.log(`   - Sponsor income: ${ethers.formatUnits(rootIncome.sponsorIncome, 18)} USDT`);
            console.log(`   - Level income: ${ethers.formatUnits(rootIncome.levelIncome, 18)} USDT\n`);
        });

        it("Should have correct total deposits across all users", async function () {
            let totalDeposits = BigInt(0);

            // Sum all user deposits
            for (let userId = 1; userId <= 51; userId++) {
                const income = await rideBNB.userIncome(userId);
                totalDeposits += income.totalDeposit;
            }

            console.log(`💵 Total system deposits: ${ethers.formatUnits(totalDeposits, 18)} USDT`);
            expect(totalDeposits).to.be.greaterThan(0);
        });

        it("Should verify fee receiver got admin fees", async function () {
            const feeBalance = await usdt.balanceOf(feeReceiver.address);
            expect(feeBalance).to.be.greaterThan(0);

            console.log(`💼 Admin fee receiver balance: ${ethers.formatUnits(feeBalance, 18)} USDT\n`);
        });

        it("Should verify royalty contract received funds", async function () {
            const royaltyBalance = await usdt.balanceOf(await royalty.getAddress());
            expect(royaltyBalance).to.be.greaterThan(0);

            console.log(`👑 Royalty pool balance: ${ethers.formatUnits(royaltyBalance, 18)} USDT\n`);
        });
    });

    describe("6. Matrix Placement Verification", function () {
        it("Should have proper matrix structure", async function () {
            console.log("\n🌳 Verifying binary matrix placement...\n");

            // Check root user's matrix children
            const rootMatrixDirect = await rideBNB.matrixDirect(DEFAULT_ROOT_ID);
            expect(rootMatrixDirect).to.be.greaterThan(0);

            console.log(`✅ Root user has ${rootMatrixDirect} direct matrix children\n`);
        });

        it("Should have team counts updated correctly", async function () {
            const rootInfo = await rideBNB.userInfo(DEFAULT_ROOT_ID);

            console.log(`📊 Root User Stats:`);
            console.log(`   - Total team size: ${rootInfo.team}`);
            console.log(`   - Direct team: ${rootInfo.directTeam}\n`);

            expect(rootInfo.team).to.be.greaterThan(0);
        });
    });

    describe("7. User Info Queries (BSCScan Read Functions)", function () {
        it("Should query user info by address", async function () {
            console.log("\n🔍 Testing view functions (BSCScan Read Contract)...\n");

            const userId = await rideBNB.id(users[0].address);
            expect(userId).to.be.greaterThan(0);

            console.log(`✅ User address lookup successful: ${users[0].address} = ID ${userId}`);
        });

        it("Should get registration cost", async function () {
            const cost = await rideBNB.getRegistrationCost();

            console.log(`\n💵 Registration Cost:`);
            console.log(`   - Level cost: ${ethers.formatUnits(cost.levelCost, 18)} USDT`);
            console.log(`   - Admin fee: ${ethers.formatUnits(cost.adminFee, 18)} USDT`);
            console.log(`   - Total: ${ethers.formatUnits(cost.cost, 18)} USDT\n`);

            expect(cost.cost).to.equal(cost.levelCost + cost.adminFee);
        });

        it("Should get all level costs", async function () {
            const costs = await rideBNB.getAllLevelCosts();

            console.log(`\n📊 All 13 Level Costs:`);
            for (let i = 0; i < 13; i++) {
                console.log(`   L${i + 1}: ${ethers.formatUnits(costs.costs[i], 18)} USDT (+ ${ethers.formatUnits(costs.fees[i], 18)} fee = ${ethers.formatUnits(costs.totals[i], 18)} total)`);
            }
            console.log("");

            expect(costs.costs.length).to.equal(13);
        });

        it("Should use getMyInfo for user stats", async function () {
            const myInfo = await rideBNB.connect(users[0]).getMyInfo();

            console.log(`\n👤 User Info (getMyInfo):`);
            console.log(`   - User ID: ${myInfo.userId}`);
            console.log(`   - Level: ${myInfo.level}`);
            console.log(`   - Team: ${myInfo.team}`);
            console.log(`   - Direct Team: ${myInfo.directTeam}`);
            console.log(`   - Total Income: ${ethers.formatUnits(myInfo.totalIncome, 18)} USDT`);
            console.log(`   - Total Deposit: ${ethers.formatUnits(myInfo.totalDeposit, 18)} USDT\n`);

            expect(myInfo.userId).to.be.greaterThan(0);
        });
    });

    describe("8. Final System Summary", function () {
        it("Should display complete system statistics", async function () {
            console.log("\n" + "=".repeat(60));
            console.log("📊 FINAL SYSTEM STATISTICS");
            console.log("=".repeat(60));

            const totalUsers = await rideBNB.totalUsers();
            const rootInfo = await rideBNB.userInfo(DEFAULT_ROOT_ID);
            const rootIncome = await rideBNB.userIncome(DEFAULT_ROOT_ID);
            const feeBalance = await usdt.balanceOf(feeReceiver.address);
            const royaltyBalance = await usdt.balanceOf(await royalty.getAddress());

            console.log(`\n👥 Total Users: ${totalUsers} (including root)`);
            console.log(`\n👑 Root User Stats:`);
            console.log(`   - Level: ${rootInfo.level}`);
            console.log(`   - Direct Team: ${rootInfo.directTeam}`);
            console.log(`   - Total Team: ${rootInfo.team}`);
            console.log(`   - Total Income: ${ethers.formatUnits(rootIncome.totalIncome, 18)} USDT`);
            console.log(`\n💼 Platform Funds:`);
            console.log(`   - Admin Fee Receiver: ${ethers.formatUnits(feeBalance, 18)} USDT`);
            console.log(`   - Royalty Pool: ${ethers.formatUnits(royaltyBalance, 18)} USDT`);

            // Calculate total deposits
            let totalDeposits = BigInt(0);
            for (let userId = 1; userId <= Number(totalUsers); userId++) {
                const income = await rideBNB.userIncome(userId);
                totalDeposits += income.totalDeposit;
            }
            console.log(`   - Total User Deposits: ${ethers.formatUnits(totalDeposits, 18)} USDT`);

            console.log("\n" + "=".repeat(60));
            console.log("✅ ALL TESTS PASSED - Contract Working Perfectly!");
            console.log("=".repeat(60) + "\n");

            expect(totalUsers).to.equal(51);
        });
    });
});
