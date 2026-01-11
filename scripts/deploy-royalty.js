import hre from "hardhat";

async function main() {
    console.log("Deploying Royalty contract to opBNB...");

    // Get deployment parameters from environment
    const ownerAddress = process.env.OWNER_ADDRESS;
    const defaultRefer = process.env.DEFAULT_REFER_ID || "36999";

    // Validate required parameters
    if (!ownerAddress) {
        throw new Error(
            "Missing required environment variables. Please check .env file:\n" +
            "- OWNER_ADDRESS\n" +
            "- DEFAULT_REFER_ID (optional, defaults to 36999)"
        );
    }

    console.log("\nDeployment Parameters:");
    console.log("----------------------");
    console.log("Owner Address:", ownerAddress);
    console.log("Default Refer ID:", defaultRefer);
    console.log("");

    // Deploy the contract
    const Royalty = await hre.ethers.getContractFactory("Royalty");
    const royalty = await Royalty.deploy(ownerAddress, defaultRefer);

    await royalty.waitForDeployment();

    const contractAddress = await royalty.getAddress();
    const network = await hre.ethers.provider.getNetwork();
    const chainId = Number(network.chainId);

    // Determine network name and explorer
    const isTestnet = chainId === 5611;
    const networkName = isTestnet ? "opBNB Testnet" : "opBNB Mainnet";
    const explorerBase = isTestnet ? "https://opbnb-testnet.bscscan.com" : "https://opbnb.bscscan.com";

    console.log("\n✅ Royalty deployed successfully!");
    console.log("==================================");
    console.log("Contract Address:", contractAddress);
    console.log(`Network: ${networkName} (Chain ID: ${chainId})`);
    console.log("Explorer:", `${explorerBase}/address/${contractAddress}`);
    console.log("\nDefault Refer ID:", defaultRefer);

    console.log("\n📋 Features Included:");
    console.log("- Direct referral requirements: [10, 11, 12, 13]");
    console.log("- Root user exemption from direct requirements");
    console.log("- Ascending order validation");
    console.log("- Configurable by owner");

    console.log("\n📋 Next Steps:");
    console.log("1. Set RideBNB contract address:");
    console.log(`   await royalty.setRideBNBContract("YOUR_RIDEBNB_ADDRESS")`);
    console.log("2. Verify contract on BSCScan (optional):");
    console.log(`   npx hardhat verify --network ${isTestnet ? 'opbnbTestnet' : 'opbnb'} ${contractAddress} "${ownerAddress}" "${defaultRefer}"`);
    console.log("\n⚠️  Save this information! Update your .env.local file:");
    console.log(`NEXT_PUBLIC_ROYALTY_ADDRESS=${contractAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
