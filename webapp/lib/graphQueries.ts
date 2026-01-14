// GraphQL queries for The Graph subgraph
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

// TODO: Replace with your actual subgraph URL after deployment
const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
    'https://api.studio.thegraph.com/query/<YOUR_SUBGRAPH_ID>/fivebnb-transactions/latest';

const client = new ApolloClient({
    uri: SUBGRAPH_URL,
    cache: new InMemoryCache(),
});

export interface GraphTransaction {
    id: string;
    txHash: string;
    timestamp: string;
    type: string;
    amount: string;
    fromUserId?: string;
    level?: number;
}

export interface GraphUser {
    id: string;
    address: string;
    referrerId: string;
    level: number;
    totalIncome: string;
    referralIncome: string;
    sponsorIncome: string;
    matrixIncome: string;
    royaltyIncome: string;
    transactionCount: number;
    transactions: GraphTransaction[];
}

/**
 * Fetch user data with all transactions from The Graph
 */
export async function fetchUserFromGraph(userId: number): Promise<GraphUser | null> {
    try {
        const { data } = await client.query({
            query: gql`
        query GetUser($userId: ID!) {
          user(id: $userId) {
            id
            address
            referrerId
            level
            totalIncome
            referralIncome
            sponsorIncome
            matrixIncome
            royaltyIncome
            transactionCount
            transactions(
              first: 1000
              orderBy: timestamp
              orderDirection: desc
            ) {
              id
              txHash
              timestamp
              type
              amount
              fromUserId
              level
            }
          }
        }
      `,
            variables: { userId: userId.toString() }
        });

        return data.user;
    } catch (error) {
        console.error('Failed to fetch user from The Graph:', error);
        return null;
    }
}

/**
 * Fetch specific transaction type for a user
 */
export async function fetchUserTransactionsByType(
    userId: number,
    type: 'REFERRAL' | 'SPONSOR' | 'MATRIX' | 'ROYALTY' | 'UPGRADE'
): Promise<GraphTransaction[]> {
    try {
        const { data } = await client.query({
            query: gql`
        query GetTransactions($userId: ID!, $type: TransactionType!) {
          user(id: $userId) {
            transactions(
              where: { type: $type }
              first: 1000
              orderBy: timestamp
              orderDirection: desc
            ) {
              id
              txHash
              timestamp
              type
              amount
              fromUserId
              level
            }
          }
        }
      `,
            variables: {
                userId: userId.toString(),
                type: type
            }
        });

        return data.user?.transactions || [];
    } catch (error) {
        console.error('Failed to fetch transactions from The Graph:', error);
        return [];
    }
}

/**
 * Fetch recent transactions across all users (for analytics)
 */
export async function fetchRecentTransactions(limit: number = 100): Promise<GraphTransaction[]> {
    try {
        const { data } = await client.query({
            query: gql`
        query GetRecentTransactions($limit: Int!) {
          transactions(
            first: $limit
            orderBy: timestamp
            orderDirection: desc
          ) {
            id
            txHash
            timestamp
            type
            amount
            fromUserId
            level
            user {
              id
            }
          }
        }
      `,
            variables: { limit }
        });

        return data.transactions;
    } catch (error) {
        console.error('Failed to fetch recent transactions:', error);
        return [];
    }
}

/**
 * Get total statistics across all users
 */
export async function fetchGlobalStats() {
    try {
        const { data } = await client.query({
            query: gql`
        query GetGlobalStats {
          users(first: 1000) {
            totalIncome
            referralIncome
            sponsorIncome
            matrixIncome
            royaltyIncome
            transactionCount
          }
        }
      `
        });

        // Calculate totals
        const stats = data.users.reduce((acc: any, user: any) => {
            acc.totalIncome += parseFloat(user.totalIncome);
            acc.totalTransactions += user.transactionCount;
            return acc;
        }, { totalIncome: 0, totalTransactions: 0 });

        return stats;
    } catch (error) {
        console.error('Failed to fetch global stats:', error);
        return null;
    }
}
