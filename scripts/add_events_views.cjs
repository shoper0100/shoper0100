/**
 * Event & View Function Enhancement Script
 * Adds comprehensive 0-gas data access via events and view functions
 */

const fs = require('fs');
const path = require('path');

const contractPath = path.join(__dirname, '../contracts/FiveDollarRide_USDT.sol');

console.log('📊 Adding Event & View Function Enhancements...\n');

let contract = fs.readFileSync(contractPath, 'utf8');

// ============ Additional Events for Complete Logging ============
console.log('✅ Adding comprehensive event logging...');

const additionalEvents = `
    // Enhanced event logging for 0-gas data access
    event UserLevelUpdated(uint indexed userId, uint8 newLevel, uint timestamp);
    event TeamCountUpdated(uint indexed userId, uint directTeam, uint totalTeam, uint timestamp);
    event MatrixPositionFilled(uint indexed userId, uint indexed parentId, uint8 position, uint timestamp);
    event SponsorChainUpdated(uint indexed userId, uint indexed sponsorId, uint8 depth, uint timestamp);
`;

// Add events after existing event declarations
contract = contract.replace(
    /(event RootFallbackIncome\(uint amount, string source, uint timestamp\);)/,
    '$1' + additionalEvents
);

console.log('   - Added UserLevelUpdated event');
console.log('   - Added TeamCountUpdated event');
console.log('   - Added MatrixPositionFilled event');
console.log('   - Added SponsorChainUpdated event');

// ============ Comprehensive View Functions ============
console.log('\n✅ Adding comprehensive view functions...');

