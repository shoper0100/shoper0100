# Frontend View Functions - Complete Guide

## RideBNB Contract - 13 View Functions

### 1. getUserData(uint _userId)
**Purpose:** Get complete user data in one call
**Returns:** 14 fields (account, id, referrer, upline, etc.)
**Usage:**
```javascript
const userData = await contract.getUserData(userId);
// Returns: [account, id, referrer, upline, startTime, level, etc.]
```

### 2. getUserLevelIncomes(uint _userId)
**Purpose:** Get user's income breakdown by level
**Returns:** Array of 13 level incomes
**Usage:**
```javascript
const levelIncomes = await contract.getUserLevelIncomes(userId);
// Returns: [level0Income, level1Income, ..., level12Income]
```

### 3. getDirectTeam(uint _userId)
**Purpose:** Get user's direct referrals
**Returns:** Array of user IDs
**Usage:**
```javascript
const directTeam = await contract.getDirectTeam(userId);
// Returns: [userId1, userId2, userId3, ...]
```

### 4. getMatrixTeam(uint _userId, uint _level)
**Purpose:** Get user's matrix team at specific level
**Returns:** Array of user IDs
**Usage:**
```javascript
const matrixTeam = await contract.getMatrixTeam(userId, 0);
// Returns: [userId1, userId2] // Max 2 per level
```

### 5. getIncomeHistory(uint _userId, uint _offset, uint _limit)
**Purpose:** Get paginated income history
**Returns:** Array of Income records + total count
**Usage:**
```javascript
const {incomes, total} = await contract.getIncomeHistory(userId, 0, 50);
// Returns: {incomes: [{id, layer, amount, time, isLost}, ...], total: 150}
```

### 6. getAllLevelCosts()
**Purpose:** Get cost for all 13 levels
**Returns:** Array of 13 costs in wei
**Usage:**
```javascript
const costs = await contract.getAllLevelCosts();
// Returns: [4e15, 6e15, 12e15, ...]
```

### 7. getAllLevelPercents()
**Purpose:** Get admin fee percentage for all levels
**Returns:** Array of 13 percentages
**Usage:**
```javascript
const percents = await contract.getAllLevelPercents();
// Returns: [5, 5, 5, 5, ...]
```

### 8. getContractConfig()
**Purpose:** Get all contract configuration in one call
**Returns:** 9 configuration parameters
**Usage:**
```javascript
const config = await contract.getContractConfig();
// Returns: [directRequired, sponsorCommission, minSponsorLevel, bnbPrice, etc.]
```

### 9. getUserRoyaltyData(uint _userId, uint _royaltyLvl)
**Purpose:** Get user's royalty pool data
**Returns:** Amount, taken status, active status
**Usage:**
```javascript
const {amount, taken, active} = await contract.getUserRoyaltyData(userId, 0);
// Returns: {amount: 1000000000000000000, taken: false, active: true}
```

### 10. getGlobalUsers(uint _offset, uint _limit)
**Purpose:** Get paginated list of all users
**Returns:** Array of user IDs + total count
**Usage:**
```javascript
const {users, total} = await contract.getGlobalUsers(0, 100);
// Returns: {users: [37006, 37007, ...], total: 5000}
```

### 11. userExists(uint _userId)
**Purpose:** Check if user ID is registered
**Returns:** Boolean
**Usage:**
```javascript
const exists = await contract.userExists(userId);
// Returns: true/false
```

### 12. getBatchUserData(uint[] memory _userIds)
**Purpose:** Get multiple users' data efficiently
**Returns:** 4 arrays (accounts, ids, levels, totalIncomes)
**Usage:**
```javascript
const {accounts, ids, levels, totalIncomes} = await contract.getBatchUserData([37006, 37007, 37008]);
// Returns: {
//   accounts: [0x..., 0x..., 0x...],
//   ids: [37006, 37007, 37008],
//   levels: [5, 3, 1],
//   totalIncomes: [1000, 500, 100]
// }
```

### 13. Existing Getters
- `getOwner()` - Get contract owner
- `getBnbPrice()` - Get BNB price in USD
- `getDefaultRefer()` - Get root user ID
- `getDirectRequired()` - Get direct referrals required
- `getSponsorCommission()` - Get sponsor commission %
- `getMinSponsorLevel()` - Get min sponsor level
- `getRoyaltyPercents()` - Get royalty percentages
- `getRoyaltyLevels()` - Get royalty tier levels
- `getGovernanceAddresses()` - Get DAO and owner addresses

