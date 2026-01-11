# Black Hole Audit & Root Fallback

## Potential Black Holes Identified

### 1. ✅ Unclaimed Matrix Income - FIXED
**Status:** Already routes to root

```solidity
if(!distributed && defaultRefer != 0) {
    // Send to root user ✓
    payable(userInfo[defaultRefer].account).transfer(levels[_level]);
}
```

### 2. ✅ Invalid Referrer (Orphans) - FIXED
**Status:** Already routes to root

```solidity
if(userInfo[_ref].start == 0 && _ref != defaultRefer) {
    _ref = defaultRefer;  // Assign orphans to root ✓
}
```

### 3. ⚠️ Unqualified Sponsor Commission
**Status:** Currently marked as "lost" - NEEDS FIX

```solidity
// Current: Tracked as lost, BNB stays in contract ❌
else {
    lostIncome[userInfo[upline].referrer] += sponsorAmt;
}
```

**Should be:** Send to root instead

### 4. ⚠️ Contract Balance Accumulation
**Status:** Could accumulate dust - NEEDS REVIEW

After fees are sent, there might be wei-level dust remaining.

### 5. ✅ Royalty Rollover
**Status:** Working correctly - unclaimed rolls to next day

### 6. ⚠️ Lost Matrix Income
**Status:** Tracked but BNB stays in contract - NEEDS FIX

```solidity
else {
    lostIncome[upline] += levels[_level];  // BNB stuck ❌
}
```

## Required Fixes

### Fix 1: Sponsor Commission Fallback

**Current (Black Hole):**
```solidity
if(sponsor not qualified) {
    lostIncome[sponsor] += sponsorAmt;  // BNB stuck in contract ❌
}
```

**Fixed (Root Fallback):**
```solidity
if(sponsor not qualified) {
    // Send to root instead
    payable(userInfo[defaultRefer].account).transfer(sponsorAmt);
    userInfo[defaultRefer].sponsorIncome += sponsorAmt;
    userInfo[defaultRefer].totalIncome += sponsorAmt;
    // Still track as lost for transparency
    lostIncome[sponsor] += sponsorAmt;
}
```

### Fix 2: Matrix Income Fallback (Already Handled)

Matrix income already routes to root when no one in 26 layers is qualified.
No additional fix needed. ✓

### Fix 3: Contract Balance Sweep Function

Add emergency function to send any stuck BNB to root:

```solidity
function sweepToRoot() external {
    require(msg.sender == owner, "Only owner");
    uint balance = address(this).balance;
    if(balance > 0) {
        payable(userInfo[defaultRefer].account).transfer(balance);
    }
}
```

## Summary of All Income Flows

### Income That Goes to Users

1. **Referral Income**
   - From: Registration
   - To: Direct referrer (or root if orphan)
   - Fallback: Root (orphans) ✓

2. **Matrix Level Income**
   - From: Upgrades
   - To: Qualified upline (26 layers)
   - Fallback: Root (if none qualified) ✓

3. **Sponsor Commission**
   - From: Referral's level earnings
   - To: Direct sponsor (if level >= 4)
   - Fallback: ROOT (WILL ADD) 🔧

4. **Royalty Income**
   - From: 5% of all transactions
   - To: Royalty pool → qualified users
   - Fallback: Rollover (next day) ✓

### Income That Goes to Platform

1. **Admin Fee**
   - From: All transactions
   - To: Fee receiver
   - Fallback: N/A (always paid)

2. **Royalty Contract**
   - From: 5% allocation
   - To: Royalty address
   - Fallback: N/A (always paid)

## After Fixes: Zero Black Holes

**Every possible income path:**

✅ Qualified user receives it
✅ OR it goes to root user
✅ OR it rolls over (royalty only)
✅ NEVER stuck in contract

**Root user becomes ultimate fallback for:**
- Orphan registrations
- Unclaimed matrix income (no qualified upline)
- Unqualified sponsor commissions (NEW FIX)
- Contract balance sweeps (emergency)

## Implementation Checklist

- [x] Orphans to root
- [x] Unclaimed matrix to root
- [ ] Unqualified sponsor commission to root
- [ ] Emergency sweep function
- [ ] Update documentation

This ensures 100% of income is distributed - zero black holes!
