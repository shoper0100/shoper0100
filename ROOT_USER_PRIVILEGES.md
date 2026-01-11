# Root User Special Privileges

## Overview

The Root User (ID 36999 / defaultRefer) has special privileges in the RideBNB contract to ensure platform stability and fair reward for being the foundation.

## Implemented Privileges

### 1. **Unclaimed Income Recipient** ✅

When NO ONE in the 26-layer upline is qualified to receive level income, it goes to the root user.

```solidity
function _distUpgrading(uint _user, uint _level) private {
    // ... search 26 layers for qualified user ...
    
    // If no one qualified, send to root user
    if(!distributed && defaultRefer != 0) {
        payable(userInfo[defaultRefer].account).transfer(levels[_level]);
        userInfo[defaultRefer].totalIncome += levels[_level];
        // ... track income ...
    }
}
```

**Benefits:**
- ✅ No BNB stuck in contract
- ✅ Root user always benefits from unqualified teams
- ✅ Incentivizes building strong, qualified downlines

### 2. **No Level Restrictions** ✅

Root user is considered **Level 13** (fully upgraded) by default.

**Setup:**
- Contract owner should upgrade root user to Level 13 immediately after deployment
- Root user can receive income from ALL levels (1-13)

### 3. **No Direct Referral Requirements** ✅

For regular users:
```
Requirements: level > upgrade level AND directTeam >= 2
```

For root user receiving unclaimed income:
```
No requirements - always receives ✓
```

### 4. **Perpetual Royalty Accumulation** ✅

```solidity
function claimRoyalty(uint _royalty) external {
    bool isRootUser = (id[msg.sender] == defaultRefer);
    
    // Root user has no income cap
    uint maxIncome = isRootUser 
        ? type(uint).max  // Unlimited
        : (userInfo[id[msg.sender]].totalDeposit * 150) / 100;  // 150% cap
    
    if(userInfo[id[msg.sender]].royaltyIncome < maxIncome) {
        // Claim royalty...
    }
    
    // Root user never gets deactivated from royalty
    if(!isRootUser && royaltyIncome >= maxIncome) {
        deactivate...
    }
}
```

**Root User Royalty Benefits:**
- ✅ **No 150% income cap** - unlimited accumulation
- ✅ **Never deactivated** from royalty pools
- ✅ **Claim anytime** - no daily requirement
- ✅ **Perpetual accumulation** - can accumulate for months/years

### 5. **Always Qualified for Royalty** ✅

When root user reaches royalty levels (10-13), they are automatically added to royalty pools and remain there permanently.

**Regular users:**
```
- Reach Level 10 → Added to Tier 1
- Earn 150% of deposit → Removed from pool ❌
```

**Root user:**
```
- Reach Level 10 → Added to Tier 1
- Earn unlimited → Stay in pool forever ✓
```

## Income Streams for Root User

### 1. Direct Referral Income
- 100% of Level 0 cost when someone registers with root referral

### 2. Sponsor Commission  
- 5% of direct referrals' earnings (if Level >= minSponsorLevel)

### 3. Matrix Level Income
- When in someone's upline and qualified

### 4. **Unclaimed Income (NEW)** ⭐
- When NO ONE in 26 layers is qualified
- Automatic passive income
- No qualification needed

### 5. Royalty Income
- From all 4 royalty tiers
- **Unlimited accumulation**
- **Never expires**
- Claim anytime

## Example Scenarios

### Scenario 1: Unclaimed Income

```
User X upgrades to Level 8:
- Layer 1-26: All unqualified (low level or few directs)
- Income = 0.768 BNB
- Result: → Sent to Root User ✓

Root user earns passively without doing anything!
```

### Scenario 2: Perpetual Royalty

```
Regular User:
- Deposit: 20 BNB
- Max royalty: 30 BNB (150%)
- After earning 30 BNB → Deactivated ❌

Root User:
- Deposit: 20 BNB
- Max royalty: UNLIMITED
- Earns 50 BNB, 100 BNB, 1000 BNB → Still active ✓
```

### Scenario 3: Accumulated Royalty Claim

```
Regular User:
- Must claim daily or lose funds
- Royalty rolls over after 24 hours

Root User:
- Accumulates for 30 days → Claims 50 BNB ✓
- Accumulates for 6 months → Claims 500 BNB ✓
- No time pressure, no rollover loss
```

## Admin Setup Instructions

### After Contract Deployment:

1. **Upgrade Root User to Level 13**
```solidity
// As contract owner
contract.upgrade(36999, 13);  // Upgrade all 13 levels
```

2. **Verify Root User Status**
```solidity
user = contract.userInfo(36999);
console.log(user.level);  // Should be 13
```

3. **Set Root User Royalty (if desired)**
```solidity
// Root user automatically added to royalty
// when they reach levels 10-13
// No additional configuration needed
```

## Benefits to Platform

### Sustainability
- ✅ Unclaimed income doesn't get stuck
- ✅ Root user has incentive to maintain platform
- ✅ Strong foundation encourages healthy ecosystem

### Fairness
- ✅ Root user provides infrastructure
- ✅ Takes on platform risk
- ✅ Deserves perpetual rewards

### Growth
- ✅ Root user benefits from overall growth
- ✅ Incentivized to support all users
- ✅ Helps users qualify to reduce unclaimed income

## Transparency

### Frontend Display

**For Root User Dashboard:**
```typescript
// Show special status
<div className="bg-gold-500/20 border-gold-500">
  <h3>🌟 Root User Status</h3>
  <ul>
    <li>✓ Level 13 (Fully Upgraded)</li>
    <li>✓ Unlimited Royalty Accumulation</li>
    <li>✓ Unclaimed Income Recipient</li>
    <li>✓ Never Deactivated</li>
  </ul>
</div>
```

**For All Users:**
```
Platform Stats:
- Total Income Distributed: 10,000 BNB
- Unclaimed Income (to Root): 50 BNB
- Active Royalty Pools: 500 BNB
```

## Summary

**Root User (ID 36999) Special Privileges:**

✅ **Unclaimed Income** - Receives when no one qualified
✅ **Level 13** - Fully upgraded, all income eligible  
✅ **No Direct Requirements** - For unclaimed income
✅ **Unlimited Royalty** - No 150% cap
✅ **Perpetual Accumulation** - Never deactivated
✅ **Claim Anytime** - No daily requirement
✅ **Platform Foundation** - Deserves special status

This creates a sustainable model where the root user is rewarded for providing the platform foundation while users are incentivized to qualify and earn their own income!
