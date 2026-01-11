# Royalty System Logic - Complete Explanation

## Overview

The royalty system is a **daily pool distribution mechanism** where qualified high-level users share in a pool funded by 5% of all registration and upgrade costs.

## Funding the Royalty Pool

### Source: 5% of All Transactions

```solidity
// On registration
uint royaltyAmt = (levels[0] * 5)/100;  // 5% of 0.004 BNB
for(uint i=0; i<royaltyLvl.length; i++) {
    royalty[getCurRoyaltyDay()][i] += (royaltyAmt * royaltyPercent[i])/100;
}

// On upgrade
uint royaltyAmt = (totalAmount * 5)/100;  // 5% of upgrade cost
for(uint i=0; i<royaltyLvl.length; i++) {
    royalty[getCurRoyaltyDay()][i] += (royaltyAmt * royaltyPercent[i])/100;
}
```

**Example:**
```
User upgrades Level 1→5:
Total cost: 0.186 BNB
Royalty: 5% = 0.0093 BNB

Split across 4 tiers:
Tier 1 (40%): 0.00372 BNB
Tier 2 (30%): 0.00279 BNB
Tier 3 (20%): 0.00186 BNB
Tier 4 (10%): 0.00093 BNB
```

## Four Royalty Tiers

### Configuration

```solidity
uint[4] private royaltyPercent = [40, 30, 20, 10];  // Distribution %
uint[4] private royaltyLvl = [10, 11, 12, 13];      // Required levels
```

**Tier Breakdown:**

| Tier | Level Required | Share | Description |
|------|----------------|-------|-------------|
| 1    | Level 10       | 40%   | Most accessible |
| 2    | Level 11       | 30%   | Medium tier |
| 3    | Level 12       | 20%   | High tier |
| 4    | Level 13       | 10%   | Elite tier |

### Exclusive Tiers

**Important:** Users can only be in **ONE tier at a time** - the **highest** tier they qualify for.

```solidity
// When user moves to higher tier
if(_royalty > 0) {
    for(uint j=0; j<royaltyPercent.length; j++) {
        if(royaltyActive[_users[i]][j] && j != _royalty) {
            royaltyUsers[j] -= 1;  // Remove from lower tier
            royaltyActive[_users[i]][j] = false;
        }
    }
}
```

**Example:**
```
User reaches Level 10:
- Added to Tier 1 (40%) ✓

User upgrades to Level 12:
- Removed from Tier 1 ❌
- Added to Tier 3 (20%) ✓
- Gets smaller % but from bigger pool
```

## Daily Distribution Cycle

### Time-Based Pools

```solidity
uint private constant royaltyDistTime = 24 hours;

function getCurRoyaltyDay() public view returns(uint) {
    return (block.timestamp - startTime) / (royaltyDistTime);
}
```

**Timeline:**
```
Day 0 (0-24h): Accumulation
Day 1 (24-48h): Accumulation + Day 0 claimable
Day 2 (48-72h): Accumulation + Day 1 claimable
...
```

### Pool Structure

```solidity
mapping(uint => mapping (uint => uint)) public royalty;
// royalty[day][tier] = amount

// Example:
royalty[5][0] = 10 BNB  // Day 5, Tier 1 pool
royalty[5][1] = 7.5 BNB // Day 5, Tier 2 pool
```

## Eligibility Requirements

### To Join Royalty

1. **Level Requirement**
   - Must reach required level (10, 11, 12, or 13)

2. **Direct Team Requirement**
   - Must have >= 2 direct referrals (directRequired)

3. **Income Cap (Regular Users)**
   - Can earn up to 150% of total deposit
   - Example: Deposited 10 BNB → Max royalty 15 BNB

4. **Special: Root User**
   - Unlimited royalty income ✓
   - Never deactivated ✓

### Checking Eligibility

```solidity
function isRoyaltyAvl(uint _user, uint _royalty) public view returns(bool) {
    if(!royaltyTaken[getCurRoyaltyDay()][_user] &&  // Not claimed today
       userInfo[_user].level == royaltyLvl[_royalty] &&  // Correct level
       userInfo[_user].directTeam >= directRequired &&  // Enough directs
       royaltyActive[_user][_royalty]) {  // Active in tier
        return true;
    }
    return false;
}
```

## Joining the Royalty Pool

### Pending Users System

