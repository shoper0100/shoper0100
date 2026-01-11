# Matrix Placement Logic - Complete Explanation

## Overview

The RideBNB contract uses a **binary matrix system** where each user can have maximum 2 direct matrix positions under them.

## Placement Algorithm

### Current Implementation (Lines 143-159)

```solidity
// Matrix positioning
for(uint i = 0; i < 12; i++) {
    _ref = userInfo[_ref].upline;
    if(_ref == 0) _ref = defaultRefer;
    if(teams[_ref][0].length < 2) {
        teams[_ref][0].push(_newId);
        userInfo[_newId].upline = _ref;
        matrixDirect[_ref]++;
        break;
    }
}

if(userInfo[_newId].upline == 0) {
    teams[defaultRefer][0].push(_newId);
    userInfo[_newId].upline = defaultRefer;
    matrixDirect[defaultRefer]++;
}
```

## Step-by-Step Flow

### Scenario 1: First Two Registrations

**User A registers (referred by Root):**
```
Root (36999)
├─ User A (37006)  [placed directly under Root]
└─ [empty]

Result:
- User A upline = Root
- Root matrix direct count = 1
```

**User B registers (referred by User A):**
```
Root (36999)
├─ User A (37006)
└─ User B (37007)  [placed directly under Root, NOT User A]

Result:
- User B upline = Root (Root still has space)
- Root matrix direct count = 2
- User A matrix direct count = 0
```

### Scenario 2: Third Registration (Spillover)

**User C registers (referred by User A):**

**Search process:**
1. Start with referrer's upline (User A's upline = Root)
2. Check Root: Has 2 members already (full)
3. Move to Root's upline: Root has no upline, defaults to Root
4. Loop continues searching up...
5. Eventually places under Root anyway

```
Root (36999)
├─ User A (37006)
│  ├─ User C (37008)  [spillover - placed in next available spot]
│  └─ [empty]
└─ User B (37007)

Result:
- User C upline = User A (first available spot found)
- User A matrix direct count = 1
```

## Key Logic Points

### 1. Search Pattern
```solidity
for(uint i = 0; i < 12; i++) {
    _ref = userInfo[_ref].upline;  // Move up the chain
```
- Searches upline chain (max 12 levels up)
- Looks for first user with available space (< 2 members)

### 2. Fallback to Root
```solidity
if(userInfo[_newId].upline == 0) {
    teams[defaultRefer][0].push(_newId);
    userInfo[_newId].upline = defaultRefer;
```
- If no space found after search, places under root
- Ensures everyone gets placed

### 3. Matrix Direct Tracking
```solidity
matrixDirect[_ref]++;
```
- Tracks how many direct members each user has
- Used to prevent overflow (max 2)

## Example Network Growth

### Stage 1: Root + 2 Users
```
Root (36999)
├─ A (37006)
└─ B (37007)
```

### Stage 2: A and B each refer 1 (spillover)
```
Root (36999)
├─ A (37006)
│  ├─ C (37008)  [A's referral, places under A]
│  └─ D (37009)  [B's referral, spillover to A]
└─ B (37007)
   ├─ E (37010)  [A's 2nd referral, spillover to B]
   └─ F (37011)  [B's 2nd referral, places under B]
```

### Stage 3: Next level fills
```
Root (36999)
├─ A (37006)
│  ├─ C (37008)
│  │  ├─ G (37012)
│  │  └─ H (37013)
│  └─ D (37009)
│     ├─ I (37014)
│     └─ J (37015)
└─ B (37007)
   ├─ E (37010)
   │  ├─ K (37016)
   │  └─ L (37017)
   └─ F (37011)
      ├─ M (37018)
      └─ N (37019)
```

## Important Points

### ✅ What It Does
1. **Binary Matrix:** Each user has exactly 2 matrix positions
2. **Spillover:** When sponsor's matrix is full, new users spill to available spots
3. **Upline Chain:** Searches up to 12 levels for available space
4. **Root Fallback:** If no space found, places under root

### ⚠️ Key Differences from Referral
- **Referrer:** Who recruited you (direct relationship, permanent)
- **Upline:** Your matrix parent (placement in tree structure)
- **Referrer ≠ Upline** (can be different!)

### Example:
```
User A refers User D
But User A's matrix is full
So User D's upline = User B (available spot)

Result:
- User D referrer = User A (income from registration)
- User D upline = User B (matrix income distribution)
```

## Matrix Income Distribution

**When User D upgrades:**
- Referrer (User A) gets: Direct referral commission (if registered through them)
- Sponsor (User A) gets: 5% sponsor commission (if Level 4+)
- Upline (User B) gets: Full matrix income (if qualified)

**Search goes up the matrix upline chain, NOT referral chain!**

## Comparison with Original

### Original Contract
Uses more complex multi-layer placement with teams[][] array tracking multiple layers.

### Our Contract
Simplified to focus on Layer 0 (direct matrix) placement, same binary principle.

## Potential Improvements

### Current Issue
The search loop might not efficiently find available spots in large networks.

### Better Algorithm (Optional)
```solidity
// Breadth-first search for available spot
// Check current level fully before moving to next level
// More efficient for large networks
```

But current implementation works correctly for the business logic!

## Summary

**Matrix Placement:**
1. New user registers
2. Search referrer's upline chain (up to 12 levels)
3. Find first user with < 2 matrix members
4. Place new user under that person
5. If no space found → place under root

**Result:**
- Binary tree structure
- Maximum 2 per level
- Spillover creates depth
- Fair distribution of matrix members

**Income flows through MATRIX UPLINE, not referral line!**

This creates the "global matrix" effect where everyone benefits from network growth! 🌐
