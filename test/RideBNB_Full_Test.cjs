const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RideBNB Full System Test", function () {
    let rideBNB, royalty;
    let owner, user1, user2, user3, dao, emergencyAdmin, feeReceiver;

    // Ethers compatibility helper
    const parseEther = ethers.parseEther || ethers.utils.parseEther;

    beforeEach(async function () {
        [owner, user1, user2, user3, dao, emergencyAdmin, feeReceiver] = await ethers.getSigners();

        // Deploy Royalty first
        const Royalty = await ethers.getContractFactory("Royalty");
        royalty = await Royalty.deploy(owner.address, 73928);
        await royalty.deployed ? await royalty.deployed() : await royalty.waitForDeployment();

        // Deploy RideBNB
        const RideBNB = await ethers.getContractFactory("RideBNB");
        rideBNB = await RideBNB.deploy(
            feeReceiver.address,
            (royalty.address || royalty.target),
            owner.address,
            73928
        );
        await rideBNB.deployed ? await rideBNB.deployed() : await rideBNB.waitForDeployment();

        // Connect contracts
        await royalty.setRideBNBContract((rideBNB.address || rideBNB.target));
    });

    describe("1. User Functions", function () {
        it("Should register a new user correctly", async function () {
            // Calculate costs handling diverse Ethers versions (BigNumber vs BigInt)
            const cost = parseEther("0.004");
            const fee = parseEther("0.0002");
            // Use string addition safety or BigNumber method if available
            let total;
            if (cost.add) {
                total = cost.add(fee);
            } else {
                total = cost + fee;
            }

            await rideBNB.register(73928, user1.address, { value: total });

            const userInfo = await rideBNB.userInfo(73929);
            expect(userInfo.account).to.equal(user1.address);
            expect(userInfo.level.toString()).to.equal("1");
            expect(userInfo.exists).to.be.true;
        });

        it("Should fail registration with insufficient funds", async function () {
            await expect(
                rideBNB.register(73928, user1.address, { value: parseEther("0.001") })
            ).to.be.revertedWith("Insufficient BNB");
        });

        it("Should upgrade user level", async function () {
            const cost = parseEther("0.004");
            const fee = parseEther("0.0002");
            let total = cost.add ? cost.add(fee) : cost + fee;

            await rideBNB.register(73928, user1.address, { value: total });

            // Upgrade to level 2
            const levels = await rideBNB.getLevels();
            const l2Cost = levels[0][1]; // Array 0 is costs, Index 1 is Level 2
            const l2Percent = levels[1][1]; // Array 1 is percents, Index 1 is Level 2

            // Fee calculation: (cost * percent) / 100
            let l2Fee;
            if (l2Cost.mul) { // Ethers v5
                l2Fee = l2Cost.mul(l2Percent).div(100);
            } else { // Ethers v6 BigInt
                l2Fee = (l2Cost * l2Percent) / 100n;
            }

            let upgradeTotal = l2Cost.add ? l2Cost.add(l2Fee) : l2Cost + l2Fee;

            await rideBNB.connect(user1).upgrade(73929, 1, { value: upgradeTotal });

            const userInfo = await rideBNB.userInfo(73929);
            expect(userInfo.level.toString()).to.equal("2");
        });
    });

    describe("2. Admin Functions (DAO Control)", function () {
        it("Should allow Owner (as initial DAO) to set configuration", async function () {
            await rideBNB.setBnbPrice(500);
            const config = await rideBNB.getContractConfig();
            // Access by index or name depending on return type
            // _bnbPriceInUSD is at index 3 based on contract definition return list
            expect(config[3].toString()).to.equal("500");
        });

        it("Should prevent non-DAO from setting configuration", async function () {
            await expect(
                rideBNB.connect(user1).setBnbPrice(500)
            ).to.be.revertedWith("Only owner or DAO");
        });
    });

    describe("3. Governance Functions", function () {
        it("Should transfer DAO control", async function () {
            await rideBNB.transferDAOControl(dao.address);

            // Owner still has access (owner OR DAO logic)
            await rideBNB.setBnbPrice(600);
            const config1 = await rideBNB.getContractConfig();
            expect(config1[3].toString()).to.equal("600");

            // New DAO also has access
            await rideBNB.connect(dao).setBnbPrice(700);
            const config2 = await rideBNB.getContractConfig();
            expect(config2[3].toString()).to.equal("700");
        });
    });

    describe("4. Emergency Functions", function () {
        it("Should pause and unpause contract", async function () {
            await rideBNB.emergencyPause();
            expect(await rideBNB.paused()).to.be.true;

            const cost = parseEther("0.004");
            const fee = parseEther("0.0002");
            let total = cost.add ? cost.add(fee) : cost + fee;

            await expect(
                rideBNB.register(73928, user1.address, { value: total })
            ).to.be.revertedWith("Contract paused");

            await rideBNB.emergencyUnpause();
            expect(await rideBNB.paused()).to.be.false;
        });
    });
});
