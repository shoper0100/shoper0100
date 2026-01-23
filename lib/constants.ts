// BSC Mainnet Contract Addresses - Updated for Five Dollar Club (FDC)
export const RIDEBNB_ADDRESS = '0xd4894bfF2096Ad0bB4D2815d57b5C21E2E16db44' as const;
export const ROYALTY_ADDRESS = '0xce7377de450AEea517704fD98d0B2a2F2e5a6b63' as const;

// Network Configuration - BSC Mainnet
export const CHAIN_ID = 56; // BSC Mainnet
export const RPC_URL = 'https://bsc-dataseed1.binance.org';
export const EXPLORER_URL = 'https://bscscan.com';

// Contract constants
export const ROOT_USER_ID = 36999;
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
    chainName: 'BSC Mainnet',
    nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18,
    },
    rpcUrls: [RPC_URL],
    blockExplorerUrls: [EXPLORER_URL],
};