## SimpleRoyaltyReceiver Contract - 3 View Functions

### 1. getFeeReceiver()
**Purpose:** Get fee receiver address
**Returns:** Address
**Usage:**
```javascript
const receiver = await royaltyContract.getFeeReceiver();
// Returns: 0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0
```

### 2. getBalance()
**Purpose:** Get current contract balance
**Returns:** Balance in wei
**Usage:**
```javascript
const balance = await royaltyContract.getBalance();
// Returns: 1000000000000000000 (1 BNB)
```

### 3. getContractInfo()
**Purpose:** Get all contract info in one call
**Returns:** Fee receiver + balance
**Usage:**
```javascript
const {receiver, balance} = await royaltyContract.getContractInfo();
// Returns: {receiver: 0x..., balance: 1000000000000000000}
```

## Frontend Implementation Examples

### Dashboard Page - User Stats
```javascript
async function loadUserDashboard(userId) {
  // Single call for all user data
  const userData = await contract.getUserData(userId);
  
  // Get level-specific income
  const levelIncomes = await contract.getUserLevelIncomes(userId);
  
  // Get team sizes
  const directTeam = await contract.getDirectTeam(userId);
  
  return {
    user: userData,
    incomes: levelIncomes,
    teamSize: directTeam.length
  };
}
```

### Income History Page - Paginated
```javascript
async function loadIncomeHistory(userId, page = 0, pageSize = 50) {
  const offset = page * pageSize;
  const {incomes, total} = await contract.getIncomeHistory(userId, offset, pageSize);
  
  return {
    incomes,
    total,
    pages: Math.ceil(total / pageSize),
    currentPage: page
  };
}
```

### Team Page - Direct Team List
```javascript
async function loadTeamData(userId) {
  // Get direct team IDs
  const teamIds = await contract.getDirectTeam(userId);
  
  // Batch load team member data
  const {accounts, ids, levels, totalIncomes} = 
    await contract.getBatchUserData(teamIds);
  
  // Combine into team list
  return teamIds.map((id, i) => ({
    id: ids[i],
    account: accounts[i],
    level: levels[i],
    totalIncome: totalIncomes[i]
  }));
}
```

### Admin Panel - Global Stats
```javascript
async function loadGlobalStats() {
  // Get contract config
  const config = await contract.getContractConfig();
  
  // Get level costs
  const costs = await contract.getAllLevelCosts();
  
  // Get all level percentages
  const percents = await contract.getAllLevelPercents();
  
  // Get royalty balance
  const royaltyInfo = await royaltyContract.getContractInfo();
  
  return {
    totalUsers: config._totalUsers,
    bnbPrice: config._bnbPriceInUSD,
    levelCosts: costs,
    levelFees: percents,
    royaltyBalance: royaltyInfo.balance
  };
}
```

### User Search - Check Existence
```javascript
async function searchUser(userId) {
  const exists = await contract.userExists(userId);
  
  if (!exists) {
    return { error: "User not found" };
  }
  
  const userData = await contract.getUserData(userId);
  return { user: userData };
}
```

## Benefits

### Single Call Efficiency
- `getUserData()` - 1 call instead of 14
- `getContractConfig()` - 1 call instead of 9
- `getBatchUserData()` - 1 call instead of N*4

### Pagination Support
- `getIncomeHistory()` - Handle large datasets
- `getGlobalUsers()` - Browse all users

### Offline Reporting
- All data accessible via view functions
- No transaction needed
- No gas costs
- Instant reads

### Frontend Flexibility
- Fetch only what you need
- Combine calls for complex views
- Cache results locally
- Build rich UIs

## Gas Costs

**All view functions:** 0 gas (read-only)
**Can be called:** Unlimited times
**Response time:** Instant (<1 second)

## Contract Updates

**RideBNB:**
- Before: 572 lines
- After: 776 lines (+204 lines)
- New functions: 13

**SimpleRoyaltyReceiver:**
- Before: 56 lines
- After: 75 lines (+19 lines)
- New functions: 2

**Total functions added:** 15
**Total new lines:** 223

## Deployment

No changes needed for deployment flow. View functions are automatically available after deployment.

✅ **All view functions ready for frontend integration!**
