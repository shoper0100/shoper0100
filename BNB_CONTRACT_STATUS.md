# ⚠️ BNB Contract Status

## Problem Found
ALL existing "BNB" files have issues:
- Partial Chainlink removal (broken)
- USDT remnants (IERC20/USDT still referenced)
- Compilation errors

## Solution
Convert clean USDT contract (`FiveDollarRide.sol`) to native BNB:

**Changes Required**:
1. Remove `IERC20` interface
2. Remove `USDT` immutable
3. Replace `USDT.transferFrom()` → `msg.value`
4. Add `cachedBNBPrice` variable
5. Add `setManualPrice()` function
6. Update constructor

**Time**: ~10 minutes
**Result**: Clean BNB contract for opBNB

**Alternative**: Use BSC Mainnet (works now, $13)
