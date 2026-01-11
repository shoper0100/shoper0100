# Lost Income Logic - RideBNB Contract

## Overview

Lost income is tracked when users are **eligible to receive income but don't meet qualification requirements**. This provides transparency and incentivizes users to upgrade.

## When Income is "Lost"

### 1. Matrix Level Income (Main Income Stream)

**Location:** `_distUpgrading()` function

```solidity
if(userInfo[upline].level > _level && userInfo[upline].directTeam >= directRequired) {
    // QUALIFIED: Pay the income ✓
    payable(userInfo[upline].account).transfer(levels[_level]);
    userInfo[upline].totalIncome += levels[_level];
    userInfo[upline].levelIncome += levels[_level];
    incomeInfo[upline].push(Income(_user, i+1, levels[_level], block.timestamp, false));
    break;
} else {
    // NOT QUALIFIED: Track as LOST ❌
    lostIncome[upline] += levels[_level];
    incomeInfo[upline].push(Income(_user, i+1, levels[_level], block.timestamp, true)); // isLost = true
}
```

**Qualification Requirements:**
- User's level must be **higher** than the level being upgraded to
- User must have **>= directRequired** direct referrals (default: 2)

**Example:**
```
User A (Level 3, 1 direct referral):
- Someone in their matrix upgrades to Level 2
- Required: Level > 2 (✓ User is Level 3) AND >= 2 directs (❌ User has only 1)
- Result: Income is LOST and tracked
```

### 2. Sponsor Commission (New Feature)

**Location:** `_distUpgrading()` function (sponsor commission section)

```solidity
if(userInfo[userInfo[upline].referrer].level >= minSponsorLevel) {
    // QUALIFIED: Pay 5% commission ✓
    uint sponsorAmt = (earned * sponsorCommission) / 100;
    payable(userInfo[userInfo[upline].referrer].account).transfer(sponsorAmt);
    userInfo[userInfo[upline].referrer].sponsorIncome += sponsorAmt;
    // ...
} else {
    // NOT QUALIFIED: Track as LOST ❌
    lostIncome[userInfo[upline].referrer] += sponsorAmt;
    incomeInfo[userInfo[upline].referrer].push(Income(upline, 0, sponsorAmt, block.timestamp, true));
}
```

**Qualification Requirements:**
- Sponsor's level must be **>= minSponsorLevel** (default: 4)

**Example:**
```
You sponsor User A (you are Level 2):
- User A earns 1 BNB from their matrix
- Your 5% commission = 0.05 BNB
- Required: Level >= 4 (❌ You are only Level 2)
- Result: 0.05 BNB commission is LOST and tracked
```

## How Lost Income is Tracked

### Storage

```solidity
mapping (uint => uint) public lostIncome;  // Total lost income per user
mapping (uint => Income[]) private incomeInfo;  // Detailed income history

struct Income {
    uint id;        // Source user ID
    uint layer;     // Layer in matrix (0 = sponsor commission)
    uint amount;    // Amount lost/earned
    uint time;      // Timestamp
    bool isLost;    // TRUE if lost, FALSE if earned
}
```

### Tracking Details

**For Matrix Income:**
- `layer` = position in matrix (1-26)
- `id` = user who triggered the income
- `isLost` = true

**For Sponsor Commission:**
- `layer` = 0 (indicates sponsor income)
- `id` = your direct referral who earned
- `isLost` = true

## Why Track Lost Income?

### 1. **Transparency**
- Users can see exactly how much they're missing
- Clear incentive to upgrade and meet requirements

### 2. **Motivation**
- Shows potential earnings
- Encourages users to:
  - Upgrade their level
  - Build their direct team
  - Stay active

### 3. **Analytics**
- Platform can track qualification rates
- Identify where users are losing out
- Help users optimize their strategy

## Viewing Lost Income

### On Frontend

**Dashboard:**
```typescript
const lostIncome = await contract.lostIncome(userId);
// Shows total lost amount
```

**Income Page:**
```typescript
const incomeHistory = await contract.getIncome(userId, 100);
const lostTransactions = incomeHistory.filter(item => item.isLost);
// Shows all lost income transactions with details
```

### Display Example

```
Income History:
----------------------------------------
✓ Earned: 0.024 BNB (Layer 5, User #12345)
❌ Lost: 0.012 BNB (Layer 3, User #12346) - Not Qualified
✓ Earned: 0.006 BNB (Layer 2, User #12347)
❌ Lost: 0.003 BNB (Sponsor, User #12348) - Level Too Low
```

## Lost Income Scenarios

### Scenario 1: Matrix Income Lost (Low Level)

```
You: Level 2, 3 direct referrals
Requirement: Level > upgrade level AND >= 2 directs

Someone upgrades to Level 3:
- Need: Level > 3 (❌ You're Level 2)
- Result: LOST ❌

Upgrade to Level 4:
- Now qualify for Level 3 upgrades ✓
- Start earning instead of losing!
```

### Scenario 2: Matrix Income Lost (Few Directs)

```
You: Level 10, 1 direct referral
Requirement: Level > upgrade level AND >= 2 directs

Someone upgrades to Level 5:
- Level check: ✓ (10 > 5)
- Direct check: ❌ (1 < 2)
- Result: LOST ❌

Get 1 more direct referral:
- Now have 2 directs ✓
- Start earning! ✓
```

### Scenario 3: Sponsor Commission Lost

```
You: Level 3, sponsor of User A
Min Required: Level 4

User A earns 1 BNB:
- Your 5% = 0.05 BNB
- Level check: ❌ (3 < 4)
- Result: LOST ❌

Upgrade to Level 4:
- Now qualified ✓
- Earn 5% on all future earnings! ✓
```

## Recovering from Lost Income

### Can't Recover Past Losses
❌ Lost income is **gone forever**
❌ Cannot claim retroactively after upgrading
✅ **BUT** future income will be earned once qualified

### How to Start Earning

**For Matrix Income:**
1. Upgrade your level (higher than income level)
2. Get minimum direct referrals (default: 2)

**For Sponsor Commission:**
1. Upgrade to minimum level (default: 4)

### Example Recovery

```
Month 1 (Level 2, 1 direct):
- Lost 10 BNB in matrix income ❌
- Lost 2 BNB in sponsor commission ❌

You upgrade to Level 5 and get 2 directs:

Month 2 (Level 5, 2 directs):
- Earn 15 BNB in matrix income ✓
- Earn 3 BNB in sponsor commission ✓

Lost income from Month 1 stays lost,
but NOW you're earning instead of losing!
```

## Admin Configuration

Lost income tracking is automatic, but admin can adjust qualification requirements:

```solidity
// Adjust direct required (affects matrix income)
setDirectRequired(3);  // Now need 3 directs instead of 2

// Adjust min sponsor level (affects sponsor commission)
setMinSponsorLevel(5);  // Now need Level 5 instead of 4
```

## Summary

**Matrix Income Lost When:**
- Your level <= upgrade level, OR
- Your direct referrals < directRequired

**Sponsor Commission Lost When:**
- Your level < minSponsorLevel

**Key Points:**
✅ All lost income is tracked transparently
✅ Shows in income history with `isLost = true`
✅ Provides clear incentive to qualify
✅ Once qualified, start earning immediately
❌ Past lost income cannot be recovered
✅ Future income will be earned when qualified

**Pro Tip:** Monitor your lost income regularly and upgrade strategically to start capturing that income!
