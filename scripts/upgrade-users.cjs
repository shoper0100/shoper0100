const { ethers } = require("hardhat");
const fs = require('fs');

/**
 * Upgrade the 10 registered users to random levels
 */

async function main() {
    const DEPLOYED_CONTRACT = process.env.FIVEDOLLARRIDE_BSC_TESTNET || "0xD295CA7BE4C6bcD65228189D8B90237b25D11625";
    const USDT_ADDRESS = process.env.USDT_BSC_TESTNET || "0x7F86d4EE5a9dAC4129e01DD91b63F120323bb26e";

    console.log("\n" + "=".repeat(70));
    console.log("⬆️  UPGRADING REGISTERED USERS");
    console.log("=".repeat(70) + "\n");

    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log(`💼 Deployer: ${deployer.address}\n`);

    // Connect to contracts
    const FiveDollarRide = await ethers.getContractFactory("FiveDollarRide");
    const contract = FiveDollarRide.attach(DEPLOYED_CONTRACT);

    const USDT = await ethers.getContractFactory("TestUSDT");
    const usdt = USDT.attach(USDT_ADDRESS);

    // Load generated wallets
    const walletsData = JSON.parse(fs.readFileSync('generated-wallets.json', 'utf8'));

    console.log(`📋 Loaded ${walletsData.length} wallets from file\n`);

    // Check deployer balances
    const deployerBNB = await ethers.provider.getBalance(deployer.address);
    const deployerUSDT = await usdt.balanceOf(deployer.address);

    console.log(`💰 Deployer Balances:`);
    console.log(`   BNB: ${ethers.formatEther(deployerBNB)} BNB`);
    console.log(`   USDT: ${ethers.formatUnits(deployerUSDT, 18)} USDT\n`);

    let successCount = 0;
    let failCount = 0;

    // Upgrade first 10 users (the ones that were successfully registered)
    console.log("=".repeat(70));
    console.log("🔄 UPGRADING USERS");
    console.log("=".repeat(70) + "\n");

    for (let i = 0; i < Math.min(10, walletsData.length); i++) {
        const walletData = walletsData[i];

        try {
            // Recreate wallet from private key
            const wallet = new ethers.Wallet(walletData.privateKey, ethers.provider);

            // Check if registered
            const userId = await contract.id(wallet.address);
            if (userId == 0) {
                console.log(`👤 User ${i + 1}: Not registered, skipping...`);
                continue;
            }

            const userInfo = await contract.userInfo(userId);
            const currentLevel = Number(userInfo.level);

            // Random upgrade between 1-5 levels
            const levelsToUpgrade = Math.floor(Math.random() * 5) + 1;
            const targetLevel = currentLevel + levelsToUpgrade;

            if (targetLevel > 13) {
                console.log(`👤 User ${i + 1} (ID: ${userId}): Already at L${currentLevel}, skipping upgrade`);
                continue;
            }

            console.log(`👤 User ${i + 1} (ID: ${userId}): L${currentLevel} → L${targetLevel} (+${levelsToUpgrade})`);

            // Get upgrade cost
            const upgradeCost = await contract.connect(wallet).getUpgradeCost(levelsToUpgrade);
            console.log(`   Cost: ${ethers.formatUnits(upgradeCost.totalCost, 18)} USDT`);

            // Check wallet BNB balance
            const walletBNB = await ethers.provider.getBalance(wallet.address);
            const neededBNB = ethers.parseEther("0.05"); // Need more BNB for upgrade TX

            if (walletBNB < neededBNB) {
                console.log(`   💸 Funding with 0.05 BNB for gas...`);
                const tx1 = await deployer.sendTransaction({
                    to: wallet.address,
                    value: neededBNB
                });
                await tx1.wait();
            }

            // Transfer USDT for upgrade
            console.log(`   💸 Transferring ${ethers.formatUnits(upgradeCost.totalCost, 18)} USDT...`);
            const tx2 = await usdt.transfer(wallet.address, upgradeCost.totalCost);
            await tx2.wait();

            // Approve USDT
            console.log(`   ✅ Approving USDT...`);
            const tx3 = await usdt.connect(wallet).approve(DEPLOYED_CONTRACT, upgradeCost.totalCost);
            await tx3.wait();

            // Upgrade
            console.log(`   ⬆️  Upgrading...`);
            const tx4 = await contract.connect(wallet).upgradeMe(levelsToUpgrade);
            await tx4.wait();

            const newInfo = await contract.userInfo(userId);
            console.log(`   ✅ Successfully upgraded to L${newInfo.level}!\n`);

            successCount++;

        } catch (error) {
            console.log(`   ❌ Failed: ${error.message.substring(0, 100)}\n`);
            failCount++;
        }
    }

    // Final summary
    console.log("=".repeat(70));
    console.log("📊 UPGRADE SUMMARY");
    console.log("=".repeat(70));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log("=".repeat(70) + "\n");

    // Show final contract state
    const totalUsers = await contract.totalUsers();
    console.log(`👥 Total users in contract: ${totalUsers}\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:");
        console.error(error);
        process.exit(1);
    });