```solidity
mapping (uint => mapping(uint => uint[])) private pendingRoyaltyUsers;
mapping (uint => uint) private royaltyUsersIndex;

// When user qualifies (during upgrade or registration)
if(user.level == royaltyLvl[j] && user.directTeam >= directRequired) {
    pendingRoyaltyUsers[j][royaltyUsersIndex[j]].push(user.id);
}
```

### Moving Pending to Active

```solidity
function movePendingRoayltyUsers(uint _royalty) public {
    uint[] memory _users = getPendingRoyaltyUsers(_royalty);
    
    for(uint i=0; i<_users.length; i++) {
        if(userInfo[_users[i]].level == royaltyLvl[_royalty]) {
            royaltyActive[_users[i]][_royalty] = true;  // Activate
            royaltyUsers[_royalty] += 1;  // Increment count
        }
    }
    
    royaltyUsersIndex[_royalty] += 1;  // Move to next batch
}
```

**Process:**
```
1. User upgrades to Level 10
2. Added to pendingRoyaltyUsers[0][currentIndex]
3. First claim of the day triggers movePendingRoayltyUsers()
4. User moved from pending → active
5. Can now claim royalty
```

## Claiming Royalty

### Claim Function

```solidity
function claimRoyalty(uint _royalty) external {
    // Move pending users if not done today
    if(!roayltyUsersMoved[_royalty][getCurRoyaltyDay()]) {
        movePendingRoayltyUsers(_royalty);
    }
    
    // Check if eligible
    bool isAvl = isRoyaltyAvl(id[msg.sender], _royalty);
    if(isAvl) {
        // Check income cap
        bool isRootUser = (id[msg.sender] == defaultRefer);
        uint maxIncome = isRootUser ? type(uint).max : (userInfo[id[msg.sender]].totalDeposit * 150) / 100;
        
        if(userInfo[id[msg.sender]].royaltyIncome < maxIncome) {
            // Calculate share
            uint toDist = royalty[getCurRoyaltyDay() - 1][_royalty] / royaltyUsers[_royalty];
            
            if(toDist > 0) {
                // Pay user
                royaltyAddr.send(toDist);
                payable(userInfo[id[msg.sender]].account).transfer(toDist);
                
                // Track
                userInfo[id[msg.sender]].royaltyIncome += toDist;
                userInfo[id[msg.sender]].totalIncome += toDist;
                royaltyTaken[getCurRoyaltyDay()][id[msg.sender]] = true;
            }
        }
        
        // Deactivate if cap reached (unless root user)
        if(!isRootUser && royaltyIncome >= maxIncome) {
            royaltyUsers[_royalty] -= 1;
            royaltyActive[id[msg.sender]][_royalty] = false;
        }
    }
}
```

### Distribution Formula

```
Your Share = Pool Amount / Number of Active Users

Example:
Tier 1 Pool (Day 5): 100 BNB
Active Tier 1 Users: 500
Your Share: 100 / 500 = 0.2 BNB
```

## Rollover Mechanism

### Unclaimed Funds Roll Forward

```solidity
// When moving pending users
if(getCurRoyaltyDay() >= 2) {
    royalty[getCurRoyaltyDay() - 1][_royalty] += 
        (royalty[getCurRoyaltyDay() - 2][_royalty] > royaltyDist[getCurRoyaltyDay() - 2][_royalty] 
            ? royalty[getCurRoyaltyDay() - 2][_royalty] - royaltyDist[getCurRoyaltyDay() - 2][_royalty] 
            : 0);
}
```

**How It Works:**
```
Day 1 Pool: 100 BNB
Day 1 Claimed: 80 BNB
Day 1 Unclaimed: 20 BNB

Day 2 Pool: 100 BNB (new) + 20 BNB (rollover) = 120 BNB
```

**Benefits:**
- ✅ Unclaimed funds aren't lost
- ✅ Increases future pool sizes
- ✅ Rewards active claimers

## Complete Example Flow

### Day 1: User Qualifies

```
User A upgrades to Level 10:
1. Reaches royalty level ✓
2. Has 3 direct referrals (>= 2) ✓
3. Added to pendingRoyaltyUsers[0][0] (Tier 1)
4. Status: PENDING
```

### Day 2: First Claim Triggers Activation

