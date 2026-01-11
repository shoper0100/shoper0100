// opBNB Testnet Contract Addresses - Updated Dec 26, 2025
export const RIDEBNB_ADDRESS = '0x9d02E94bDBCa308321023D6f4C949a55Fe0004aF' as const;
export const ROYALTY_ADDRESS = '0x37beB9241455EA436DEd9f9bDa7550237D507744' as const;

// Network Configuration
export const CHAIN_ID = 5611; // opBNB Testnet
export const RPC_URL = 'https://opbnb-testnet-rpc.bnbchain.org';
export const EXPLORER_URL = 'https://opbnb-testnet.bscscan.com';

// Contract constants
export const ROOT_USER_ID = 73928;
export const MAX_LEVELS = 13;
export const ROYALTY_TIERS = 4;
export const ROYALTY_LEVELS = [10, 11, 12, 13];
export const ROYALTY_PERCENTAGES = [40, 30, 20, 10];
export const DIRECT_REQUIRED = 2;
export const ROYALTY_MAX_PERCENT = 150;

// Level costs in BNB (wei values from contract)
export const LEVEL_COSTS = [
    '4000000000000000',      // Level 1: 0.004 BNB
    '6000000000000000',      // Level 2: 0.006 BNB
    '12000000000000000',     // Level 3: 0.012 BNB
    '24000000000000000',     // Level 4: 0.024 BNB
    '48000000000000000',     // Level 5: 0.048 BNB
    '96000000000000000',     // Level 6: 0.096 BNB
    '192000000000000000',    // Level 7: 0.192 BNB
    '384000000000000000',    // Level 8: 0.384 BNB
    '768000000000000000',    // Level 9: 0.768 BNB
    '1536000000000000000',   // Level 10: 1.536 BNB
    '3072000000000000000',   // Level 11: 3.072 BNB
    '6144000000000000000',   // Level 12: 6.144 BNB
    '12288000000000000000',  // Level 13: 12.288 BNB
];

// Fee percentages for each level (5% default)
export const LEVEL_FEES = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];

// Network configuration for wallet
export const NETWORK_CONFIG = {
    chainId: `0x${CHAIN_ID.toString(16)}`,
    chainName: 'opBNB Testnet',
    nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18,
    },
    rpcUrls: [RPC_URL],
    blockExplorerUrls: [EXPLORER_URL],
};
