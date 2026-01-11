# Registration Amount Guide

## 📋 How to Get Registration Cost

### Method 1: On BSCScan (Easiest)

1. Go to Main Contract → **Read Contract**:
   https://testnet.bscscan.com/address/0x2d42fbDBEE79089b78D49D92a81680fBf5FECEb2#readContract

2. Find function **`getRegistrationCost`**

3. Click **"Query"**

4. You'll see two values:
   - **usdCost**: 5250000000000000000 = $5.25 USD
   - **bnbCost**: [USE THIS VALUE] = BNB amount to send

### Method 2: Calculate Based on Current Price

**Current BNB Price**: $904.47

**Registration Cost**: $5.25 USD

**Formula**: 5.25 ÷ 904.47 = **0.0058 BNB**

---

## 💰 To Register on BSCScan:

1. Go to: https://testnet.bscscan.com/address/0x2d42fbDBEE79089b78D49D92a81680fBf5FECEb2#writeContract

2. Connect your wallet

3. Find function **`registerMe`**

4. Fill in:
   - **_referrerAddress**: `0x0000000000000000000000000000000000000000` (or valid referrer)
   - **payableAmount (BNB)**: `0.0058` (or exact value from getRegistrationCost)

5. Click **Write**

6. Confirm transaction

---

## ✅ At Current Price ($904.47):

**Send**: **0.0058 BNB** (approximately)

**Exact value**: Check `getRegistrationCost` on BSCScan first!

---

## 💡 Tips:

- Always check `getRegistrationCost` first (price may have updated)
- Send exact amount or slightly more (excess is refunded automatically)
- Don't send less - transaction will fail
- Price updates every 72 hours or when anyone calls `updatePrice()`
