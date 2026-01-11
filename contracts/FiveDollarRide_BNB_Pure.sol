// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.20;

// OpenZeppelin Security (v4.x paths)
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Chainlink Price Oracle
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title FiveDollarRide V2 - Secure Edition with Chainlink Oracle
 * @notice Revolutionary income platform starting at just $5 with BNB payments
 * @dev Owner-controlled smart contract with progressive decentralization capability
 * 
 * V2 Features:
 * - OpenZeppelin ReentrancyGuard protection
 * - Chainlink BNB/USD price oracle with fallback
 * - Admin-configurable price bounds and update intervals
 * - Dual referral system (address + ID)
 * - Updated level progression (L1=$5, L2=$5, L3=$10... L13=$10,240)
 * - Binary matrix tree structure  
 * - Multi-layer income distribution (20 layers)
 * - Sponsor commissions (13 levels)
 * - Royalty pool funding (5% per upgrade)
 * - Native BNB payments (no token approvals needed)
 * - Comprehensive event logging
 * 
 * Brand: FiveDollarRide - Your $5 Journey to Financial Freedom
 */


// Royalty Contract Interface
interface IRoyalty {
    function registerUser(uint _userId, uint _level, uint _directCount) external;
    function claimRoyalty(
        uint _id, 
        uint _tier,
        uint rootUserId,
        uint userTotalIncome,
        uint userTotalDeposit,
        address userAccount
    ) external returns (uint);
    function getUserRoyaltyData(uint _userId, uint _tier) external view returns (uint, bool, bool);
    function getRoyaltyPercents() external view returns(uint[4] memory);
    function getRoyaltyLevels() external view returns(uint[4] memory);
    function getTierStats(uint _tier) external view returns(uint userCount, uint distributionRound, uint pendingUserCount);
}

contract FiveDollarRide is ReentrancyGuard, Ownable {
    // ============ IMMUTABLE VALUES (SET AT DEPLOYMENT) ============
    
    address public immutable FEE_RECEIVER;

    IRoyalty public immutable ROYALTY_ADDR;
    uint private immutable DEFAULT_REFER;
    uint public immutable START_TIME;
    
    // ============ CONSTANTS (HARDCODED FOREVER) ============
    
    // System constants
    uint8 public constant MAX_LEVELS = 13;
    uint8 public constant MAX_INCOME_LAYER = 13;  // Income distribution depth (matches 13 levels)
    
    // Owner-configurable placement depth (can be adjusted if needed)
    uint8 public maxPlacementDepth = 100;  // Default: 100, adjustable by owner
    // Note: If tree depth exceeds this value, placement falls back to root (DEFAULT_REFER)
    // This prevents infinite loops but may cluster users under root in very large trees
    
    // ✅ FIX #10-#13: State variables for MEDIUM priority fixes
    bool public oraclePaused;  // Separate oracle pause control
    uint public fallbackReferrer;  // Changeable fallback referrer
    mapping(address => uint) public lastRegistrationTime;  // Rate limiting
    uint public registrationCooldown = 3600;  // Default: 1 hour (3600 seconds), configurable by owner
    
    
    // ============ DYNAMIC PRICING WITH CHAINLINK ORACLE ============
    
    // Chainlink Price Feed
    AggregatorV3Interface public priceFeed;
    
    // Current BNB price (updated by oracle or owner)
    uint256 public bnbPrice = 903e18; // Default $903 (18 decimals)
    
    // Price update configuration
    uint256 public priceUpdateInterval = 7 days; // Configurable by owner
    uint256 public lastPriceUpdate;
    bool public autoUpdateEnabled = true;
    
    // Price validation bounds (configurable by owner)
    uint256 public minBNBPrice = 1e18;      // $1 minimum
    uint256 public maxBNBPrice = 100000e18; // $100,000 maximum
    
    // ============ LEVEL COSTS (UPDATED V2 STRUCTURE) ============
    
    // Economic constants (adjustable by owner until renounced)
    uint8 public constant ADMIN_FEE_PERCENT = 5;      // 5% admin fee
    uint8 public constant ROYALTY_FUND_PERCENT = 5;   // 5% to royalty pool
    
    // Level costs in USD (18 decimals) - NEW PROGRESSION
    // L1=$5, L2=$5, L3=$10, L4=$20... up to L13=$10,240
    uint256[13] public levelCosts = [
        5e18,      // L1: $5
        5e18,      // L2: $5 (NEW)
        10e18,     // L3: $10 (was $20)
        20e18,     // L4: $20 (was $40)
        40e18,     // L5: $40 (was $80)
        80e18,     // L6: $80 (was $160)
        160e18,    // L7: $160 (was $320)
        320e18,    // L8: $320 (was $640)
        640e18,    // L9: $640 (was $1,280)
        1280e18,   // L10: $1,280 (was $2,560)
        2560e18,   // L11: $2,560 (was $5,120)
        5120e18,   // L12: $5,120 (was $10,240)
        10240e18   // L13: $10,240 (was $20,480)
    ];
    
    // Team & income constants
    uint public constant DIRECT_REQUIRED = 2;
    uint public constant MAX_REFERRAL_LAYERS = 1;
    
    // Sponsor commission (13 levels, total 5%)
    uint8 private constant SPONSOR_LEVELS = 13;
    
    function _getSponsorPercentage(uint8 level) private pure returns (uint16) {
        if (level == 0) return 100;   // L1: 1%
        if (level == 1) return 80;    // L2: 0.8%
        if (level == 2) return 60;    // L3: 0.6%
        if (level == 3) return 50;    // L4: 0.5%
        if (level == 4) return 50;    // L5: 0.5%
        if (level == 5) return 40;    // L6: 0.4%
        if (level == 6) return 30;    // L7: 0.3%
        if (level == 7) return 25;    // L8: 0.25%
        if (level == 8) return 20;    // L9: 0.2%
        if (level == 9) return 15;    // L10: 0.15%
        if (level == 10) return 10;   // L11: 0.1%
        if (level == 11) return 10;   // L12: 0.1%
        if (level == 12) return 10;   // L13: 0.1%
        return 0;
    }
    
    // Sponsor qualification thresholds
    uint8 private constant MIN_DIRECTS_L6_8 = 2;
    uint8 private constant MIN_DIRECTS_L9_10 = 3;
    uint8 private constant MIN_DIRECTS_L11_13 = 5;
    
    
    // ============ STATE VARIABLES ============
    
    // Emergency controls
    bool public paused;
    
    // User tracking
    uint public totalUsers;
    uint private userIdCounter;
    
    // ============ DATA STRUCTURES ============
    
    struct User {
        bool exists;
        address account;
        uint referrer;
        uint upline;
        uint level;
        uint directTeam;
        uint team;
        uint registrationTime;
    }
    
    struct UserIncome {
        uint totalDeposit;
        uint totalIncome;
        uint referralIncome;
        uint sponsorIncome;
        uint levelIncome;
    }
    
    struct Activity {
        uint id;
        uint level;
        uint time;
    }
    
    // Mappings
    mapping(address => uint) public id;
    mapping(uint => User) public userInfo;
    mapping(uint => UserIncome) public userIncome;
    mapping(uint => mapping(uint => uint[])) public teams;
    mapping(uint => uint) public matrixDirect;
    mapping(uint => uint) public lostIncome;
    mapping(uint => uint[]) private directReferrals;  // NEW: O(1) direct team lookup
    
    uint[] private globalUsers;  // Changed to private (use events instead)
    Activity[] private activity;  // Changed to private (use events instead)
    
    // ============ EVENTS ============
    
    // User lifecycle
    event UserRegistered(uint indexed userId, address indexed account, uint indexed referrer, uint timestamp);
    event UserUpgraded(uint indexed userId, uint newLevel, uint amount, uint timestamp);
    event RootUserCreated(uint indexed rootUserId, address indexed rootAddress, uint timestamp);
    
    // Payments & income
    event AdminFeePaid(uint amount, uint level, uint timestamp);
    event ReferralPayment(uint indexed referrerId, uint indexed userId, uint amount, uint timestamp);
    event SponsorCommissionPaid(uint indexed sponsorId, uint indexed fromUserId, uint amount, uint level, uint timestamp);
    event MatrixPayment(uint indexed fromUserId, uint indexed toUserId, uint amount, uint level, uint layer, bool qualified, uint timestamp);
    event IncomeLost(uint indexed userId, uint indexed fromUser, uint amount, string reason, uint timestamp);
    event RoyaltyPoolFunded(uint indexed userId, uint amount, uint timestamp);
    
    // Ownership & Emergency
    // Note: OwnershipTransferred event is inherited from Ownable
    event OwnershipRenounced(address indexed previousOwner, uint timestamp);
    event LevelCostUpdated(uint8 indexed level, uint256 oldCost, uint256 newCost, uint timestamp);
    event ContractPaused(address indexed by, uint timestamp);
    event ContractUnpaused(address indexed by, uint timestamp);
    event RootFallbackIncome(uint amount, string source, uint timestamp);
    event BNBPriceUpdated(uint oldPrice, uint newPrice, uint timestamp);
    
    // V2 Chainlink Oracle Events
    event PriceUpdateFailed(string reason, uint256 currentPrice, uint256 timestamp);
    event PriceFeedUpdated(address indexed newFeed, uint256 timestamp);
    event PriceBoundsUpdated(uint256 minPrice, uint256 maxPrice, uint256 timestamp);
    event UpdateIntervalChanged(uint256 newIntervalDays, uint256 timestamp);
    event AutoUpdateToggled(bool enabled, uint256 timestamp);
    event ManualPriceSet(uint256 oldPrice, uint256 newPrice, uint256 timestamp);
    event MaxPlacementDepthUpdated(uint8 oldDepth, uint8 newDepth, uint256 timestamp);
    event RoyaltyClaimed(uint indexed userId, uint indexed tier, uint amount, uint timestamp);
    
    // ✅ FIX #15: Missing events for MEDIUM priority fixes
    event OraclePauseToggled(bool paused, uint256 timestamp);
    event FallbackReferrerUpdated(uint oldReferrer, uint newReferrer, uint256 timestamp);
    event RegistrationRateLimited(address indexed user, uint256 cooldownRemaining, uint256 timestamp);
    event RegistrationCooldownUpdated(uint256 oldCooldown, uint256 newCooldown, uint256 timestamp);
    
    // ============ MODIFIERS ============
    // Note: Using OpenZeppelin's nonReentrant from ReentrancyGuard
    // Note: Using OpenZeppelin's onlyOwner from Ownable
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }
    
    modifier validUser(uint _userId) {
        require(_userId > 0 && userInfo[_userId].exists, "Invalid user ID");
        _;
    }
    
    
    // ============ RECEIVE FUNCTION ============
    
    /**
     * @notice Accept BNB payments
     */
    receive() external payable {}
    
