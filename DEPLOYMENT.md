# Complete Deployment Guide - RideBNB

## Overview
This guide will help you deploy both contracts with all funds going to the admin fee address.

**Admin Fee Address:** `0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0`

## Architecture
1. **SimpleRoyaltyReceiver** - Forwards all royalty to admin fee address
2. **RideBNB** - Main contract with starting ID 36999

## Step-by-Step Deployment

### Step 1: Configure Environment

Edit your `.env` file:
```env
# Deployer wallet private key
PRIVATE_KEY=your_private_key_here

# Admin fee receiver (all funds go here)
FEE_RECEIVER_ADDRESS=0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0

# Owner address (for admin functions)
OWNER_ADDRESS=0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0

# Starting user ID
DEFAULT_REFER_ID=36999

# Network RPC
BSC_RPC_URL=https://bsc-dataseed1.binance.org
```

### Step 2: Deploy Royalty Receiver First

```bash
# Compile contracts
npx hardhat compile

# Deploy royalty receiver (this forwards all funds to admin fee address)
npx hardhat run scripts/deployRoyalty.js --network bsc
```

**Save the output!** You'll get a royalty contract address like:
```
Royalty Contract Address: 0x...
```

### Step 3: Update .env with Royalty Address

Add the royalty address to your `.env`:
```env
ROYALTY_ADDRESS=0xYourRoyaltyContractAddress
```

### Step 4: Deploy Main RideBNB Contract

```bash
# Deploy main contract
npx hardhat run scripts/deploy.js --network bsc
```

## Fund Flow

All funds automatically go to admin fee address:

```
User Registration/Upgrade
    ↓
Main Contract
    ├─→ Referral Income (direct to users)
    ├─→ Level Income (direct to qualified users)
    ├─→ 5% Royalty → Royalty Contract → Admin Fee Address ✓
    └─→ 10% Admin Fee → Admin Fee Address ✓
```

**Result:** All administrative income and royalty goes to:
`0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0`

## Verification (Optional)

After deployment, verify both contracts:

```bash
# Verify royalty receiver
npx hardhat verify --network bsc <ROYALTY_ADDRESS> "0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0"

# Verify main contract
npx hardhat verify --network bsc <CONTRACT_ADDRESS> "0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0" "<ROYALTY_ADDRESS>" "0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0" "36999"
```

## Update Frontend

After successful deployment, update:

**1. `lib/constants.ts`**
```typescript
export const CONTRACT_ADDRESS = 'YOUR_NEW_CONTRACT_ADDRESS' as const;
export const DEFAULT_REFER = 36999;
```

**2. `.env.local`**
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_NEW_CONTRACT_ADDRESS
NEXT_PUBLIC_DEFAULT_REFER=36999
```

## Contract ABIs

If you need to update frontend ABIs:
```bash
# SimpleRoyaltyReceiver ABI
artifacts/contracts/SimpleRoyaltyReceiver.sol/SimpleRoyaltyReceiver.json

# RideBNB ABI  
artifacts/contracts/RideBNB.sol/RideBNB.json
```

## Troubleshooting

**Node.js Version Error:**
- Hardhat requires Node.js LTS (v18 or v20)
- Current version v25.2.1 is not yet supported
- Install Node.js v20 LTS: https://nodejs.org/

**Insufficient funds:**
- Ensure deployer wallet has BNB on BSC Mainnet
- Each deployment costs ~0.01-0.02 BNB

**Private key issues:**
- Don't include "0x" prefix in PRIVATE_KEY
- Ensure key has 64 characters

## Security Checklist

- [ ] Private key stored securely (not committed to git)
- [ ] Admin fee address verified (0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0)
- [ ] Tested on testnet first (recommended)
- [ ] Backup of deployment addresses saved
- [ ] Frontend configuration updated

## Support

Contract details:
- Starting ID: 36999
- First user ID: 37006
- Admin Fee: 10% per level
- Royalty: 5% (forwarded to admin)
- All funds destination: 0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0 ✓
