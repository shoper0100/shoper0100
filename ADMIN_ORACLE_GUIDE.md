# Admin Settings & Price Oracle - Complete Guide

## Overview

**Two Access Levels:**
1. **Owner Functions** - Emergency & governance transfers
2. **DAO Functions** - All parameter settings & price oracle

## Initial Setup

**After Deployment:**
- Owner = Your deployer address
- DAO = Same as owner (initially)
- Later: Transfer DAO to Gnosis Safe 2-of-5 multisig

## DAO Functions (8 Admin Settings)

### 1. BNB Price Oracle 🔥

**Function:** `setBnbPrice(uint _priceInUSD)`
**Access:** DAO only
**Purpose:** Update BNB price for USD-based level calculations

**How to Use (Remix/Explorer):**
```
Function: setBnbPrice
_priceInUSD: 600  // $600 per BNB
Connect: DAO address
Click: transact
```

**Example Scenarios:**
```
BNB = $600 → setBnbPrice(600)
BNB = $700 → setBnbPrice(700)
BNB = $550 → setBnbPrice(550)
```

**Check Current Price:**
```
Function: getBnbPrice
Result: 600 (current price in USD)
```

### 2. Batch Update All Levels 🚀

**Function:** `batchUpdateLevels(uint[13] memory _usdAmounts)`
**Access:** DAO only
**Purpose:** Update all 13 level costs based on USD targets

**How to Use:**
```
Function: batchUpdateLevels
_usdAmounts: [2,3,6,12,24,48,96,192,384,768,1536,3072,6144]
Connect: DAO address
Click: transact
```

**What It Does:**
- Converts each USD amount to BNB using current oracle price
- Updates all 13 levels in one transaction
- Example: If BNB = $600, Level 0 = $2 becomes 0.00333... BNB

**Formula:**
```
BNB Cost = (USD Amount * 1e18) / BNB Price
```

**Example Calculation:**
```
Level 0: $2 / $600 = 0.00333 BNB = 3.33e15 wei
Level 1: $3 / $600 = 0.005 BNB = 5e15 wei
Level 2: $6 / $600 = 0.01 BNB = 1e16 wei
```

**Check Current Costs:**
```
Function: getAllLevelCosts
Result: [4e15, 6e15, 12e15, ...] // 13 values in wei
```

### 3. Direct Referrals Required

**Function:** `setDirectRequired(uint _newRequired)`
**Access:** DAO only
**Purpose:** Set how many direct referrals needed to earn matrix income
**Range:** 1-10
**Default:** 2

**How to Use:**
```
Function: setDirectRequired
_newRequired: 3  // Now need 3 directs
Connect: DAO
Click: transact
```

**Check Current:**
```
Function: getDirectRequired
Result: 2
```

### 4. Sponsor Commission Percentage

**Function:** `setSponsorCommission(uint _newPercent)`
**Access:** DAO only
**Purpose:** Set sponsor commission percentage
**Range:** 0-20%
**Default:** 5%

**How to Use:**
```
Function: setSponsorCommission
_newPercent: 7  // 7% commission
Connect: DAO
Click: transact
```

**Check Current:**
```
Function: getSponsorCommission
Result: 5
```

### 5. Minimum Sponsor Level

**Function:** `setMinSponsorLevel(uint _newLevel)`
**Access:** DAO only
**Purpose:** Set minimum level to earn sponsor commission
**Range:** 1-13
**Default:** 4 (must be Level 4+)

**How to Use:**
```
Function: setMinSponsorLevel
_newLevel: 5  // Now need Level 5
Connect: DAO
Click: transact
```

**Check Current:**
```
Function: getMinSponsorLevel
Result: 4
```

### 6. Royalty Distribution Percentages

**Function:** `setRoyaltyPercents(uint[4] memory _percents)`
**Access:** DAO only
**Purpose:** Set how royalty pool divides among 4 tiers
**Rule:** Must total 100%
**Default:** [40, 30, 20, 10]

**How to Use:**
```
Function: setRoyaltyPercents
_percents: [35,30,25,10]  // New distribution
Connect: DAO
Click: transact
```

**Validation:**
- 35 + 30 + 25 + 10 = 100 ✅
- 40 + 40 + 10 + 5 = 95 ❌ (Reverts: "Must equal 100%")

