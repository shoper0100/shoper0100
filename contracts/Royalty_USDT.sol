// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.20;

/**
 * @title Royalty - USDT-Only Version
 * @notice Manages all royalty distribution for the RideBNB platform in USDT
 * @dev Simplified version with owner-only control
 */

// USDT Token Interface
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

// Interface to query RideBNB contract for user data
interface IRideBNB {
    function getUserAccount(uint userId) external view returns (address);
}

contract Royalty_USDT {
    
    // ==================== IMMUTABLES ====================
    
    IERC20 public immutable USDT;
    
    // ==================== STATE VARIABLES ====================
    
    // Reentrancy guard (improved pattern)
    uint256 private unlocked = 1;
    address public owner;
    address public rideBNBContract;
    uint public immutable startTime;
    uint private immutable rootUserId;
    
    // Royalty system constants
    uint public constant royaltyDistTime = 1 days;
    uint public constant royaltyMaxPercent = 150;  // 150% cap on total income
    
    // Royalty tier percentages (immutable)
    uint[4] public royaltyPercent = [40, 30, 20, 10];  // Tier 0-3 pool distribution
    
    // Royalty tier requirements (adjustable by owner, immutable after renounce)
    uint[4] public royaltyLevels = [10, 11, 12, 13];  // Required levels for each tier
    uint[4] public royaltyDirects = [0, 0, 0, 0];     // Required direct referrals for each tier required
    
    // Royalty tracking
    struct RoyaltyData {
        uint userCount;
        uint index;
        uint distributionRound;
        uint dividendPerShare; // Accumulated dividend per share (scaled by 1e18)
    }
    
    mapping(uint => RoyaltyData) public royaltyData;  // Tier index -> RoyaltyData
    mapping(uint => mapping(uint => uint[])) private pendingRoyaltyUsers; // Pending list
    mapping(uint => mapping(uint => bool)) public royaltyActive;    // Active status
    mapping(uint => mapping(uint => uint)) private lastRoyaltyTime; // Claim timestamps
    mapping(uint => mapping(uint => uint)) private lastClaimedDividend; // Track last claimed dividend per share
    
    mapping(uint => uint) private lastDistributedBalance;  // Track last balance PER TIER to calculate new funds only
    
    // Separate tracking for royalty income only (for 150% cap)
    mapping(uint => uint) public royaltyIncome;  // userId -> total royalty income claimed
    
    // ==================== EVENTS ====================
    
    event RoyaltyDistributed(uint indexed tier, uint amount, uint userCount, uint timestamp);
    event RoyaltyClaimed(uint indexed userId, uint indexed tier, uint amount, uint timestamp);
    event UserRegistered(uint indexed userId, uint indexed tier, uint timestamp);
    event RoyaltyConfigUpdated(string configType, uint timestamp);
    event RoyaltyRequirementsUpdated(uint indexed tier, uint newLevel, uint newDirects, uint timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event RideBNBContractSet(address indexed rideBNBContract, uint timestamp);
    
    // ==================== MODIFIERS ====================
    
    modifier nonReentrant() {
        require(unlocked == 1, "Reentrancy detected");
        unlocked = 0;
        _;
        unlocked = 1;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyRideBNB() {
        require(msg.sender == rideBNBContract, "Only RideBNB contract");
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor(address _owner, uint _defaultRefer, address _usdtToken) {
        require(_owner != address(0), "Invalid owner");
        require(_usdtToken != address(0), "Invalid USDT");
        
        owner = _owner;
        rootUserId = _defaultRefer;  // Store as immutable
        startTime = block.timestamp;
        USDT = IERC20(_usdtToken);
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    /**
     * @dev Set RideBNB contract address (one-time setup)
     */
    function setRideBNBContract(address _rideBNBContract) external onlyOwner {
        require(rideBNBContract == address(0), "Already set");
        require(_rideBNBContract != address(0), "Invalid address");
        rideBNBContract = _rideBNBContract;
        emit RideBNBContractSet(_rideBNBContract, block.timestamp);
    }
    
    /**
     * @dev Set royalty distribution percentages
     */
    function setRoyaltyPercents(uint[4] memory _newPercents) external {
        require(msg.sender == owner, "Not owner");
        require(_newPercents[0] + _newPercents[1] + _newPercents[2] + _newPercents[3] == 100, "Must total 100%");
        royaltyPercent = _newPercents;
        emit RoyaltyConfigUpdated("percentages", block.timestamp);
    }
    
    /**
     * @notice Update royalty tier requirements (owner only, before renouncing)
     * @dev Allows flexibility during initial phase, becomes immutable after renounce
     */
    function setRoyaltyRequirements(uint _tier, uint _requiredLevel, uint _requiredDirects) external {
        require(msg.sender == owner, "Not owner");
        require(_tier < 4, "Invalid tier");
        require(_requiredLevel >= 1 && _requiredLevel <= 13, "Level must be 1-13");
        require(_requiredDirects <= 100, "Max 100 directs");
        
        royaltyLevels[_tier] = _requiredLevel;
        royaltyDirects[_tier] = _requiredDirects;
        
        emit RoyaltyRequirementsUpdated(_tier, _requiredLevel, _requiredDirects, block.timestamp);
    }
    
    /**
     * @dev Set royalty tier levels (deprecated - use setRoyaltyRequirements)
     */
    function setRoyaltyLevels(uint[4] memory _levels) external onlyOwner {
        for(uint i=0; i<4; i++) {
            require(_levels[i] >= 1 && _levels[i] <= 13, "Invalid level");
        }
        royaltyLevels = _levels;
        emit RoyaltyConfigUpdated("levels", block.timestamp);
    }
    
    /**
     * @dev Set direct referral requirements (deprecated - use setRoyaltyRequirements)
     */
    function setRoyaltyDirectRequired(uint[4] memory _required) external onlyOwner {
        for(uint i=0; i<4; i++) {
            require(_required[i] > 0 && _required[i] <= 100, "Invalid requirement");
            // Ensure ascending order - higher tiers need more or equal direct referrals
            if(i > 0) require(_required[i] >= _required[i-1], "Must be ascending");
        }
        royaltyDirects = _required;
        emit RoyaltyConfigUpdated("directRequired", block.timestamp);
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        address previousOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(previousOwner, _newOwner);
    }
    
    // ==================== CORE ROYALTY FUNCTIONS ====================
    
    /**
     * @dev Register user for royalty tier (called by RideBNB on upgrade)
     * Root user stays in ALL tiers, normal users move between tiers (only one at a time)
     * Auto-claims any unclaimed dividends before tier transition to prevent loss
     */
    function registerUser(uint _userId, uint _level, uint _directCount) external {
        // Allow calls from RideBNB contract OR during initial setup (before RideBNB is connected)
        require(msg.sender == rideBNBContract || rideBNBContract == address(0), "Only RideBNB contract");
        
        bool isRootUser = (_userId == rootUserId);
        
        // For normal users (not root): auto-claim and deactivate all previous tiers
        if (!isRootUser) {
            for(uint i = 0; i < 4; i++) {
                if (royaltyActive[_userId][i]) {
                    // AUTO-CLAIM: Try to transfer unclaimed dividends (non-blocking)
                    uint totalDividendPerShare = royaltyData[i].dividendPerShare;
                    uint userLastClaimed = lastClaimedDividend[_userId][i];
                    
                    if (totalDividendPerShare > userLastClaimed) {
                        uint unclaimedDividend = totalDividendPerShare - userLastClaimed;
                        uint claimAmount = unclaimedDividend / 1e18;
                        
                        if (claimAmount > 0) {
                            // Try to transfer (best effort, non-blocking)
                            address userAccount = IRideBNB(rideBNBContract).getUserAccount(_userId);
                            bool success = USDT.transfer(userAccount, claimAmount);
                            
                            // Only update tracking if transfer successful
                            if (success) {
                                lastClaimedDividend[_userId][i] = totalDividendPerShare;
                                royaltyIncome[_userId] += claimAmount;
                                emit RoyaltyClaimed(_userId, i, claimAmount, block.timestamp);
                            }
                            // If failed: Share preserved, user can claim from old tier later
                        }
                    }
                    
                    // Deactivate tier
                    royaltyActive[_userId][i] = false;
                    royaltyData[i].userCount--;
                }
            }
        }
        
        // Register to new tier
        for(uint i = 0; i < 4; i++) {
            bool meetsRequirement = isRootUser || (_directCount >= royaltyDirects[i]);
            
            if(royaltyLevels[i] == _level && meetsRequirement) {
                // Skip if already active (for root user)
                if (!royaltyActive[_userId][i]) {
                    pendingRoyaltyUsers[i][0].push(_userId);
                    royaltyActive[_userId][i] = true;
                    emit UserRegistered(_userId, i, block.timestamp);
                }
                break;
            }
        }
    }
    
    /**
     * @dev Distribute royalty pool to eligible users (NEW MODEL: Dividend-Per-Share)
     * This increases accumulated dividends for ALL active users, not just new ones
     */
    function distRoyalty(uint _tier) external {
        require(_tier < 4, "Invalid tier");
        require((block.timestamp - startTime) / royaltyDistTime > royaltyData[_tier].distributionRound, "Not yet");
        
        // Get NEW funds only (not entire balance) - PER TIER
        uint currentBalance = USDT.balanceOf(address(this));
        uint newFunds = currentBalance > lastDistributedBalance[_tier] 
            ? currentBalance - lastDistributedBalance[_tier] 
            : 0;
        
        uint _amt = (newFunds * royaltyPercent[_tier]) / 100;
        
        require(_amt > 0, "No new funds to distribute");
        
        // Update tracked balance for THIS tier after calculating tier share
        lastDistributedBalance[_tier] += _amt;
        
        // Process pending users first (add them to active pool for THIS tier)
        uint currentIndex = royaltyData[_tier].index;
        
        for(uint i = currentIndex; i < pendingRoyaltyUsers[_tier][0].length; i++) {
            uint _user = pendingRoyaltyUsers[_tier][0][i];
            royaltyActive[_user][_tier] = true;
            royaltyData[_tier].userCount++;
            royaltyData[_tier].index++;
        }
        
        uint totalActiveUsers = royaltyData[_tier].userCount;
        require(totalActiveUsers > 0, "No active users");
        
        // Calculate dividend per share (scaled by 1e18 for precision)
        uint dividendIncrease = (_amt * 1e18) / totalActiveUsers;
        royaltyData[_tier].dividendPerShare += dividendIncrease;
        
        royaltyData[_tier].distributionRound++;
        emit RoyaltyDistributed(_tier, _amt, totalActiveUsers, block.timestamp);
    }
    
    /**
     * @dev User claims their ACCUMULATED royalty (NEW MODEL: Pull Pattern)
     */
    function claimRoyalty(
        uint _id, 
        uint _tier,
        uint rootUserId,
        uint userTotalIncome,
        uint userTotalDeposit,
        address userAccount
    ) external nonReentrant returns (uint) {
        require(msg.sender == userAccount || msg.sender == rideBNBContract, "Unauthorized");
        require(_tier < 4, "Invalid tier");
        
        // Allow claiming from ANY tier where user has unclaimed dividends
        // No longer requires active status - user can claim old tier dividends
        
        // Prevent claiming if no new dividends available
        uint totalDividendPerShare = royaltyData[_tier].dividendPerShare;
        uint userLastClaimed = lastClaimedDividend[_id][_tier];
        require(userLastClaimed < totalDividendPerShare, "No new dividends");
        
        // Root user special privilege: no income cap
        bool isRoot = _id == rootUserId;
        
        // CAP CHECK: 150% applies ONLY to royalty income, not other income!
        if(!isRoot) {
            uint maxRoyaltyIncome = (userTotalDeposit * royaltyMaxPercent) / 100;
            require(royaltyIncome[_id] < maxRoyaltyIncome, "Royalty cap reached");
        }
        
        // Calculate accumulated dividends
        uint unclaimedDividend = totalDividendPerShare - userLastClaimed;
        
        // Each user gets 1 share, so amount = unclaimedDividend / 1e18
        uint _amt = unclaimedDividend / 1e18;
        
        require(_amt > 0, "No royalty available");
        
        // Apply cap to claim amount if needed
        if(!isRoot) {
            uint maxRoyaltyIncome = (userTotalDeposit * royaltyMaxPercent) / 100;
            uint remainingAllowed = maxRoyaltyIncome > royaltyIncome[_id]
                ? maxRoyaltyIncome - royaltyIncome[_id]
                : 0;
            
            if (_amt > remainingAllowed) {
                _amt = remainingAllowed;
            }
        }
        
        require(_amt > 0, "Claim amount too small");
        
        // Update tracking
        lastClaimedDividend[_id][_tier] = totalDividendPerShare;
        lastRoyaltyTime[_id][_tier] = getCurRoyaltyDay();
        
        // Track royalty income separately for cap calculation
        royaltyIncome[_id] += _amt;
        
        // RECURRING ROYALTY MODEL: Users stay active until 150% income cap
        // Both root and normal users can claim multiple times from their tier
        // Only the 150% cap check (line 220) limits normal users
        // if(!isRoot) {
        //     royaltyActive[_id][_tier] = false; // DISABLED - allows recurring claims
        // }
        
        
        // Transfer royalty to user in USDT
        require(USDT.transfer(userAccount, _amt), "USDT transfer failed");
        
        emit RoyaltyClaimed(_id, _tier, _amt, block.timestamp);
        return _amt;
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Get current royalty day
     */
    function getCurRoyaltyDay() public view returns(uint) {
        return (block.timestamp - startTime) / royaltyDistTime;
    }
    
    /**
     * @dev Get next royalty distribution time
     */
    function getNextDistTime() external view returns(uint) {
        return startTime + (royaltyDistTime * (getCurRoyaltyDay() + 1));
    }
    
    /**
     * @dev Get royalty percentages
     */
    function getRoyaltyPercents() external view returns(uint[4] memory) {
        return royaltyPercent;
    }
    
    /**
     * @dev Get royalty levels
     */
    function getRoyaltyLevels() external view returns(uint[4] memory) {
        return royaltyLevels;
    }
    
    /**
     * @dev Get user's royalty data for specific tier
     */
    function getUserRoyaltyData(uint _userId, uint _tier) external view returns(
        uint claimableAmount,
        bool active,
        uint lastClaimedDay
    ) {
        uint totalDividendPerShare = royaltyData[_tier].dividendPerShare;
        uint userLastClaimed = lastClaimedDividend[_userId][_tier];
        uint unclaimedDividend = totalDividendPerShare > userLastClaimed 
            ? totalDividendPerShare - userLastClaimed 
            : 0;
        
        return (
            unclaimedDividend / 1e18,
            royaltyActive[_userId][_tier],
            lastRoyaltyTime[_userId][_tier]
        );
    }
    
    /**
     * @dev Get tier statistics
     */
    function getTierStats(uint _tier) external view returns(
        uint userCount,
        uint distributionRound,
        uint pendingUserCount
    ) {
        require(_tier < 4, "Invalid tier");
        return (
            royaltyData[_tier].userCount,
            royaltyData[_tier].distributionRound,
            pendingRoyaltyUsers[_tier][0].length
        );
    }
    
    /**
     * @dev Check if user is eligible for specific tier
     */
    function isEligibleForRoyalty(uint _userId, uint _tier) external view returns(bool) {
        require(_tier < 4, "Invalid tier");
        return royaltyActive[_userId][_tier] && 
               lastClaimedDividend[_userId][_tier] < royaltyData[_tier].dividendPerShare;
    }
    
    /**
     * @dev Get contract USDT balance
     */
    function getBalance() external view returns(uint) {
        return USDT.balanceOf(address(this));
    }
    
    /**
     * @dev Get contract configuration for frontend
     */
    function getContractConfig() external view returns(
        uint _royaltyMaxPercent,
        uint _royaltyDistTime,
        uint _startTime,
        uint _currentDay
    ) {
        return (
            royaltyMaxPercent,
            royaltyDistTime,
            startTime,
            getCurRoyaltyDay()
        );
    }
}
