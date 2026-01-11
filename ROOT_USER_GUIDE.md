# 👑 Root User Setup Guide

## Overview

The **Root User** (ID `73928`) is the foundational account in RideBNB with special privileges and responsibilities. This guide covers setup, privileges, and deployment considerations.

---

## 🔑 Special Privileges

### 1. **Unlimited Income**
- **No 150% Cap**: Root user bypasses the royalty income cap
- **Code Location**: `Royalty.sol` line 178-182

```solidity
bool isRoot = _id == rootUserId;
if(!isRoot) {
    require(userTotalIncome < (userTotalDeposit * royaltyMaxPercent / 100), "Max cap reached");
}
```

### 2. **Persistent Royalty Access**
- **Status Never Disabled**: `royaltyActive` remains `true` after claiming
- **Benefit**: Can claim multiple times without re-registration
- **Code Location**: `Royalty.sol` line 190-192

```solidity
if(!isRoot) {
    royaltyActive[_id][_tier] = false; // Normal users disabled
}
// Root stays active
```

### 3. **Fallback Income Receiver**
- **Matrix Fallback**: Receives all "lost" matrix income from unqualified uplines
- **Referral Fallback**: Ultimate receiver when referral chain is invalid
- **Code Locations**: 
  - `RideBNB.sol` line 538-544 (Matrix)
  - `RideBNB.sol` line 397-403 (Referral)

### 4. **Tree Anchor**
- **Self-Referrer**: `referrer = ROOT_ID`
- **Self-Upline**: `upline = ROOT_ID`
- **Purpose**: Prevents infinite loops and anchors binary tree

---

## 📦 Deployment Configuration

### Constructor Initialization

Both contracts require the Root User ID during deployment:

#### **RideBNB.sol**
```solidity
constructor(
    address _feeReceiver,
    address _royalty,
    address _owner,
    uint _defaultRefer  // 👈 Root User ID
)
```

#### **Royalty.sol**
```solidity
constructor(
    address _owner,
    uint _defaultRefer  // 👈 Root User ID
)
```

### Example Deployment Script

```javascript
// scripts/deploy.js
const ROOT_USER_ID = 73928;
const OWNER_ADDRESS = "0x..."; // Your admin wallet

// Deploy Royalty
const royalty = await Royalty.deploy(
    OWNER_ADDRESS,
    ROOT_USER_ID
);

// Deploy RideBNB
const rideBNB = await RideBNB.deploy(
    FEE_RECEIVER_ADDRESS,
    royalty.address,
    OWNER_ADDRESS,
    ROOT_USER_ID
);
```

---

## ⚙️ Post-Deployment Verification

### 1. Check Root User Initialization
```javascript
const rootInfo = await rideBNB.userInfo(73928);
console.log("Root Account:", rootInfo.account);
console.log("Root ID:", rootInfo.id.toString());
console.log("Exists:", rootInfo.exists);
```

**Expected Output:**
```
Root Account: 0xYourOwnerAddress
Root ID: 73928
Exists: true
```

### 2. Verify Self-Reference
```javascript
console.log("Referrer:", rootInfo.referrer.toString()); // 73928
console.log("Upline:", rootInfo.upline.toString());     // 73928
```

### 3. Test Royalty Privilege
```javascript
// After root reaches Level 10 and claims royalty
const [amount, taken, active] = await royalty.getUserRoyaltyData(73928, 0);
console.log("Active Status:", active); // Should be TRUE even after claiming
```

---

## 🧪 Testing

Run the comprehensive root user test suite:

```bash
npx hardhat test test/RootUser_Test.cjs
```

**Test Coverage:**
- ✅ Initialization verification
- ✅ Income cap bypass
- ✅ Persistent royalty access
- ✅ Fallback income reception

---

## 🔒 Security Considerations

### 1. **Owner Control**
The root user account is controlled by the `owner` address. Ensure this wallet:
- Has secure backup/recovery
- Uses hardware wallet for mainnet
- Is the only address with root privileges

### 2. **No Transfer**
Root user ID **cannot be changed** after deployment. Choose wisely!

### 3. **Income Tracking**
Monitor root user income to ensure fallback mechanisms work correctly:

```javascript
const rootIncome = await rideBNB.userIncome(73928);
console.log("Level Income:", ethers.utils.formatEther(rootIncome.levelIncome));
console.log("Referral Income:", ethers.utils.formatEther(rootIncome.referralIncome));
```

---

## 📊 Economics

### Expected Root Income Sources

1. **Fallback Matrix**: ~5-10% of total platform volume
2. **Fallback Referral**: ~2-5% of registrations
3. **Royalty Pool**: Same as other Level 10+ users (but unlimited)

### Gas Optimization

Root user transactions may consume slightly more gas due to additional privilege checks. Monitor in production.

---

## ✅ Deployment Checklist

- [ ] Root User ID confirmed (`73928`)
- [ ] Owner address secured
- [ ] Both contracts deployed with same Root ID
- [ ] Post-deployment verification completed
- [ ] Test royalty claim (testnet)
- [ ] Monitor fallback income (first 24h)
- [ ] Backup root user wallet securely

---

**Last Updated**: 2025-12-25  
**Contract Versions**: RideBNB v1.0, Royalty v1.0
