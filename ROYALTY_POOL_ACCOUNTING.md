# CRITICAL: Royalty Pool Accounting Issue ⚠️

## Issue Identified

**Problem:** Using entire contract balance instead of tracked pool
**Severity:** HIGH RISK
**Type:** Accounting vulnerability

### The Vulnerability

```solidity
// CURRENT (UNSAFE):
function distRoyalty(uint _royaltyLvl) external {
    uint _balance = address(royaltyAddr).balance;  // ❌ Uses ENTIRE balance
    uint _amt = _balance * royaltyPercent[_royaltyLvl] / 100;
    // Distributes based on total balance, not just royalty pool
}
```

## The Risks

### Risk 1: External Funds Drainage
```
Scenario:
1. Royalty contract receives 100 BNB from protocol
2. Someone accidentally sends 50 BNB to same address
3. Balance = 150 BNB
4. Distribution uses 150 BNB → distributes external funds!
5. Accidental sender loses money
```

### Risk 2: Contract Upgrade
```
Scenario:
1. Deploy new royalty logic contract
2. Reuse same address for different purpose
3. Old funds + new funds mixed
4. Distribution drains unrelated funds
```

### Risk 3: Multiple Sources
```
Scenario:
1. Royalty contract used for multiple protocols
2. Protocol A sends 100 BNB
3. Protocol B sends 50 BNB
4. Distribution: 150 BNB total
5. Users drain Protocol B's funds!
```

### Risk 4: Dust/Donations
```
Scenario:
1. Random user sends 1000 BNB as donation/mistake
2. Next distribution includes this
3. Early claimers get huge unexpected bonus
4. Later claimers get nothing
```

## Current Flow (Unsafe)

```
Registration/Upgrade:
  ↓
5% sent to royalty contract
  ↓
royalty contract balance = cumulative total
  ↓
distRoyalty() reads ENTIRE balance
  ↓
Distributes % of ENTIRE balance (includes everything!)
```

**Problem:** No tracking of what SHOULD be distributed vs what IS in contract

## The Fix: Tracked Pool

### Implementation

```solidity
contract RideBNB {
    // Track actual royalty pool per distribution
    mapping(uint => uint) public royaltyPool;
    
    // When funds come in
    function register(...) {
        uint royaltyAmt = (levels[0] * 5)/100;
        
        // Send to royalty contract
        royaltyAddr.send{value: royaltyAmt}(royaltyAmt);
        
        // Track in internal accounting
        for(uint i=0; i<royaltyLvl.length; i++) {
            uint tierAmt = (royaltyAmt * royaltyPercent[i])/100;
            royaltyPool[i] += tierAmt;  // ✅ Track what should be distributed
        }
    }
    
    // When distributing
    function distRoyalty(uint _royaltyLvl) external {
        // Use tracked pool, NOT contract balance
        uint _amt = royaltyPool[_royaltyLvl];  // ✅ Only what was accumulated
        
        require(_amt > 0, "No pool funds");
        
        // Calculate per-user amount
        // ... distribution logic ...
        
        // Clear the pool after distribution
        royaltyPool[_royaltyLvl] = 0;  // ✅ Reset for next period
    }
}
```

## Comparison

### Current (Unsafe)
```solidity
// Uses entire balance
uint _balance = address(royaltyAddr).balance;  // Could be ANYTHING
uint _amt = _balance * royaltyPercent[_royaltyLvl] / 100;
```

**Issues:**
- ❌ Includes external funds
- ❌ Includes donations
- ❌ Includes mistakes
- ❌ No accounting control

### Fixed (Safe)
```solidity
// Uses tracked pool
uint _amt = royaltyPool[_royaltyLvl];  // ONLY protocol funds

// Increment when receiving
royaltyPool[tier] += amount;

// Clear after distribution
royaltyPool[tier] = 0;
```

**Benefits:**
- ✅ Only distributes intended funds
- ✅ Protected from external deposits
- ✅ Accurate accounting
- ✅ Predictable amounts

## Complete Fix Implementation

### 1. Add State Variable
```solidity
mapping(uint => uint) public royaltyPool;  // Tracked pool per tier
```

