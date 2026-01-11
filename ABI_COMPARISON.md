# Original Contract ABI - Useful Functions Extracted

## Core Functions from Original ABI

### Write Functions (User Actions)
1. ✅ `register(uint _ref, address _newAcc)` - payable
2. ✅ `upgrade(uint _id, uint _lvls)` - payable
3. ✅ `claimRoyalty(uint _royalty)`
4. ✅ `movePendingRoayltyUsers(uint _royalty)`

### Admin Functions
5. ✅ `setAddr(address _new, uint _type, uint _num)`
6. ✅ `transferOwnershipToZeroAddress()`
7. ✅ `stackData(uint _startIndex, uint _endIndex)` - Migration function

### View Functions - User Data
8. ✅ `userInfo(uint)` - Returns 13 fields
9. ✅ `getUserCurDay(uint _id)`
10. ✅ `getLevelIncome(uint _id)` - Returns uint[13]
11. ✅ `getDirectTeamUsers(uint _user, uint _num)` - Returns User[]
12. ✅ `getMatrixUsers(uint _user, uint _layer, uint _startIndex, uint _num)` - Returns User[]
13. ✅ `getMatrixDirect(uint _user)` - Returns uint[2]

### View Functions - Income Data
14. ✅ `getIncome(uint _user, uint _length)` - Returns Income[]
15. ✅ `dayIncome(uint, uint)` - Daily income mapping
16. ✅ `lostIncome(uint)` - Lost income per user

### View Functions - System Data
17. ✅ `getLevels()` - Returns (uint[13], uint[13]) costs & percents
18. ✅ `getRecentActivities(uint _num)` - Returns Activity[]
19. ✅ `globalUsers(uint)` - Access global users array
20. ✅ `totalUsers()` - Total user count
21. ✅ `startTime()` - Contract start time
22. ✅ `id(address)` - Address to ID mapping

### View Functions - Royalty Data
23. ✅ `isRoyaltyAvl(uint _user, uint _royalty)` - Check eligibility
24. ✅ `getPendingRoyaltyUsers(uint _roaylty)` - Returns uint[]
25. ✅ `getRoyaltyTime()` - Next distribution time
26. ✅ `getCurRoyaltyDay()` - Current royalty day
27. ✅ `royalty(uint, uint)` - Royalty amounts
28. ✅ `royaltyUsers(uint)` - User count per tier
29. ✅ `royaltyActive(uint, uint)` - Active status
30. ✅ `royaltyTaken(uint, uint)` - Claimed status

### Direct Team Functions
31. ✅ `directTeam(uint, uint)` - Direct team members

## Functions We Need to Add

Comparing with our contract, we're MISSING these useful functions:

### 1. getUserCurDay
```solidity
function getUserCurDay(uint _id) public view returns(uint) {
    return (block.timestamp - userInfo[_id].start) / (24 hours);
}
```

### 2. getMatrixDirect
```solidity
function getMatrixDirect(uint _user) external view returns(uint[2] memory _directs) {
    for(uint i=0; i<teams[_user][0].length; i++) {
        _directs[i] = teams[_user][0][i];
    }
}
```

### 3. getDirectTeamUsers
```solidity
function getDirectTeamUsers(uint _user, uint _num) external view returns(User[] memory) {
    // Returns paginated direct team with full user data
}
```

### 4. getMatrixUsers
```solidity
function getMatrixUsers(uint _user, uint _layer, uint _startIndex, uint _num) 
    external view returns(User[] memory) {
    // Returns paginated matrix team with full user data
}
```

### 5. getIncome
```solidity
function getIncome(uint _user, uint _length) external view returns(Income[] memory) {
    // Returns recent income history (reverse chronological)
}
```

### 6. getRecentActivities
```solidity
function getRecentActivities(uint _num) external view returns(Activity[] memory) {
    // Returns recent upgrade activities
}
```

### 7. getLevels
```solidity
function getLevels() external view returns(uint[13] memory, uint[13] memory) {
    return (levels, percents);
}
```

### 8. isRoyaltyAvl
```solidity
function isRoyaltyAvl(uint _user, uint _royalty) public view returns(bool) {
    // Check if user can claim royalty
}
```

### 9. getRoyaltyTime
```solidity
function getRoyaltyTime() external view returns(uint) {
    return startTime + (royaltyDistTime * (getCurRoyaltyDay() + 1));
}
```

### 10. getCurRoyaltyDay
```solidity
function getCurRoyaltyDay() public view returns(uint) {
    return (block.timestamp - startTime) / (royaltyDistTime);
}
```

## Functions We Already Have (Good!)

✅ getUserData - Our enhanced version
✅ getUserLevelIncomes - Same as getLevelIncome
✅ getDirectTeam - Returns IDs only
✅ getContractConfig - Enhanced version
✅ getAllLevelCosts - Part of our system
✅ getAllLevelPercents - Part of our system

## Recommendation

**ADD these 10 functions for full compatibility:**
1. getUserCurDay
2. getMatrixDirect
3. getDirectTeamUsers (with User[] return)
4. getMatrixUsers (paginated)
5. getIncome (income history)
6. getRecentActivities
7. getLevels (combined getter)
8. isRoyaltyAvl
9. getRoyaltyTime
10. getCurRoyaltyDay

These will make our contract 100% compatible with any existing frontend!
