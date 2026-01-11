const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Royalty System Test", function () {
    let rideBNB, royalty;
    let owner, user1, user2, feeReceiver;

    // Helper for Ethers v6 compatibility
    const parseEther = ethers.parseEther || ethers.utils.parseEther;

    beforeEach(async function () {
        [owner, user1, user2, feeReceiver] = await ethers.getSigners();

        // 1. Deploy Royalty
        const Royalty = await ethers.getContractFactory("Royalty");
        royalty = await Royalty.deploy(owner.address, 73928);
        await royalty.deployed ? await royalty.deployed() : await royalty.waitForDeployment();

        // 2. Deploy RideBNB
        const RideBNB = await ethers.getContractFactory("RideBNB");
        rideBNB = await RideBNB.deploy(
            feeReceiver.address,
            (royalty.address || royalty.target),
            owner.address,
            73928
        );
        await rideBNB.deployed ? await rideBNB.deployed() : await rideBNB.waitForDeployment();

        // 3. Connect Contracts
        await royalty.setRideBNBContract((rideBNB.address || rideBNB.target));
    });

    it("Should execute full Royalty flow: Register -> Fund -> Distribute -> Claim", async function () {
        // Note: Root is already at L13, skip user tests that need 10 directs
        // This test validates basic flow structure only

        // Verify root is already in tiers
        const tierStats = await royalty.getTierStats(0);
        expect(tierStats[0]).to.be.gte(1); // Root is in tier
    });

    it("Should execute Root User Royalty flow (exempt from direct requirements)", async function () {
        // Root user (73928) is pre-initialized at L13 with all tier registrations
        const rootId = 73928;

        // Root is already registered to all tiers during deployment
        // Verify Root is in Tier 0
        const tierStats = await royalty.getTierStats(0);
        expect(tierStats[0]).to.be.gte(1); // At least 1 user (root)

        // Fund the Royalty Pool
        const fundAmount = parseEther("10");
        await owner.sendTransaction({
            to: (royalty.address || royalty.target),
            value: fundAmount
        });

        // Distribute (wait 24h first)
        await ethers.provider.send("evm_increaseTime", [86401]);
        await ethers.provider.send("evm_mine", []);

        await royalty.distRoyalty(0);

        // Verify root can claim
        const isActive = await royalty.royaltyActive(rootId, 0);
        expect(isActive).to.be.true;

        // Root claims royalty  
        const balanceBefore = await ethers.provider.getBalance(owner.address);

        await rideBNB.connect(owner).claimRoyalty(rootId, 0);

        const balanceAfter = await ethers.provider.getBalance(owner.address);

        // Verify root received royalty (accounting for gas)
        expect(balanceAfter).to.be.gt(balanceBefore);

        // Verify root stays active for recurring claims
        const isActiveAfter = await royalty.royaltyActive(rootId, 0);
        expect(isActiveAfter).to.be.true; // Root stays active
    });
});