```
Someone calls movePendingRoayltyUsers(0):
1. User A moved from pending → active
2. royaltyActive[userA][0] = true
3. royaltyUsers[0] += 1 (now 50 users in Tier 1)
4. Status: ACTIVE

User A calls claimRoyalty(0):
1. Eligible check: ✓
2. Pool: royalty[1][0] = 50 BNB (yesterday's pool)
3. Share: 50 / 50 = 1 BNB
4. User receives 1 BNB ✓
5. royaltyTaken[2][userA] = true (claimed for Day 2)
```

### Day 3: Regular Claim

```
User A calls claimRoyalty(0):
1. Already active ✓
2. Not claimed today ✓
3. Pool: royalty[2][0] = 75 BNB
4. Users: 50
5. Share: 75 / 50 = 1.5 BNB
6. User receives 1.5 BNB ✓
```

### Later: User Reaches Cap

```
User A total royalty: 14.8 BNB
User A deposit: 10 BNB
Cap: 10 * 150% = 15 BNB

Next claim: 0.5 BNB
Total would be: 15.3 BNB > 15 BNB cap

Result:
- User receives 0.2 BNB (to reach exactly 15 BNB)
- royaltyActive[userA][0] = false
- royaltyUsers[0] -= 1
- User DEACTIVATED from royalty ❌
```

## Special Scenarios

### Scenario 1: Multiple Tiers

```
100 users in Tier 1 (Level 10)
50 users in Tier 2 (Level 11)
20 users in Tier 3 (Level 12)
5 users in Tier 4 (Level 13)

Total royalty collected today: 10 BNB

Distribution:
Tier 1: 10 * 40% = 4 BNB / 100 = 0.04 BNB per user
Tier 2: 10 * 30% = 3 BNB / 50 = 0.06 BNB per user  
Tier 3: 10 * 20% = 2 BNB / 20 = 0.1 BNB per user
Tier 4: 10 * 10% = 1 BNB / 5 = 0.2 BNB per user

Higher tier = bigger share per user ✓
```

### Scenario 2: Root User Unlimited

```
Root User (ID 36999):
- Deposit: 20 BNB
- Regular cap: 30 BNB (150%)
- Actual cap: UNLIMITED

Royalty earned:
Month 1: 50 BNB → Still active ✓
Month 6: 500 BNB → Still active ✓
Year 1: 5000 BNB → Still active ✓

Regular users deactivated at 150%
Root user NEVER deactivated ✓
```

### Scenario 3: Tier Upgrade

```
User at Level 10 (Tier 1):
- Active in Tier 1 ✓
- Earning 40% share

User upgrades to Level 13 (Tier 4):
- Removed from Tier 1 ❌
- Added to Tier 4 ✓  
- Now earning 10% share
- But fewer users in Tier 4 = bigger individual share
```

## Admin Configuration

### Adjustable Parameters

```solidity
// Change tier percentages
setRoyaltyPercents([40, 30, 20, 10]);  // Must total 100%

// Change tier levels
setRoyaltyLevels([10, 11, 12, 13]);  // Must be ascending
```

### View Functions

```solidity
getRoyaltyPercents() → [40, 30, 20, 10]
getRoyaltyLevels() → [10, 11, 12, 13]
```

## Frontend Integration

### Check Royalty Status

```typescript
const isEligible = await contract.isRoyaltyAvl(userId, tier);
const isActive = await contract.royaltyActive(userId, tier);
const poolAmount = await contract.royalty(day, tier);
const userCount = await contract.royaltyUsers(tier);
```

### Calculate Potential Earnings

```typescript
const yourShare = poolAmount / userCount;
const maxCap = userDeposit * 1.5; // 150%
const remainingCap = maxCap - currentRoyaltyIncome;
const canClaim = Math.min(yourShare, remainingCap);
```

## Summary

**Royalty System Components:**

✅ **Funding**: 5% of all transactions
✅ **4 Tiers**: Levels 10-13 with 40/30/20/10% split
✅ **Daily Pools**: 24-hour accumulation cycles
✅ **Eligibility**: Level + 2 directs + active status
✅ **Claiming**: Daily share = pool / active users
✅ **Rollover**: Unclaimed funds → next day
✅ **Cap**: 150% of deposit (unlimited for root)
✅ **Exclusive**: One tier per user (highest level)

**Key Benefits:**
- Passive daily income for qualified users
- Higher levels = exclusive smaller pools = bigger shares
- Rollover prevents fund loss
- Root user has unlimited accumulation

This creates a sustainable reward system for high-level, active participants!