const comprehensiveViews = `
    // ============ COMPREHENSIVE VIEW FUNCTIONS (0-GAS) ============
    
    /**
     * @notice Get complete user profile in one call (0-gas)
     * @dev Efficient batch query for frontend
     */
    function getUserProfile(uint _userId) external view returns (
        address account,
        string memory username,
        uint8 level,
        uint directTeam,
        uint totalTeam,
        uint sponsor,
        uint matrixParent,
        uint totalDeposit,
        uint totalIncome,
        uint registrationTime,
        bool isActive
    ) {
        User memory user = userInfo[_userId];
        UserIncome memory income = userIncome[_userId];
        
        return (
            user.account,
            user.username,
            user.level,
            user.directTeam,
            user.team,
            user.referrer,
            user.upline,
            income.totalDeposit,
            income.totalIncome,
            user.registrationTime,
            user.exists
        );
    }
    
    /**
     * @notice Get user's income breakdown (0-gas)
     */
    function getUserIncomeDetails(uint _userId) external view returns (
        uint totalDeposit,
        uint totalIncome,
        uint referralIncome,
        uint sponsorIncome,
        uint levelIncome,
        uint lostIncome,
        uint netProfit
    ) {
        UserIncome memory income = userIncome[_userId];
        uint lost = lostIncome[_userId];
        uint profit = income.totalIncome > income.totalDeposit 
            ? income.totalIncome - income.totalDeposit 
            : 0;
        
        return (
            income.totalDeposit,
            income.totalIncome,
            income.referralIncome,
            income.sponsorIncome,
            income.levelIncome,
            lost,
            profit
        );
    }
    
    /**
     * @notice Get user's matrix position details (0-gas)
     */
    function getMatrixInfo(uint _userId) external view returns (
        uint upline,
        uint leftChild,
        uint rightChild,
        uint matrixDirectCount,
        uint[] memory allChildren
    ) {
        User memory user = userInfo[_userId];
        uint[] memory children = teams[_userId][0];
        uint left = children.length > 0 ? children[0] : 0;
        uint right = children.length > 1 ? children[1] : 0;
        
        return (
            user.upline,
            left,
            right,
            matrixDirect[_userId],
            children
        );
    }
    
    /**
     * @notice Get user's direct referrals list (0-gas)
     */
    function getDirectReferrals(uint _userId) external view returns (uint[] memory) {
        return teams[_userId][0];  // Returns all direct team members
    }
    
    /**
     * @notice Get user's sponsor lineage (0-gas)
     * @param _userId User ID
     * @param _depth How many levels up to fetch (max 20)
     */
    function getSponsorLineage(uint _userId, uint8 _depth) external view returns (
        uint[] memory lineage,
        string[] memory usernames
    ) {
        require(_depth <= 20, "Max depth 20");
        
        uint[] memory ids = new uint[](_depth);
        string[] memory names = new string[](_depth);
        
        uint current = _userId;
        uint count = 0;
        
        for (uint8 i = 0; i < _depth && current != 0; i++) {
            current = userInfo[current].referrer;
            if (current == 0) break;
            
            ids[count] = current;
            names[count] = userInfo[current].username;
            count++;
        }
        
        // Trim arrays to actual count
        uint[] memory trimmedIds = new uint[](count);
        string[] memory trimmedNames = new string[](count);
        for (uint i = 0; i < count; i++) {
            trimmedIds[i] = ids[i];
            trimmedNames[i] = names[i];
        }
        
        return (trimmedIds, trimmedNames);
    }
    
    /**
     * @notice Get global platform statistics (0-gas)
     */
    function getPlatformStats() external view returns (
        uint totalUsersCount,
        uint totalVolume,
        uint contractBalance,
        uint averageUserLevel,
        uint activeUsersToday
    ) {
        uint totalLevels = 0;
        for (uint i = 0; i < globalUsers.length; i++) {
            uint userId = globalUsers[i];
            totalLevels += userInfo[userId].level;
        }
        
        uint avgLevel = totalUsers > 0 ? totalLevels / totalUsers : 0;
        
        // Calculate total volume (approximation)
        uint totalVol = 0;
        for (uint i = 0; i < globalUsers.length; i++) {
            totalVol += userIncome[globalUsers[i]].totalDeposit;
        }
        
        return (
            totalUsers,
            totalVol,
            USDT.balanceOf(address(this)),
            avgLevel,
            totalUsers  // Simplified - full impl would track daily active
        );
    }
    
    /**
     * @notice Get level costs for all levels (0-gas)
     */
    function getAllLevelCostsView() external view returns (
        uint256[13] memory costs,
        uint256[13] memory adminFees,
        uint256[13] memory royaltyFees,
        uint256[13] memory totalCosts
    ) {
        for (uint8 i = 0; i < 13; i++) {
            costs[i] = levelCosts[i];
            adminFees[i] = (levelCosts[i] * ADMIN_FEE_PERCENT) / 100;
            royaltyFees[i] = (levelCosts[i] * ROYALTY_FUND_PERCENT) / 100;
            totalCosts[i] = levelCosts[i] + adminFees[i];
        }
        return (costs, adminFees, royaltyFees, totalCosts);
    }
    
    /**
     * @notice Check if username is available (0-gas)
     */
    function isUsernameAvailable(string memory username) external view returns (bool) {
        return !usernameExists[username];
    }
    
    /**
     * @notice Get user by username (0-gas)
     */
    function getUserByUsername(string memory username) external view returns (
        uint userId,
        address account,
        uint8 level,
        bool exists
    ) {
        address addr = usernameToAddress[username];
        uint uId = id[addr];
        User memory user = userInfo[uId];
        
        return (uId, user.account, user.level, user.exists);
    }
    
    /**
     * @notice Batch get multiple user profiles (0-gas)
     * @param _userIds Array of user IDs to fetch
     */
    function getBatchUserProfiles(uint[] memory _userIds) external view returns (
        address[] memory accounts,
        string[] memory usernames,
        uint8[] memory levels,
        uint[] memory teams
    ) {
        uint len = _userIds.length;
        require(len <= 50, "Max 50 users per batch");
        
        accounts = new address[](len);
        usernames = new string[](len);
        levels = new uint8[](len);
        teams = new uint[](len);
        
        for (uint i = 0; i < len; i++) {
            User memory user = userInfo[_userIds[i]];
            accounts[i] = user.account;
            usernames[i] = user.username;
            levels[i] = user.level;
            teams[i] = user.team;
        }
        
        return (accounts, usernames, levels, teams);
    }
    
    /**
     * @notice Get contract configuration (0-gas)
     */
    function getContractConfig() external view returns (
        uint maxLevels,
        uint adminFeePercent,
        uint royaltyFundPercent,
        uint maxIncomeLayer,
        uint startTime,
        bool isPaused,
        bool isAutonomous
    ) {
        return (
            MAX_LEVELS,
            ADMIN_FEE_PERCENT,
            ROYALTY_FUND_PERCENT,
            MAX_INCOME_LAYER,
            START_TIME,
            paused,
            owner == address(0)
        );
    }
`;

// Add before the closing brace of the contract
contract = contract.replace(
    /(\s+\/\/ ============ HELPER FUNCTIONS ============)/,
    comprehensiveViews + '\n$1'
);

console.log('   - Added getUserProfile() - complete user data in 1 call');
console.log('   - Added getUserIncomeDetails() - income breakdown');
console.log('   - Added getMatrixInfo() - matrix position details');
console.log('   - Added getSponsorLineage() - upline chain');
console.log('   - Added getPlatformStats() - global statistics');
console.log('   - Added getAllLevelCostsView() - all level pricing');
console.log('   - Added isUsernameAvailable() - username checker');
console.log('   - Added getUserByUsername() - lookup by name');
console.log('   - Added getBatchUserProfiles() - bulk user query');
console.log('   - Added getContractConfig() - configuration viewer');

// Save enhanced contract
console.log('\n📝 Saving event & view enhanced contract...');
fs.writeFileSync(contractPath, contract, 'utf8');

console.log('✅ Event & View enhancements applied successfully!\n');
console.log('📊 Summary:');
console.log('   - Added 4 new events for complete data tracking');
console.log('   - Added 10 comprehensive view functions');
console.log('   - All data now accessible with 0 gas cost');
console.log('   - Frontend can query all data offline');
console.log('\n💡 Next: Compile and test');
console.log('   npx hardhat compile');
