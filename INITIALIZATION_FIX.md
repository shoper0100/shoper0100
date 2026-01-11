# Quick Fix: Initialization Error

## ⚠️ Error You're Seeing:
"execution reverted: Not registered"

## 🔍 Root Cause:
You're trying to call `initializeRoyalty` **before** linking the contracts!

## ✅ Correct Order:

### Step 1: First Link Royalty → Main (MUST DO FIRST!)

**Contract**: Royalty  
**URL**: https://testnet.bscscan.com/address/0x9F4fE3F3dD5B79B7729145023A7F66E654237505#writeContract

1. Connect wallet
2. Scroll to **function 18: `setMainContract`**
3. Enter main address: `0x2A6E31141D1f4F029A65E1493C9A7ed9B6d99b27`
4. Click **Write**
5. Confirm transaction
6. **Wait for confirmation** (~5 seconds)

### Step 2: Then Initialize (AFTER Step 1!)

**Contract**: Main  
**URL**: https://testnet.bscscan.com/address/0x2A6E31141D1f4F029A65E1493C9A7ed9B6d99b27#writeContract

1. Scroll to **function 19: `initializeRoyalty`**
2. Click **Write** (no parameters)
3. Confirm transaction

---

## 📸 What You Should See:

**On setMainContract:**
- Input field for _mainContract address
- Enter: 0x2A6E31141D1f4F029A65E1493C9A7ed9B6d99b27

**On initializeRoyalty:**
- Just a "Write" button (no inputs)
- Click it after Step 1 completes

---

## ✅ Verify Success:

After both steps, bash run:
```
npx hardhat run scripts/check-connection.cjs --network bscTestnet
```

Should show all ✅ checkmarks!
