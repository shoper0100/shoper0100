import hre from "hardhat";

async function main() {
    console.log("🔗 Connecting RideBNB and Royalty Contracts...\n");

    const rideBNBAddress = "0x231a45188e06eB4803f5BFdb71821d5B8530ED03";
    const royaltyAddress = "0xd8F8e666Ea1EE66Be1eAd4dA813e8d12DeF1a795";

    console.log("Contract Addresses:");
    console.log("RideBNB:", rideBNBAddress);
    console.log("Royalty:", royaltyAddress);
    console.log("");

    // Connect to contracts
    const rideBNB = await hre.ethers.getContractAt("RideBNB", rideBNBAddress);
    const royalty = await hre.ethers.getContractAt("Royalty", royaltyAddress);

    // Check current Royalty address in RideBNB
    const currentRoyaltyInRideBNB = await rideBNB.royaltyAddr();
    console.log("✅ Current Royalty in RideBNB:", currentRoyaltyInRideBNB);

    if (currentRoyaltyInRideBNB.toLowerCase() === royaltyAddress.toLowerCase()) {
        console.log("✅ RideBNB already points to correct Royalty contract!");
    } else {
        console.log("⚠️  RideBNB points to different Royalty address");
    }

    // Set RideBNB address in Royalty contract
    console.log("\nSetting RideBNB address in Royalty contract...");
    const tx = await royalty.setRideBNBContract(rideBNBAddress);
    await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("TX Hash:", tx.hash);

    // Verify connection
    const rideBNBInRoyalty = await royalty.rideBNBContract();
    console.log("\n✅ Verification:");
    console.log("RideBNB in Royalty:", rideBNBInRoyalty);

    if (rideBNBInRoyalty.toLowerCase() === rideBNBAddress.toLowerCase()) {
        console.log("\n🎉 Contracts successfully connected!");
        console.log("==================================");
        console.log("✅ RideBNB ↔ Royalty linked");
        console.log("\n📋 Next Step: Configure Chainlink Oracle");
        console.log("Run: npx hardhat run scripts/setup-oracle.js --network opbnbTestnet");
    } else {
        console.log("\n❌ Connection failed - addresses don't match");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
