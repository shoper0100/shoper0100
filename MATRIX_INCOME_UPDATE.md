# Matrix Income Update

## Change Made
✅ Matrix income now distributes across **13 levels** (was 26)

**Updated:**
```solidity
uint private constant maxIncomeLayer = 13;  // Changed from 26
```

**Impact:**
- Each qualified upline gets: `income / 13` (was `income / 26`)
- Larger share per level
- Matches the 13 upgrade levels

**Example:**
- User upgrades Level 5 (0.096 BNB)
- After sponsor commission (5%): 0.0912 BNB
- Each of 13 qualified uplines gets: 0.007 BNB (was 0.0035 BNB)

✅ **Matrix income distribution updated to 13 levels!**
