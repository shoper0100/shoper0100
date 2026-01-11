# Registration Logic - Complete Explanation

## Overview

Registration is the **entry point** to the RideBNB platform. Users must register once before they can upgrade levels, earn income, or participate in royalty pools.

## Registration Function

```solidity
function register(uint _ref, address _newAcc) external payable {
    bool isSuper;
    if(msg.sender == owner) isSuper = true;
    require(id[_newAcc] == 0, "Already Registered");
    require(userInfo[_ref].start > 0 || _ref == defaultRefer, "Invalid Referrer");

    uint newId = defaultRefer + ((totalUsers + 1) * 7); 
    id[_newAcc] = newId;
    User storage user = userInfo[newId];
    user.id = newId;

    uint _inAmt = levels[0] + ((levels[0] * percents[0]) / 100);
    if(!isSuper) require(msg.value == _inAmt, "invalid value");

    user.referrer = _ref;
    user.account = _newAcc;

    if(user.referrer != defaultRefer) {
        userInfo[user.referrer].directTeam += 1;
        directTeam[user.referrer].push(user.id);
        if(!isSuper) {
            payable(userInfo[user.referrer].account).transfer(levels[user.level]);
            incomeInfo[user.referrer].push(Income(user.id, 1, levels[user.level], block.timestamp, false));
            userInfo[user.referrer].totalIncome += levels[user.level];
            userInfo[user.referrer].referralIncome += levels[user.level];
            userInfo[user.referrer].income[user.level] += levels[user.level];
            dayIncome[user.referrer][getUserCurDay(user.referrer)] += levels[user.level];
        }
    } 

    globalUsers.push(user.id);
    if(totalUsers > 0 && user.referrer != defaultRefer) _placeInMatrixLimitless(user.id, user.referrer);
    user.start = block.timestamp;
    totalUsers += 1;

    user.level += 1;
    user.totalDeposit += levels[0];
    
    uint royaltyAmt = (levels[0] * 5)/100;
    for(uint i=0; i<royaltyLvl.length; i++) {
        if(!isSuper) royalty[getCurRoyaltyDay()][i] += (royaltyAmt * royaltyPercent[i])/100;
    }

    if(!isSuper) payable(address(royaltyAddr)).transfer(royaltyAmt);
    if(!isSuper) payable(feeReceiver).transfer(address(this).balance);

    activity.push(Activity(user.id, user.level));

    for(uint i=0; i<royaltyLvl.length; i++) {
        if(userInfo[_ref].level > lastLevel[_ref] && userInfo[_ref].level == royaltyLvl[i] && userInfo[_ref].directTeam == directRequired && userInfo[_ref].royaltyIncome < (userInfo[_ref].totalDeposit * royaltyMaxPercent)/(100) && !royaltyActive[_ref][i]) {
            pendingRoyaltyUsers[i][royaltyUsersIndex[i]].push(_ref);
            break;
        }
    }
}
```

## Step-by-Step Breakdown

### 1. **Validation Checks**

```solidity
require(id[_newAcc] == 0, "Already Registered");
require(userInfo[_ref].start > 0 || _ref == defaultRefer, "Invalid Referrer");
```

**Checks:**
- ✅ Address not already registered
- ✅ Referrer exists OR is default refer (36999)

**Example:**
```
Alice tries to register:
- Alice's address not in system ✓
- Referrer ID 37013 exists ✓
- Proceed with registration
```

### 2. **User ID Generation**

```solidity
uint newId = defaultRefer + ((totalUsers + 1) * 7);
```

**Formula:**
```
First user: 36999 + (1 * 7) = 37006
Second user: 36999 + (2 * 7) = 37013
Third user: 36999 + (3 * 7) = 37020
...
```

**Why +7?**
- Creates unique, sequential IDs
- Easy to track user order
- No ID collisions

### 3. **Payment Calculation**

```solidity
uint _inAmt = levels[0] + ((levels[0] * percents[0]) / 100);
```

**Breakdown:**
```
Level 0 Cost: 0.004 BNB
Admin Fee: 10% = 0.0004 BNB
Total Required: 0.0044 BNB
```

**Distribution:**
- Base cost → Goes to referrer
- Admin fee → Goes to fee receiver
- Royalty (5% of base) → Royalty pools

### 4. **Direct Referral Setup**

