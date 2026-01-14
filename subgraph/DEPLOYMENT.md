# The Graph Subgraph - Deployment Guide

## Prerequisites

1. **Install Graph CLI globally:**
```bash
npm install -g @graphprotocol/graph-cli
```

2. **Create account on The Graph Studio:**
- Visit: https://thegraph.com/studio/
- Connect wallet
- Create new subgraph "fivebnb-transactions"
- Copy your deploy key

## Deployment Steps

### 1. Install dependencies
```bash
cd subgraph
npm install
```

### 2. Generate code from schema
```bash
npm run codegen
```

This generates TypeScript types from your GraphQL schema.

### 3. Build the subgraph
```bash
npm run build
```

This compiles AssemblyScript to WebAssembly.

### 4. Authenticate with The Graph Studio
```bash
graph auth --studio <YOUR_DEPLOY_KEY>
```

Replace `<YOUR_DEPLOY_KEY>` with the key from The Graph Studio.

### 5. Deploy to Studio
```bash
npm run deploy
```

Or manually:
```bash
graph deploy --studio fivebnb-transactions
```

### 6. Wait for indexing
- The Graph will start indexing from block 43000000
- Initial indexing takes ~30-60 minutes for all historical data
- Check progress in The Graph Studio dashboard

### 7. Get your subgraph URL
After deployment, you'll get a query URL like:
```
https://api.studio.thegraph.com/query/<ID>/fivebnb-transactions/latest
```

### 8. Update frontend environment variable
Add to `webapp/.env.local`:
```bash
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/<YOUR_ID>/fivebnb-transactions/latest
```

## Frontend Integration

### 1. Install Apollo Client
```bash
cd webapp
npm install @apollo/client graphql
```

### 2. Update `income/page.tsx`

Replace the `loadTransactionHistory` function:

```typescript
import { fetchUserFromGraph } from '@/lib/graphQueries';

const loadTransactionHistory = async () => {
  if (!userId) return;
  
  console.log('📊 Loading from The Graph...');
  
  try {
    const userData = await fetchUserFromGraph(userId);
    
    if (!userData) {
      console.warn('No data found for user');
      return;
    }
    
    // Convert Graph data to existing format
    const history: IncomeHistory = {
      referralIncome: userData.transactions.filter(t => t.type === 'REFERRAL').map(t => ({
        txHash: t.txHash,
        timestamp: new Date(parseInt(t.timestamp) * 1000),
        type: 'referral' as const,
        amount: t.amount,
        fromUserId: parseInt(t.fromUserId || '0'),
        blockNumber: 0
      })),
      sponsorIncome: userData.transactions.filter(t => t.type === 'SPONSOR').map(t => ({
        txHash: t.txHash,
        timestamp: new Date(parseInt(t.timestamp) * 1000),
        type: 'sponsor' as const,
        amount: t.amount,
        fromUserId: parseInt(t.fromUserId || '0'),
        level: t.level,
        blockNumber: 0
      })),
      matrixIncome: userData.transactions.filter(t => t.type === 'MATRIX').map(t => ({
        txHash: t.txHash,
        timestamp: new Date(parseInt(t.timestamp) * 1000),
        type: 'matrix' as const,
        amount: t.amount,
        fromUserId: parseInt(t.fromUserId || '0'),
        level: t.level,
        blockNumber: 0
      })),
      royaltyIncome: userData.transactions.filter(t => t.type === 'ROYALTY').map(t => ({
        txHash: t.txHash,
        timestamp: new Date(parseInt(t.timestamp) * 1000),
        type: 'royalty' as const,
        amount: t.amount,
        blockNumber: 0
      })),
      upgrades: userData.transactions.filter(t => t.type === 'UPGRADE').map(t => ({
        txHash: t.txHash,
        timestamp: new Date(parseInt(t.timestamp) * 1000),
        type: 'upgrade' as const,
        amount: t.amount,
        level: t.level,
        blockNumber: 0
      })),
      totalTransactions: userData.transactionCount
    };
    
    setTransactionHistory(history);
    
    // Update income from indexed data (more accurate)
    setIncomeData({
      totalIncome: userData.totalIncome,
      referralIncome: userData.referralIncome,
      sponsorIncome: userData.sponsorIncome,
      levelIncome: userData.matrixIncome,
      royaltyIncome: userData.royaltyIncome,
      totalDeposit: '0' // Can be added to schema
    });
    
    console.log(`✅ Loaded ${history.totalTransactions} transactions from The Graph`);
    console.log(`💰 Total income: ${userData.totalIncome} BNB`);
  } catch (error) {
    console.error('Failed to load from The Graph:', error);
  }
};
```

## Testing

### Test queries in The Graph Playground

Visit your subgraph URL in browser and test queries:

```graphql
query {
  user(id: "36999") {
    id
    totalIncome
    referralIncome
    sponsorIncome
    matrixIncome
    transactions(first: 10) {
      txHash
      type
      amount
      timestamp
    }
  }
}
```

## Troubleshooting

### Subgraph fails to sync
- Check contract address in `subgraph.yaml`
- Verify startBlock is correct
- Check event signatures match contract

### No data for user
- Wait for indexing to complete
- Check if user has transactions after startBlock
- Verify user ID exists on-chain

### Frontend errors
- Check NEXT_PUBLIC_SUBGRAPH_URL is set
- Verify Apollo Client is installed
- Check browser console for GraphQL errors

## Benefits You'll See

**Before (RPC queries):**
- ❌ 10-60 seconds load time
- ❌ Rate limit errors
- ❌ Only last 50k blocks
- ❌ No income totals

**After (The Graph):**
- ✅ < 1 second load time
- ✅ No rate limits
- ✅ Complete history from deployment
- ✅ Accurate income totals
- ✅ Real transaction timestamps!

## Next Steps

1. Deploy subgraph to The Graph Studio
2. Update frontend to use GraphQL
3. Test with your user ID
4. Remove old RPC queries
5. Enjoy blazing fast queries! 🚀
