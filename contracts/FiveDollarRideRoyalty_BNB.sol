// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.20;

// OpenZeppelin Security (v5.x)
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FiveDollarRideRoyalty_BNB V2 - Native BNB Royalty Pool
 * @notice Royalty distribution system for FiveDollarRide_BNB platform
 * @dev Accepts native BNB and distributes to eligible users
 * 
 * V2 Features:
 * - OpenZeppelin v5 security (ReentrancyGuard + Ownable)
 * - Native BNB payments (no token approval)
 * - 4 royalty tiers (L10, L11, L12, L13)
 * - Automatic distribution rounds
 * - Eligible user tracking
 * - Multiple claim support
 */

contract FiveDollarRideRoyalty_BNB is ReentrancyGuard, Ownable {
    // ============ IMMUTABLES ============
    
    address public immutable DEFAULT_REFER_ADDRESS;
    address public MAIN_CONTRACT; // Can be set after deployment
    
    // ============ CONSTANTS ============
    
    uint[4] public ROYALTY_LEVELS = [10, 11, 12, 13];
    uint public constant MIN_CLAIM = 0.001 ether; // Minimum claim threshold (~$0.90)
    
    // ============ STATE VARIABLES ============
    
    // Tier => User ID => Registration Data
    mapping(uint => mapping(uint => UserRoyalty)) public userRoyalties;
    
    // Tier => Distribution Round => User IDs
    mapping(uint => mapping(uint => uint[])) public distributionQueue;
    
    // Tier => Statistics
    mapping(uint => TierStats) public tierStats;
    
    // Tier => BNB Pool Balance
    mapping(uint => uint) public poolBalance;
    
    // NEW: Tier => Round => BNB Amount for that round
    mapping(uint => mapping(uint => uint)) public roundPoolAmount;
    
    struct UserRoyalty {
        bool registered;
        uint registrationRound;
        uint lastClaimRound;
        uint totalClaimed;
        uint directReferrals;
        uint totalDeposits;  // Track user's total platform deposits for 150% cap
        bool active;  // Only one tier can be active at a time
    }
    
    struct TierStats {
        uint totalUsers;
        uint currentRound;
        uint pendingUsers;
        uint totalDistributed;
        uint lastRoundTime;  // NEW: Track last round advancement
    }
    
    uint public constant ROUND_DURATION = 24 hours;  // NEW: 24-hour rounds
    
    // ============ EVENTS ============
    
    event UserRegistered(uint indexed userId, uint indexed tier, uint round, uint timestamp);
    event RoyaltyDistributed(uint indexed userId, uint indexed tier, uint bnbAmount, uint round, uint timestamp);
    event PoolFunded(uint indexed tier, uint bnbAmount, uint timestamp);
    event RoundAdvanced(uint indexed tier, uint newRound, uint timestamp);
    
    // V2 Security Events
    event EmergencyWithdrawal(address indexed owner, uint256 amount, uint256 timestamp);
    event MainContractUpdated(address indexed oldContract, address indexed newContract, uint256 timestamp);
    
    // ============ MODIFIERS ============
    
    modifier onlyMainContract() {
        require(msg.sender == MAIN_CONTRACT, "Only main contract");
        _;
    }
    
    modifier validTier(uint _tier) {
        require(_tier >= 10 && _tier <= 13, "Invalid tier");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        address _owner,
        address _defaultRefer,
        address _mainContract
    ) Ownable(_owner) {
        require(_defaultRefer != address(0), "Invalid default refer");
        // Allow zero address for _mainContract (will be set via setMainContract)
        
        DEFAULT_REFER_ADDRESS = _defaultRefer;
        MAIN_CONTRACT = _mainContract;
        
        // Initialize tier stats with time-based rounds
        for (uint i = 0; i < 4; i++) {
            tierStats[ROYALTY_LEVELS[i]].currentRound = 1;
            tierStats[ROYALTY_LEVELS[i]].lastRoundTime = block.timestamp;
        }
    }
    
    // ============ MAIN CONTRACT FUNCTIONS ============
    
    /**
     * @notice Register user for royalty tier
     * @dev Called by main contract when user reaches required level
     */
    function registerUser(
        uint _userId,
        uint _level,
        uint _directCount
    ) external onlyMainContract {
        // Deactivate all lower tiers (only one active tier at a time)
        for (uint i = 0; i < 4; i++) {
            uint tier = ROYALTY_LEVELS[i];
            if (tier < _level && userRoyalties[tier][_userId].registered) {
                userRoyalties[tier][_userId].active = false;
            }
        }
        
        // Register users for tiers they qualify for (only current level)
        for (uint i = 0; i < 4; i++) {
            uint tier = ROYALTY_LEVELS[i];
            
            if (_level >= tier && !userRoyalties[tier][_userId].registered) {
                // Advance round if 24h passed before registering
                _checkAndAdvanceRound(tier);
                
                TierStats storage stats = tierStats[tier];
                
                userRoyalties[tier][_userId] = UserRoyalty({
                    registered: true,
                    registrationRound: stats.currentRound,
                    lastClaimRound: 0,
                    totalClaimed: 0,
                    directReferrals: _directCount,
                    totalDeposits: 0,  // Will be updated on first claim
                    active: (tier == _level)  // Only current level is active
                });
                
                distributionQueue[tier][stats.currentRound].push(_userId);
                stats.totalUsers++;
                stats.pendingUsers++;
                
                emit UserRegistered(_userId, tier, stats.currentRound, block.timestamp);
            }
        }
    }
    
    /**
     * @notice Claim royalty for a specific tier
     * @dev Called by main contract via user request
     */
    function claimRoyalty(
        uint _userId,
        uint _tier,
        uint, // _rootUserId - unused
        uint, // _userTotalIncome - unused  
        uint _userTotalDeposit,  // Used for 150% cap calculation
        address _userAccount
    ) external onlyMainContract validTier(_tier) nonReentrant returns (uint) {
        UserRoyalty storage user = userRoyalties[_tier][_userId];
        require(user.registered, "Not registered");
        require(user.active, "Tier not active - upgraded to higher tier");
        
        // Update total deposits for 150% cap calculation
        if (_userTotalDeposit > user.totalDeposits) {
            user.totalDeposits = _userTotalDeposit;
        }
        
        // Calculate 150% cap: max royalty income is 1.5x total deposits
        uint maxAllowedIncome = (user.totalDeposits * 150) / 100;
        uint remainingCap = maxAllowedIncome > user.totalClaimed ? maxAllowedIncome - user.totalClaimed : 0;
        
        if (remainingCap == 0) {
            return 0; // User reached 150% cap
        }
        
        // Advance round if 24 hours passed
        _checkAndAdvanceRound(_tier);
        
        TierStats storage stats = tierStats[_tier];
        require(user.lastClaimRound < stats.currentRound, "Already claimed");
        
        // Calculate total claimable
        uint totalClaimable = _calculateClaimable(_tier, _userId);
        
        // Apply 150% cap
        if (totalClaimable > remainingCap) {
            totalClaimable = remainingCap;
        }
        
        // Minimum claim threshold  
        if (totalClaimable < MIN_CLAIM) {
            return 0; // Roll over to next claim
        }
        
        if (totalClaimable > 0) {
            require(poolBalance[_tier] >= totalClaimable, "Insufficient balance");
            
            poolBalance[_tier] -= totalClaimable;
            user.lastClaimRound = stats.currentRound - 1;
            user.totalClaimed += totalClaimable;
            stats.totalDistributed += totalClaimable;
            
            (bool success, ) = payable(_userAccount).call{value: totalClaimable}("");
            require(success, "Transfer failed");
            
            emit RoyaltyDistributed(_userId, _tier, totalClaimable, stats.currentRound, block.timestamp);
        }
        
        return totalClaimable;
    }
    
    /**
     * @dev Calculate claimable amount for a user (helper to avoid stack too deep)
     */
    function _calculateClaimable(uint _tier, uint _userId) private view returns (uint) {
        UserRoyalty storage user = userRoyalties[_tier][_userId];
        TierStats storage stats = tierStats[_tier];
        
        uint startRound = user.lastClaimRound == 0 ? user.registrationRound : user.lastClaimRound;
        uint claimableRounds = stats.currentRound - startRound;
        uint total = 0;
        
        for (uint i = 0; i < claimableRounds && i < 10; i++) {
            uint round = startRound + i + 1;
            uint users = distributionQueue[_tier][round].length;
            uint pool = roundPoolAmount[_tier][round];
            
            if (users > 0 && pool > 0) {
                uint share = pool / users;
                if (share > 0) total += share;
            }
        }
        
        return total;
    }
    
    /**
     * @dev Check if round should advance based on pending users
     */
    function _checkAndAdvanceRound(uint _tier) private {
        TierStats storage stats = tierStats[_tier];
        
        // CHANGED: Advance round based on 24-hour time intervals
        if (block.timestamp >= stats.lastRoundTime + ROUND_DURATION) {
            stats.currentRound++;
            stats.lastRoundTime = block.timestamp;
            stats.pendingUsers = 0;
            emit RoundAdvanced(_tier, stats.currentRound, block.timestamp);
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function getUserRoyaltyData(
        uint _userId,
        uint _tier
    ) external view validTier(_tier) returns (
        uint claimableAmount,
        bool isEligible,
        bool hasClaimed
    ) {
        UserRoyalty storage user = userRoyalties[_tier][_userId];
        isEligible = user.registered;
        hasClaimed = user.lastClaimRound >= tierStats[_tier].currentRound - 1;
        
        if (isEligible && !hasClaimed) {
            TierStats storage stats = tierStats[_tier];
            uint claimableRounds = stats.currentRound - user.lastClaimRound;
            if (user.lastClaimRound == 0) {
                claimableRounds = stats.currentRound - user.registrationRound;
            }
            
            for (uint i = 0; i < claimableRounds; i++) {
                uint round = user.lastClaimRound + i + 1;
                uint usersInRound = distributionQueue[_tier][round].length;
                
                uint poolForRound = roundPoolAmount[_tier][round];
                if (usersInRound > 0 && poolForRound > 0) {
                    uint userShare = poolForRound / usersInRound;
                    claimableAmount += userShare;
                }
            }
        }
    }
    

    
    function getRoyaltyLevels() external view returns (uint[4] memory) {
        return ROYALTY_LEVELS;
    }
    
    function getTierStats(uint _tier) external view validTier(_tier) returns (
        uint userCount,
        uint distributionRound,
        uint pendingUserCount
    ) {
        TierStats storage stats = tierStats[_tier];
        return (stats.totalUsers, stats.currentRound, stats.pendingUsers);
    }
    
    function getPoolBalance(uint _tier) external view validTier(_tier) returns (uint) {
        return poolBalance[_tier];
    }
    
    function getTotalPoolBalance() external view returns (uint) {
        return address(this).balance;
    }
    
    // ============ OWNER FUNCTIONS ============
    
    /**
     * @notice Manual round advancement (emergency use)
     */
    function advanceRound(uint _tier) external onlyOwner validTier(_tier) {
        TierStats storage stats = tierStats[_tier];
        stats.currentRound++;
        stats.pendingUsers = 0;
        emit RoundAdvanced(_tier, stats.currentRound, block.timestamp);
    }
    
    /**
     * @notice Set main contract address (only once)
     */
    function setMainContract(address _mainContract) external onlyOwner {
        require(_mainContract != address(0), "Invalid address");
        require(MAIN_CONTRACT == address(0), "Already set");
        MAIN_CONTRACT = _mainContract;
    }
    
    /**
     * @notice Emergency withdraw (only to owner)
     */
    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint balance = address(this).balance;
        require(balance > 0, "No balance");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdraw failed");
        emit EmergencyWithdrawal(owner(), balance, block.timestamp);
    }
    
    // ============ RECEIVE FUNCTION ============
    
    /**
     * @notice Accept BNB deposits - distribute to tier pools equally
     */
    receive() external payable {
        require(msg.value > 0, "No BNB sent");
        
        // Distribute equally across all 4 tiers
        uint perTier = msg.value / 4;
        
        for (uint i = 0; i < 4; i++) {
            uint tier = ROYALTY_LEVELS[i];
            poolBalance[tier] += perTier;
            
            // FIXED: Track per-round pool amounts
            uint currentRound = tierStats[tier].currentRound;
            roundPoolAmount[tier][currentRound] += perTier;
            
            emit PoolFunded(tier, perTier, block.timestamp);
        }
    }
    
    /**
     * @notice Fallback function
     */
    fallback() external payable {
        revert("Use receive() function");
    }
}