```solidity
user.referrer = _ref;
userInfo[user.referrer].directTeam += 1;
directTeam[user.referrer].push(user.id);
```

**Actions:**
- Set referrer relationship
- Increment referrer's direct team count
- Add to referrer's direct team list

**Example:**
```
User 37020 registers with referrer 37006:
- user[37020].referrer = 37006
- user[37006].directTeam = 2 (was 1)
- directTeam[37006] = [37013, 37020]
```

### 5. **Referral Payment**

```solidity
if(user.referrer != defaultRefer) {
    payable(userInfo[user.referrer].account).transfer(levels[user.level]);
    userInfo[user.referrer].totalIncome += levels[user.level];
    userInfo[user.referrer].referralIncome += levels[user.level];
}
```

**Payment:**
- **Amount**: 100% of Level 0 cost (0.004 BNB)
- **To**: Direct referrer
- **Instant**: Paid immediately

**Note:** If registering with defaultRefer (root), no referral payment (keeps in contract)

### 6. **Matrix Placement**

```solidity
if(totalUsers > 0 && user.referrer != defaultRefer) {
    _placeInMatrixLimitless(user.id, user.referrer);
}
```

**Process:**
- Search for available position in referrer's matrix
- Place in first available spot (max 2 per person)
- If referrer full, spillover to downline
- Limitless - always finds position

**Example:**
```
User registers with Referrer A:

Referrer A has 0 matrix positions:
  └─ Place directly under A ✓

Referrer A has 2 matrix positions (full):
  Referrer A
    ├─ User B
    │   ├─ [Empty] ← Place here ✓
    │   └─ [Empty]
    └─ User C (also full)
```

### 7. **User Initialization**

```solidity
user.start = block.timestamp;
user.level += 1;  // Now Level 1
user.totalDeposit += levels[0];
totalUsers += 1;
globalUsers.push(user.id);
```

**Sets:**
- Registration timestamp
- Initial level = 1
- Total deposit tracking
- Global user count
- Add to global users list

### 8. **Royalty Pool Funding**

```solidity
uint royaltyAmt = (levels[0] * 5)/100;  // 5% of 0.004 = 0.0002 BNB
for(uint i=0; i<royaltyLvl.length; i++) {
    royalty[getCurRoyaltyDay()][i] += (royaltyAmt * royaltyPercent[i])/100;
}
```

**Distribution:**
```
5% of 0.004 BNB = 0.0002 BNB total

Split:
Tier 1 (40%): 0.00008 BNB
Tier 2 (30%): 0.00006 BNB
Tier 3 (20%): 0.00004 BNB
Tier 4 (10%): 0.00002 BNB
```

### 9. **Admin Fee Collection**

```solidity
payable(feeReceiver).transfer(address(this).balance);
```

**Collects:**
- 10% admin fee = 0.0004 BNB
- Any remaining dust in contract

### 10. **Activity Logging**

```solidity
activity.push(Activity(user.id, user.level));
```

**Records:**
- User ID
- Current level (1 after registration)
- Visible on recent activity feed

### 11. **Referrer Royalty Check**

```solidity
// Check if referrer now qualifies for royalty
if(userInfo[_ref].level == royaltyLvl[i] && 
   userInfo[_ref].directTeam == directRequired) {
    pendingRoyaltyUsers[i][royaltyUsersIndex[i]].push(_ref);
}
```

**Checks if referrer:**
- Just reached required direct team count (e.g., 2)
- Is at a royalty level (10-13)
- Not already in royalty
→ Add to pending royalty users

## Complete Flow Example

### User Alice Registers

**Initial State:**
```
Alice: Not registered
Referrer Bob (ID 37006): Level 5, 1 direct
```

**Step 1: Alice calls register(37006, aliceAddress)**
```
Cost: 0.0044 BNB
```

**Step 2: Validation**
```
✓ Alice not registered
✓ Bob exists
✓ Payment = 0.0044 BNB
```

**Step 3: ID Generation**
```
totalUsers = 5
newId = 36999 + (6 * 7) = 37041
Alice's ID: 37041
```

**Step 4: Referral Payment**
```
Bob receives: 0.004 BNB (100% of base cost)
Bob's referralIncome: +0.004 BNB
Bob's totalIncome: +0.004 BNB
Bob's directTeam: 2 (was 1)
```

