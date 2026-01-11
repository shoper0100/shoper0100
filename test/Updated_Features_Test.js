import { expect } from "chai";
import hre from "hardhat";

describe("🔥 RideBNB + Royalty Updated Features Test", function () {
    let rideBNB, royalty;
    let owner, dao, feeReceiver, user1, user2, user3, rootUser;
    let mockOracle;

    const LEVEL_COST = hre.ethers.parseEther("0.004");
    const ADMIN_FEE = hre.ethers.parseEther("0.0002");
    const TOTAL_COST = LEVEL_COST + ADMIN_FEE;
    const ROOT_ID = 1;

    beforeEach(async function () {
        [owner, dao, feeReceiver, user1, user2, user3, rootUser] = await hre.ethers.getSigners();

        // Deploy Mock Oracle
        const MockOracle = await hre.ethers.getContractFactory("MockChainlinkOracle");
        mockOracle = await MockOracle.deploy();
        await mockOracle.setPrice(650); // $650 BNB price

        // Deploy Royalty
        const Royalty = await hre.ethers.getContractFactory("Royalty");
        royalty = await Royalty.deploy(owner.address, ROOT_ID);

        // Deploy RideBNB
        const RideBNB = await hre.ethers.getContractFactory("RideBNB");
        rideBNB = await RideBNB.deploy(
            feeReceiver.address,
            await royalty.getAddress(),
            owner.address,
            ROOT_ID
        );

        // Connect contracts
        await royalty.setRideBNBContract(await rideBNB.getAddress());

        console.log("✅ Contracts deployed and connected");
    });

    describe("🎛️ Configurable Royalty Tests", function () {
        it("Should have 5% default royalty", async function () {
            const royaltyPercent = await rideBNB.royaltyFundPercent();
            expect(royaltyPercent).to.equal(5n);
        });

        it("Should allow owner to change royalty percentage", async function () {
            await rideBNB.setRoyaltyFundPercent(7);
            expect(await rideBNB.royaltyFundPercent()).to.equal(7n);
        });

        it("Should reject royalty > 20%", async function () {
            await expect(
                rideBNB.setRoyaltyFundPercent(25)
            ).to.be.revertedWith("Exceeds max royalty percent");
        });
    });

    describe("🔗 Chainlink Oracle Tests", function () {
        beforeEach(async function () {
            await rideBNB.setPriceOracle(await mockOracle.getAddress());
        });

        it("Should set oracle address", async function () {
            const oracle = await rideBNB.priceOracle();
            expect(oracle).to.equal(await mockOracle.getAddress());
        });

        it("Should update price from oracle", async function () {
            await rideBNB.updateBnbPriceFromOracle();
            const price = await rideBNB.bnbPriceInUSD();
            expect(price).to.equal(650n);
        });

        it("Should have auto-update ON by default", async function () {
            const autoUpdate = await rideBNB.autoUpdateEnabled();
            expect(autoUpdate).to.be.true;
        });

        it("Should allow toggling auto-update", async function () {
            await rideBNB.setAutoUpdateEnabled(false);
            expect(await rideBNB.autoUpdateEnabled()).to.be.false;

            await rideBNB.setAutoUpdateEnabled(true);
            expect(await rideBNB.autoUpdateEnabled()).to.be.true;
        });
    });

    describe("👥 Direct Referral Requirements Tests", function () {
        it("Should have default direct requirements [10,11,12,13]", async function () {
            for (let i = 0; i < 4; i++) {
                const req = await royalty.royaltyDirectRequired(i);
                expect(req).to.equal(BigInt(10 + i));
            }
        });

        it("Should allow owner to change direct requirements", async function () {
            await royalty.setRoyaltyDirectRequired([5, 10, 15, 20]);

            expect(await royalty.royaltyDirectRequired(0)).to.equal(5n);
            expect(await royalty.royaltyDirectRequired(1)).to.equal(10n);
            expect(await royalty.royaltyDirectRequired(2)).to.equal(15n);
            expect(await royalty.royaltyDirectRequired(3)).to.equal(20n);
        });

        it("Should reject descending requirements", async function () {
            await expect(
                royalty.setRoyaltyDirectRequired([20, 15, 10, 5])
            ).to.be.revertedWith("Must be ascending");
        });
    });

    describe("🔄 Registration with Direct Count Tests", function () {
        it("Should pass direct count when registering for royalty", async function () {
            // Register user1
            await rideBNB.connect(user1).register(ROOT_ID, user1.address, {
                value: TOTAL_COST
            });

            const user1Id = await rideBNB.id(user1.address);
            expect(user1Id).to.equal(2n);

            // Register user2 under user1
            await rideBNB.connect(user2).register(user1Id, user2.address, {
                value: TOTAL_COST
            });

            // Check user1's direct team count
            const user1Info = await rideBNB.userInfo(user1Id);
            expect(user1Info.directTeam).to.equal(1n);
        });
    });

    describe("💰 Payment Distribution with Royalty Tests", function () {
        it("Should distribute 5% to royalty pool", async function () {
            const royaltyBalanceBefore = await hre.ethers.provider.getBalance(await royalty.getAddress());

            await rideBNB.connect(user1).register(ROOT_ID, user1.address, {
                value: TOTAL_COST
            });

            const royaltyBalanceAfter = await hre.ethers.provider.getBalance(await royalty.getAddress());
            const royaltyReceived = royaltyBalanceAfter - royaltyBalanceBefore;

            // 5% of 0.004 = 0.0002
            const expected = hre.ethers.parseEther("0.0002");
            expect(royaltyReceived).to.equal(expected);
        });
    });

    describe("📊 Complete Integration Test", function () {
        it("Should work end-to-end with all features", async function () {
            // 1. Set oracle
            await rideBNB.setPriceOracle(await mockOracle.getAddress());
            await rideBNB.updateBnbPriceFromOracle();

            // 2. Configure royalty
            await rideBNB.setRoyaltyFundPercent(7);

            // 3. Set direct requirements
            await royalty.setRoyaltyDirectRequired([8, 10, 12, 15]);

            // 4. Register users
            await rideBNB.connect(user1).register(ROOT_ID, user1.address, {
                value: TOTAL_COST
            });

            const user1Id = await rideBNB.id(user1.address);

            // 5. Check all states
            expect(await rideBNB.bnbPriceInUSD()).to.equal(650n);
            expect(await rideBNB.royaltyFundPercent()).to.equal(7n);
            expect(await royalty.royaltyDirectRequired(0)).to.equal(8n);
            expect(user1Id).to.be.gt(0n);

            console.log("\n✅ Full integration test passed!");
            console.log("   - Oracle: Working");
            console.log("   - Royalty: 7%");
            console.log("   - Direct Req: [8,10,12,15]");
            console.log("   - Registration: Success");
        });
    });
});
