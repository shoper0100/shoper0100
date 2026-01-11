# Binary Matrix Placement Logic - RideBNB

## Overview

The RideBNB contract uses an **automated binary matrix placement** system. Each user can have a maximum of 2 direct positions in their matrix (left and right).

## How It Works

### Key Concepts

1. **Binary Tree Structure**: Each node can have max 2 children (positions)
2. **26 Layers Deep**: Matrix can grow up to 26 levels
3. **Auto-Placement**: New users are automatically placed in the first available position
4. **Spillover**: When your referrer's positions are full, you "spill over" to someone in their downline

### Placement Algorithm

```
Step 1: Check if referrer has available positions (< 2)
        ↓
    YES → Place directly under referrer
        ↓
    NO → Search through referrer's matrix layers
         Find first person with available position
         Place under them
```

### Visual Example

**Scenario 1: Direct Placement**
```
User A (referrer) has 0 positions filled
    ├─ [Empty]
    └─ [Empty]

New User B joins with referrer A
    ↓
User A
    ├─ User B ✓ (placed in position 1)
    └─ [Empty]
```

**Scenario 2: Second Position**
```
User A
    ├─ User B
    └─ [Empty]

New User C joins with referrer A
    ↓
User A
    ├─ User B
    └─ User C ✓ (placed in position 2)
```

**Scenario 3: Spillover (Referrer Full)**
```
User A (Referrer)
    ├─ User B
    └─ User C

New User D joins with referrer A
    ↓
Algorithm searches layers:
Layer 0: [B, C] - Check if either has space
    ↓
User A
    ├─ User B
    │   ├─ User D ✓ (placed under B - first available)
    │   └─ [Empty]
    └─ User C
        ├─ [Empty]
        └─ [Empty]
```

### Code Implementation

```solidity
function _placeInMatrix(uint _user, uint _ref) private {
    bool isFound;
    uint upline;

    // Check if referrer has less than 2 direct positions
    if(matrixDirect[_ref] < 2) {
        userInfo[_user].upline = _ref;
        matrixDirect[_ref] += 1;
        upline = _ref;
    } 
    // Spillover: Search through layers
    else {
        for(uint i=0; i<maxLayers; i++) {  // maxLayers = 26
            if(isFound) break;
            
            // Check if this layer has space for more members
            if(teams[_ref][i+1].length < 2 ** (i+2)) {
                
                // Search through current layer members
                for(uint j=0; j<teams[_ref][i].length; j++) {
                    if(isFound) break;
                    
                    uint temp = teams[_ref][i][j];
                    
                    // Found someone with available position
                    if(matrixDirect[temp] < 2) {
                        userInfo[_user].upline = temp;
                        matrixDirect[temp] += 1;
                        upline = temp;
                        isFound = true;
                    }
                }
            }
        }
    }

    // Update matrix team counts for all uplines
    for(uint i=0; i<maxLayers; i++) {
        if(upline == 0 || upline == defaultRefer) break;
        userInfo[upline].totalMatrixTeam += 1;
        teams[upline][i].push(_user);
        upline = userInfo[upline].upline;
    }
}
```

## Placement Priority

1. **Direct under referrer** (if space available)
2. **Layer 0** (referrer's direct positions) - left to right
3. **Layer 1** (referrer's grandchildren) - left to right
4. **Layer 2** and so on...

## Example: Full Tree Growth

```
Layer 0:        User A (Root)
                /        \
Layer 1:    User B      User C
            /    \      /    \
Layer 2:   D    E      F     G
          / \  / \    / \   / \
Layer 3: H I J K L M N O P Q R S...
```

**Placement Order:**
1. User B → Direct under A (position 1)
2. User C → Direct under A (position 2)
3. User D → Under B (A is full, B has space)
4. User E → Under B (position 2)
5. User F → Under C (B is full)
6. User G → Under C (position 2)
7. User H → Under D (layer 1 full, check layer 2)
... and so on

## Key Features

### 1. Automatic Spillover
- **Benefits everyone**: Even if you don't recruit, you can get matrix members from spillover
- **Fair distribution**: Fills from top to bottom, left to right

### 2. Deep Network Effect
- **26 layers**: Can accommodate 2^26 - 1 = 67,108,863 users theoretically
- **Exponential growth**: Each layer doubles in size

### 3. Matrix Stats Tracking
- `matrixDirect[user]`: Number of direct positions (0-2)
- `totalMatrixTeam`: Total size of downline matrix
- `teams[user][layer]`: Array of user IDs at each layer

## Income Distribution

When someone in your matrix upgrades:

```
Layer 0 (Referrer): Receives income
Layer 1-25: Check qualification
    ↓
If qualified (level > upgraded level AND directTeam >= 2):
    → Receive income
Else:
    → Lost income (tracked)
```

## Matrix vs Direct Team

**Direct Team (Referrals)**
```
You
 ├─ Direct Referral 1
 ├─ Direct Referral 2
 ├─ Direct Referral 3
 └─ Direct Referral 4
```
- Unlimited direct referrals
- These are people who used YOUR referral link

**Matrix Team (Binary)**
```
You
 ├─ Matrix Position 1 (max 2 ONLY)
 │   ├─ Their Position 1
 │   └─ Their Position 2
 └─ Matrix Position 2
     ├─ Their Position 1
     └─ Their Position 2
```
- Max 2 direct matrix positions
- Includes spillover from upline

## Important Notes

1. **Referrer ≠ Upline**: Your referrer might not be your direct matrix upline due to spillover
2. **First User (ID 36999)**: Has no upline, is the root of the entire matrix
3. **Qualification Required**: Must have level > income level AND >= 2 direct referrals to earn from matrix

## Checking Placement

Use frontend to view:
- **Direct Team Tab**: See your direct referrals
- **Matrix Tab**: See your 2 direct matrix positions and layers below

## Summary

✅ **Auto-placement** - No manual positioning needed
✅ **Fair spillover** - Everyone benefits from team growth
✅ **Binary structure** - Max 2 positions per person
✅ **26 layers deep** - Massive scalability
✅ **Tracked income** - Know exactly where earnings come from

The placement logic ensures fair distribution and maximizes spillover benefits for all participants!
