# BSC Testnet - Link and Verify Guide

## 🎯 Quick Action Required

You need to complete these steps to fully activate the contracts.

---

## Step 1: Verify Contracts on BSCScan ✅

Run these commands from your terminal:

### Verify Main Contract
```bash
npx hardhat verify --network bscTestnet 0x2A6E31141D1f4F029A65E1493C9A7ed9B6d99b27 "0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0" "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526" "0x9F4fE3F3dD5B79B7729145023A7F66E654237505" "0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0" 100000
```

### Verify Royalty Contract
```bash
npx hardhat verify --network bscTestnet 0x9F4fE3F3dD5B79B7729145023A7F66E654237505 "0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0" "0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0" "0x0000000000000000000000000000000000000000"
```

---

## Step 2: Link Contracts on BSCScan 🔗

### Connect Royalty to Main Contract

**URL**: https://testnet.bscscan.com/address/0x9F4fE3F3dD5B79B7729145023A7F66E654237505#writeContract

**Steps:**
1. Click "Connect to Web3" (top right)
2. Connect with MetaMask (use owner wallet: 0x018B...)
3. Scroll to function **`setMainContract`**
4. Enter main contract address:
   ```
   0x2A6E31141D1f4F029A65E1493C9A7ed9B6d99b27
   ```
5. Click **"Write"**
6. Confirm MetaMask transaction
7. Wait for confirmation (~3 seconds)

---

## Step 3: Initialize Royalty 🎯

### Register Root User to Royalty Tiers

**URL**: https://testnet.bscscan.com/address/0x2A6E31141D1f4F029A65E1493C9A7ed9B6d99b27#writeContract

**Steps:**
1. Should already be connected from Step 2
2. Scroll to function **`initializeRoyalty`**
3. Click **"Write"** (no parameters needed)
4. Confirm MetaMask transaction
5. Wait for confirmation (~3 seconds)

---

## Step 4: Verify Connection ✅

Run the connection check script:

```bash
npx hardhat run scripts/check-connection.cjs --network bscTestnet
```

**Expected Output:**
```
✅ Main Contract → Royalty: Correct
✅ Royalty → Main: Connected
✅ Royalty Initialized: Yes
✅✅ ALL CONTRACTS FULLY CONNECTED AND READY!
```

---

## Troubleshooting

### Issue: "Only owner" error
**Solution**: Make sure you're using wallet address: 0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0

### Issue: "Already set" error on setMainContract
**Solution**: Contract already linked! Skip to Step 3.

### Issue: "Already initialized" error on initializeRoyalty
**Solution**: Royalty already initialized! You're done!

### Issue: Can't connect wallet
**Solution**: 
1. Add BSC Testnet to MetaMask:
   - Network Name: BSC Testnet
   - RPC URL: https://data-seed-prebsc-1-s1.bnbchain.org:8545
   - Chain ID: 97
   - Symbol: BNB
   - Explorer: https://testnet.bscscan.com

---

## After Completion

Once all 4 steps are done:

✅ Contracts verified  
✅ Contracts linked  
✅ Royalty initialized  
✅ Ready for testing  

**Next**: Try test registration!
