# Admin Configuration - Complete Guide

## All Admin Functions

### 1. Price Oracle
```solidity
function setBnbPrice(uint _priceInUSD) external
```
**Access:** Owner only  
**Purpose:** Update BNB/USD price  
**Example:** `setBnbPrice(650)` → Set BNB to $650

### 2. Batch Level Updates
```solidity
function batchUpdateLevels(uint[13] memory _newCosts) external
```
**Access:** Owner only  
**Purpose:** Update all 13 level costs at once  
**Example:** `batchUpdateLevels([2,3,6,12,24,48,96,192,384,768,1536,3072,6144])`

### 3. Individual Level Cost
```solidity
function setLevelCost(uint _level, uint _cost) external
```
**Access:** Owner only  
**Purpose:** Update single level cost  
**Example:** `setLevelCost(0, 5e15)` → Set Level 1 to 0.005 BNB

### 4. Individual Level Fee
```solidity
function setLevelFeePercent(uint _level, uint _percent) external
```
**Access:** Owner only  
**Purpose:** Update single level admin fee %  
**Example:** `setLevelFeePercent(0, 5)` → Set Level 1 fee to 5%

### 5. Direct Requirement
```solidity
function setDirectRequired(uint _num) external
```
**Access:** Owner only  
**Purpose:** Change direct referrals needed for matrix income  
**Example:** `setDirectRequired(3)` → Require 3 directs

### 6. Sponsor Commission %
```solidity
function setSponsorCommission(uint _percent) external
```
**Access:** Owner only  
**Purpose:** Change sponsor commission percentage  
**Example:** `setSponsorCommission(10)` → Set to 10%

### 7. Min Sponsor Level
```solidity
function setMinSponsorLevel(uint _level) external
```
**Access:** Owner only  
**Purpose:** Change minimum level to earn sponsor commission  
**Example:** `setMinSponsorLevel(5)` → Require Level 5

### 8. Royalty Percentages
```solidity
function setRoyaltyPercents(uint[4] memory _percents) external
```
**Access:** Owner only  
**Purpose:** Update royalty tier percentages  
**Example:** `setRoyaltyPercents([35, 30, 25, 10])` → Adjust distribution

### 9. Royalty Levels
```solidity
function setRoyaltyLevels(uint[4] memory _levels) external
```
**Access:** Owner only  
**Purpose:** Change which levels qualify for royalty tiers  
**Example:** `setRoyaltyLevels([9, 10, 11, 12])` → Change tier levels

### 10. Fee Receiver
```solidity
function setFeeReceiver(address _new) external
```
**Access:** Owner only  
**Purpose:** Change where admin fees are sent  
**Example:** `setFeeReceiver(0x123...)` → New fee wallet

### 11. Royalty Contract
```solidity
function setRoyaltyContract(address _new) external
```
**Access:** Owner only  
**Purpose:** Update royalty contract address  
**Example:** `setRoyaltyContract(0x456...)` → New royalty contract

### 12. Emergency Pause
```solidity
function pause() external
function unpause() external
```
**Access:** Owner only  
**Purpose:** Stop/resume all user actions  
**Example:** `pause()` → Freeze contract, `unpause()` → Resume

### 13. Emergency Sweep
```solidity
function sweepToRoot() external
```
**Access:** Owner only  
**Purpose:** Send stuck BNB to root user  
**Example:** `sweepToRoot()` → Recover funds

### 14. Transfer Ownership
```solidity
function transferOwnership(address _newOwner) external
```
**Access:** Owner only  
**Purpose:** Transfer ownership to new address/multisig  
**Example:** `transferOwnership(gnosisSafeAddress)` → Transfer to multisig

### 15. Transfer DAO Control
```solidity
function transferDAOControl(address _newDAO) external
```
**Access:** Owner only  
**Purpose:** Transfer DAO address  
**Example:** `transferDAOControl(0x789...)` → New DAO

### 16. Update Both Governance
```solidity
function updateGovernance(address _newDAO, address _newOwner) external
```
**Access:** Owner only  
**Purpose:** Update DAO and Owner together  
**Example:** `updateGovernance(daoAddr, ownerAddr)` → Update both

## Quick Reference

| Function | What It Does | Default Value |
|----------|--------------|---------------|
| setBnbPrice | BNB/USD price | 600 |
| setDirectRequired | Directs for matrix | 2 |
| setSponsorCommission | Sponsor % | 5% |
| setMinSponsorLevel | Min level for commission | 4 |
| setLevelFeePercent | Admin fee per level | 5% |
| pause/unpause | Emergency stop | false |

## Admin Panel Integration

**Frontend can call:**
```javascript
// Update BNB price
await contract.setBnbPrice(650);

// Pause contract
await contract.pause();

// Update sponsor commission
await contract.setSponsorCommission(10);

// Transfer to multisig
await contract.transferOwnership(gnosisSafeAddress);
```

## Safety Notes

**Owner Control:**
- All functions require msg.sender == owner
- Should transfer to multisig after testing
- Recommended: 2-of-3 or 3-of-5 Gnosis Safe

**Parameters:**
- Cannot set values that break logic
- Most have validation checks
- Some have reasonable limits

**Emergency:**
- pause() can stop exploits
- sweepToRoot() recovers stuck funds
- Always available to owner

## Current Values (Default)

```
bnbPriceInUSD: 600
directRequired: 2
sponsorCommission: 5
minSponsorLevel: 4
royaltyPercent: [40, 30, 20, 10]
royaltyLvl: [10, 11, 12, 13]
paused: false
```

## Complete Admin Workflow

**1. Deploy Contract**
```
Deploy with initial parameters
Owner = Your address
```

**2. Test on Testnet**
```
Adjust parameters as needed
Test all admin functions
```

**3. Transfer to Multisig**
```
Create Gnosis Safe
transferOwnership(safeAddress)
All future changes need multisig approval
```

**4. Monitor & Adjust**
```
setBnbPrice() when needed
Adjust parameters if necessary
pause() if exploit detected
```

**Total admin functions: 16** ✅  
**All owner-controlled for safety** ✅
