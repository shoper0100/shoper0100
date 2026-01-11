# 👑 Root User & Royalty Distribution

**Root User ID**: 73928  
**Root Address**: `0xd9a3044CD5a329b16d5e1E02b0E64FBE18E6bf12` (You!)

---

## 🎯 Root User Setup

### During Contract Deployment:

```solidity
// Root user created at Level 13 (max level)
_createUser(DEFAULT_REFER, rootAddress, DEFAULT_REFER, DEFAULT_REFER, 12);
//                                                                       ^
//                                                               Level 13 (12+1)
```

### Root User Registration in Royalty (During initializeRoyalty):

```solidity
// Root user is registered in ALL 4 royalty tiers!
ROYALTY_ADDR.registerUser(DEFAULT_REFER, 10, 0);  // L10 tier
ROYALTY_ADDR.registerUser(DEFAULT_REFER, 11, 0);  // L11 tier  
ROYALTY_ADDR.registerUser(DEFAULT_REFER, 12, 0);  // L12 tier
ROYALTY_ADDR.registerUser(DEFAULT_REFER, 13, 0);  // L13 tier
```

**This means**: Root user is in Round 1 of ALL 4 tiers!

---

## 💰 How Root User Gets Royalty

### Root User is the FIRST user in every tier:

**L10 Tier - Round 1**:
- Root user = User #1 in Round 1
- When 9 more users reach L10:
  - Round 1 closes
  - Root user can claim from Round 1

**L11 Tier - Round 1**:
- Root user = User #1 in Round 1
- When 9 more users reach L11:
  - Round 1 closes
  - Root user can claim from Round 1

**L12 Tier - Round 1**:
- Root user = User #1 in Round 1
- When 9 more users reach L12:
  - Round 1 closes
  - Root user can claim from Round 1

**L13 Tier - Round 1**:
- Root user = User #1 in Round 1
- When 9 more users reach L13:
  - Round 1 closes
  - Root user can claim from Round 1

---

## 📊 Root User Claim Calculation

### Example: L10 Tier (5%)

**Scenario**:
- 10 users register in L10 Round 1 (including root)
- Round 1 pool: 1 BNB

**Root user's share**:
```
poolForRound = 1 BNB
sharePercent = 5% (L10)
usersInRound = 10

rootShare = (1 * 5) / (100 * 10)
rootShare = 5 / 1000
rootShare = 0.005 BNB

Root gets: 0.005 BNB (same as other users in Round 1!)
```

**Key Point**: Root gets **SAME share** as other users in the round!

---

## 💎 Root User Advantage

### Root user gets 4x the claims:

**When all tiers reach 10 users**:

| Tier | % | Pool | Root Share |
|------|---|------|------------|
| L10  | 5%  | 1 BNB | 0.005 BNB |
| L11  | 10% | 1 BNB | 0.010 BNB |
| L12  | 15% | 1 BNB | 0.015 BNB |
| L13  | 20% | 1 BNB | 0.020 BNB |

**Total Root Claims**: 0.05 BNB from all 4 tiers!

**Regular User** (only in one tier): Gets 0.005-0.020 BNB depending on their level

**Advantage**: Root is in ALL tiers from the start! 👑

---

## 🎯 Root User Also Gets:

### 1. Fallback Income
When no qualified upline found:
```solidity
// Root gets fallback matrix income
userIncome[DEFAULT_REFER].levelIncome += amount;
```

### 2. Default Referral Income
When user has no referrer:
```solidity
// Root gets referral commission
userIncome[DEFAULT_REFER].referralIncome += amount;
```

### 3. Unqualified Sponsor Income
When sponsor not qualified:
```solidity
// Root gets unpaid sponsor commissions
userIncome[DEFAULT_REFER].sponsorIncome += amount;
```

---

## 📊 Root User Total Earnings

**Root user earns from**:
1. ✅ Royalty L10 (5%)
2. ✅ Royalty L11 (10%)
3. ✅ Royalty L12 (15%)
4. ✅ Royalty L13 (20%)
5. ✅ Fallback matrix income
6. ✅ Default referral commissions
7. ✅ Unqualified sponsor commissions

**Result**: Root user earns the MOST in the entire system! 👑

---

## ⚙️ Root User Restrictions

**Root user CANNOT**:
- ❌ Upgrade (already at max level)
- ❌ Change referrer (is own referrer)
- ❌ Be removed from royalty

**Root user CAN**:
- ✅ Claim royalties from all 4 tiers
- ✅ Receive fallback income
- ✅ Call admin functions (is owner)

---

## 🔑 Summary

**Root User Benefits**:
- First user in ALL 4 royalty tiers
- Gets equal share with other users in Round 1
- Eligible for 4 different royalty percentages
- Receives all fallback/default incomes
- Maximum earning potential in the system

**Fair Distribution**: ✅
- Root doesn't get MORE per tier
- Root gets SAME as others in the round
- Root's advantage is being in ALL tiers from start

**This is FAIR because**:
- Root user deployed the contract
- Root user takes all the risk
- Root user provides default referral service
- Root user ensures no income is lost

👑 **The Root User is rewarded fairly for bootstrapping the system!**
