// Transaction History Queries - Fast Event-Based Fetching
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
 * Fetch user's transaction history (FAST!)
 * Uses event filters with user address/ID as indexed parameter
 */
export async function fetchUserTransactions(
    userId: number,
    userAddress: string,
    provider: Provider,
    contractAddress: string,
    royaltyAddress: string
): Promise<IncomeHistory> {
    console.log(`📜 Fetching transaction history for user ${userId}...`);

    const mainContract = new ethers.Contract(contractAddress, MAIN_ABI, provider);
    const royaltyContract = new ethers.Contract(royaltyAddress, ROYALTY_ABI, provider);

    const history: IncomeHistory = {
        referralIncome: [],
        sponsorIncome: [],
        matrixIncome: [],
        royaltyIncome: [],
        upgrades: [],
        totalTransactions: 0
    };

    try {
        // Get current block
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 1000000); // Last ~3 days on BSC

        console.log(`   Querying blocks ${fromBlock} → ${currentBlock} (~1M blocks, ~3 days)`);

        // 1. Referral Income - Filter by referrer (user received payment)
        try {
            // Event: ReferralPayment(uint indexed referrerId, uint indexed userId, uint amount, uint timestamp)
            const referralFilter = mainContract.filters.ReferralPayment(userId);
            const referralEvents = await mainContract.queryFilter(referralFilter, fromBlock, currentBlock);

            console.log(`   Found ${referralEvents.length} referral payments`);

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
        } catch (e) {
            console.warn('   Failed to fetch referral events:', e);
        }

        // 2. Sponsor Income
        try {
            // Event: SponsorCommissionPaid(uint256 indexed userId, uint256 amount, uint256 fromUserId, uint8 layer)
            const sponsorFilter = mainContract.filters.SponsorCommissionPaid(userId);
            const sponsorEvents = await mainContract.queryFilter(sponsorFilter, fromBlock, currentBlock);

            console.log(`   Found ${sponsorEvents.length} sponsor commissions`);

            for (const event of sponsorEvents) {
                const block = await provider.getBlock(event.blockNumber);
                history.sponsorIncome.push({
                    txHash: event.transactionHash,
                    timestamp: new Date(block!.timestamp * 1000),
                    type: 'sponsor',
                    amount: ethers.formatEther(event.args!.amount),
                    fromUserId: Number(event.args!.fromUserId),
                    level: Number(event.args!.layer),
                    blockNumber: event.blockNumber
                });
            }
        } catch (e) {
            console.warn('   Failed to fetch sponsor events:', e);
        }

        // 3. Matrix Income
        try {
            // Event: MatrixPayment(uint indexed fromUserId, uint indexed toUserId, uint amount, uint level, uint layer, bool qualified, uint timestamp)
            const matrixFilter = mainContract.filters.MatrixPayment(null, userId);
            const matrixEvents = await mainContract.queryFilter(matrixFilter, fromBlock, currentBlock);

            console.log(`   Found ${matrixEvents.length} matrix payment events`);

            // Deduplicate by transaction hash (same tx can have multiple MatrixPayment events for different layers)
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
                    // Same transaction, add amounts together (multiple layers)
                    const existing = matrixByTx.get(txHash)!;
                    const currentAmount = parseFloat(existing.amount);
                    const newAmount = parseFloat(ethers.formatEther(event.args!.amount));
                    existing.amount = (currentAmount + newAmount).toString();
                }
            }

            history.matrixIncome = Array.from(matrixByTx.values());
            console.log(`   Deduplicated to ${history.matrixIncome.length} unique matrix transactions`);
        } catch (e) {
            console.warn('   Failed to fetch matrix events:', e);
        }

        // 4. Royalty Claims
        try {
            // Event: RoyaltyClaimed(uint256 indexed userId, uint256 tier, uint256 amount)
            const royaltyFilter = royaltyContract.filters.RoyaltyClaimed(userId);
            const royaltyEvents = await royaltyContract.queryFilter(royaltyFilter, fromBlock, currentBlock);

            console.log(`   Found ${royaltyEvents.length} royalty claims`);

            for (const event of royaltyEvents) {
                const block = await provider.getBlock(event.blockNumber);
                history.royaltyIncome.push({
                    txHash: event.transactionHash,
                    timestamp: new Date(block!.timestamp * 1000),
                    type: 'royalty',
                    amount: ethers.formatEther(event.args!.amount),
                    level: Number(event.args!.tier) + 10, // Tier 0-3 = L10-L13
                    blockNumber: event.blockNumber
                });
            }
        } catch (e) {
            console.warn('   Failed to fetch royalty events:', e);
        }

        // 5. User Upgrades (for context)
        try {
            // Event: UserUpgraded(uint256 indexed userId, uint256 newLevel, uint256 cost)
            const upgradeFilter = mainContract.filters.UserUpgraded(userId);
            const upgradeEvents = await mainContract.queryFilter(upgradeFilter, fromBlock, currentBlock);

            console.log(`   Found ${upgradeEvents.length} upgrades`);

            for (const event of upgradeEvents) {
                const block = await provider.getBlock(event.blockNumber);
                history.upgrades.push({
                    txHash: event.transactionHash,
                    timestamp: new Date(block!.timestamp * 1000),
                    type: 'upgrade',
                    amount: ethers.formatEther(event.args!.cost),
                    level: Number(event.args!.newLevel),
                    blockNumber: event.blockNumber
                });
            }
        } catch (e) {
            console.warn('   Failed to fetch upgrade events:', e);
        }

        history.totalTransactions =
            history.referralIncome.length +
            history.sponsorIncome.length +
            history.matrixIncome.length +
            history.royaltyIncome.length +
            history.upgrades.length;

        console.log(`✅ Loaded ${history.totalTransactions} total transactions`);
        console.log(`   - Referral: ${history.referralIncome.length}`);
        console.log(`   - Sponsor: ${history.sponsorIncome.length}`);
        console.log(`   - Matrix: ${history.matrixIncome.length}`);
        console.log(`   - Royalty: ${history.royaltyIncome.length}`);
        console.log(`   - Upgrades: ${history.upgrades.length}`);

        return history;

    } catch (error) {
        console.error('❌ Failed to fetch transaction history:', error);
        return history;
    }
}

/**
 * Get all transactions sorted by timestamp (newest first)
 */
export function getAllTransactionsSorted(history: IncomeHistory): Transaction[] {
    const all = [
        ...history.referralIncome,
        ...history.sponsorIncome,
        ...history.matrixIncome,
        ...history.royaltyIncome,
        ...history.upgrades
    ];

    return all.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Calculate total income by type
 */
export function calculateTotalsByType(history: IncomeHistory) {
    const sum = (txs: Transaction[]) =>
        txs.reduce((total, tx) => total + parseFloat(tx.amount), 0);

    return {
        referral: sum(history.referralIncome).toFixed(4),
        sponsor: sum(history.sponsorIncome).toFixed(4),
        matrix: sum(history.matrixIncome).toFixed(4),
        royalty: sum(history.royaltyIncome).toFixed(4),
        total: (
            sum(history.referralIncome) +
            sum(history.sponsorIncome) +
            sum(history.matrixIncome) +
            sum(history.royaltyIncome)
        ).toFixed(4)
    };
}