**Check Current:**
```
Function: getRoyaltyPercents
Result: [40, 30, 20, 10]
```

### 7. Royalty Tier Levels

**Function:** `setRoyaltyLevels(uint[4] memory _levels)`
**Access:** DAO only
**Purpose:** Set which levels qualify for each royalty tier
**Range:** 1-13 each
**Default:** [10, 11, 12, 13]

**How to Use:**
```
Function: setRoyaltyLevels
_levels: [9,10,11,12]  // Easier qualification
Connect: DAO
Click: transact
```

**Check Current:**
```
Function: getRoyaltyLevels
Result: [10, 11, 12, 13]
```

### 8. Individual Level Settings

**8a. Set Single Level Cost**
```
Function: setLevelCost
_levelIndex: 0  // Level 0
_newCost: 5000000000000000  // 0.005 BNB
Connect: DAO
Click: transact
```

**8b. Set Single Level Fee**
```
Function: setLevelFeePercent
_levelIndex: 0  // Level 0
_newPercent: 10  // 10% admin fee
Connect: DAO
Click: transact
```

## Owner Functions (Emergency & Governance)

### 1. Emergency Sweep

**Function:** `sweepToRoot()`
**Access:** Owner only
**Purpose:** Send stuck BNB to root user

**How to Use:**
```
Function: sweepToRoot
Connect: Owner address
Click: transact
Result: All contract balance → root user
```

### 2. Transfer DAO Control

**Function:** `transferDAOControl(address _newDAO)`
**Access:** Owner only
**Purpose:** Move DAO control to Gnosis Safe multisig

**How to Use:**
```
Function: transferDAOControl
_newDAO: 0xYourGnosisSafeAddress
Connect: Owner
Click: transact
Result: DAO control transferred
```

**Verify:**
```
Function: getGovernanceAddresses
Result: {dao: 0xGnosisSafe..., owner: 0xYourAddress}
```

### 3. Transfer Ownership

**Function:** `transferOwnership(address _newOwner)`
**Access:** Owner only
**Purpose:** Change owner address

**How to Use:**
```
Function: transferOwnership
_newOwner: 0xNewOwnerAddress
Connect: Owner
Click: transact
```

### 4. Update Both (Governance)

**Function:** `updateGovernance(address _newDAO, address _newOwner)`
**Access:** Owner only
**Purpose:** Update both DAO and owner in one transaction

**How to Use:**
```
Function: updateGovernance
_newDAO: 0xGnosisSafe
_newOwner: 0xNewOwner
Connect: Owner
Click: transact
```

### 5. Super Set (Advanced)

**Function:** `super_set(uint _type, address _new, uint _num)`
**Access:** Owner only
**Purpose:** Emergency parameter updates

**Types:**
- 0 = Change fee receiver
- 1 = Change royalty contract
- 2 = Manual user ID assignment

**Examples:**
```
// Change fee receiver
super_set(0, 0xNewFeeReceiver, 0)

// Change royalty contract
super_set(1, 0xNewRoyaltyContract, 0)

// Assign manual ID
super_set(2, 0xUserAddress, 50000)
```

## Complete Admin Workflow

### Scenario 1: Deploy & Initial Setup

**Step 1 - Deploy Contract**
```
Deploy with:
_feeReceiver: 0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0
_royalty: [SimpleRoyaltyReceiver address]
_owner: 0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0
_defaultRefer: 36999
```

**Step 2 - Verify Initial Settings**
```
getContractConfig() → Check all defaults
getBnbPrice() → Should be 600
getDirectRequired() → Should be 2
```

**Step 3 - Transfer to DAO (Later)**
```
transferDAOControl(0xGnosisSafeAddress)
```

### Scenario 2: Update BNB Price & Levels

**Step 1 - Update Oracle**
```
Current BNB price: $700
Call: setBnbPrice(700)
Caller: DAO address
```

**Step 2 - Batch Update Levels**
```
Target USD amounts: [2,3,6,12,24,48,96,192,384,768,1536,3072,6144]
Call: batchUpdateLevels([2,3,6,12,24,48,96,192,384,768,1536,3072,6144])
Caller: DAO
Result: All costs recalculated for $700/BNB
```

