# maxLayers = 26 Explained

## The Constant

```solidity
uint private constant maxLayers = 26;  // Maximum search depth for placement
```

## Why 26?

**Rationale:**
- Income distribution depth: 13 levels (maxIncomeLayer)
- Placement search depth: 26 levels (2x income depth)
- Provides buffer for finding spots beyond income range

**Origin:**
- Original contract comment said "26 layers"
- Carried over from original design
- Works well for binary tree structure

## Is 26 Optimal?

**Too Much?**
- Could reduce to 50, 100, or even 13
- Lower = less gas, faster search
- Network depth rarely exceeds 26 initially

**Too Little?**
- In massive networks (Layer 500+), 26 might not find spot
- Falls back to root anyway (safe)
- No real problem, just places under root

## Better Options

### Option 1: Match Income Layers (13)
```solidity
uint private constant maxLayers = 13;
// Same as maxIncomeLayer
// Simpler logic
```

**Benefits:**
- ✅ Consistent with income distribution
- ✅ Lower max gas (13 × 6k = 78k)
- ✅ Still covers most cases

### Option 2: Larger Buffer (50)
```solidity
uint private constant maxLayers = 50;
// Covers deeper networks
```

**Benefits:**
- ✅ Finds spots in deeper networks
- ⚠️ Higher max gas (50 × 6k = 300k)
- ⚠️ Rarely needed

### Option 3: Very Deep (100)
```solidity
uint private constant maxLayers = 100;
// Maximum coverage
```

**Benefits:**
- ✅ Handles very deep networks
- ❌ High max gas (100 × 6k = 600k)
- ❌ Overkill for most cases

## Recommendation

**For Your Contract:**

**Keep 26** ✅
- Reasonable middle ground
- Not too high, not too low
- Works for networks up to depth 26
- Falls back to root if needed

**Or change to 50** for more coverage:
```solidity
uint private constant maxLayers = 50;
```

**Or reduce to 13** for lower gas:
```solidity
uint private constant maxLayers = 13;  // Match income layers
```

## Current Implementation

```solidity
for(uint i = 0; i < maxLayers; i++) {  // i < 26
    _ref = userInfo[_ref].upline;
    if(_ref == 0) _ref = defaultRefer;
    
    if(teams[_ref][0].length < 2 || _ref == defaultRefer) {
        // Place and break
        break;
    }
}
```

**Max iterations:** 26  
**Max gas:** 26 × 6,000 = 156,000 gas

## Impact of Different Values

| maxLayers | Max Gas | Coverage | Recommendation |
|-----------|---------|----------|----------------|
| **13** | 78k | Good | ✅ Best for low gas |
| **26** | 156k | Better | ✅ Current (balanced) |
| **50** | 300k | Best | ⚠️ If deep networks expected |
| **100** | 600k | Overkill | ❌ Too high |

## My Recommendation

**Change to 50 for better coverage:**
```solidity
uint private constant maxLayers = 50;  // Better coverage for deep networks
```

**Why?**
- Still reasonable gas (300k max)
- Handles networks up to depth 50
- Better than arbitrary 26
- More "future-proof"

**Or keep 26 if:**
- You want lower gas
- Network won't be too deep initially
- Root fallback is acceptable

## Summary

✅ **Current:** maxLayers = 26 (works fine)  
⚠️ **Could change to:** 50 (better coverage)  
⚠️ **Or reduce to:** 13 (lower gas)

**The important part:** It's no longer `while(true)`! Any bounded limit is better than unbounded.

Would you like me to change it to 50? Or keep 26?
