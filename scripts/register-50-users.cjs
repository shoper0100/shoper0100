const { ethers } = require("hardhat");

/**
 * Register 50 NEW users (generated wallets) and upgrade them
 * This script will:
 * 1. Generate 50 random wallet addresses
 * 2. Fund each wallet with USDT from deployer
 * 3. Approve USDT for the contract (from deployer, then transfer)
 * 4. Register each user using deployer as proxy
 * 5. Upgrade users to random levels
 */

async function main() {
    // Configuration
    const DEPLOYED_CONTRACT = process.env.FIVEDOLLARRIDE_BSC_TESTNET || "0xD295CA7BE4C6bcD65228189D8B90237b25D11625";
    const USDT_ADDRESS = process.env.USDT_BSC_TESTNET || "0x7F86d4EE5a9dAC4129e01DD91b63F120323bb26e";
    const REFERRER_ADDRESS = "0xd9a3044CD5a329b16d5e1E02b0E64FBE18E6bf12";
    const NUM_USERS = 50;

    console.log("\n" + "=".repeat(70));
    console.log("🚀 GENERATING & REGISTERING 50 NEW USERS");
    console.log("=".repeat(70));
    console.log(`📍 Contract: ${DEPLOYED_CONTRACT}`);
    console.log(`💰 USDT: ${USDT_ADDRESS}`);
    console.log(`👤 Referrer: ${REFERRER_ADDRESS}`);
    console.log(`👥 Users to Generate & Register: ${NUM_USERS}\n`);

    // Get deployer (should be the referrer address)
    const [deployer] = await ethers.getSigners();

    console.log(`💼 Deployer: ${deployer.address}`);

    if (deployer.address.toLowerCase() !== REFERRER_ADDRESS.toLowerCase()) {
        console.log(`⚠️  WARNING: Deployer (${deployer.address}) is not the referrer (${REFERRER_ADDRESS})`);
        console.log(`   Continuing anyway...\n`);
    }

    // Connect to contracts
    const FiveDollarRide = await ethers.getContractFactory("FiveDollarRide");
    const contract = FiveDollarRide.attach(DEPLOYED_CONTRACT);

    const USDT = await ethers.getContractFactory("TestUSDT");
    const usdt = USDT.attach(USDT_ADDRESS);

    // Get contract info
    const regCost = await contract.getRegistrationCost();
    const totalCost = regCost.cost;

    console.log("💵 Costs:");
    console.log(`   Registration: ${ethers.formatUnits(totalCost, 18)} USDT per user`);

    // Check deployer USDT balance
    const deployerBalance = await usdt.balanceOf(deployer.address);
    console.log(`\n📊 Deployer USDT Balance: ${ethers.formatUnits(deployerBalance, 18)} USDT`);

    const totalNeeded = totalCost * BigInt(NUM_USERS);
    console.log(`💡 Total USDT needed: ${ethers.formatUnits(totalNeeded, 18)} USDT\n`);

    if (deployerBalance < totalNeeded) {
        console.log(`⚠️  Insufficient USDT! Trying to mint...`);
        try {
            const mintAmount = totalNeeded * BigInt(2);
            const tx = await usdt.mint(deployer.address, mintAmount);
            await tx.wait();
            console.log(`✅ Minted ${ethers.formatUnits(mintAmount, 18)} USDT\n`);
        } catch (error) {
            console.log(`❌ Cannot mint: ${error.message}`);
            console.log(`   Need ${ethers.formatUnits(totalNeeded - deployerBalance, 18)} more USDT\n`);
            return;
        }
    }

    // Generate 50 wallets
    console.log("🔑 Generating 50 random wallets...\n");
    const wallets = [];
    for (let i = 0; i < NUM_USERS; i++) {
        const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
        wallets.push(wallet);
    }
    console.log(`✅ Generated ${wallets.length} wallets\n`);

    // Check current contract state
    const currentTotal = await contract.totalUsers();
    console.log(`📊 Current total users in contract: ${currentTotal}\n`);

    // Register all wallets
    console.log("=".repeat(70));
    console.log("🔄 STARTING REGISTRATION PROCESS");
    console.log("=".repeat(70) + "\n");

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const userNum = i + 1;

        try {
            console.log(`👤 User ${userNum}/${NUM_USERS}: ${wallet.address}`);

            // Fund wallet with BNB for gas (small amount)
            const gasFee = ethers.parseEther("0.01"); // 0.01 BNB for gas
            const tx1 = await deployer.sendTransaction({
                to: wallet.address,
                value: gasFee
            });
            await tx1.wait();
            console.log(`   ⛽ Funded with 0.01 BNB for gas`);

            // Transfer USDT to wallet
            const tx2 = await usdt.transfer(wallet.address, totalCost);
            await tx2.wait();
            console.log(`   💸 Transferred ${ethers.formatUnits(totalCost, 18)} USDT`);

            // Approve USDT from wallet
            const tx3 = await usdt.connect(wallet).approve(DEPLOYED_CONTRACT, totalCost);
            await tx3.wait();
            console.log(`   ✅ Approved USDT`);

            // Register wallet
            const tx4 = await contract.connect(wallet).registerMe(REFERRER_ADDRESS);
            await tx4.wait();

            const userId = await contract.id(wallet.address);
            console.log(`   ✅ Registered! User ID: ${userId}`);

            successCount++;

            // Progress update
            if (userNum % 10 === 0) {
                console.log(`\n📊 Progress: ${userNum}/${NUM_USERS} users registered (${successCount} successful, ${failCount} failed)\n`);
            }

        } catch (error) {
            console.log(`   ❌ Failed: ${error.message.substring(0, 100)}`);
            failCount++;
        }
    }

    // Upgrade first 20 users
    console.log("\n" + "=".repeat(70));
    console.log("⬆️  UPGRADING FIRST 20 USERS");
    console.log("=".repeat(70) + "\n");

    let upgradeSuccess = 0;
    let upgradeFail = 0;

    for (let i = 0; i < Math.min(20, wallets.length); i++) {
        const wallet = wallets[i];

        try {
            const userId = await contract.id(wallet.address);
            if (userId == 0) continue;

            const userInfo = await contract.userInfo(userId);
            const currentLevel = Number(userInfo.level);

            // Random upgrade 1-3 levels
            const levelsToUpgrade = Math.floor(Math.random() * 3) + 1;
            const targetLevel = currentLevel + levelsToUpgrade;

            if (targetLevel > 13) continue;

            console.log(`👤 User ${i + 1} (ID: ${userId}): L${currentLevel} → L${targetLevel} (+${levelsToUpgrade})`);

            // Get upgrade cost
            const upgradeCost = await contract.connect(wallet).getUpgradeCost(levelsToUpgrade);

            // Transfer USDT for upgrade
            const tx1 = await usdt.transfer(wallet.address, upgradeCost.totalCost);
            await tx1.wait();

            // Approve
            const tx2 = await usdt.connect(wallet).approve(DEPLOYED_CONTRACT, upgradeCost.totalCost);
            await tx2.wait();

            // Upgrade
            const tx3 = await contract.connect(wallet).upgradeMe(levelsToUpgrade);
            await tx3.wait();

            console.log(`   ✅ Upgraded successfully!`);
            upgradeSuccess++;

        } catch (error) {
            console.log(`   ❌ Upgrade failed: ${error.message.substring(0, 80)}`);
            upgradeFail++;
        }
    }

    // Final summary
    const finalTotal = await contract.totalUsers();

    console.log("\n" + "=".repeat(70));
    console.log("📊 FINAL SUMMARY");
    console.log("=".repeat(70));
    console.log(`\n👥 Total Users Before: ${currentTotal}`);
    console.log(`👥 Total Users After: ${finalTotal}`);
    console.log(`👥 New Users Added: ${finalTotal - currentTotal}`);
    console.log(`\n✅ Registration Results:`);
    console.log(`   - Successful: ${successCount}`);
    console.log(`   - Failed: ${failCount}`);
    console.log(`\n⬆️  Upgrade Results:`);
    console.log(`   - Successful: ${upgradeSuccess}`);
    console.log(`   - Failed: ${upgradeFail}`);
    console.log("\n" + "=".repeat(70));
    console.log("✅ COMPLETE!");
    console.log("=".repeat(70) + "\n");

    // Save wallet info to file
    console.log("💾 Saving wallet addresses to file...");
    const fs = require('fs');
    const walletData = wallets.map((w, i) => ({
        index: i + 1,
        address: w.address,
        privateKey: w.privateKey
    }));
    fs.writeFileSync('generated-wallets.json', JSON.stringify(walletData, null, 2));
    console.log("✅ Saved to generated-wallets.json\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:");
        console.error(error);
        process.exit(1);
    });
