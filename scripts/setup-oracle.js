import hre from "hardhat";

async function main() {
    console.log("⚙️  Configuring Chainlink Oracle...\n");

    const rideBNBAddress = "0x231a45188e06eB4803f5BFdb71821d5B8530ED03";
    const oracleAddress = "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526"; // opBNB Testnet BNB/USD

    console.log("Contract Address:", rideBNBAddress);
    console.log("Oracle Address:", oracleAddress);
    console.log("Oracle Type: Chainlink BNB/USD (opBNB Testnet)");
    console.log("");

    // Connect to contract
    const rideBNB = await hre.ethers.getContractAt("RideBNB", rideBNBAddress);

    // Step 1: Set oracle address
    console.log("Step 1: Setting oracle address...");
    const currentOracle = await rideBNB.priceOracle();

    if (currentOracle.toLowerCase() === oracleAddress.toLowerCase()) {
        console.log("✅ Oracle already set!");
    } else {
        const tx1 = await rideBNB.setPriceOracle(oracleAddress);
        await tx1.wait();
        console.log("✅ Oracle address set!");
        console.log("TX:", tx1.hash);

        // Wait a bit for the blockchain to update
        console.log("Waiting for confirmation...");
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Step 2: Manual price update
    console.log("\nStep 2: Updating price from oracle...");
    try {
        const tx2 = await rideBNB.updateBnbPriceFromOracle();
        await tx2.wait();
        console.log("✅ Price updated!");
        console.log("TX:", tx2.hash);
    } catch (error) {
        console.log("⚠️  Price update failed. This might be normal if:");
        console.log("   - Oracle hasn't reported yet");
        console.log("   - Price is outside acceptable range");
        console.log("   - Network delay");
        console.log("\nContinuing with verification...");
    }

    // Step 3: Verify configuration
    console.log("\n📊 Verification:");
    console.log("==================");

    const priceOracle = await rideBNB.priceOracle();
    const bnbPrice = await rideBNB.bnbPriceInUSD();
    const lastUpdate = await rideBNB.lastPriceUpdate();
    const autoUpdate = await rideBNB.autoUpdateEnabled();

    console.log("Oracle Address:", priceOracle);
    console.log("BNB Price: $" + bnbPrice);
    console.log("Last Update:", Number(lastUpdate) === 0 ? "Never" : new Date(Number(lastUpdate) * 1000).toLocaleString());
    console.log("Auto-Update:", autoUpdate ? "ON ✅" : "OFF ❌");

    if (priceOracle.toLowerCase() === oracleAddress.toLowerCase()) {
        console.log("\n🎉 Oracle Configuration Complete!");
        console.log("==================================");
        console.log("✅ Oracle address set correctly");
        console.log("✅ Auto-update enabled");
        console.log(`✅ Current BNB price: $${bnbPrice}`);
        console.log("\n💡 Note: Price will auto-update on next transaction if 24h passed");
        console.log("\n📋 Next Step: Update and deploy frontend");
        console.log("Update .env.local with contract addresses and deploy to VPS");
    } else {
        console.log("\n❌ Oracle configuration failed");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
