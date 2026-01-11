# 💰 Royalty Distribution Explained (Step-by-Step)

## 🎯 Current System: 24-Hour Time-Based Fair Distribution

---

## 1. How Pools Get Funded

### Every Registration/Upgrade:
```
User pays $100
├─ 3% → Royalty Pool = $3
│   ├─ L10 Pool: $0.75 (25%)
│   ├─ L11 Pool: $0.75 (25%)
│   ├─ L12 Pool: $0.75 (25%)
│   └─ L13 Pool: $0.75 (25%)
└─ 97% → Main contract functions
```

**Code**:
```solidity
receive() external payable {
    uint perTier = msg.value / 4;  // Split 4 ways
    
    for each tier:
        poolBalance[tier] += perTier;
        roundPoolAmount[tier][currentRound] += perTier;  // Track per round!
}
```

---

## 2. User Registration Example

### Monday 10am - Round 1 Starts

**User A reaches Level 10**:
```
registerUser(userA, level=10, ...)
→ Registered in L10, Round 1
→ Added to Round 1 distribution queue
```

**User B reaches Level 11**:
```
registerUser(userB, level=11, ...)
→ Registered in L10, Round 1
→ Registered in L11, Round 1
→ Added to both Round 1 queues
```

**User C reaches Level 13** (Root):
```
Already registered in ALL tiers, Round 1
```

**Round 1 Status**:
- L10: 3 users (A, B, C)
- L11: 2 users (B, C)
- L12: 1 user (C)
- L13: 1 user (C)

---

## 3. Pool Accumulation (24 Hours)

### Throughout Monday (Round 1):

**10am**: $100 enters → +$0.75 per tier  
**2pm**: $200 enters → +$1.50 per tier  
**6pm**: $150 enters → +$1.125 per tier  
**10pm**: $50 enters → +$0.375 per tier

**Round 1 Totals at Monday 11:59pm**:
- L10 Pool: $3.75
- L11 Pool: $3.75
- L12 Pool: $3.75
- L13 Pool: $3.75

---

## 4. Round Advancement (Automatic)

### Tuesday 10am - 24 Hours Passed:

```solidity
if (block.timestamp >= lastRoundTime + 24 hours) {
    currentRound++;  // Round 1 → Round 2
    lastRoundTime = block.timestamp;
}
```

**Now**:
- Round 1: CLOSED (can claim)
- Round 2: OPEN (new registrations)

---

## 5. Distribution Calculation

### L10 Tier - Round 1:

**Pool**: $3.75  
**Users**: 3 (A, B, C)  
**Tier %**: 5% (L10)

```solidity
sharePercent = 5
usersInRound = 3
poolForRound = $3.75

userShare = (poolForRound * sharePercent) / (100 * usersInRound)
userShare = ($3.75 * 5) / (100 * 3)
userShare = $18.75 / 300
userShare = $0.0625 per user
```

**Each user (A, B, C) gets**: $0.0625 from L10 Round 1

**Total distributed**: $0.0625 × 3 = $0.1875  
**Remaining in pool**: $3.75 - $0.1875 = $3.5625 (for future rounds)

---

## 6. Multi-Tier Claims

### User B (Level 11) Claims on Tuesday:

**Eligible for**:
- L10, Round 1: $0.0625
- L11, Round 1: $0.1875 (2 users: B, C)

```
L11 calculation:
poolForRound = $3.75
sharePercent = 10
usersInRound = 2

userShare = ($3.75 * 10) / (100 * 2)
         = $37.5 / 200
         = $0.1875
```

**Total User B claims**: $0.0625 + $0.1875 = $0.25

---

## 7. Root User (Level 13) Claims

### Root can claim from ALL 4 tiers:

**Round 1 Claims**:
| Tier | Pool | Users | % | Root Share |
|------|------|-------|---|------------|
| L10  | $3.75 | 3 | 5%  | $0.0625 |
| L11  | $3.75 | 2 | 10% | $0.1875 |
| L12  | $3.75 | 1 | 15% | $0.5625 |
| L13  | $3.75 | 1 | 20% | $0.75 |

**Total Root Claims**: $1.5625

**Explanation**:
- L12: Only root registered → Gets (3.75 * 15) / 100 = $0.5625
- L13: Only root registered → Gets (3.75 * 20) / 100 = $0.75

---

## 8. Real-World Example (1 Week)

### Daily Activity:

**Monday** (Round 1):
- 10 registrations → $30 enters ($7.50 per tier)
- 5 users in L10
- Root claims nothing yet

**Tuesday** (Round 2):
- 15 registrations → $45 enters
- 3 new users join L10 (now 8 total)
- Root claims Round 1: Gets fair share

**Wednesday** (Round 3):
- 20 registrations → $60 enters
- Root claims Rounds 1-2

...continuing daily

**Sunday** (Round 7):
- Root claims Rounds 1-6 accumulated
- Total claimed: ~$50 across all tiers

---

## 9. Fair Distribution Guarantee

### Per-Round Tracking Ensures:

✅ **Round 1 pool** = Reserved for Round 1 users only  
✅ **Round 2 pool** = Reserved for Round 2 users only  
✅ **No drainage** = Early claimers can't steal from late users  
✅ **Equal shares** = All users in same round get same amount

**Example**:
```
Round 1: 5 users, $10 pool
  → Each gets: $10 * 5% / 5 = $0.10 ✅

Round 2: 10 users, $20 pool  
  → Each gets: $20 * 5% / 10 = $0.10 ✅

Fair for everyone!
```

---

## 10. Key Formulas

### Per-User Share:
```
userShare = (roundPool × tierPercent) / (100 × usersInRound)
```

### Tier Percentages:
- L10: 5% of pool
- L11: 10% of pool
- L12: 15% of pool
- L13: 20% of pool

### Minimum Claim:
- Must accumulate ≥ 0.001 BNB (~$0.90)
- If below → rolls over to next claim

---

## ✅ Summary

**Distribution is**:
- ⏰ Time-based (24-hour rounds)
- 👥 Fair to all users in same round
- 💰 Proportional to tier percentage
- 🔒 Per-round tracking prevents drainage
- 🎯 Simple and transparent

**Root user advantage**:
- First in ALL tiers
- Gets fair share like everyone else
- But claims from 4 tiers instead of 1
- Maximum earning potential!

**Result**: Fair, transparent, automatic distribution! ✅
