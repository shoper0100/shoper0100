# 🚀 Quick Test Guide - USD Functions

## Contract Address
**Main**: `0xDA28E7cE02d8fB06cECBe3E6B248AcC50f13f4Fa`

---

## Step 1: Register (Choose One Method)

### Method A: USD-Based (Recommended) ⭐

**URL**: https://testnet.bscscan.com/address/0xDA28E7cE02d8fB06cECBe3E6B248AcC50f13f4Fa#writeContract

1. Connect wallet
2. Function: **`registerMeUSD`**
3. Fill in:
   ```
   _referrerAddress: 0x0000000000000000000000000000000000000000
   _usdAmount: 5250000000000000000
   payableAmount (BNB): 0.01
   ```
4. Click **Write** → Confirm

### Method B: Traditional

1. Function: **`registerMe`**  
2. Fill in:
   ```
   _referrerAddress: 0x0000000000000000000000000000000000000000
   payableAmount (BNB): 0.00577
   ```
3. Click **Write** → Confirm

---

## Step 2: Check Your Info

**Go to Read Contract tab**

Function: **`getMyInfo`**
- Click **Query**
- Should show: Your ID, Level 1, etc.

---

## Step 3: Preview Upgrade Cost

Function: **`getLevelsForUSD`**
- Input: `30000000000000000000` (= $30)
- Click **Query**
- Shows: 2 levels, cost, BNB needed

---

## Step 4: Upgrade (USD Method)

Function: **`upgradeMeUSD`**
- `_usdAmount`: `30000000000000000000` (= $30)
- `payableAmount`: `0.05` BNB
- Click **Write** → Confirm

---

## Step 5: Verify Upgrade

Function: **`getMyInfo`**
- Should show: Level 3 (upgraded 2 levels)

---

## ✅ Success Criteria

After testing, you should have:
- ✅ Registered at Level 1
- ✅ Checked levels for $30 USD
- ✅ Upgraded to Level 3
- ✅ Received excess BNB refund

## 💡 USD Amount Reference

```
Registration: 5250000000000000000 = $5.25
1 level up:   10500000000000000000 = $10.50
2 levels:     31500000000000000000 = $31.50
3 levels:     73500000000000000000 = $73.50
```

**Formula**: USD × 1000000000000000000