**Step 5: Matrix Placement**
```
Search Bob's matrix:
Bob has 1 matrix position
  ├─ User (existing)
  └─ [Empty] ← Alice placed here ✓
```

**Step 6: Royalty Funding**
```
5% of 0.004 = 0.0002 BNB
Tier 1: +0.00008 BNB
Tier 2: +0.00006 BNB
Tier 3: +0.00004 BNB
Tier 4: +0.00002 BNB
```

**Step 7: Admin Fee**
```
Fee receiver: +0.0004 BNB (10%)
```

**Step 8: Referrer Royalty Check**
```
Bob now has 2 directs!
Bob is Level 5 (not royalty level yet)
→ Not added to royalty (needs Level 10+)
```

**Final State:**
```
Alice: 
  - ID: 37041
  - Level: 1
  - Registered: ✓
  - Referrer: 37006 (Bob)
  - Matrix Upline: 37006 (Bob)

Bob:
  - Direct Team: 2
  - Direct Income: +0.004 BNB
  - Can now earn sponsor commission ✓
```

## Special Cases

### Case 1: Registering with Root (defaultRefer)

```solidity
if(user.referrer != defaultRefer) {
    // Pay referrer
} else {
    // Skip payment - no referrer to pay
}
```

**Flow:**
```
User registers with ID 36999:
- No referral payment made
- Not placed in matrix (root has no matrix)
- User becomes independent node
```

### Case 2: Owner/Super Registration

```solidity
if(msg.sender == owner) isSuper = true;
```

**Benefits:**
- No payment required
- Can register anyone
- Testing/admin purposes
- All other logic same

### Case 3: First Time Referrer Gets 2nd Direct

```solidity
// After registration, check referrer
if(userInfo[_ref].directTeam == directRequired) {
    // Referrer now qualifies for:
    // - Matrix income (if level qualified)
    // - Sponsor commission (if level >= minSponsorLevel)
}
```

## Income Distribution from Registration

```
User pays: 0.0044 BNB

Distribution:
1. Referrer: 0.004 BNB (90.9%) ✓
2. Royalty Pools: 0.0002 BNB (4.5%) ✓
3. Admin Fee: 0.0004 BNB (9.1%) ✓
4. Contract: 0 BNB (sent to royalty contract)

Total: 0.0044 BNB (100%)
```

## Post-Registration

**User Can Now:**
- ✅ Upgrade to higher levels
- ✅ Refer new users (earn 100% of L0)
- ✅ Earn from matrix (if qualified)
- ✅ Earn sponsor commission (if qualified)
- ✅ Work toward royalty tiers

**User Cannot (until qualified):**
- ❌ Earn matrix income (need level 2+ and 2 directs)
- ❌ Earn sponsor commission (need level 4+)
- ❌ Claim royalty (need level 10+ and 2 directs)

## Frontend Integration

### Check Registration Status

```typescript
const userId = await contract.id(userAddress);
const isRegistered = userId > 0;

if (!isRegistered) {
    // Show registration form
}
```

### Register Function

```typescript
const refId = 37006; // Referrer ID
const cost = await contract.levels(0); // 0.004 BNB
const adminFee = cost * 10n / 100n; // 0.0004 BNB
const total = cost + adminFee; // 0.0044 BNB

const tx = await contract.register(refId, userAddress, {
    value: total
});
await tx.wait();
```

### Get New User ID

```typescript
// After registration
const newUserId = await contract.id(userAddress);
console.log("Your ID:", newUserId.toString());
```

## Summary

**Registration Process:**

1. ✅ **Validate** - Check not registered, referrer valid
2. ✅ **Generate ID** - defaultRefer + (totalUsers * 7)
3. ✅ **Payment** - 0.0044 BNB (base + admin fee)
4. ✅ **Referral** - 100% base to referrer
5. ✅ **Matrix** - Place in limitless matrix
6. ✅ **Initialize** - Set level 1, timestamp, deposit
7. ✅ **Royalty** - Fund 4 tier pools (5% of base)
8. ✅ **Admin** - Collect 10% fee
9. ✅ **Activity** - Log registration
10. ✅ **Check** - Referrer royalty eligibility

**One-Time Cost:** 0.0044 BNB
**Entry Level:** Level 1
**Ready to**: Upgrade, refer, earn!

This is the gateway to the entire RideBNB ecosystem!
