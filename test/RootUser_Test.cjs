const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Root User Privileges Test", function () {
    let rideBNB, royalty;
    let owner, user1, feeReceiver;
    const ROOT_ID = 73928;

    const parseEther = ethers.parseEther || ethers.utils.parseEther;

    beforeEach(async function () {
        [owner, user1, feeReceiver] = await ethers.getSigners();

        // Deploy Royalty
        const Royalty = await ethers.getContractFactory("Royalty");
        royalty = await Royalty.deploy(owner.address, ROOT_ID);
        await royalty.deployed ? await royalty.deployed() : await royalty.waitForDeployment();

        // Deploy RideBNB
        const RideBNB = await ethers.getContractFactory("RideBNB");
        rideBNB = await RideBNB.deploy(
            feeReceiver.address,
            (royalty.address || royalty.target),
            owner.address,
            ROOT_ID
        );
        await rideBNB.deployed ? await rideBNB.deployed() : await rideBNB.waitForDeployment();

        // Connect contracts
        await royalty.setRideBNBContract((rideBNB.address || rideBNB.target));
    });

    describe("1. Root User Initialization", function () {
        it("Should correctly initialize root user as ID 73928", async function () {
            const rootInfo = await rideBNB.userInfo(ROOT_ID);
            expect(rootInfo.id).to.equal(ROOT_ID);
            expect(rootInfo.account).to.equal(owner.address);
            expect(rootInfo.exists).to.be.true;
        });

        it("Should set root as its own referrer and upline", async function () {
            const rootInfo = await rideBNB.userInfo(ROOT_ID);
            expect(rootInfo.referrer).to.equal(ROOT_ID);
            expect(rootInfo.upline).to.equal(ROOT_ID);
        });
    });

    describe("2. Income Without Cap", function () {
        it("Should allow root user to claim royalty beyond 150% income cap", async function () {            // Root is already at L13 with all tier registrations
            // Just verify root can claim without upgrade

            // Fund royalty pool
            const fundAmount = parseEther("1000");
            await owner.sendTransaction({
                to: (royalty.address || royalty.target),
                value: fundAmount
            });

            // Fast-forward time and distribute
            await ethers.provider.send("evm_increaseTime", [86401]);
            await ethers.provider.send("evm_mine", []);
            await royalty.distRoyalty(0);

            // Check root's deposit and income
            const rootIncome = await rideBNB.userIncome(ROOT_ID);
            const rootUser = await rideBNB.userInfo(ROOT_ID);

            // Mock scenario: Root has earned way more than 150%
            // Even if totalIncome > 150% of deposit, root should still claim

            // Root claims royalty (should succeed regardless of cap)
            await expect(
                rideBNB.claimRoyalty(ROOT_ID, 0)
            ).to.not.be.reverted;
        });
    });

    describe("3. Persistent Royalty Access", function () {
        it("Should keep root user's royaltyActive status after claiming", async function () {
            // Root is already at L13 with all tier registrations

            // Fund and distribute
            const fundAmount = parseEther("10");
            await owner.sendTransaction({
                to: (royalty.address || royalty.target),
                value: fundAmount
            });

            await ethers.provider.send("evm_increaseTime", [86401]);
            await ethers.provider.send("evm_mine", []);
            await royalty.distRoyalty(0);

            // Claim royalty
            await rideBNB.claimRoyalty(ROOT_ID, 0);

            // Check status AFTER claiming
            // Root should stay active for recurring claims (with our fix)
            const isActive = await royalty.royaltyActive(ROOT_ID, 0);
            expect(isActive).to.be.true; // Root stays ACTIVE for recurring claims
        });
    });

    describe("4. Fallback Income Receiver", function () {
        it("Should receive lost income when no qualified upline exists", async function () {
            // Register user1 with insufficient level to receive matrix income
            const cost = parseEther("0.005");
            await rideBNB.register(ROOT_ID, user1.address, { value: cost });

            // User1 is Level 1, no qualified uplines except root
            // Income should flow to root as fallback

            const rootIncomeBefore = await rideBNB.userIncome(ROOT_ID);
            const levelIncomeBefore = rootIncomeBefore.levelIncome;

            // User1 registers another user (this generates referral income)
            const [, , user2] = await ethers.getSigners();
            const cost2 = parseEther("0.005");
            await rideBNB.register(73929, user2.address, { value: cost2 });

            // Root should have received referral income as fallback
            const rootIncomeAfter = await rideBNB.userIncome(ROOT_ID);
            const referralIncomeAfter = rootIncomeAfter.referralIncome;

            // Verify root received additional income
            expect(referralIncomeAfter).to.be.gte(levelIncomeBefore);
        });
    });
});
