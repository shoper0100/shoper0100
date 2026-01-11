const hre = require("hardhat");

async function main() {
    console.log("Deploying FiveDollarRide System to BSC Testnet...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    // Configuration
    const FEE_RECEIVER = deployer.address; // Change if needed
    const ROOT_USER_ADDRESS = deployer.address; // Change if needed
    const ROOT_USER_ID = 36999; // Registration counter starts from here

    console.log("\n=== Step 1: Deploy Royalty Contract ===");
    const RoyaltyFactory = await hre.ethers.getContractFactory("FiveDollarRideRoyalty_BNB");
    const royalty = await RoyaltyFactory.deploy(
        deployer.address, // owner
        ROOT_USER_ADDRESS, // default refer
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

    console.log("\n=== Deployment Summary ===");
    console.log("Royalty Contract:", royaltyAddress);
    console.log("Main Contract:", mainAddress);
    console.log("Fee Receiver:", FEE_RECEIVER);
    console.log("Root User:", ROOT_USER_ADDRESS);

    console.log("\n=== Verification Commands ===");
    console.log("\nRoyalty:");
    console.log(`npx hardhat verify --network bscTestnet ${royaltyAddress} "${deployer.address}" "${ROOT_USER_ADDRESS}" "${hre.ethers.ZeroAddress}"`);
    console.log("\nMain Contract:");
    console.log(`npx hardhat verify --network bscTestnet ${mainAddress} "${FEE_RECEIVER}" "${royaltyAddress}" "${ROOT_USER_ADDRESS}" ${ROOT_USER_ID}`);

    // Save addresses
    const fs = require('fs');
    const deployment = {
        network: "bscTestnet",
        timestamp: new Date().toISOString(),
        contracts: {
            royalty: royaltyAddress,
            main: mainAddress
        },
        config: {
            feeReceiver: FEE_RECEIVER,
            rootUser: ROOT_USER_ADDRESS,
            rootUserId: ROOT_USER_ID
        }
    };
    fs.writeFileSync('deployment-bsc-testnet.json', JSON.stringify(deployment, null, 2));
    console.log("\n✓ Deployment info saved to deployment-bsc-testnet.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
