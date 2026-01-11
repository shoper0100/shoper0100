# Testing Guide for RideBNB Contract

## Issue Found
Node.js 25.2.1 is not compatible with Hardhat. Need to downgrade to Node.js 22 LTS.

## Solution Options

### Option 1: Use NVM (Recommended)
```bash
# Install NVM for Windows
# Download from: https://github.com/coreybutler/nvm-windows/releases

# Then install Node 22
nvm install 22
nvm use 22

# verify
node -v  # Should show v22.x.x

# Run tests
npx hardhat compile
npx hardhat test
```

### Option 2: Manual Testing (Without Hardhat)

If you can't change Node version, test manually after deployment to testnet:

#### 1. Deploy to opBNB Testnet
```bash
# Add to .env
PRIVATE_KEY=your_private_key
OPBNB_TESTNET_RPC=https://opbnb-testnet-rpc.bnbchain.org

# Deploy
npx hardhat run scripts/deploy.js --network opbnbTest
```

#### 2. Manual Test Checklist

**Registration:**
- [ ] Register user with valid referrer
- [ ] Try duplicate registration (should fail)
- [ ] Register with invalid referrer (should assign to root)

**Upgrades:**
- [ ] Upgrade Level 1
- [ ] Upgrade Level 5
- [ ] Upgrade Level 10
- [ ] Upgrade Level 13
- [ ] Verify total deposit tracking  

**Income Distribution:**
- [ ] Verify referral income paid
- [ ] Verify matrix income distributed
- [ ] Check lost income tracking

**Sponsor Commission:**
- [ ] Upgrade sponsor to Level 4+
- [ ] Verify 5% commission paid
- [ ] Test unqualified sponsor (should go to root)

**DAO Governance:**
- [ ] Transfer DAO control to multisig
- [ ] Update BNB price as DAO
- [ ] Verify non-DAO cannot update

**Admin Functions:**
- [ ] Update direct required
- [ ] Update sponsor commission
- [ ] Batch update levels

## Quick Test Script (Without Hardhat)

Create `quickTest.js`:

```javascript
const { ethers } = require("ethers");

async function quickTest() {
    const provider = new ethers.JsonRpcProvider("YOUR_RPC_URL");
    const wallet = new ethers.Wallet("YOUR_PRIVATE_KEY", provider);
    
    const contractAddress = "DEPLOYED_CONTRACT_ADDRESS";
    const abi = [/* ABI from compiled contract */];
    
   const contract = new ethers.Contract(contractAddress, abi, wallet);
    
    console.log("Testing RideBNB Contract...");
    
    // Test 1: Check owner
    const owner = await contract.owner();
    console.log("✓ Owner:", owner);
    
    // Test 2: Check DAO address
    const [dao] = await contract.getGovernanceAddresses();
    console.log("✓ DAO:", dao);
    
    // Test 3: Check BNB price
    const price = await contract.getBnbPrice();
    console.log("✓ BNB Price:", price.toString());
    
    // Test 4: Check level cost
    const level0 = await contract.levels(0);
    console.log("✓ Level 0 Cost:", ethers.formatEther(level0));
    
    console.log("\n✅ Basic contract checks passed!");
}

quickTest().catch(console.error);
```

## Recommended Workflow

1. **Fix Node version** (use NVM)
2. **Compile contract:**
   ```bash
   npx hardhat compile
   ```
3. **Run hardhat tests:**
   ```bash
   npx hardhat test
   ```
4. **Deploy to testnet:**
   ```bash
   npx hardhat run scripts/deploy.js --network opbnbTest
   ```
5. **Manual testing on testnet**
6. **Deploy to mainnet when all tests pass**

## Test Checklist

### Core Functions ✓
- [ ] Contract deploys successfully
- [ ] Owner set correctly
- [ ] DAO address initialized
- [ ] Root user created

### Registration ✓
- [ ] Valid registration works
- [ ] Duplicate registration fails
- [ ] Orphan handling works
- [ ] Referral income paid

### Upgrades (All Levels) ✓
- [ ] Level 1-3 upgrades
- [ ] Level 4-7 upgrades
- [ ] Level 8-10 upgrades
- [ ] Level 11-13 upgrades
- [ ] Total deposit tracking
- [ ] Level tracking

### Income Distribution ✓
- [ ] Matrix income distributed
- [ ] Sponsor commission (5%)
- [ ] Unqualified to root
- [ ] Lost income tracked
- [ ] Root receives all fallbacks

### DAO Governance ✓
- [ ] Transfer DAO control
- [ ] DAO can update price
- [ ] DAO can batch update
- [ ] Non-DAO blocked

### Admin Functions ✓
- [ ] Update direct required
- [ ] Update commission
- [ ] Update min level
- [ ] Update royalty settings

### Edge Cases ✓
- [ ] Zero black holes
- [ ] Orphan assignment
- [ ] Root special privileges
- [ ] Emergency functions

## Expected Results

All tests should PASS showing:
- ✅ 9 test suites
- ✅ 40+ test cases
- ✅ 0 failures
- ✅ Contract ready for deployment

## If Tests Fail

1. Check error message
2. Review contract logic
3. Fix bugs
4. Recompile
5. Re-run tests
6. Repeat until all pass

Ready to deploy when ALL tests pass! 🚀
