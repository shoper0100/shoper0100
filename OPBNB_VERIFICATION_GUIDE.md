# ✅ CLEAN Flattened Files for opBNB Verification

## 📁 Files Created

**New Clean Files** (No build output):
- `FiveDollarRide_BNB_Flattened_Clean.sol` ⭐
- `FiveDollarRideRoyalty_BNB_Flattened_Clean.sol` ⭐

**Old Files** (had dotenv output - don't use):
- ~~FiveDollarRide_BNB_Flattened.sol~~ ❌
- ~~FiveDollarRideRoyalty_BNB_Flattened.sol~~ ❌

---

## 🚀 Verification on opBNBScan

### Main Contract: `0x0C88413cdc7a52000Fe95C24D614415188930209`

**Step-by-Step**:

1. Go to: https://testnet.opbnbscan.com/address/0x0C88413cdc7a52000Fe95C24D614415188930209#code

2. Click **"Verify & Publish"**

3. **Compiler Settings**:
   - Compiler: `v0.8.20+commit.a1b79de6`
   - Optimization: ✅ **Enabled**  
   - Runs: `200`
   - Via IR: ✅ **Yes**

4. **Contract Code**:
   - Copy ALL content from: `FiveDollarRide_BNB_Flattened_Clean.sol`
   - Paste into "Enter the Solidity Contract Code below"

5. **Constructor Arguments (ABI-encoded)**:
```
000000000000000000000000018b5411f0fdbc989bca41115f6124c2fbaa0db000000000000000000000000073110e8602930f01bb584bc683c5aa2fb4d424190000000000000000000000009ce42d353b380e9014cb5dc4c3c85c0aba2872ce000000000000000000000000d9a3044cd5a329b16d5e1e02b0e64fbe18e6bf12000000000000000000000000000000000000000000000000000000000001209
8
```

6. Click **"Verify and Publish"**

---

### Royalty Contract: `0x9ce42D353B380E9014CB5dC4C3c85C0aBA2872ce`

**Step-by-Step**:

1. Go to: https://testnet.opbnbscan.com/address/0x9ce42D353B380E9014CB5dC4C3c85C0aBA2872ce#code

2. Click **"Verify & Publish"**

3. **Same compiler settings as above**

4. **Contract Code**:
   - Copy ALL content from: `FiveDollarRideRoyalty_BNB_Flattened_Clean.sol`

5. **Constructor Arguments (ABI-encoded)**:
```
000000000000000000000000018b5411f0fdbc989bca41115f6124c2fbaa0db0000000000000000000000000d9a3044cd5a329b16d5e1e02b0e64fbe18e6bf120000000000000000000000000000000000000000000000000000000000000000
```

6. Click **"Verify and Publish"**

---

## ⚠️ Common Issues

### Issue 1: Parser Error
**Cause**: Old flattened files had `[dotenv@17.2.3]...` output  
**Solution**: Use `*_Clean.sol` files ✅

### Issue 2: Bytecode Mismatch
**Cause**: Wrong compiler settings  
**Solution**: Must use **Via IR: Yes**, Optimization: 200 runs

### Issue 3: Constructor Args Wrong
**Cause**: Missing leading zeros or wrong format  
**Solution**: Use exact ABI-encoded args above

---

## ✅ After Verification Success

You'll be able to:
- Read all contract functions
- Write to contract (registerMeUSD, upgradeMeUSD)
- View full source code
- See all events and logs

---

**Files Location**: `f:\ridebnb\`  
**Use CLEAN files only!** ⭐
