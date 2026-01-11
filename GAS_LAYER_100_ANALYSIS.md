# Gas Calculation: Commission Distribution at Layer 100

## Scenario: User at Layer 100 Upgrades

**Setup:**
- User is 100 layers deep in the matrix
- User upgrades from Level 1 to Level 2
- Direct sponsor is at Layer 99
- Matrix upline chain goes up 100 levels

## Gas Breakdown

### 1. Basic Upgrade Operations
```
Transaction start: 21,000 gas (base ETH/BNB tx)
Function call overhead: ~3,000 gas
Total base: 24,000 gas
```

### 2. Sponsor Commission (5%)
```solidity
if(_ref > 0 && _ref != _id) {
    uint sponsorAmt = (_amt * sponsorCommission) / 100;
    if(userInfo[_ref].level >= minSponsorLevel) {
        (bool success, ) = payable(userInfo[_ref].account).call{value: sponsorAmt}("");
        require(success, "Sponsor payment failed");
        // Updates sponsor income
    }
}
```

**Gas Cost:**
- Sponsor check: 2,100 gas (storage read)
- Level check: 2,100 gas (storage read)
- call{value}: 21,000 gas (external call)
- 3 storage writes: 15,000 gas (3 × 5,000)
- **Sponsor total: ~40,000 gas**

### 3. Matrix Distribution (_distUpgrading)

**The Loop:**
```solidity
for(uint i = 0; i < maxIncomeLayer && _upline != 0; i++) {
    if(userInfo[_upline].level > _level && 
       userInfo[_upline].directTeam >= directRequired) {
        // Pay and break
    }
    _upline = userInfo[_upline].upline;
}
```

**At Layer 100:**
- Loop starts from Layer 100
- Searches UP the chain (towards root)
- Maximum 13 iterations (maxIncomeLayer)
- Checks each upline for qualification

**Per Iteration:**
- Read upline: 2,100 gas
- Read level: 2,100 gas  
- Read directTeam: 2,100 gas
- Total per iteration: ~6,300 gas

**Worst Case (13 iterations, all unqualified):**
- 13 × 6,300 = 81,900 gas
- Plus lost income tracking: 13 × 5,000 = 65,000 gas
- **Loop total (worst): ~147,000 gas**

**Best Case (first upline qualified):**
- 1 iteration: 6,300 gas
- Payment: 21,000 gas
- Storage updates (4 writes): 20,000 gas
- **Loop total (best): ~47,000 gas**

**Average Case (found at iteration 5):**
- 5 iterations: 31,500 gas
- Payment: 21,000 gas
- Storage updates: 20,000 gas
- Lost income for 4: 20,000 gas
- **Loop total (avg): ~92,500 gas**

### 4. Activity Tracking
```solidity
activity.push(Activity(_id, _level + 1));
```
- Array push: 20,000-40,000 gas (depends on array size)
- **Activity: ~30,000 gas**

### 5. Other Operations
```
Admin fee payment: 21,000 gas
Total deposit update: 5,000 gas
Misc operations: 10,000 gas
```

## Total Gas by Scenario

### Best Case (First Upline Qualified)
```
Base:              24,000 gas
Sponsor:           40,000 gas
Distribution:      47,000 gas
Activity:          30,000 gas
Admin fee:         21,000 gas
Other:             15,000 gas
-------------------------
Total:            177,000 gas
```

**Cost at 3 gwei:**
- 177,000 × 3 = 531,000 gwei = 0.000531 BNB
- At $600/BNB = **$0.32**

### Average Case (5 Iterations to Find Match)
```
Base:              24,000 gas
Sponsor:           40,000 gas
Distribution:      92,500 gas
Activity:          30,000 gas
Admin fee:         21,000 gas
Other:             15,000 gas
-------------------------
Total:            222,500 gas
```

**Cost at 3 gwei:**
- 222,500 × 3 = 667,500 gwei = 0.0006675 BNB
- At $600/BNB = **$0.40**

### Worst Case (All 13 Iterations, No Match)
```
Base:              24,000 gas
Sponsor:           40,000 gas
Distribution:     147,000 gas
Root fallback:     21,000 gas
Activity:          30,000 gas
Admin fee:         21,000 gas
Other:             15,000 gas
-------------------------
Total:            298,000 gas
```

**Cost at 3 gwei:**
- 298,000 × 3 = 894,000 gwei = 0.000894 BNB
- At $600/BNB = **$0.54**

## Key Insight: Layer Depth Doesn't Matter!

**IMPORTANT:** The distribution search is LIMITED to 13 levels up from the user, regardless of how deep they are in the network.

**Example:**
```
Layer 100 user upgrades:
- Searches from Layer 100 → Layer 87 (max 13 up)
- Does NOT search all 100 layers
- Gas cost is CONSTANT regardless of depth

Layer 10 user upgrades:
- Searches from Layer 10 → Layer 0 or qualifies (max 13 up)
- SAME gas cost as Layer 100 user!
```

## Comparison: Layer 10 vs Layer 100

| Operation | Layer 10 | Layer 100 | Difference |
|-----------|----------|-----------|------------|
| Sponsor commission | 40k | 40k | ✅ Same |
| Distribution search | 92k | 92k | ✅ Same |
| Payment | 21k | 21k | ✅ Same |
| Activity | 30k | 30k | ✅ Same |
| **Total (avg)** | **222k** | **222k** | ✅ **SAME** |

**Why? Because:**
- Loop is LIMITED to maxIncomeLayer (13)
- Not scanning entire depth
- Same max iterations everywhere

## Registration is Different

**NOTE:** Registration gas DOES scale with depth due to _incTeamNum():

```solidity
function _incTeamNum(uint _user) private {
    uint _upline = userInfo[_user].upline;
    for(uint i=0; i<200; i++) {  // Up to 200!
        if(_upline == 0) break;
        userInfo[_upline].totalMatrixTeam++;
        _upline = userInfo[_upline].upline;
    }
}
```

**At Layer 100:**
- Loop runs 100 times (updates all uplines)
- 100 × 5,000 gas = 500,000 gas
- Registration total: ~2.5-3M gas

**But upgrades are constant! 🎯**

## Multi-Level Upgrade (3 levels)

**If user upgrades Levels 1-3 in one transaction:**

```
Best case:  177k × 3 = 531k gas   ($0.96)
Average:    222k × 3 = 667k gas   ($1.20)
Worst case: 298k × 3 = 894k gas   ($1.62)
```

## Summary

### Single Level Upgrade at Layer 100
- **Best:** 177k gas ($0.32)
- **Average:** 222k gas ($0.40)
- **Worst:** 298k gas ($0.54)

### Key Takeaways

✅ **Layer depth DOES NOT affect upgrade gas**
✅ **Commission distribution is constant (max 13 iterations)**
✅ **Average upgrade: ~$0.40 regardless of depth**
✅ **Very scalable for deep networks**

### Comparison with Registration

| Depth | Registration Gas | Upgrade Gas |
|-------|-----------------|-------------|
| Layer 10 | ~1.5M | 222k |
| Layer 50 | ~2.5M | 222k |
| Layer 100 | ~3M | 222k ✅ |
| Layer 200 | ~4M | 222k ✅ |

**Upgrades are 10x cheaper and scale perfectly!** 🚀
