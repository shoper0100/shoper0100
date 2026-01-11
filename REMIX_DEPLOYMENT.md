# Remix IDE Deployment Guide

## Quick Deployment Using Remix (Browser-based)

Since Hardhat requires Node.js v20 but you have v25.2.1, you can use Remix IDE to deploy directly from your browser.

### Step 1: Open Remix IDE
Go to: https://remix.ethereum.org/

### Step 2: Create Contract Files

**File 1: SimpleRoyaltyReceiver.sol**
Copy the content from: `f:\ridebnb\contracts\SimpleRoyaltyReceiver.sol`

**File 2: RideBNB.sol**  
Copy the content from: `f:\ridebnb\contracts\RideBNB.sol`

### Step 3: Compile Contracts

1. Click on "Solidity Compiler" tab (left sidebar)
2. Select compiler version: `0.8.20`
3. Click "Compile SimpleRoyaltyReceiver.sol"
4. Click "Compile RideBNB.sol"

### Step 4: Deploy Royalty Receiver

1. Click "Deploy & Run Transactions" tab
2. Select "Injected Provider - MetaMask" (connects to opBNB)
3. Make sure MetaMask is on opBNB network (Chain ID: 204)
4. Select contract: "SimpleRoyaltyReceiver"
5. Constructor parameter:
   - `_feeReceiver`: `0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0`
6. Click "Deploy"
7. Confirm in MetaMask
8. **COPY THE DEPLOYED ADDRESS** - you'll need this!

### Step 5: Deploy Main Contract

1. In Remix, select contract: "RideBNB"
2. Constructor parameters:
   - `_feeReceiver`: `0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0`
   - `_royalty`: `[ROYALTY_CONTRACT_ADDRESS_FROM_STEP_4]`
   - `_owner`: `0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0`
   - `_defaultRefer`: `36999`
3. Click "Deploy"
4. Confirm in MetaMask
5. **COPY THE DEPLOYED ADDRESS**

### Step 6: Update Frontend

Update `lib/constants.ts`:
```typescript
export const CONTRACT_ADDRESS = 'YOUR_RIDEBNB_CONTRACT_ADDRESS' as const;
export const DEFAULT_REFER = 36999;
```

Update `.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_RIDEBNB_CONTRACT_ADDRESS
NEXT_PUBLIC_DEFAULT_REFER=36999
```

### Step 7: Verify Contracts (Optional)

Go to https://opbnb.bscscan.com/verifyContract

**For SimpleRoyaltyReceiver:**
- Contract Address: [your deployed address]
- Compiler: v0.8.20
- Optimization: Yes (200 runs)
- Constructor Arguments: [use Remix's "Constructor Arguments" from deployment]

**For RideBNB:**
- Contract Address: [your deployed address]  
- Compiler: v0.8.20
- Optimization: Yes (200 runs)
- Constructor Arguments: [use Remix's "Constructor Arguments" from deployment]

## MetaMask Network Configuration

If opBNB not in MetaMask, add it:

**Network Name:** opBNB Mainnet
**RPC URL:** https://opbnb-mainnet-rpc.bnbchain.org
**Chain ID:** 204  
**Currency Symbol:** BNB
**Block Explorer:** https://opbnb.bscscan.com

## Summary

✅ **All funds go to:** 0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0
✅ **Starting ID:** 36999
✅ **First user ID:** 37006 (36999 + 7)

## Alternative: Fix Node.js Version

If you prefer using Hardhat:

1. Install Node.js v20 LTS from https://nodejs.org/
2. Restart terminal
3. Run:
```bash
npx hardhat compile
npx hardhat run scripts/deployRoyalty.js --network opbnb
# Save royalty address to .env
npx hardhat run scripts/deploy.js --network opbnb
```
