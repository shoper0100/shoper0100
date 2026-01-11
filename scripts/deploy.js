import hre from "hardhat";

async function main() {
    console.log("Deploying RideBNB contract to opBNB...");

    // Get deployment parameters from environment
    const feeReceiver = process.env.FEE_RECEIVER_ADDRESS;
    const royaltyAddress = process.env.ROYALTY_ADDRESS;
    const ownerAddress = process.env.OWNER_ADDRESS;
    const defaultRefer = process.env.DEFAULT_REFER_ID || "36999";

    // Validate required parameters
    if (!feeReceiver || !royaltyAddress || !ownerAddress) {
        throw new Error(
            "Missing required environment variables. Please check .env file:\\n" +
            "- FEE_RECEIVER_ADDRESS\\n" +
            "- ROYALTY_ADDRESS\\n" +
            "- OWNER_ADDRESS\\n" +
            "- DEFAULT_REFER_ID (optional, defaults to 36999)"
        );
    }

    console.log("\\nDeployment Parameters:");
    console.log("----------------------");
    console.log("Fee Receiver:", feeReceiver);
    console.log("Royalty Address:", royaltyAddress);
    console.log("Owner Address:", ownerAddress);
    console.log("Default Refer ID:", defaultRefer);
    console.log("");

    // Deploy the contract
    const RideBNB = await hre.ethers.getContractFactory("RideBNB");
    const rideBNB = await RideBNB.deploy(
        feeReceiver,
        royaltyAddress,
        ownerAddress,
        defaultRefer
    );

    await rideBNB.waitForDeployment();

    const contractAddress = await rideBNB.getAddress();
    const network = await hre.ethers.provider.getNetwork();
    const chainId = Number(network.chainId);

    // Determine network name and explorer
    const isTestnet = chainId === 5611;
    const networkName = isTestnet ? "opBNB Testnet" : "opBNB Mainnet";
    const explorerBase = isTestnet ? "https://opbnb-testnet.bscscan.com" : "https://opbnb.bscscan.com";

    console.log("\\n✅ RideBNB deployed successfully!");
    console.log("==================================");
    console.log("Contract Address:", contractAddress);
    console.log(`Network: ${networkName} (Chain ID: ${chainId})`);
    console.log("Explorer:", `${explorerBase}/address/${contractAddress}`);
    console.log("\\nDefault Refer ID:", defaultRefer);
    console.log("\\n📋 Next Steps:");
    console.log("1. Update lib/constants.ts with new contract address");
    console.log("2. Verify contract on BSCScan (optional):");
    console.log(`   npx hardhat verify --network ${isTestnet ? 'opbnbTestnet' : 'opbnb'} ${contractAddress} "${feeReceiver}" "${royaltyAddress}" "${ownerAddress}" "${defaultRefer}"`);
    console.log("\\n⚠️  Save this information! Update your .env.local file:");
    console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
    console.log(`NEXT_PUBLIC_DEFAULT_REFER=${defaultRefer}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
