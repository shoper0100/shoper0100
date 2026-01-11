# Sponsor Commission - 5% from Referral's Earnings

## Correct Implementation

Direct sponsors earn **5% from their referrals' EARNINGS** (level income), not from upgrade costs.

## How It Really Works

### The Flow

```
Step 1: You sponsor User A
Step 2: User A gets placed in matrix
Step 3: Someone in User A's downline upgrades
Step 4: User A earns 0.1 BNB (level income)
Step 5: YOU earn 5% of User A's earning = 0.005 BNB ✓
```

**Key Point:** You earn from what your referral EARNS, not what they pay!

## Example Scenario

### Scenario: Your Referral Earns from Downline

```
YOU (Sponsor)
    ↓ (direct referral)
User A (your referral)
    ↓ (in their matrix)
User B, C, D, E, F... (User A's downline)

User C upgrades → User A earns 0.024 BNB
    ↓
YOU earn 5% = 0.0012 BNB ✓
```

### Real Numbers

**User A earns from level income:**
- Layer 1 user upgrades: A earns 0.006 BNB → You earn 0.0003 BNB
- Layer 2 user upgrades: A earns 0.012 BNB → You earn 0.0006 BNB
- Layer 3 user upgrades: A earns 0.024 BNB → You earn 0.0012 BNB
- ...and so on

**If User A earns 1 BNB total from their downline:**
- YOU earn 5% = 0.05 BNB ✓

## Technical Implementation

```solidity
// When someone qualifies and earns level income
if(upline.qualified) {
    uint earned = levels[_level];  // e.g., 0.024 BNB
    
    // Pay the earner
    pay(upline, earned);
    
    // Pay 5% to their sponsor
    if(upline.hasReferrer) {
        uint sponsorAmt = earned * 5% // = 0.0012 BNB
        pay(upline.referrer, sponsorAmt);  ✓
    }
}
```

## Why This Is Powerful

### Passive Income from Team Success

```
Your 10 Direct Referrals Build Teams
    ↓
Each builds 100-person downline
    ↓
Each earns 10 BNB from their downline over time
    ↓
YOU earn 5% × 10 people × 10 BNB = 5 BNB ✓
```

### No Cap, Unlimited Growth

- More referrals = more earning potential
- Their success = your success
- Truly passive - happens automatically

## Income Breakdown

### Traditional Matrix Income
```
User upgrades in your matrix (26 layers)
    ↓
You earn 100% of level cost (if qualified)
```

### NEW: Sponsor Commission
```
Your direct referral earns from THEIR matrix
    ↓
You earn 5% of what THEY earned
```

## Comparison

| Your Referral Makes | Your 5% Commission |
|---------------------|-------------------|
| 0.1 BNB | 0.005 BNB |
| 1 BNB | 0.05 BNB |
| 10 BNB | 0.5 BNB |
| 100 BNB | 5 BNB |

## Multiple Income Streams

```
YOU
├─ Direct Registration: 100% of 0.004 BNB
├─ Sponsor Commission: 5% of referral's earnings ← NEW!
├─ Matrix Income: 100% from 26 layers below
└─ Royalty: Daily pool share
```

## Key Points

✅ **From Earnings, Not Costs**
- You earn 5% of what your referral EARNS
- NOT from what they pay to upgrade

✅ **Global Impact**
- Works anywhere your referral is placed
- No matrix limitation

✅ **Unlimited Potential**
- No cap on referrals
- No cap on their earnings
- Passive income scales

✅ **Win-Win**
- Help your team build
- They earn more = you  earn more
- True partnership

## Summary

**Old thinking:** "Commission from upgrade fees"
**Correct:** "Commission from referral's EARNINGS"

Your referral earns 1 BNB from their downline → You get 0.05 BNB!

This incentivizes helping your team succeed! 🎯
