const hre = require("hardhat");

async function main() {
    console.log("========================================");
    console.log("Deploying FiveDollarRide_USDT to BSC Testnet");
    console.log("========================================\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "wei\n");

    // BSC Testnet Addresses
    const TESTNET_USDT = "0x7F86d4EE5a9dAC4129e01DD91b63F120323bb26e"; // User's USDT Token
    const FEE_RECEIVER = deployer.address; // Change to your admin wallet
    const ROOT_USER_ADDRESS = deployer.address; // Change to your root user
    const ROOT_USER_ID = 36999;

    console.log("Configuration:");
    console.log("- USDT Token:", TESTNET_USDT);
    console.log("- Fee Receiver:", FEE_RECEIVER);
    console.log("- Root User:", ROOT_USER_ADDRESS);
    console.log("- Root User ID:", ROOT_USER_ID);

    // Step 1: Deploy Royalty Contract
    console.log("\n📌 Step 1: Deploying Royalty_USDT Contract...");
    const Royalty = await hre.ethers.getContractFactory("Royalty_USDT");
    const royalty = await Royalty.deploy(
        deployer.address,    // _owner
        ROOT_USER_ID,        // _defaultRefer (root user ID)
        TESTNET_USDT         // _usdtToken
    );
    await royalty.waitForDeployment();
    const royaltyAddress = await royalty.getAddress();
    console.log("✅ Royalty_USDT deployed to:", royaltyAddress);

    // Step 2: Deploy FiveDollarRide_USDT
    console.log("\n📌 Step 2: Deploying FiveDollarRide_USDT Contract...");
    const FiveDollarRide = await hre.ethers.getContractFactory("contracts/FiveDollarRide_USDT.sol:FiveDollarRide");
    const fiveDollarRide = await FiveDollarRide.deploy(
        FEE_RECEIVER,
        royaltyAddress,
        ROOT_USER_ADDRESS,
        ROOT_USER_ID,
        TESTNET_USDT
    );
    await fiveDollarRide.waitForDeployment();
    const fiveDollarRideAddress = await fiveDollarRide.getAddress();
    console.log("✅ FiveDollarRide_USDT deployed to:", fiveDollarRideAddress);

    // Step 3: Connect Contracts
    console.log("\n📌 Step 3: Connecting Royalty to FiveDollarRide...");
    const tx = await royalty.setRideBNBContract(fiveDollarRideAddress);
    await tx.wait();
    console.log("✅ Contracts connected!");

    // Step 4: Verify Contracts on BSCScan
    console.log("\n📌 Step 4: Waiting 30 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
        console.log("Verifying FiveDollarRide_USDT...");
        await hre.run("verify:verify", {
            address: fiveDollarRideAddress,
            constructorArguments: [
                FEE_RECEIVER,
                royaltyAddress,
                ROOT_USER_ADDRESS,
                ROOT_USER_ID,
                TESTNET_USDT
            ],
        });
        console.log("✅ FiveDollarRide_USDT verified!");
    } catch (error) {
        console.log("⚠️ Verification error (might already be verified):", error.message);
    }

    try {
        console.log("Verifying Royalty_USDT...");
        await hre.run("verify:verify", {
            address: royaltyAddress,
            constructorArguments: [deployer.address, ROOT_USER_ID, TESTNET_USDT],
        });
        console.log("✅ Royalty_USDT verified!");
    } catch (error) {
        console.log("⚠️ Verification error (might already be verified):", error.message);
    }

    // Save deployment info
    const deploymentInfo = {
        network: "bscTestnet",
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            FiveDollarRide_USDT: fiveDollarRideAddress,
            Royalty: royaltyAddress,
            USDT: TESTNET_USDT
        },
        constructorArgs: {
            FiveDollarRide: {
                feeReceiver: FEE_RECEIVER,
                royalty: royaltyAddress,
                rootUserAddress: ROOT_USER_ADDRESS,
                rootUserId: ROOT_USER_ID,
                usdtToken: TESTNET_USDT
            },
            Royalty: {
                usdtToken: TESTNET_USDT
            }
        }
    };

    const fs = require("fs");
    const existingData = fs.existsSync("deployment-info.json")
        ? JSON.parse(fs.readFileSync("deployment-info.json", "utf8"))
        : {};

    existingData.bscTestnet = deploymentInfo;
    fs.writeFileSync("deployment-info.json", JSON.stringify(existingData, null, 2));

    console.log("\n========================================");
    console.log("✅ DEPLOYMENT COMPLETE!");
    console.log("========================================");
    console.log("\n📋 Contract Addresses:");
    console.log("FiveDollarRide_USDT:", fiveDollarRideAddress);
    console.log("Royalty:", royaltyAddress);
    console.log("USDT:", TESTNET_USDT);

    console.log("\n📝 Next Steps:");
    console.log("1. Get testnet USDT from faucet");
    console.log("2. Approve FiveDollarRide to spend USDT");
    console.log("3. Test registration with username");
    console.log("4. Test upgrade functionality");
    console.log("5. Verify contracts on BSCScan Testnet");

    console.log("\n🔗 Verification Commands:");
    console.log(`npx hardhat verify --network bscTestnet ${fiveDollarRideAddress} "${FEE_RECEIVER}" "${royaltyAddress}" "${ROOT_USER_ADDRESS}" ${ROOT_USER_ID} "${TESTNET_USDT}"`);
    console.log(`npx hardhat verify --network bscTestnet ${royaltyAddress} "${TESTNET_USDT}"`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
