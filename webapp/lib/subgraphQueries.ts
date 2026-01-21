// Transaction History using The Graph Subgraph - FAST!
import { Transaction, IncomeHistory } from './transactionQueries';

export interface SubgraphTransaction {
    id: string;
    txHash: string;
    timestamp: string;
    type: string;
    amount: string;
    fromUser?: string;
    toUser?: string;
    level?: string;
    blockNumber: string;
}

/**
 * Fetch transaction history from The Graph subgraph (RECOMMENDED)
 * Much faster than querying blockchain events!
 */
export async function fetchUserTransactionsFromSubgraph(
    userId: number,
    subgraphUrl: string
): Promise<IncomeHistory> {
    console.log(`📊 Fetching transactions from subgraph for user ${userId}...`);

    const history: IncomeHistory = {
        referralIncome: [],
        sponsorIncome: [],
        matrixIncome: [],
        royaltyIncome: [],
        upgrades: [],
        totalTransactions: 0
    };

    try {
        // GraphQL query - simplified to match exact schema
        const query = `
            query GetUserTransactions($userId: String!) {
                transactions(
                    where: { user: $userId }
                    orderBy: timestamp
                    orderDirection: desc
                    first: 1000
                ) {
                    id
                    txHash
                    blockNumber
                    timestamp
                    type
                    amount
                    fromUserId
                    level
                }
            }
        `;

        const response = await fetch(subgraphUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: { userId: userId.toString() }
            })
        });

        const result = await response.json();

        if (result.errors) {
            console.error('❌ Subgraph query error:');
            result.errors.forEach((err: any, i: number) => {
                console.error(`   Error ${i + 1}:`, err.message);
                if (err.locations) {
                    console.error('   Location:', err.locations);
                }
            });
            return history;
        }

        const data = result.data;

        // Process all transactions from unified array
        if (data.transactions) {
            for (const tx of data.transactions) {
                const transaction = {
                    txHash: typeof tx.txHash === 'string' ? tx.txHash : tx.txHash.toString(),
                    timestamp: new Date(parseInt(tx.timestamp.toString()) * 1000),
                    amount: tx.amount.toString(), // Already in ether from subgraph
                    fromUserId: tx.fromUserId ? parseInt(tx.fromUserId.toString()) : 0,
                    level: tx.level || 0,
                    blockNumber: parseInt(tx.blockNumber.toString())
                };

                // Sort by type
                const txType = tx.type.toUpperCase();
                if (txType.includes('REFERRAL')) {
                    history.referralIncome.push({ ...transaction, type: 'referral' });
                } else if (txType.includes('SPONSOR')) {
                    history.sponsorIncome.push({ ...transaction, type: 'sponsor' });
                } else if (txType.includes('MATRIX') || txType.includes('LEVEL')) {
                    history.matrixIncome.push({ ...transaction, type: 'matrix' });
                }
            }
        }

        history.totalTransactions =
            history.referralIncome.length +
            history.sponsorIncome.length +
            history.matrixIncome.length;

        console.log(`✅ Loaded ${history.totalTransactions} transactions from subgraph (all-time)`);
        console.log(`   - Referral: ${history.referralIncome.length}`);
        console.log(`   - Sponsor: ${history.sponsorIncome.length}`);
        console.log(`   - Matrix: ${history.matrixIncome.length}`);

    } catch (error) {
        console.error('❌ Failed to fetch from subgraph:', error);
    }

    return history;
}

/**
 * Helper to get all transactions sorted by timestamp
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
