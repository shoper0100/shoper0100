// Contract addresses and ABIs
export const MAIN_ABI = [
    "function registerMe(address _referrerAddress) external payable",
    "function upgradeMe(uint256 _levels) external payable",
    "function id(address) external view returns (uint256)",
    "function userInfo(uint256) external view returns (tuple(bool exists, address account, uint256 referrer, uint256 upline, uint256 level, uint256 directTeam, uint256 team, uint256 registrationTime))",
    "function userIncome(uint256) external view returns (tuple(uint256 totalDeposit, uint256 totalIncome, uint256 referralIncome, uint256 sponsorIncome, uint256 levelIncome))",
    "function getLevelCost(uint256 _level) external view returns (uint256)",
    "function totalUsers() external view returns (uint256)",
    "function bnbPrice() external view returns (uint256)",
    "event UserRegistered(uint256 indexed userId, address indexed account, uint256 indexed referrer, uint256 timestamp)",
    "event UserUpgraded(uint256 indexed userId, uint256 newLevel, uint256 amount, uint256 timestamp)",
    "event ReferralPayment(uint256 indexed referrerId, uint256 indexed userId, uint256 amount, uint256 timestamp)",
    "event SponsorCommissionPaid(uint256 indexed sponsorId, uint256 indexed fromUserId, uint256 amount, uint256 level, uint256 timestamp)",
    "event MatrixPayment(uint256 indexed fromUserId, uint256 indexed toUserId, uint256 amount, uint256 level, uint256 layer, bool qualified, uint256 timestamp)"
];

export const ROYALTY_ABI = [
    "function getUserRoyaltyInfo(uint256 _userId, uint256 _royaltyLvl) external view returns (tuple(bool registered, uint256 totalClaimed, uint256 lastClaimTime))",
    "function getClaimableAmount(uint256 _userId, uint256 _royaltyLvl) external view returns (uint256)",
    "function royaltyPools(uint256) external view returns (uint256 balance, uint256 eligibleCount)"
];

// Contract addresses and ABIs
// BSC Mainnet - Deployed 2026-01-11
export const CONTRACTS = {
    // New Deployment Addresses
    MAIN: "0xd4894bfF2096Ad0bB4D2815d57b5C21E2E16db44",
    ROYALTY: "0xce7377de450AEea517704fD98d0B2a2F2e5a6b63",

    // Network Configuration
    chainId: 56, // BSC Mainnet
    chainName: "BNB Smart Chain",
    rpcUrls: [
        "https://bsc-dataseed1.bnbchain.org",
        "https://bsc-dataseed2.bnbchain.org",
        "https://bsc-dataseed3.bnbchain.org",
        "https://bsc-dataseed4.bnbchain.org",
        "https://bsc-dataseed1.binance.org",
        "https://bsc-dataseed2.binance.org",
        "https://bsc.publicnode.com",
        "https://1rpc.io/bnb",
    ],
    blockExplorer: "https://bscscan.com",
    nativeCurrency: {
        name: "BNB",
        symbol: "BNB",
        decimals: 18,
    },

    // System Configuration
    ROOT_USER_ID: 36999,
    ROOT_ADDRESS: "0xD2f8819eD8b85dBFe0B42956D23A8a8e0D041F7f",
    feeReceiver: "0xF2f511BAB6fdAC691Fbf66a608A4Dd7cB813fd27",
    owner: "0x92E8Ef7075cd9a8085187391f32D1118C824Bd17",

    // Chainlink Oracle
    chainlinkBnbUsd: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE",
};

// Contract Links
export const CONTRACT_LINKS = {
    main: `${CONTRACTS.blockExplorer}/address/${CONTRACTS.MAIN}`,
    royalty: `${CONTRACTS.blockExplorer}/address/${CONTRACTS.ROYALTY}`,
    writeMain: `${CONTRACTS.blockExplorer}/address/${CONTRACTS.MAIN}#writeContract`,
    writeRoyalty: `${CONTRACTS.blockExplorer}/address/${CONTRACTS.ROYALTY}#writeContract`,
};

// Level Costs (in USD) - ACTUAL VALUES FROM CONTRACT
export const LEVEL_COSTS = [
    5,     // L1: $5
    5,     // L2: $5
    10,    // L3: $10
    20,    // L4: $20
    40,    // L5: $40
    80,    // L6: $80
    160,   // L7: $160
    320,   // L8: $320
    640,   // L9: $640
    1280,  // L10: $1,280
    2560,  // L11: $2,560
    5120,  // L12: $5,120
    10240  // L13: $10,240
];

// Royalty Tiers
export const ROYALTY_TIERS = [10, 11, 12, 13];

// Helper function to get network config
export function getNetworkConfig() {
    return {
        chainId: `0x${CONTRACTS.chainId.toString(16)}`, // Hex format for wallet
        chainName: CONTRACTS.chainName,
        nativeCurrency: CONTRACTS.nativeCurrency,
        rpcUrls: CONTRACTS.rpcUrls,
        blockExplorerUrls: [CONTRACTS.blockExplorer],
    };
}

// Helper function to check if on correct network
export function isCorrectNetwork(chainId: number): boolean {
    return chainId === CONTRACTS.chainId;
}

// Export for use in components
export default CONTRACTS;
