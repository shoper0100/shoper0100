const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying FiveDollarRide System to BSC MAINNET (Separated Roles)...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    // SEPARATED ROLES Configuration
    const OWNER_ADDRESS = "0x92E8Ef7075cd9a8085187391f32D1118C824Bd17";
    const FEE_RECEIVER = "0xF2f511BAB6fdAC691Fbf66a608A4Dd7cB813fd27";
    const ROOT_USER_ADDRESS = "0xD2f8819eD8b85dBFe0B42956D23A8a8e0D041F7f";
    const ROOT_USER_ID = 36999;

    console.log("\n📋 Configuration:");
    console.log("Deployer:", deployer.address);
    console.log("Owner:", OWNER_ADDRESS);
    console.log("Fee Receiver:", FEE_RECEIVER);
    console.log("Root User:", ROOT_USER_ADDRESS);
    console.log("Root User ID:", ROOT_USER_ID);

    console.log("\n=== Step 1: Deploy Royalty Contract ===");
    const RoyaltyFactory = await hre.ethers.getContractFactory("FiveDollarRideRoyalty_BNB");
    const royalty = await RoyaltyFactory.deploy(
        OWNER_ADDRESS,
        ROOT_USER_ADDRESS,
        hre.ethers.ZeroAddress // main contract (set later)
    );
    await royalty.waitForDeployment();
    const royaltyAddress = await royalty.getAddress();
    console.log("✓ Royalty deployed to:", royaltyAddress);

    console.log("\n=== Step 2: Deploy Main Contract ===");
    const MainFactory = await hre.ethers.getContractFactory("contracts/FiveDollarRide_BNB_Pure.sol:FiveDollarRide");
    const mainContract = await MainFactory.deploy(
        FEE_RECEIVER,
        royaltyAddress,
        ROOT_USER_ADDRESS,
        ROOT_USER_ID
    );
    await mainContract.waitForDeployment();
    const mainAddress = await mainContract.getAddress();
    console.log("✓ Main Contract deployed to:", mainAddress);

    console.log("\n=== Step 3: Connect Contracts ===");
    const tx = await royalty.setMainContract(mainAddress);
    await tx.wait();
    console.log("✓ Contracts connected");

    console.log("\n=== Step 4: Initialize Royalty ===");
    const initTx = await mainContract.initializeRoyalty();
    await initTx.wait();
    console.log("✓ Root user registered in all royalty tiers");

    console.log("\n=== Step 5: Transfer Ownership ===");
    const transferTx = await mainContract.transferOwnership(OWNER_ADDRESS);
    await transferTx.wait();
    console.log("✓ Main contract ownership transferred to:", OWNER_ADDRESS);

    console.log("\n=== 🎉 MAINNET DEPLOYMENT SUMMARY 🎉 ===");
    console.log("Royalty Contract:", royaltyAddress);
    console.log("Main Contract:", mainAddress);
    console.log("Owner:", OWNER_ADDRESS);
    console.log("Fee Receiver:", FEE_RECEIVER);
    console.log("Root User:", ROOT_USER_ADDRESS);
    console.log("Root User ID:", ROOT_USER_ID);
    console.log("Deployer:", deployer.address);

    console.log("\n=== Verification Commands ===");
    console.log("\nRoyalty:");
    console.log(`npx hardhat verify --network bsc ${royaltyAddress} "${OWNER_ADDRESS}" "${ROOT_USER_ADDRESS}" "${hre.ethers.ZeroAddress}"`);
    console.log("\nMain Contract:");
    console.log(`npx hardhat verify --network bsc ${mainAddress} "${FEE_RECEIVER}" "${royaltyAddress}" "${ROOT_USER_ADDRESS}" ${ROOT_USER_ID}`);

    // Save addresses
    const fs = require('fs');
    const deployment = {
        network: "BSC Mainnet",
        timestamp: new Date().toISOString(),
        contracts: {
            royalty: royaltyAddress,
            main: mainAddress
        },
        roles: {
            deployer: deployer.address,
            owner: OWNER_ADDRESS,
            feeReceiver: FEE_RECEIVER,
            rootUser: ROOT_USER_ADDRESS,
            rootUserId: ROOT_USER_ID
        },
        gasPrice: "0.1 Gwei"
    };
    fs.writeFileSync('deployment-bsc-mainnet-separated.json', JSON.stringify(deployment, null, 2));
    console.log("\n✓ Deployment info saved to deployment-bsc-mainnet-separated.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
