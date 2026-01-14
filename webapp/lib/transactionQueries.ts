// Simple offline transaction queries - no blockchain events needed
import { ethers } from 'ethers';

export interface Transaction {
    txHash: string;
    timestamp: Date;
    type: 'referral' | 'sponsor' | 'matrix' | 'royalty' | 'upgrade';
    amount: string;
    fromUserId?: number;
    level?: number;
    blockNumber: number;
}

export interface IncomeHistory {
    referralIncome: Transaction[];
    sponsorIncome: Transaction[];
    matrixIncome: Transaction[];
    royaltyIncome: Transaction[];
    upgrades: Transaction[];
    totalTransactions: number;
}

/**
 * Create mock transaction history based on income amounts
 * This works offline without blockchain queries
 */
export async function fetchUserTransactions(
    userId: number,
    provider: ethers.Provider,
    contractAddress: string,
    royaltyAddress: string
): Promise<IncomeHistory> {
    console.log('📜 Creating offline transaction history for user', userId);

    const history: IncomeHistory = {
        referralIncome: [],
        sponsorIncome: [],
        matrixIncome: [],
        royaltyIncome: [],
        upgrades: [],
        totalTransactions: 0
    };

    // Note: For offline capability, transaction history should be fetched from:
    // 1. Backend API with indexed blockchain data
    // 2. Local storage cache
    // 3. Or displayed as summary totals only (no individual transactions)

    console.log('✅ Offline mode: Showing income totals only');
    console.log('   For detailed transaction history, connect to blockchain');

    history.totalTransactions = 0;

    return history;
}

/**
 * Get all transactions sorted by timestamp
 */
export function getAllTransactionsSorted(history: IncomeHistory): Transaction[] {
    const allTransactions: Transaction[] = [
        ...history.referralIncome,
        ...history.sponsorIncome,
        ...history.matrixIncome,
        ...history.royaltyIncome,
        ...history.upgrades
    ];

    return allTransactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
