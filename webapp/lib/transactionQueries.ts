// Transaction History Queries - Simple & Fast
import { ethers, Provider } from 'ethers';
import { MAIN_ABI, ROYALTY_ABI } from './contracts';

export interface Transaction {
    txHash: string;
    timestamp: Date;
    type: 'referral' | 'sponsor' | 'matrix' | 'royalty' | 'upgrade' | 'registration';
    amount: string;
    from?: string;
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
 * Fetch user's transaction history - SIMPLE VERSION (last 5000 blocks only)
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
        // SIMPLE: Only last 5000 blocks (~4 hours) - fast, no rate limits
        const fromBlock = Math.max(0, currentBlock - 5000);

        console.log(`   Querying last 5000 blocks (${fromBlock} → ${currentBlock})`);

        // 1. Referral Income
        try {
            const referralFilter = mainContract.filters.ReferralPayment(userId);
            const referralEvents = await mainContract.queryFilter(referralFilter, fromBlock, currentBlock);

            for (const event of referralEvents) {
                const block = await provider.getBlock(event.blockNumber);
                history.referralIncome.push({
                    txHash: event.transactionHash,
                    timestamp: new Date(block!.timestamp * 1000),
                    type: 'referral',
                    amount: ethers.formatEther(event.args!.amount),
                    fromUserId: Number(event.args!.userId),
                    blockNumber: event.blockNumber
                });
            }
            console.log(`   ✓ ${referralEvents.length} referral payments`);
        } catch (e) {
            console.warn('   Failed to fetch referral events:', e);
        }

        // 2. Sponsor Income
        try {
            const sponsorFilter = mainContract.filters.SponsorCommissionPaid(userId);
            const sponsorEvents = await mainContract.queryFilter(sponsorFilter, fromBlock, currentBlock);

            for (const event of sponsorEvents) {
                const block = await provider.getBlock(event.blockNumber);
                history.sponsorIncome.push({
                    txHash: event.transactionHash,
                    timestamp: new Date(block!.timestamp * 1000),
                    type: 'sponsor',
                    amount: ethers.formatEther(event.args!.amount),
                    fromUserId: Number(event.args!.fromUserId),
                    level: Number(event.args!.level),
                    blockNumber: event.blockNumber
                });
            }
            console.log(`   ✓ ${sponsorEvents.length} sponsor commissions`);
        } catch (e) {
            console.warn('   Failed to fetch sponsor events:', e);
        }

        // 3. Matrix Income (deduplicated by txHash)
        try {
            const matrixFilter = mainContract.filters.MatrixPayment(null, userId);
            const matrixEvents = await mainContract.queryFilter(matrixFilter, fromBlock, currentBlock);

            const matrixByTx = new Map<string, Transaction>();

            for (const event of matrixEvents) {
                const txHash = event.transactionHash;

                if (!matrixByTx.has(txHash)) {
                    const block = await provider.getBlock(event.blockNumber);
                    matrixByTx.set(txHash, {
                        txHash: txHash,
                        timestamp: new Date(block!.timestamp * 1000),
                        type: 'matrix',
                        amount: ethers.formatEther(event.args!.amount),
                        level: Number(event.args!.level),
                        blockNumber: event.blockNumber
                    });
                } else {
                    const existing = matrixByTx.get(txHash)!;
                    const currentAmount = parseFloat(existing.amount);
                    const newAmount = parseFloat(ethers.formatEther(event.args!.amount));
                    existing.amount = (currentAmount + newAmount).toString();
                }
            }

            history.matrixIncome = Array.from(matrixByTx.values());
            console.log(`   ✓ ${history.matrixIncome.length} matrix transactions (${matrixEvents.length} events)`);
        } catch (e) {
            console.warn('   Failed to fetch matrix events:', e);
        }

        // Calculate total
        history.totalTransactions =
            history.referralIncome.length +
            history.sponsorIncome.length +
            history.matrixIncome.length +
            history.royaltyIncome.length +
            history.upgrades.length;

        console.log(`✅ Loaded ${history.totalTransactions} transactions (last 4 hours)`);
        console.log(`   - Referral: ${history.referralIncome.length}`);
        console.log(`   - Sponsor: ${history.sponsorIncome.length}`);
        console.log(`   - Matrix: ${history.matrixIncome.length}`);

    } catch (error) {
        console.error('Failed to fetch transaction history:', error);
    }

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
