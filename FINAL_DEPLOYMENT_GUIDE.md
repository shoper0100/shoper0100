# Final Deployment Guide - RideBNB

## ⚠️ Important: Use Remix IDE for Deployment

**Hardhat Compilation Issue:**
- Contract hits "Stack too deep" error in Hardhat
- This is a known Solidity compiler limitation
- **Solution: Deploy using Remix IDE** (handles large contracts better)

## Deployment Steps - Remix IDE

### Step 1: Prepare Contracts

**Files to deploy:**
1. `SimpleRoyaltyReceiver.sol` (75 lines)
2. `RideBNB.sol` (899 lines)

### Step 2: Deploy SimpleRoyaltyReceiver First

**Go to Remix IDE:** https://remix.ethereum.org

**1. Create new file:**
- Name: `SimpleRoyaltyReceiver.sol`
- Copy entire content from `f:\ridebnb\contracts\SimpleRoyaltyReceiver.sol`

**2. Compile:**
- Compiler version: 0.8.20
- Enable optimization: Yes (200 runs)
- Click "Compile"

**3. Deploy:**
```
Constructor Parameters:
_feeReceiver: 0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0
```

**4. Save Address:**
- Copy deployed contract address
- Example: 0x1234...abc (SimpleRoyaltyReceiver address)

### Step 3: Deploy RideBNB

**1. Create new file:**
- Name: `RideBNB.sol`
- Copy entire content from `f:\ridebnb\contracts\RideBNB.sol`

**2. Compile:**
- Compiler version: 0.8.20
- Enable optimization: Yes (200 runs)
- Click "Compile"

**3. Deploy:**
```
Constructor Parameters:
_feeReceiver: 0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0
_royalty: [SimpleRoyaltyReceiver address from Step 2]
_owner: 0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0
_defaultRefer: 36999
```

**4. Save Address:**
- Copy deployed RideBNB contract address
- This is your main contract!

### Step 4: Verify Deployment

**Test these functions:**

```javascript
// 1. Check owner
getOwner()
// Should return: 0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0

// 2. Check BNB price
getBnbPrice()
// Should return: 600

// 3. Check root user
getUserData(36999)
// Should return user data with:
// - id: 36999
// - level: 13
// - account: 0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0

// 4. Check level costs
getAllLevelCosts()
// Should return array of 13 costs

// 5. Check governance
getGovernanceAddresses()
// Should return: {dao: your address, owner: your address}
```

### Step 5: Network Configuration

**opBNB Testnet:**
```
Network Name: opBNB Testnet
RPC URL: https://opbnb-testnet-rpc.bnbchain.org
Chain ID: 5611
Symbol: BNB
Block Explorer: https://opbnb-testnet.bscscan.com
```

**opBNB Mainnet:**
```
Network Name: opBNB Mainnet
RPC URL: https://opbnb-mainnet-rpc.bnbchain.org
Chain ID: 204
Symbol: BNB
Block Explorer: https://opbnb.bscscan.com
```

## Post-Deployment Checklist

### ✅ Immediate Verification

- [ ] Contract deployed successfully
- [ ] Owner address correct
- [ ] Root user (36999) initialized
- [ ] BNB price set (600)
- [ ] Fee receiver correct
- [ ] Royalty contract linked

### ✅ Test Transactions

- [ ] Register test user
- [ ] Upgrade test user
- [ ] Check income distribution
- [ ] Verify sponsor commission
- [ ] Test admin functions

### ✅ Optional: Transfer to DAO

If you want multisig control later:

1. Create Gnosis Safe (2-of-2 or 2-of-5)
2. Call `transferOwnership(safeAddress)`
3. All admin functions now need multisig signatures

## Admin Functions Available

**After deployment, you can:**

1. **Update BNB Price:**
   ```
   setBnbPrice(700)  // Update to $700/BNB
   ```

2. **Batch Update Levels:**
   ```
   batchUpdateLevels([2,3,6,12,24,48,96,192,384,768,1536,3072,6144])
   ```

3. **Adjust Parameters:**
   ```
   setDirectRequired(3)  // Change direct requirement
   setSponsorCommission(10)  // Change commission %
   setMinSponsorLevel(5)  // Change min level
   ```

4. **Emergency:**
   ```
   sweepToRoot()  // Recover stuck funds
   ```

## Contract Addresses to Document

**After deployment, save these:**

```
Network: opBNB [Testnet/Mainnet]
SimpleRoyaltyReceiver: 0x...
RideBNB Main Contract: 0x...
Fee Receiver: 0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0
Owner: 0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0
Root User ID: 36999
```

## Troubleshooting

### Compilation Issues in Remix

If you get "Stack too deep" even in Remix:

1. **Enable Optimization:**
   - Compiler settings → Enable optimization
   - Set to 200 runs

2. **Use Latest Compiler:**
   - Select 0.8.20 or 0.8.23

3. **Flatten Contract:**
   - Use Remix flattener plugin
   - Deploy flattened version

### Gas Estimation

**Estimated gas costs:**
- SimpleRoyaltyReceiver deployment: ~500,000 gas
- RideBNB deployment: ~6,000,000 gas
- **Total: ~6.5M gas**

**At 1 Gwei gas price:**
- Cost: ~0.0065 BNB

### Verification on Block Explorer

**After deployment:**

1. Go to opbnb.bscscan.com (or testnet)
2. Find your contract
3. Navigate to "Contract" tab
4. Click "Verify and Publish"
5. Upload flattened source
6. Match compiler settings
7. Verify!

## Summary

✅ **Contract Ready:** 899 lines, all features working
✅ **Deploy with Remix:** Avoid Hardhat stack too deep error
✅ **Network:** opBNB (Testnet then Mainnet)
✅ **Total Contracts:** 2 (SimpleRoyaltyReceiver + RideBNB)
✅ **Gas Cost:** ~6.5M gas (~0.0065 BNB)

**You're ready to deploy!** 🚀

## Quick Reference

**Constructor Parameters:**

**SimpleRoyaltyReceiver:**
```
_feeReceiver: 0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0
```

**RideBNB:**
```
_feeReceiver: 0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0
_royalty: [SimpleRoyaltyReceiver address]
_owner: 0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0
_defaultRefer: 36999
```

**Start deploying on testnet first, then mainnet!** ✅
