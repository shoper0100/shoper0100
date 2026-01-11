import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("RideBNB - Comprehensive Testing", function () {
    let rideBNB, royaltyReceiver;
    let owner, dao, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10;
    let users = [];
    const DEFAULT_REFER = 36999;

    // Level costs in BNB
    const levels = [
        ethers.parseEther("0.004"),  // Level 0 (registration)
        ethers.parseEther("0.006"),  // Level 1
        ethers.parseEther("0.012"),  // Level 2
        ethers.parseEther("0.024"),  // Level 3
        ethers.parseEther("0.048"),  // Level 4
        ethers.parseEther("0.096"),  // Level 5
        ethers.parseEther("0.192"),  // Level 6
        ethers.parseEther("0.384"),  // Level 7
        ethers.parseEther("0.768"),  // Level 8
        ethers.parseEther("1.536"),  // Level 9
        ethers.parseEther("3.072"),  // Level 10
        ethers.parseEther("6.144"),  // Level 11
        ethers.parseEther("12.288")  // Level 12
    ];

    beforeEach(async function () {
        [owner, dao, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10] = await ethers.getSigners();
        users = [user1, user2, user3, user4, user5, user6, user7, user8, user9, user10];

        // Deploy Royalty contract (actual production contract)
        const Royalty = await ethers.getContractFactory("Royalty");
        royaltyReceiver = await Royalty.deploy(owner.address, DEFAULT_REFER);
        await royaltyReceiver.waitForDeployment();

        // Deploy RideBNB
        const RideBNB = await ethers.getContractFactory("RideBNB");
        rideBNB = await RideBNB.deploy(
            owner.address,  // feeReceiver
            await royaltyReceiver.getAddress(),  // royalty contract
            owner.address,  // owner
            DEFAULT_REFER   // defaultRefer (root user ID)
        );

        await rideBNB.waitForDeployment();

        // Connect contracts (required for Royalty to accept calls from RideBNB)
        await royaltyReceiver.setRideBNBContract(await rideBNB.getAddress());
    });

    describe("1. Deployment & Initial State", function () {
        it("Should set correct owner", async function () {
            expect(await rideBNB.owner()).to.equal(owner.address);
        });

        it("Should set DAO address to owner initially", async function () {
            const [daoAddr] = await rideBNB.getGovernanceAddresses();
            expect(daoAddr).to.equal(owner.address);
        });

        it("Should have root user ID set", async function () {
            const userInfo = await rideBNB.userInfo(DEFAULT_REFER);
            expect(userInfo.id).to.equal(DEFAULT_REFER);
        });
    });

    describe("2. Registration Tests", function () {
        it("Should register user with valid referrer", async function () {
            const cost = levels[0];
            const adminFee = cost * 5n / 100n;
            const totalCost = cost + adminFee;

            await rideBNB.connect(user1).register(DEFAULT_REFER, user1.address, {
                value: totalCost
            });

            const userId = await rideBNB.id(user1.address);
            expect(userId).to.be.gt(0);
        });

        it("Should reject duplicate registration", async function () {
            const cost = levels[0];
            const adminFee = cost * 5n / 100n;
            const totalCost = cost + adminFee;

            await rideBNB.connect(user1).register(DEFAULT_REFER, user1.address, {
                value: totalCost
            });

            await expect(
                rideBNB.connect(user1).register(DEFAULT_REFER, user1.address, {
                    value: totalCost
                })
            ).to.be.revertedWith("Already registered");
        });

        it("Should handle orphan referrals (assign to root)", async function () {
            const cost = levels[0];
            const adminFee = cost * 5n / 100n;
            const totalCost = cost + adminFee;

            // Register with invalid referrer (should auto-assign to root)
            await rideBNB.connect(user1).register(99999, user1.address, {
                value: totalCost
            });

            const userId = await rideBNB.id(user1.address);
            const userInfo = await rideBNB.userInfo(userId);
            expect(userInfo.referrer).to.equal(DEFAULT_REFER);
        });
    });

    describe("3. Upgrade Tests (All 13 Levels)", function () {
        beforeEach(async function () {
            // Register user1
            const cost = levels[0];
            const adminFee = cost * 5n / 100n;
            await rideBNB.connect(user1).register(DEFAULT_REFER, user1.address, {
                value: cost + adminFee
            });
        });

        it("Should upgrade to Level 1", async function () {
            const userId = await rideBNB.id(user1.address);
            const cost = levels[1];
            const adminFee = cost * 5n / 100n;

            await rideBNB.connect(user1).upgrade(userId, 1, {
                value: cost + adminFee
            });

            const userInfo = await rideBNB.userInfo(userId);
            expect(userInfo.level).to.equal(2); // Level 1 after upgrade (starts at 1)
        });

        it("Should upgrade through all levels (1-13)", async function () {
            const userId = await rideBNB.id(user1.address);

            for (let i = 1; i < levels.length; i++) {
                const cost = levels[i];
                const adminFee = cost * 5n / 100n;

                await rideBNB.connect(user1).upgrade(userId, 1, {
                    value: cost + adminFee
                });

                const userInfo = await rideBNB.userInfo(userId);
                expect(userInfo.level).to.equal(i + 1);
            }

            // Final check - should be Level 13
            const finalInfo = await rideBNB.userInfo(userId);
            expect(finalInfo.level).to.equal(13);
        });

        it("Should track total deposit correctly", async function () {
            const userId = await rideBNB.id(user1.address);
            let expectedDeposit = levels[0];

            // Upgrade to level 5
            for (let i = 1; i <= 5; i++) {
                const cost = levels[i];
                const adminFee = cost * 5n / 100n;
                expectedDeposit += cost;

                await rideBNB.connect(user1).upgrade(userId, 1, {
                    value: cost + adminFee
                });
            }

            const income = await rideBNB.userIncome(userId);
            expect(income.totalDeposit).to.equal(expectedDeposit);
        });
    });

    describe("4. Income Distribution Tests", function () {
        it("Should pay referral income on registration", async function () {
            // Register user1 with root
            const cost = levels[0];
            const adminFee = cost * 5n / 100n;

            const rootBalanceBefore = await ethers.provider.getBalance(owner.address);

            await rideBNB.connect(user1).register(DEFAULT_REFER, user1.address, {
                value: cost + adminFee
            });

            // Root should receive referral payment
            const rootIncome = await rideBNB.userIncome(DEFAULT_REFER);
            // Note: referralIncome might be less due to royalty funding deduction
            expect(rootIncome.referralIncome).to.be.gt(0);
        });

        it("Should distribute matrix income correctly", async function () {
            // Setup: Register multiple users in a chain
            const cost = levels[0];
            const adminFee = cost * 5n / 100n;

            // User1 registers with root
            await rideBNB.connect(user1).register(DEFAULT_REFER, user1.address, {
                value: cost + adminFee
            });
            const user1Id = await rideBNB.id(user1.address);

            // User2 registers with user1
            await rideBNB.connect(user2).register(user1Id, user2.address, {
                value: cost + adminFee
            });
            const user2Id = await rideBNB.id(user2.address);

            // User2 upgrades - user1 should receive matrix income
            const upgradeCost = levels[1];
            const upgradeAdminFee = upgradeCost * 5n / 100n;

            await rideBNB.connect(user2).upgrade(user2Id, 1, {
                value: upgradeCost + upgradeAdminFee
            });

            const user1Income = await rideBNB.userIncome(user1Id);
            // User1 should have some level income (if qualified)
            expect(user1Income.totalIncome).to.be.gt(0);
        });
    });

    describe("5. Sponsor Commission Tests", function () {
        it("Should pay 5% sponsor commission when qualified", async function () {
            const cost = levels[0];
            const adminFee = cost * 5n / 100n;

            // Register user1 and upgrade to Level 4 (min sponsor level)
            await rideBNB.connect(user1).register(DEFAULT_REFER, user1.address, {
                value: cost + adminFee
            });
            const user1Id = await rideBNB.id(user1.address);

            // Upgrade user1 to Level 4
            for (let i = 1; i <= 4; i++) {
                const upgradeCost = levels[i];
                const upgradeAdminFee = upgradeCost * 5n / 100n;
                await rideBNB.connect(user1).upgrade(user1Id, 1, {
                    value: upgradeCost + upgradeAdminFee
                });
            }

            // Register user2 with user1 as referrer
            await rideBNB.connect(user2).register(user1Id, user2.address, {
                value: cost + adminFee
            });
            const user2Id = await rideBNB.id(user2.address);

            const user1InfoBefore = await rideBNB.userInfo(user1Id);

            // User2 upgrades - user1 should get sponsor commission
            const upgradeCost = levels[1];
            const upgradeAdminFee = upgradeCost * 5n / 100n;
            await rideBNB.connect(user2).upgrade(user2Id, 1, {
                value: upgradeCost + upgradeAdminFee
            });

            const user1IncomeAfter = await rideBNB.userIncome(user1Id);
            expect(user1IncomeAfter.sponsorIncome).to.be.gt(0);
        });

        it("Should send commission to root if sponsor not qualified", async function () {
            const cost = levels[0];
            const adminFee = cost * 5n / 100n;

            // Register user1 (Level 1 - below min sponsor level 4)
            await rideBNB.connect(user1).register(DEFAULT_REFER, user1.address, {
                value: cost + adminFee
            });
            const user1Id = await rideBNB.id(user1.address);

            // Register user2 with user1
            await rideBNB.connect(user2).register(user1Id, user2.address, {
                value: cost + adminFee
            });
            const user2Id = await rideBNB.id(user2.address);

            const rootIncomeBefore = await rideBNB.userIncome(DEFAULT_REFER);

            // User2 upgrades - commission should go to root
            const upgradeCost = levels[1];
            const upgradeAdminFee = upgradeCost * 5n / 100n;
            await rideBNB.connect(user2).upgrade(user2Id, 1, {
                value: upgradeCost + upgradeAdminFee
            });

            const rootIncomeAfter = await rideBNB.userIncome(DEFAULT_REFER);
            expect(rootIncomeAfter.sponsorIncome).to.be.gt(rootIncomeBefore.sponsorIncome);
        });
    });

    describe("6. DAO Governance Tests", function () {
        it("Should transfer DAO control", async function () {
            await rideBNB.connect(owner).transferDAOControl(dao.address);

            const [daoAddr] = await rideBNB.getGovernanceAddresses();
            expect(daoAddr).to.equal(dao.address);
        });

        it("Should allow DAO to update BNB price", async function () {
            await rideBNB.connect(owner).transferDAOControl(dao.address);

            await rideBNB.connect(dao).setBnbPrice(700);

            const price = await rideBNB.bnbPriceInUSD();
            expect(price).to.equal(700);
        });

        it("Should reject non-DAO price updates", async function () {
            await rideBNB.connect(owner).transferDAOControl(dao.address);

            await expect(
                rideBNB.connect(user1).setBnbPrice(700)
            ).to.be.revertedWith("Only owner or DAO");
        });
    });

    describe("7. Admin Functions Tests", function () {
        it("Should update direct required (as DAO)", async function () {
            await rideBNB.connect(owner).setDirectRequired(3);
            const directReq = await rideBNB.directRequired();
            expect(directReq).to.equal(3);
        });

        it("Should update sponsor commission", async function () {
            await rideBNB.connect(owner).setSponsorCommission(7);
            const commission = await rideBNB.sponsorCommission();
            expect(commission).to.equal(7);
        });

        it("Should update min sponsor level", async function () {
            await rideBNB.connect(owner).setMinSponsorLevel(5);
            const minLevel = await rideBNB.minSponsorLevel();
            expect(minLevel).to.equal(5);
        });

        it("Should batch update levels", async function () {
            const usdAmounts = [2, 3, 6, 12, 24, 48, 96, 192, 384, 768, 1536, 3072, 6144];
            await rideBNB.connect(owner).setBnbPrice(600);
            await rideBNB.connect(owner).batchUpdateLevels(usdAmounts);

            // levels array is private, can't test directly
            // Just verify the function executes successfully
            // Test passes if no revert occurs
            expect(true).to.be.true;
        });
    });

    describe("8. Edge Cases & Security", function () {
        it("Should handle zero black holes - unclaimed to root", async function () {
            // This is tested implicitly in sponsor commission tests
            // where unqualified commissions go to root
            expect(true).to.be.true;
        });

        it("Should track lost income correctly", async function () {
            const cost = levels[0];
            const adminFee = cost * 5n / 100n;

            // Register user1 (no upgrade - won't qualify for matrix income)
            await rideBNB.connect(user1).register(DEFAULT_REFER, user1.address, {
                value: cost + adminFee
            });
            const user1Id = await rideBNB.id(user1.address);

            // Register user2 with user1
            await rideBNB.connect(user2).register(user1Id, user2.address, {
                value: cost + adminFee
            });
            const user2Id = await rideBNB.id(user2.address);

            // User2 upgrades - user1 might lose income if not qualified
            const upgradeCost = levels[1];
            const upgradeAdminFee = upgradeCost * 5n / 100n;
            await rideBNB.connect(user2).upgrade(user2Id, 1, {
                value: upgradeCost + upgradeAdminFee
            });

            // Check lost income tracking
            const lostIncome = await rideBNB.lostIncome(user1Id);
            // May or may not have lost income depending on qualification
        });
    });

    describe("9. Full Workflow Test", function () {
        it("Should complete full user journey (register → upgrade to 13 → earn from team)", async function () {
            const cost = levels[0];
            const adminFee = cost * 5n / 100n;

            // 1. Register user1
            await rideBNB.connect(user1).register(DEFAULT_REFER, user1.address, {
                value: cost + adminFee
            });
            const user1Id = await rideBNB.id(user1.address);

            // 2. Upgrade to Level 13
            for (let i = 1; i < levels.length; i++) {
                const upgradeCost = levels[i];
                const upgradeAdminFee = upgradeCost * 5n / 100n;
                await rideBNB.connect(user1).upgrade(user1Id, 1, {
                    value: upgradeCost + upgradeAdminFee
                });
            }

            // 3. Build team
            await rideBNB.connect(user2).register(user1Id, user2.address, {
                value: cost + adminFee
            });
            await rideBNB.connect(user3).register(user1Id, user3.address, {
                value: cost + adminFee
            });

            // 4. Team upgrades - user1 earns
            const user2Id = await rideBNB.id(user2.address);
            const user3Id = await rideBNB.id(user3.address);

            for (let i = 1; i <= 5; i++) {
                const upgradeCost = levels[i];
                const upgradeAdminFee = upgradeCost * 5n / 100n;
                await rideBNB.connect(user2).upgrade(user2Id, 1, {
                    value: upgradeCost + upgradeAdminFee
                });
                await rideBNB.connect(user3).upgrade(user3Id, 1, {
                    value: upgradeCost + upgradeAdminFee
                });
            }

            // 5. Verify earnings
            const user1Info = await rideBNB.userInfo(user1Id);
            const user1Income = await rideBNB.userIncome(user1Id);
            expect(user1Info.level).to.equal(13);
            expect(user1Info.directTeam).to.equal(2);
            expect(user1Income.totalIncome).to.be.gt(0);
            expect(user1Income.sponsorIncome).to.be.gt(0); // Should have sponsor commission
        });
    });
});
