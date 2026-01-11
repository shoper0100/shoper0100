# RideBNB Deployment Guide

## Current Status

✅ **Royalty.sol** - Production ready, compiles successfully
⚠️ **RideBNB.sol** (new version) - Stack too deep error, cannot compile
✅ **RideBNBWorking.sol** - Original working version (backup)

## Deployment Order

### 1. Deploy Royalty Contract First
```bash
npx hardhat run scripts/deployNewRoyalty.js --network opbnbTestnet
```

Save the deployed address!

### 2. Deploy RideBNB (use working version)
Update your main deploy script to use:
- The original RideBNB contract
- The newly deployed Royalty contract address

### 3. Connect Contracts
After both are deployed:
```javascript
// In RideBNB: already has royaltyAddr in constructor
// In Royalty: set RideBNB address
await royalty.setRideBNBContract(rideBNBAddress);
```

## Files
- contracts/Royalty.sol - Deploy this ✅
- contracts/RideBNBWorking.sol - Original working contract
- contracts/RideBNB.sol - Modern version (won't compile)
- scripts/deployNewRoyalty.js - Royalty deployment script ✅

## Next Steps for V2

When you're ready to rebuild RideBNB:
1. Start with modular architecture
2. Use libraries for complex logic
3. Keep functions small (<15 parameters)
4. Test compilation frequently