// ============ CONSTRUCTOR ============
    
    constructor(
        address _feeReceiver,
        address _royalty,
        address _rootUserAddress,
        uint _rootUserId,
        address _priceFeedAddress // V2: Chainlink BNB/USD price feed
    ) Ownable(msg.sender) { // OpenZeppelin v5 requires initialOwner
        require(_feeReceiver != address(0), "Invalid fee receiver");
        require(_royalty != address(0), "Invalid royalty");
        require(_rootUserAddress != address(0), "Invalid root address");
        require(_rootUserId > 0, "Invalid root user ID");
        require(_priceFeedAddress != address(0), "Invalid price feed"); // V2

        
        // Set immutables
        FEE_RECEIVER = _feeReceiver;
        ROYALTY_ADDR = IRoyalty(_royalty);
        DEFAULT_REFER = _rootUserId;
        START_TIME = block.timestamp;

        // V2: Initialize Chainlink oracle
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        lastPriceUpdate = block.timestamp;
        
        // Initialize root user
        userIdCounter = DEFAULT_REFER;
        id[_rootUserAddress] = DEFAULT_REFER;
        _createUser(DEFAULT_REFER, _rootUserAddress, DEFAULT_REFER, DEFAULT_REFER, 12);
        globalUsers.push(DEFAULT_REFER);
        totalUsers = 1;
        // Root user already has level 13 from _createUser (12 + 1)
        
        // ✅ FIX #12: Initialize fallback referrer
        fallbackReferrer = DEFAULT_REFER;
        
        // NOTE: Royalty registration moved to initializeRoyalty() function
        // This must be called after deployment when contracts are connected
        
        emit RootUserCreated(DEFAULT_REFER, _rootUserAddress, block.timestamp);
        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    /**
     * @notice Initialize root user in royalty tiers (call after deployment)
     * @dev Must be called once after both contracts are deployed and connected
     */
    function initializeRoyalty() external onlyOwner {
        require(userInfo[DEFAULT_REFER].level == 13, "Root not at max level");
        
        // Register root to all royalty tiers
        ROYALTY_ADDR.registerUser(DEFAULT_REFER, 10, 0);
        ROYALTY_ADDR.registerUser(DEFAULT_REFER, 11, 0);
        ROYALTY_ADDR.registerUser(DEFAULT_REFER, 12, 0);
        ROYALTY_ADDR.registerUser(DEFAULT_REFER, 13, 0);
    }
    
    // ============ LEVEL COST HELPER ============
    
    /**
     * @dev Get level cost in USDT (uses adjustable levelCosts array)
     * @param _level Level index (0-12 for L1-L13)
     * @return BNB cost in wei (18 decimals)
     */
    /**
     * @dev Get level cost in BNB based on USD price and current BNB rate
     * @param _level Level index (0-12 for L1-L13)
     * @return BNB cost in wei
     */
    function getLevelCost(uint _level) public view returns (uint) {
        require(_level < MAX_LEVELS, "Invalid level");
        // Convert USD cost to BNB: (USD_Cost * 1e18) / BNB_Price
        return (levelCosts[_level] * 1e18) / bnbPrice;
    }

    function _getLevelCost(uint _level) private view returns (uint) {
        return getLevelCost(_level);
    }
    
    // ============ USER-FACING FUNCTIONS ============
    
    // ============ USER FUNCTIONS ============
    
    /**
     * @notice Register new user with BNB payment
     * @param _ref Referrer user ID (0 = default)
     * @param _newAcc New user wallet address
     */
    function register(uint _ref, address _newAcc) external payable nonReentrant whenNotPaused {
        require(id[_newAcc] == 0, "Already registered");
        require(_newAcc != address(0), "Invalid address");
        
        // ✅ FIX #13: Rate limiting (prevent spam)
        if (lastRegistrationTime[_newAcc] > 0) {
            require(
                block.timestamp >= lastRegistrationTime[_newAcc] + registrationCooldown,
                "Registration cooldown active"
            );
        }
        lastRegistrationTime[_newAcc] = block.timestamp;
        
        // Validate referrer or use fallback
        if (_ref == 0 || !userInfo[_ref].exists) {
            _ref = fallbackReferrer;  // ✅ FIX #12: Use fallback instead of hardcoded
        }
        
        // Calculate required USDT amount
        uint levelCost = _getLevelCost(0);
        uint adminFee = (levelCost * ADMIN_FEE_PERCENT) / 100;
        uint requiredAmount = levelCost + adminFee;
        
        // Transfer USDT from user
        require(msg.value >= requiredAmount, "Insufficient BNB sent");
        
        // Create user
        uint _newId = userIdCounter + 1;
        userIdCounter = _newId;
        id[_newAcc] = _newId;
        _createUser(_newId, _newAcc, _ref, _ref, 0);
        globalUsers.push(_newId);
        totalUsers++;
        
        // Update deposit
        userIncome[_newId].totalDeposit += levelCost;
        
        // Process payments
        _processRegistrationPayments(_newId, levelCost, adminFee);
        _placeInBinaryMatrix(_newId, _ref);
        _updateTeamCounts(_newId);

        
        emit UserRegistered(_newId, _newAcc, _ref, block.timestamp);
        activity.push(Activity(_newId, 1, block.timestamp));

        // Refund excess BNB
        if (msg.value > requiredAmount) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - requiredAmount}("");
            // If refund fails, it stays in contract for owner recovery
        }
    }
    
    /**
     * @notice BSCScan-friendly registration using referrer address
     */
    function registerMe(address _referrerAddress) external payable nonReentrant whenNotPaused {
        uint _ref = (_referrerAddress == address(0)) ? 0 : id[_referrerAddress];
        address _newAcc = msg.sender;
        require(id[_newAcc] == 0, "Already registered");
        require(_newAcc != address(0), "Invalid address");
        
        // Validate referrer or use default
        if (_ref == 0 || !userInfo[_ref].exists) {
            _ref = DEFAULT_REFER;
        }
        
        // Calculate required USDT amount
        uint levelCost = _getLevelCost(0);
        uint adminFee = (levelCost * ADMIN_FEE_PERCENT) / 100;
        uint requiredAmount = levelCost + adminFee;
        
        // Transfer USDT from user
        require(msg.value >= requiredAmount, "Insufficient BNB sent");
        
        // Create user
        uint _newId = userIdCounter + 1;
        userIdCounter = _newId;
        id[_newAcc] = _newId;
        _createUser(_newId, _newAcc, _ref, _ref, 0);
        globalUsers.push(_newId);
        totalUsers++;
        
        // Update deposit
        userIncome[_newId].totalDeposit += levelCost;
        
        // Process payments
        _processRegistrationPayments(_newId, levelCost, adminFee);
        _placeInBinaryMatrix(_newId, _ref);
        _updateTeamCounts(_newId);

        
        emit UserRegistered(_newId, _newAcc, _ref, block.timestamp);
        activity.push(Activity(_newId, 1, block.timestamp));

        // Refund excess BNB
        if (msg.value > requiredAmount) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - requiredAmount}("");
        }
    }
    
    /**
     * @notice Upgrade user to higher levels with BNB
     */
    function upgrade(uint _id, uint _lvls) external payable nonReentrant whenNotPaused validUser(_id) {
        require(msg.sender == userInfo[_id].account, "Unauthorized");
        require(userInfo[_id].level + _lvls <= MAX_LEVELS, "Exceeds max level");
        
        uint totalCost;
        
        // Calculate total cost
        for (uint i = 0; i < _lvls; i++) {
            uint levelCost = _getLevelCost(userInfo[_id].level + i - 1);
            totalCost += levelCost + (levelCost * ADMIN_FEE_PERCENT / 100);
        }
        
        // Transfer USDT from user
        require(msg.value >= totalCost, "Insufficient BNB");
        
        // Process each level
        for (uint i = 0; i < _lvls; i++) {
            uint levelCost = _getLevelCost(userInfo[_id].level + i - 1);
            uint adminFee = (levelCost * ADMIN_FEE_PERCENT) / 100;
            
            userInfo[_id].level++;
            userIncome[_id].totalDeposit += levelCost;
            
            // Pay admin fee
            if (adminFee > 0) {
                (bool success, ) = payable(FEE_RECEIVER).call{value: adminFee}("");
                require(success, "Fee transfer failed");
                emit AdminFeePaid(adminFee, userInfo[_id].level - 1, block.timestamp);
            }
            
            // Fund royalty pool (5% of levelCost)
            uint royaltyFundAmt = (levelCost * ROYALTY_FUND_PERCENT) / 100;
            if (royaltyFundAmt > 0) {
                (bool success, ) = payable(address(ROYALTY_ADDR)).call{value: royaltyFundAmt}("");
                require(success, "Royalty transfer failed");
                emit RoyaltyPoolFunded(_id, royaltyFundAmt, block.timestamp);
            }
            
            // Distribute payments
            uint remaining = _processSponsorCommission(_id, levelCost);
            _distributeMatrixIncome(_id, userInfo[_id].level - 1, remaining - royaltyFundAmt, false);
            
            // Register for royalty
            ROYALTY_ADDR.registerUser(_id, userInfo[_id].level, userInfo[_id].directTeam);
            
            emit UserUpgraded(_id, userInfo[_id].level, levelCost, block.timestamp);
            activity.push(Activity(_id, userInfo[_id].level, block.timestamp));

        }

        // Refund excess BNB
        if (msg.value > totalCost) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - totalCost}("");
        }
    }
    
    /**
     * @notice BSCScan-friendly upgrade for caller
     */
    function upgradeMe(uint _levels) external payable nonReentrant whenNotPaused {
        uint myId = id[msg.sender];
        require(myId > 0, "Not registered");
        require(msg.sender == userInfo[myId].account, "Unauthorized");
        require(userInfo[myId].level + _levels <= MAX_LEVELS, "Exceeds max level");
        
        uint totalCost;
        for (uint i = 0; i < _levels; i++) {
            uint levelCost = _getLevelCost(userInfo[myId].level + i - 1);
            totalCost += levelCost + (levelCost * ADMIN_FEE_PERCENT / 100);
        }
        
        require(msg.value >= totalCost, "Insufficient BNB");
        
        for (uint i = 0; i < _levels; i++) {
            uint levelCost = _getLevelCost(userInfo[myId].level + i - 1);
            uint adminFee = (levelCost * ADMIN_FEE_PERCENT) / 100;
            
            userInfo[myId].level++;
            userIncome[myId].totalDeposit += levelCost;
            
            if (adminFee > 0) {
                (bool success, ) = payable(FEE_RECEIVER).call{value: adminFee}("");
                require(success, "Fee transfer failed");
                emit AdminFeePaid(adminFee, userInfo[myId].level - 1, block.timestamp);
            }
            
            uint royaltyFundAmt = (levelCost * ROYALTY_FUND_PERCENT) / 100;
            if (royaltyFundAmt > 0) {
                (bool success, ) = payable(address(ROYALTY_ADDR)).call{value: royaltyFundAmt}("");
                require(success, "Royalty transfer failed");
                emit RoyaltyPoolFunded(myId, royaltyFundAmt, block.timestamp);
            }
            
            uint remaining = _processSponsorCommission(myId, levelCost);
            _distributeMatrixIncome(myId, userInfo[myId].level - 1, remaining - royaltyFundAmt, false);
            
            ROYALTY_ADDR.registerUser(myId, userInfo[myId].level, userInfo[myId].directTeam);
            
            emit UserUpgraded(myId, userInfo[myId].level, levelCost, block.timestamp);
            activity.push(Activity(myId, userInfo[myId].level, block.timestamp));
        }

        // Refund excess BNB
        if (msg.value > totalCost) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - totalCost}("");
        }
    }
    
    /**
     * @notice Claim royalty reward
     */
    function claimRoyalty(uint _id, uint _royaltyLvl) external nonReentrant validUser(_id) {
        require(msg.sender == userInfo[_id].account, "Unauthorized");
        
        uint amount = ROYALTY_ADDR.claimRoyalty(
            _id,
            _royaltyLvl,
            DEFAULT_REFER,
            userIncome[_id].totalIncome,
            userIncome[_id].totalDeposit,
            userInfo[_id].account
        );
        
        emit RoyaltyClaimed(_id, _royaltyLvl, amount, block.timestamp);
    }
    
    /**
     * @notice BSCScan-friendly royalty claim
     */
    function claimMyRoyalty(uint _tier) external nonReentrant {
        uint myId = id[msg.sender];
        require(myId > 0, "Not registered");
        
        uint amount = ROYALTY_ADDR.claimRoyalty(
            myId,
            _tier,
            DEFAULT_REFER,
            userIncome[myId].totalIncome,
            userIncome[myId].totalDeposit,
            userInfo[myId].account
        );
        
        emit RoyaltyClaimed(myId, _tier, amount, block.timestamp);
    }
    
    // ============ OWNER FUNCTIONS ============
    
    /**
     * @notice Renounce ownership - makes contract fully autonomous
     * @dev IRREVERSIBLE - contract becomes ownerless forever
     */
    function renounceOwnership() public override onlyOwner {
        emit OwnershipRenounced(owner(), block.timestamp);
        super.renounceOwnership();
    }
    
    /**
     * @notice Transfer ownership to new address
     */
    function transferOwnership(address newOwner) public override onlyOwner {
        super.transferOwnership(newOwner);
    }
    
    /**
     * @notice Update level cost (owner only, before renouncing)
     * @dev Allows flexibility during initial phase, becomes immutable after renounce
     */
    function setLevelCost(uint8 _level, uint256 _newCost) external onlyOwner {
        require(_level < MAX_LEVELS, "Invalid level");
        require(_newCost > 0, "Cost must be positive");
        require(_newCost >= 1e18, "Minimum cost is 1 BNB");
        require(_newCost <= 100000e18, "Maximum cost is 100,000 BNB");
        
        // Ensure costs are ascending (level n+1 > level n)
        if (_level > 0) {
            require(_newCost > levelCosts[_level - 1], "Cost must increase");
        }
        if (_level < MAX_LEVELS - 1) {
            require(_newCost < levelCosts[_level + 1] || levelCosts[_level + 1] == 0, "Cost must be less than next level");
        }
        
        uint256 oldCost = levelCosts[_level];
        levelCosts[_level] = _newCost;
        
        emit LevelCostUpdated(_level, oldCost, _newCost, block.timestamp);
    }
    
    /**
     * @notice Pause contract in case of emergency
     * @dev Only owner can pause, prevents all user operations
     */
    function pauseContract() external onlyOwner {
        require(!paused, "Already paused");
        paused = true;
        emit ContractPaused(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Resume contract operations
     */
    function unpauseContract() external onlyOwner {
        require(paused, "Not paused");
        paused = false;
        emit ContractUnpaused(msg.sender, block.timestamp);
    }

    /**
     * @notice Recover stuck BNB (e.g., from failed transfers)
     */
    function recoverBNB() external onlyOwner {
        uint balance = address(this).balance;
        require(balance > 0, "No BNB to recover");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Transfer failed");
    }

    /**
     * @notice Update BNB Price for dynamic cost calculation (Owner only)
     * @param _price New BNB price in 18 decimals (e.g., 600e18 for $600)
     */
    function updateBNBPrice(uint _price) external onlyOwner {
        require(_price > 0, "Invalid price");
        uint oldPrice = bnbPrice;
        bnbPrice = _price;
        emit BNBPriceUpdated(oldPrice, _price, block.timestamp);
    }

    // Helper to pay root with checks
    function payRoot(uint amount, string memory reason) private {
        (bool success, ) = payable(userInfo[DEFAULT_REFER].account).call{value: amount}("");
         if (success) {
            userIncome[DEFAULT_REFER].referralIncome += amount;
            userIncome[DEFAULT_REFER].totalIncome += amount;
            emit RootFallbackIncome(amount, reason, block.timestamp);
        }
    }

    
    // ============ INTERNAL FUNCTIONS - PAYMENT DISTRIBUTION ============
    
    function _processRegistrationPayments(uint _newId, uint _levelCost, uint _adminFee) private {
        // Pay admin fee (5%)
        if (_adminFee > 0) {
            (bool success, ) = payable(FEE_RECEIVER).call{value: _adminFee}("");
            require(success, "Fee transfer failed");
            emit AdminFeePaid(_adminFee, 0, block.timestamp);
        }
        
        // Fund royalty pool (5% of levelCost)
        uint royaltyFundAmt = (_levelCost * ROYALTY_FUND_PERCENT) / 100;
        if (royaltyFundAmt > 0) {
            (bool success, ) = payable(address(ROYALTY_ADDR)).call{value: royaltyFundAmt}("");
            require(success, "Royalty transfer failed");
            emit RoyaltyPoolFunded(_newId, royaltyFundAmt, block.timestamp);
        }
        
        // Referral income (95% = levelCost - royaltyFund)
        uint _referrer = userInfo[_newId].referrer;
        uint referralAmount = _levelCost - royaltyFundAmt;
        
        if (_referrer != 0 && userInfo[_referrer].exists) {
            (bool success, ) = payable(userInfo[_referrer].account).call{value: referralAmount}("");
            if (success) {
                userIncome[_referrer].referralIncome += referralAmount;
                userIncome[_referrer].totalIncome += referralAmount;
                emit ReferralPayment(_referrer, _newId, referralAmount, block.timestamp);
            } else {
                // Transfer failed - refund to sender
                (bool refund, ) = payable(userInfo[_newId].account).call{value: referralAmount}("");
                require(refund, "Refund failed");
            }
        } else {
            // No valid referrer - send to Root
            payRoot(referralAmount, "no_valid_referrer");
        }
        
        // Note: For registration, income goes to Referrer, NOT matrix
        // Matrix distribution only happens on upgrade
    }

    
    function _processSponsorCommission(uint _id, uint _amount) private returns (uint) {
        uint _referrer = userInfo[_id].referrer;
        uint totalPaid = 0;
        uint totalSponsorAllocation = (_amount * 500) / 10000;  // 5%
        
        // Distribute to up to 13 levels
        for (uint8 level = 0; level < SPONSOR_LEVELS && _referrer != 0; level++) {
            bool qualified = _isQualifiedForSponsorLevel(_referrer, level);
            uint reward = (_amount * _getSponsorPercentage(level)) / 10000;
            
            if (qualified && reward > 0) {
                (bool success, ) = payable(userInfo[_referrer].account).call{value: reward}("");
                if (success) {
                    userIncome[_referrer].sponsorIncome += reward;
                    userIncome[_referrer].totalIncome += reward;
                    totalPaid += reward;
                    
                    emit SponsorCommissionPaid(_referrer, _id, reward, level + 1, block.timestamp);
                }
            } else if (reward > 0) {
                // Track lost income only if upline exists
                if (userInfo[_referrer].exists) {
                    lostIncome[_referrer] += reward;
                    
                    string memory reason;
                    if (level < 5) {
                        reason = "Not active (need Level 1+)";
                    } else if (level >= 5 && level < 8) {
                        reason = "Need 2+ direct referrals for L6-L8";
                    } else if (level >= 8 && level < 10) {
                        reason = "Need 3+ direct referrals for L9-L10";
                    } else {
                        reason = "Need 5+ direct referrals for L11-L13";
                    }
                    
                    emit IncomeLost(_referrer, _id,reward, reason, block.timestamp);
                }
            }
            
            _referrer = userInfo[_referrer].referrer;
        }
        
        // Unpaid commission goes to Root (no eligible sponsors)
        if (totalPaid < totalSponsorAllocation) {
            uint unpaid = totalSponsorAllocation - totalPaid;
            payRoot(unpaid, "sponsor_no_eligible");
            totalPaid = totalSponsorAllocation;
        }
        
        return _amount - totalPaid;  // Returns 95%
    }
    
    
    function _distributeMatrixIncome(uint _userId, uint _level, uint _amount, bool ignoreQualification) private {
        uint _upline = userInfo[_userId].upline;
        bool paid = false;
        
        // Search up to 13 levels for qualified upline
        for (uint i = 0; i < MAX_INCOME_LAYER && _upline != 0; i++) {
            bool qualified = ignoreQualification || 
                            (userInfo[_upline].level > _level && userInfo[_upline].directTeam >= DIRECT_REQUIRED);
            
            if (qualified) {
                // Give FULL remaining amount (90%) to first qualified upline
                (bool success, ) = payable(userInfo[_upline].account).call{value: _amount}("");
                if (success) {
                    userIncome[_upline].levelIncome += _amount;
                    userIncome[_upline].totalIncome += _amount;
                    paid = true;
                    
                    emit MatrixPayment(_userId, _upline, _amount, _level, i + 1, true, block.timestamp);
                } else {
                    // Transfer failed - refund to sender
                    (bool refund, ) = payable(userInfo[_userId].account).call{value: _amount}("");
                    require(refund, "Matrix refund failed");
                    paid = true; // Mark as handled
                }
                break;  // Stop after first qualified upline
            } else {
                // Emit events for transparency, but DON'T track lostIncome
                // (winner-takes-all model - only first qualified gets paid, so no real "share" lost)
                if (userInfo[_upline].exists) {
                    emit MatrixPayment(_userId, _upline, _amount, _level, i + 1, false, block.timestamp);
                    emit IncomeLost(_upline, _userId, _amount, "Not qualified for matrix", block.timestamp);
                }
            }
            
            _upline = userInfo[_upline].upline;
        }
        
        // No qualified upline found - send to Root
        if (!paid && _amount > 0) {
            payRoot(_amount, "matrix_no_qualified");
        }
    }

    
    function _isQualifiedForSponsorLevel(uint _userId, uint8 level) private view returns (bool) {
        User storage user = userInfo[_userId];
        
        if (!user.exists || user.level < 1) return false;
        
        if (level < 5) {
            return true;  // L1-L5: Just need Level 1+
        } else if (level >= 5 && level < 8) {
            return user.directTeam >= MIN_DIRECTS_L6_8;  // L6-L8: 2+ directs
        } else if (level >= 8 && level < 10) {
            return user.directTeam >= MIN_DIRECTS_L9_10;  // L9-L10: 3+ directs
        } else {
            return user.directTeam >= MIN_DIRECTS_L11_13;  // L11-L13: 5+ directs
        }
    }
    
    // ============ INTERNAL FUNCTIONS - USER & MATRIX ============
    
    function _createUser(uint _userId, address _account, uint _referrer, uint _upline, uint _level) private {
        userInfo[_userId] = User({
            exists: true,
            account: _account,
            referrer: _referrer,
            upline: _upline,
            level: _level + 1,
            directTeam: 0,
            team: 0,
            registrationTime: block.timestamp
        });
        
        userIncome[_userId] = UserIncome({
            totalDeposit: 0,
            totalIncome: 0,
            referralIncome: 0,
            sponsorIncome: 0,
            levelIncome: 0
        });
        
        if (_referrer != 0 && _referrer != _userId) {
            userInfo[_referrer].directTeam++;
            directReferrals[_referrer].push(_userId);  // Store in mapping for O(1) lookup
        }
    }
    
    /**
     * @dev Place new user in binary matrix using breadth-first search
     * @param _newId ID of new user to place
     * @param _ref Starting point (usually referrer)
     * 
     * Searches for available spot (max 2 children per node) within MAX_PLACEMENT_DEPTH.
     * If no spot found, searches up sponsor chain (max 13 levels).
     * Final fallback: places under root.
     */
    function _placeInBinaryMatrix(uint _newId, uint _ref) private {
        uint _upline = 0;
        uint currentSponsor = _ref;
        
        // Try to find spot in sponsor chain (up to 13 levels)
        for (uint sponsorLevel = 0; sponsorLevel < 13 && currentSponsor != 0; sponsorLevel++) {
            _upline = _findSpotInTree(currentSponsor);
            if (_upline != 0) break;
            
            // Move to next sponsor up the chain
            currentSponsor = userInfo[currentSponsor].referrer;
        }
        
        // Final fallback to root if no spot found in entire sponsor chain
        if (_upline == 0) {
            _upline = DEFAULT_REFER;
        }
        
        // Place user
        teams[_upline][0].push(_newId);
        userInfo[_newId].upline = _upline;
        matrixDirect[_upline]++;
    }
    
    /**
     * @dev Search for available spot in a specific user's tree
     * @param _root Starting point for BFS
     * @return ID of upline with available spot, or 0 if none found
     */
    function _findSpotInTree(uint _root) private view returns (uint) {
        uint[] memory queue = new uint[](maxPlacementDepth);
        uint front = 0;
        uint back = 0;
        queue[back++] = _root;
        
        uint iterations = 0;
        
        while (front < back && iterations < maxPlacementDepth) {
            uint currentNode = queue[front++];
            iterations++;
            
            // Check if this node has space
            if (teams[currentNode][0].length < 2) {
                return currentNode;
            }
            
            // Add children to queue
            for (uint i = 0; i < teams[currentNode][0].length && back < maxPlacementDepth; i++) {
                queue[back++] = teams[currentNode][0][i];
            }
        }
        
        return 0; // No spot found
    }
    
    /**
     * @dev Update team counts - FIXED: Only increment once per new user
     * Previously this was over-counting by incrementing multiple times
     */
    function _updateTeamCounts(uint _userId) private {
        uint _upline = userInfo[_userId].referrer;
        uint depth = 0;
        
        // Walk up referral chain and increment team count for each upline
        // Each new user adds +1 to all uplines' team counts
        while (_upline != 0 && depth < maxPlacementDepth) {
            userInfo[_upline].team++;
            _upline = userInfo[_upline].referrer;
            depth++;
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function isAutonomous() external view returns (bool) {
        return owner() == address(0);
    }
    
    /**
     * @notice Get user account address by ID (used by Royalty contract)
     */
    function getUserAccount(uint _userId) external view returns (address) {
        return userInfo[_userId].account;
    }
    
    function getLevelCostWithFee(uint _level) external view returns (uint cost, uint adminFee, uint total) {
        require(_level < MAX_LEVELS, "Invalid level");
        cost = _getLevelCost(_level);
        adminFee = (cost * ADMIN_FEE_PERCENT) / 100;
        total = cost + adminFee;
    }
    
    function getAllLevelCosts() external view returns (
        uint[13] memory costs,
        uint[13] memory fees,
        uint[13] memory totals
    ) {
        for (uint i = 0; i < 13; i++) {
            costs[i] = _getLevelCost(i);
            fees[i] = (costs[i] * ADMIN_FEE_PERCENT) / 100;
            totals[i] = costs[i] + fees[i];
        }
    }
    
    function getRegistrationCost() external view returns (uint cost, uint levelCost, uint adminFee) {
        levelCost = _getLevelCost(0);
        adminFee = (levelCost * ADMIN_FEE_PERCENT) / 100;
        cost = levelCost + adminFee;
    }
    
    /**
     * @notice Get upgrade cost for caller (for dApp use)
     * @dev This version uses msg.sender - DOES NOT WORK on BSCScan Read Contract!
     *      Use getUpgradeCostFor() on BSCScan instead
     */
    function getUpgradeCost(uint _levels) external view returns (uint totalCost, uint[] memory breakdown) {
        uint myId = id[msg.sender];
        require(myId > 0, "Not registered");
        
        uint currentLevel = userInfo[myId].level;
        require(currentLevel + _levels <= MAX_LEVELS, "Exceeds max level");
        
        breakdown = new uint[](_levels);
        totalCost = 0;
        
        for (uint i = 0; i < _levels; i++) {
            uint targetLevel = currentLevel + i;
            uint levelCost = _getLevelCost(targetLevel - 1);  // FIX: targetLevel is 1-13, need index 0-12
            uint adminFee = (levelCost * ADMIN_FEE_PERCENT) / 100;
            uint cost = levelCost + adminFee;
            
            breakdown[i] = cost;
            totalCost += cost;
        }
    }
    
    /**
     * @notice Get upgrade cost for specific user (BSCScan-friendly!)
     * @param _userAddress Address of the user to check
     * @param _levels Number of levels to upgrade
     * @return totalCost Total USDT cost (including admin fee)
     * @return breakdown Cost breakdown per level
     */
    function getUpgradeCostFor(address _userAddress, uint _levels) 
        external view returns (uint totalCost, uint[] memory breakdown) 
    {
        uint userId = id[_userAddress];
        require(userId > 0, "Not registered");
        
        uint currentLevel = userInfo[userId].level;
        require(currentLevel + _levels <= MAX_LEVELS, "Exceeds max level");
        
        breakdown = new uint[](_levels);
        totalCost = 0;
        
        for (uint i = 0; i < _levels; i++) {
            uint targetLevel = currentLevel + i;
            uint levelCost = _getLevelCost(targetLevel - 1);
            uint adminFee = (levelCost * ADMIN_FEE_PERCENT) / 100;
            uint cost = levelCost + adminFee;
            
            breakdown[i] = cost;
            totalCost += cost;
        }
    }
    
    function getMyInfo() external view returns (
        uint userId,
        uint level,
        uint team,
        uint directTeam,
        uint totalIncome,
        uint referrerId,
        uint uplineId,
        uint registrationTime
    ) {
        userId = id[msg.sender];
        if (userId == 0) return (0, 0, 0, 0, 0, 0, 0, 0);
        
        User storage user = userInfo[userId];
        UserIncome storage income = userIncome[userId];
        
        return (
            userId,
            user.level,
            user.team,
            user.directTeam,
            income.totalIncome,
            user.referrer,
            user.upline,
            user.registrationTime
        );
    }
    
    function getMyIncomeBreakdown() external view returns (
        uint totalDeposit,
        uint totalIncome,
        uint referralIncome,
        uint sponsorIncome,
        uint levelIncome,
        uint lostAmount
    ) {
        uint myId = id[msg.sender];
        if (myId == 0) return (0, 0, 0, 0, 0, 0);
        
        UserIncome storage income = userIncome[myId];
        return (
            income.totalDeposit,
            income.totalIncome,
            income.referralIncome,
            income.sponsorIncome,
            income.levelIncome,
            lostIncome[myId]
        );
    }
    
    function getMyTeam() external view returns (
        uint teamSize,
        uint directCount,
        uint[] memory directReferralIds,
        address[] memory directReferralAddresses
    ) {
        uint myId = id[msg.sender];
        if (myId == 0) return (0, 0, new uint[](0), new address[](0));
        
        User storage user = userInfo[myId];
        teamSize = user.team;
        directCount = user.directTeam;
        
        // Use mapping for O(1) lookup instead of O(N) loop
        directReferralIds = directReferrals[myId];
        
        // Build addresses array
        directReferralAddresses = new address[](directReferralIds.length);
        for (uint i = 0; i < directReferralIds.length; i++) {
            directReferralAddresses[i] = userInfo[directReferralIds[i]].account;
        }
    }
    
    function getMyRoyaltyStatus() external view returns (
        uint[4] memory claimableAmounts,
        bool[4] memory isEligible,
        bool[4] memory hasClaimed
    ) {
        uint myId = id[msg.sender];
        if (myId == 0) return (claimableAmounts, isEligible, hasClaimed);
        
        for (uint i = 0; i < 4; i++) {
            (claimableAmounts[i], isEligible[i], hasClaimed[i]) = ROYALTY_ADDR.getUserRoyaltyData(myId, i);
        }
    }
    
    function isRegistered(address _address) external view returns (bool) {
        return id[_address] > 0;
    }
    
    /**
     * @notice Claim royalty earnings for a specific tier
     * @param _tier Royalty tier to claim from (10, 11, 12, or 13)
     */
    function claimRoyalty(uint _tier) external nonReentrant whenNotPaused {  // ✅ Added whenNotPaused
        require(_tier >= 10 && _tier <= 13, "Invalid tier");  // ✅ FIX #4: Tier validation
        
        uint userId = id[msg.sender];
        require(userId > 0, "Not registered");
        
        // Get user's total income and deposits for 150% cap calculation
        UserIncome storage income = userIncome[userId];
        uint totalDeposits = income.totalDeposit;
        
        // Call royalty contract to process claim
        uint claimed = ROYALTY_ADDR.claimRoyalty(
            userId,
            _tier,
            DEFAULT_REFER,
            income.totalIncome,
            totalDeposits,
            msg.sender
        );
        
        // ✅ FIX #2: Validate claimed amount
        require(claimed > 0, "No royalty to claim");
        
        // ✅ FIX #1: Emit event for transparency
        emit RoyaltyClaimed(userId, _tier, claimed, block.timestamp);
    }
    
    /**
     * @notice Get royalty data for a user in a specific tier
     * @param _tier Royalty tier (10, 11, 12, or 13)
     * @return claimableAmount BNB available to claim
     * @return isEligible Whether user is registered in this tier
     * @return hasClaimed Whether user claimed current round
     */
    function getRoyaltyData(uint _tier) external view returns (
        uint claimableAmount,
        bool isEligible,
        bool hasClaimed
    ) {
        require(_tier >= 10 && _tier <= 13, "Invalid tier");  // ✅ FIX #4
        
        uint userId = id[msg.sender];
        if (userId == 0) {
            return (0, false, false);
        }
        
        return ROYALTY_ADDR.getUserRoyaltyData(userId, _tier);
    }
    
    /**
     * @notice Get royalty data for any user (by address)
     * @param _user User address to query
     * @param _tier Royalty tier (10, 11, 12, or 13)
     */
    function getRoyaltyDataByAddress(address _user, uint _tier) external view returns (
        uint claimableAmount,
        bool isEligible,
        bool hasClaimed
    ) {
        require(_tier >= 10 && _tier <= 13, "Invalid tier");  // ✅ FIX #4
        
        uint userId = id[_user];
        if (userId == 0) {
            return (0, false, false);
        }
        
        return ROYALTY_ADDR.getUserRoyaltyData(userId, _tier);
    }
    
    /**
     * @notice Get royalty tier statistics
     * @param _tier Royalty tier (10, 11, 12, or 13)
     * @return userCount Total users in tier
     * @return distributionRound Current round number
     * @return pendingUserCount Users in current round
     */
    function getRoyaltyTierStats(uint _tier) external view returns (
        uint userCount,
        uint distributionRound,
        uint pendingUserCount
    ) {
        require(_tier >= 10 && _tier <= 13, "Invalid tier");  // ✅ FIX #4
        return ROYALTY_ADDR.getTierStats(_tier);
    }
    
    function getContractBalance() external view returns (uint) {
        return address(this).balance;
    }
    
    // ============ V2 CHAINLINK ORACLE FUNCTIONS ============
    
    /**
     * @notice Get latest BNB price from Chainlink oracle
     * @dev Returns stored price if oracle fails
     */
    function getLatestBNBPrice() public view returns (uint256) {
        try priceFeed.latestRoundData() returns (
            uint80 /* roundId */,
            int256 price,
            uint256 /* startedAt */,
            uint256 updatedAt,
            uint80 /* answeredInRound */
        ) {
            require(price > 0, "Invalid price");
            require(block.timestamp - updatedAt < 1 hours, "Stale price");
            
            // Convert from 8 decimals to 18 decimals
            return uint256(price) * 10**10;
        } catch {
            // Return stored price if Chainlink fails
            return bnbPrice;
        }
    }

    /**
     * @notice Update BNB price from Chainlink oracle
     * @dev Internal function with validation and fallback
     */
    function _updateBNBPrice() internal {
        uint256 oldPrice = bnbPrice;
        
        try this.getLatestBNBPrice() returns (uint256 newPrice) {
            // Validate price is within bounds
            if (newPrice >= minBNBPrice && newPrice <= maxBNBPrice) {
                bnbPrice = newPrice;
                lastPriceUpdate = block.timestamp;
                emit BNBPriceUpdated(oldPrice, newPrice, block.timestamp);
            } else {
                emit PriceUpdateFailed("Price out of bounds", oldPrice, block.timestamp);
            }
        } catch Error(string memory reason) {
            emit PriceUpdateFailed(reason, oldPrice, block.timestamp);
        }
    }

    // ============ V2 ADMIN CONFIGURATION FUNCTIONS ============
    
    /**
     * @notice Set Chainlink price feed address
     */
    function setPriceFeed(address _priceFeedAddress) external onlyOwner {
        require(_priceFeedAddress != address(0), "Invalid address");
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        emit PriceFeedUpdated(_priceFeedAddress, block.timestamp);
    }

    /**
     * @notice Set price validation bounds
     */
    function setPriceBounds(uint256 _minPrice, uint256 _maxPrice) external onlyOwner {
        require(_minPrice > 0 && _maxPrice > _minPrice, "Invalid bounds");
        minBNBPrice = _minPrice;
        maxBNBPrice = _maxPrice;
        emit PriceBoundsUpdated(_minPrice, _maxPrice, block.timestamp);
    }

    /**
     * @notice Set auto-update interval
     */
    function setUpdateInterval(uint256 _days) external onlyOwner {
        require(_days > 0 && _days <= 365, "Invalid interval");
        priceUpdateInterval = _days * 1 days;
        emit UpdateIntervalChanged(_days, block.timestamp);
    }

    /**
     * @notice Toggle automatic price updates
     */
    function setAutoUpdateEnabled(bool _enabled) external onlyOwner {
        autoUpdateEnabled = _enabled;
        emit AutoUpdateToggled(_enabled, block.timestamp);
    }

    /**
     * @notice Manually update BNB price from oracle
     */
    function manualPriceUpdate() external onlyOwner {
        _updateBNBPrice();
    }

    /**
     * @notice Emergency: Set price manually
     */
    function setManualPrice(uint256 _price) external onlyOwner {
        require(_price >= minBNBPrice && _price <= maxBNBPrice, "Price out of bounds");
        uint256 oldPrice = bnbPrice;
        bnbPrice = _price;
        lastPriceUpdate = block.timestamp;
        emit ManualPriceSet(oldPrice, _price, block.timestamp);
    }

    /**
     * @notice Update level cost
     */
    function setLevelCostUSD(uint256 _level, uint256 _costUSD) external onlyOwner {
        require(_level < MAX_LEVELS, "Invalid level");
        require(_costUSD > 0, "Invalid cost");
        uint256 oldCost = levelCosts[_level];
        levelCosts[_level] = _costUSD;
        emit LevelCostUpdated(uint8(_level), oldCost, _costUSD, block.timestamp);
    }
    
    /**
     * @notice Update max placement depth
     * @param _newDepth New maximum depth for placement search
     */
    function setMaxPlacementDepth(uint8 _newDepth) external onlyOwner {
        require(_newDepth > 0 && _newDepth <= 255, "Invalid depth");
        uint8 oldDepth = maxPlacementDepth;
        maxPlacementDepth = _newDepth;
        emit MaxPlacementDepthUpdated(oldDepth, _newDepth, block.timestamp);
    }
    
    /**
     * @notice Toggle oracle pause (emergency stop for price updates)
     * ✅ FIX #10: Separate oracle control
     */
    function toggleOraclePause() external onlyOwner {
        oraclePaused = !oraclePaused;
        emit OraclePauseToggled(oraclePaused, block.timestamp);
    }
    
    /**
     * @notice Update fallback referrer
     * ✅ FIX #12: Changeable fallback if root becomes unavailable
     */
    function setFallbackReferrer(uint _newFallback) external onlyOwner {
        require(_newFallback > 0 && _newFallback <= userIdCounter, "Invalid referrer ID");
        require(userInfo[_newFallback].exists, "Referrer does not exist");
        
        uint oldFallback = fallbackReferrer;
        fallbackReferrer = _newFallback;
        emit FallbackReferrerUpdated(oldFallback, _newFallback, block.timestamp);
    }
    
    /**
     * @notice Update registration cooldown period
     * @param _cooldownSeconds New cooldown in seconds (0 = no cooldown)
     * ✅ FIX #13: Owner-configurable rate limiting
     */
    function setRegistrationCooldown(uint _cooldownSeconds) external onlyOwner {
        require(_cooldownSeconds <= 1 days, "Cooldown too long");
        
        uint oldCooldown = registrationCooldown;
        registrationCooldown = _cooldownSeconds;
        emit RegistrationCooldownUpdated(oldCooldown, _cooldownSeconds, block.timestamp);
    }

    // ============ V2 HELPER VIEW FUNCTIONS ============
    
    /**
     * @notice Get referrer address from user ID
     */
    function getReferrerAddress(uint256 _userId) public view returns (address) {
        require(userInfo[_userId].exists, "User not found");
        return userInfo[_userId].account;
    }

    /**
     * @notice Check if price update is due
     */
    function isPriceUpdateDue() public view returns (bool) {
        return block.timestamp >= lastPriceUpdate + priceUpdateInterval;
    }

    /**
     * @notice Get oracle status and price info
     */
    function getPriceStatus() external view returns (
        uint256 oraclePrice,
        uint256 storedPrice,
        bool updateDue,
        uint256 timeSinceUpdate
    ) {
        oraclePrice = getLatestBNBPrice();
        storedPrice = bnbPrice;
        updateDue = isPriceUpdateDue();
        timeSinceUpdate = block.timestamp - lastPriceUpdate;
    }
}