### 2. Update Funding Logic
```solidity
function _setRefs(uint _userId, uint _level) private {
    // ... existing code ...
    
    // Calculate royalty amount for this registration
    uint royaltyAmt = (levels[_level] * 5) / 100;
    
    // Track in pools
    for(uint i=0; i<4; i++) {
        uint tierAmt = (royaltyAmt * royaltyPercent[i]) / 100;
        royaltyPool[i] += tierAmt;
    }
}
```

### 3. Update Distribution Logic
```solidity
function distRoyalty(uint _royaltyLvl) external {
    require((block.timestamp - startTime) / royaltyDistTime > royaltyDist[_royaltyLvl][0], "Not yet");
    
    // Use tracked pool instead of balance
    uint _amt = royaltyPool[_royaltyLvl];
    require(_amt > 0, "No pool funds");
    
    // Calculate users
    uint _index = royaltyUsersIndex[_royaltyLvl];
    uint _totalPending = pendingRoyaltyUsers[_royaltyLvl][0].length;
    uint _count = _totalPending - _index;
    require(_count > 0, "No users");
    
    // Send to royalty contract
    if(_amt > 0) royaltyAddr.send{value: _amt}(_amt);
    
    uint _amtPerUser = _amt / _count;
    
    // Distribute
    for(uint i=_index; i<_totalPending; i++) {
        uint _userId = pendingRoyaltyUsers[_royaltyLvl][0][i];
        if(userInfo[_userId].level >= royaltyLvl[_royaltyLvl]) {
            if(!royaltyUsersMoved[_userId][_royaltyLvl]) {
                royalty[_userId][_royaltyLvl] = _amtPerUser;
                royaltyActive[_userId][_royaltyLvl] = true;
                royaltyUsersMoved[_userId][_royaltyLvl] = true;
                royaltyUsers[_royaltyLvl]++;
            }
        }
    }
    
    // Clear pool after distribution
    royaltyPool[_royaltyLvl] = 0;
    
    royaltyUsersIndex[_royaltyLvl] = _totalPending;
    royaltyDist[_royaltyLvl][0]++;
}
```

### 4. Add View Function
```solidity
function getRoyaltyPool(uint _royaltyLvl) external view returns(uint) {
    return royaltyPool[_royaltyLvl];
}
```

## Benefits of Tracked Pool

✅ **Isolation:** Only protocol funds distributed
✅ **Protection:** External funds can't be drained
✅ **Accuracy:** Exact accounting of what should be distributed
✅ **Predictability:** Users know what to expect
✅ **Security:** No accounting exploits possible

## Edge Cases Handled

### Case 1: Accidental Transfer
```
Someone sends 100 BNB to royalty contract
→ Contract balance = pool + 100 BNB
→ Distribution uses royaltyPool (not balance)
→ 100 BNB stays in contract (safe)
→ Can be recovered by admin if needed
```

### Case 2: Contract Reuse
```
Upgrade to new royalty contract
→ Old pool amounts stay tracked
→ New distributions use new pool
→ No mixing of old/new funds
```

### Case 3: Multiple Protocols
```
If same contract used by multiple systems
→ Each has own tracking
→ No cross-contamination
→ Fair distribution per protocol
```

## Recommendation: IMPLEMENT IMMEDIATELY

**Priority:** HIGH
**Complexity:** Medium
**Impact:** Prevents fund drainage vulnerability

**Steps:**
1. Add `royaltyPool` mapping
2. Update `_setRefs()` to track contributions
3. Update `distRoyalty()` to use pool
4. Clear pool after each distribution
5. Add view function for transparency

## Alternative: Contract Balance Check

**If you don't want to change accounting:**

```solidity
function distRoyalty(uint _royaltyLvl) external {
    uint _balance = address(royaltyAddr).balance;
    
    // Safety: Cap distribution to expected maximum
    uint _maxExpected = lastDistAmount[_royaltyLvl] * 2;  // 2x safety margin
    if(_balance > _maxExpected) {
        _balance = _maxExpected;  // Don't use excess
    }
    
    uint _amt = _balance * royaltyPercent[_royaltyLvl] / 100;
    // ...
}
```

**But tracked pool is MUCH better!**

## Summary

✅ **Issue:** Using entire contract balance is unsafe
✅ **Risk:** External funds can be drained
✅ **Fix:** Track internal pool per tier
✅ **Impact:** Prevents accounting vulnerabilities

**Highly recommend implementing tracked pool approach!** 🔒
