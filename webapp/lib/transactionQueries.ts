// Transaction History Queries - SIMPLE: Just hash + amount
import { ethers, Provider } from 'ethers';
import { MAIN_ABI } from './contracts';

export interface Transaction {
    txHash: string;
    timestamp: Date; // Not fetched, just for UI compatibility
    type: 'referral' | 'sponsor' | 'matrix' | 'royalty' | 'upgrade';
    amount: string;
    fromUserId?: number;
    level?: number;
    qualified?: boolean; // For matrix payments - did user qualify?
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
 * Fetch user's transaction history - SIMPLE VERSION
 * Only fetches txHash + amount (no timestamps from blocks)
 */
export async function fetchUserTransactions(
    userId: number,
    provider: ethers.Provider,
    contractAddress: string,
    royaltyAddress: string
): Promise<IncomeHistory> {
    console.log(`📜 Fetching transaction history for user ${userId}...`);

    const history: IncomeHistory = {
        referralIncome: [],
        sponsorIncome: [],
        matrixIncome: [],
        royaltyIncome: [],
        upgrades: [],
        totalTransactions: 0
    };

    const mainContract = new ethers.Contract(contractAddress, MAIN_ABI, provider);

    try {
        const currentBlock = await provider.getBlockNumber();

        // Query ALL transactions from contract deployment (not time-based)
        // BSC Mainnet contract deployed at block ~43000000 (adjust if different)
        const deploymentBlock = 43000000; // Change this to your actual deployment block
        const fromBlock = deploymentBlock;

        console.log(`   🔍 Querying ALL transactions from contract deployment`);
        console.log(`   📦 Block range: ${fromBlock} → ${currentBlock} (${currentBlock - fromBlock} blocks)`);
        console.log(`   📍 Contract Address: ${contractAddress}`);
        console.log(`   👤 User ID: ${userId}`);

        // 1. Referral Income
        try {
            const referralFilter = mainContract.filters.ReferralPayment(userId);
            const referralEvents = await mainContract.queryFilter(referralFilter, fromBlock, currentBlock);

            for (const event of referralEvents) {
                history.referralIncome.push({
                    txHash: event.transactionHash,
                    timestamp: new Date(), // Placeholder - view on BSCScan for exact time
                    type: 'referral',
                    amount: ethers.formatEther(event.args!.amount),
                    fromUserId: Number(event.args!.userId),
                    blockNumber: event.blockNumber
                });
            }
            console.log(`   ✓ ${referralEvents.length} referral payments`);
        } catch (e) {
            console.warn('   ⚠ Failed to fetch referral events:', e);
        }

        // 2. Sponsor Income
        try {
            const sponsorFilter = mainContract.filters.SponsorCommissionPaid(userId);
            const sponsorEvents = await mainContract.queryFilter(sponsorFilter, fromBlock, currentBlock);

            for (const event of sponsorEvents) {
                history.sponsorIncome.push({
                    txHash: event.transactionHash,
                    timestamp: new Date(), // Placeholder
                    type: 'sponsor',
                    amount: ethers.formatEther(event.args!.amount),
                    fromUserId: Number(event.args!.fromUserId),
                    level: Number(event.args!.level),
                    blockNumber: event.blockNumber
                });
            }
            console.log(`   ✓ ${sponsorEvents.length} sponsor commissions`);
        } catch (e) {
            console.warn('   ⚠ Failed to fetch sponsor events:', e);
        }

        // 3. Matrix Income (deduplicated by txHash)
        try {
            const matrixFilter = mainContract.filters.MatrixPayment(null, userId);
            const matrixEvents = await mainContract.queryFilter(matrixFilter, fromBlock, currentBlock);

            const matrixByTx = new Map<string, Transaction>();

            for (const event of matrixEvents) {
                const txHash = event.transactionHash;
                const qualified = event.args!.qualified;
                const fromUserId = Number(event.args!.fromUserId);

                if (!matrixByTx.has(txHash)) {
                    matrixByTx.set(txHash, {
                        txHash: txHash,
                        timestamp: new Date(), // Placeholder
                        type: 'matrix',
                        amount: ethers.formatEther(event.args!.amount),
                        level: Number(event.args!.level),
                        fromUserId: fromUserId,
                        qualified: qualified,
                        blockNumber: event.blockNumber
                    });
                } else {
                    // BUG FIX: Don't sum! Each event is a separate payment
                    // Use event index to create unique key instead of txHash
                    const existing = matrixByTx.get(txHash)!;
                    // Create new entry with unique key
                    matrixByTx.set(`${txHash}-${event.logIndex}`, {
                        txHash: txHash,
                        timestamp: new Date(),
                        type: 'matrix',
                        amount: ethers.formatEther(event.args!.amount),
                        level: Number(event.args!.level),
                        fromUserId: fromUserId,
                        qualified: qualified,
                        blockNumber: event.blockNumber
                    });
                }
            }

            history.matrixIncome = Array.from(matrixByTx.values());
            console.log(`   ✓ ${history.matrixIncome.length} matrix transactions (${matrixEvents.length} events)`);
        } catch (e) {
            console.warn('   ⚠ Failed to fetch matrix events:', e);
        }

        // Calculate total
        history.totalTransactions =
            history.referralIncome.length +
            history.sponsorIncome.length +
            history.matrixIncome.length;

        console.log(`✅ Loaded ${history.totalTransactions} transactions (all-time)`);
        console.log(`   - Referral: ${history.referralIncome.length}`);
        console.log(`   - Sponsor: ${history.sponsorIncome.length}`);
        console.log(`   - Matrix: ${history.matrixIncome.length}`);
        console.log(`   💡 Click transaction hash to view details on BSCScan`);

    } catch (error) {
        console.error('Failed to fetch transaction history:', error);
    }

    return history;
}

/**
 * Get all transactions sorted by block number (newest first)
 */
export function getAllTransactionsSorted(history: IncomeHistory): Transaction[] {
    const allTransactions: Transaction[] = [
        ...history.referralIncome,
        ...history.sponsorIncome,
        ...history.matrixIncome,
        ...history.royaltyIncome,
        ...history.upgrades
    ];

    // Sort by block number instead of timestamp
    return allTransactions.sort((a, b) => b.blockNumber - a.blockNumber);
}