**Step 3 - Verify**
```
getAllLevelCosts() → Check new BNB amounts
Level 0: $2 / $700 = 0.00286 BNB ✅
```

### Scenario 3: Adjust Game Economics

**Make it easier to earn:**
```
1. setDirectRequired(1)  // Only 1 direct needed
2. setSponsorCommission(10)  // 10% sponsor commission
3. setMinSponsorLevel(3)  // Level 3+ can earn
```

**Make royalty more accessible:**
```
setRoyaltyLevels([8,9,10,11])  // Lower level requirements
```

### Scenario 4: Emergency Adjustments

**Contract received stuck funds:**
```
Call: sweepToRoot()
Caller: Owner
Result: Funds sent to root user
```

**Need to change fee receiver:**
```
Call: super_set(0, 0xNewAddress, 0)
Caller: Owner
Result: All future fees go to new address
```

## Access Control Summary

### DAO Functions (Need DAO Signature)
- ✅ setBnbPrice
- ✅ batchUpdateLevels
- ✅ setDirectRequired
- ✅ setSponsorCommission
- ✅ setMinSponsorLevel
- ✅ setRoyaltyPercents
- ✅ setRoyaltyLevels
- ✅ setLevelCost
- ✅ setLevelFeePercent

### Owner Functions (Need Owner Signature)
- ✅ transferDAOControl
- ✅ transferOwnership
- ✅ updateGovernance
- ✅ sweepToRoot
- ✅ super_set

### Anyone Can Call
- ✅ All view functions (free)
- ✅ register
- ✅ upgrade
- ✅ claimRoyalty
- ✅ distRoyalty

## Best Practices

### 1. Always Use DAO for Parameter Changes
```
❌ Don't: Change settings randomly
✅ Do: Discuss in DAO, vote, then execute
```

### 2. Update Oracle Regularly
```
Frequency: Weekly or when BNB moves >10%
Check: coinmarketcap.com, coingecko.com
Update: setBnbPrice(currentPrice)
```

### 3. Test on Testnet First
```
1. Deploy to opBNB testnet
2. Test all admin functions
3. Verify settings work
4. Then deploy to mainnet
```

### 4. Transfer to Multisig ASAP
```
After mainnet deployment:
1. Create Gnosis Safe 2-of-5
2. Add 5 trusted addresses
3. Call transferDAOControl(gnosisSafe)
4. All future changes need 2/5 signatures
```

## Gnosis Safe Integration

### Setup 2-of-5 Multisig

**Step 1 - Create Safe**
1. Go to app.safe.global
2. Select opBNB network
3. Create new Safe
4. Add 5 owner addresses
5. Set threshold: 2 of 5
6. Deploy Safe

**Step 2 - Transfer Control**
```
Call: transferDAOControl(safeAddress)
From: Current owner
Result: DAO functions now need multisig
```

**Step 3 - Using Multisig**
```
To change BNB price:
1. Owner 1: Propose transaction (setBnbPrice)
2. Owner 2: Sign proposal
3. Transaction executes (2 of 5 threshold met)
```

## Quick Reference

### Get All Current Settings
```javascript
// One call gets everything
const config = await contract.getContractConfig();
const [
  directRequired,      // 2
  sponsorCommission,   // 5
  minSponsorLevel,     // 4
  bnbPrice,           // 600
  maxLayers,          // 13
  royaltyMaxPercent,  // 150
  startTime,          // Timestamp
  totalUsers,         // 5000
  defaultRefer        // 36999
] = config;
```

### Common Admin Actions
```javascript
// Update BNB price
await contract.setBnbPrice(700);

// Update all levels
await contract.batchUpdateLevels([2,3,6,12,24,48,96,192,384,768,1536,3072,6144]);

// Make sponsor commission 10%
await contract.setSponsorCommission(10);

// Transfer to multisig
await contract.transferDAOControl(gnosisSafeAddress);
```

## Summary

✅ **8 DAO Functions** - Control all game parameters
✅ **5 Owner Functions** - Emergency & governance
✅ **BNB Oracle** - Dynamic USD-based pricing
✅ **Batch Updates** - Efficient mass changes
✅ **Multisig Ready** - Transfer to Gnosis Safe
✅ **No Frontend Needed** - Use Remix or block explorer

**All admin features fully functional!** 🎯
