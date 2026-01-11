// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.20;

/**
 * @title RideBNB - USDT-Only Global Matrix
 * @notice Fully autonomous contract with hardcoded economics
 * @dev Owner can renounce to make fully decentralized
 */

// USDT Token Interface
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

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

contract RideBNB {
    // ============ IMMUTABLE VALUES (SET AT DEPLOYMENT) ============
    
    address public immutable FEE_RECEIVER;
    IERC20 public immutable USDT;
    IRoyalty public immutable ROYALTY_ADDR;
    uint private immutable DEFAULT_REFER;
    uint public immutable START_TIME;
    
    // ============ CONSTANTS (HARDCODED FOREVER) ============
    
    // System constants
    uint8 public constant MAX_LEVELS = 13;
    uint8 public constant MAX_INCOME_LAYER = 20;  // Income distribution depth
    uint8 public constant MAX_PLACEMENT_DEPTH = 100;  // Placement search depth
    // Note: If tree depth exceeds 100, placement falls back to root (DEFAULT_REFER)
    // This prevents infinite loops but may cluster users under root in very large trees
    
    // Economic constants (adjustable by owner until renounced)
    uint8 public constant ADMIN_FEE_PERCENT = 5;      // 5% admin fee
    uint8 public constant ROYALTY_FUND_PERCENT = 5;   // 5% to royalty pool
    
    // Level costs (adjustable by owner, immutable after renounce)
    // Starting costs: L1=$5, L2=$10, L3=$20... up to L13=$20,480 (hardcoded initially)
    uint256[13] public levelCosts = [
        5e18,      // L1: $5
        10e18,     // L2: $10  
        20e18,     // L3: $20
        40e18,     // L4: $40
        80e18,     // L5: $80
        160e18,    // L6: $160
        320e18,    // L7: $320
        640e18,    // L8: $640
        1280e18,   // L9: $1,280
        2560e18,   // L10: $2,560
        5120e18,   // L11: $5,120
        10240e18,  // L12: $10,240
        20480e18   // L13: $20,480
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
    
    // Owner (can renounce)
    address public owner;
    
    // Reentrancy guard (improved pattern)
    uint256 private unlocked = 1;
    
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
    event RoyaltyClaimed(uint indexed userId, uint indexed royaltyLevel, uint amount, uint timestamp);
    
    // Ownership
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnershipRenounced(address indexed previousOwner, uint timestamp);
    event LevelCostUpdated(uint8 indexed level, uint256 oldCost, uint256 newCost, uint timestamp);
    
    // ============ MODIFIERS ============
    
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
    
    modifier validUser(uint _userId) {
        require(_userId > 0 && userInfo[_userId].exists, "Invalid user ID");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        address _feeReceiver,
        address _royalty,
        address _rootUserAddress,
        uint _rootUserId,
        address _usdtToken
    ) {
        require(_feeReceiver != address(0), "Invalid fee receiver");
        require(_royalty != address(0), "Invalid royalty");
        require(_rootUserAddress != address(0), "Invalid root address");
        require(_rootUserId > 0, "Invalid root user ID");
        require(_usdtToken != address(0), "Invalid USDT");
        
        // Set immutables
        FEE_RECEIVER = _feeReceiver;
        ROYALTY_ADDR = IRoyalty(_royalty);
        DEFAULT_REFER = _rootUserId;
        START_TIME = block.timestamp;
        USDT = IERC20(_usdtToken);
        
        // Set owner
        owner = msg.sender;
        
        // Initialize root user
        userIdCounter = DEFAULT_REFER;
        id[_rootUserAddress] = DEFAULT_REFER;
        _createUser(DEFAULT_REFER, _rootUserAddress, DEFAULT_REFER, DEFAULT_REFER, 12);
        globalUsers.push(DEFAULT_REFER);
        totalUsers = 1;
        // Root user already has level 13 from _createUser (12 + 1)
        
        // Register root to all royalty tiers
        ROYALTY_ADDR.registerUser(DEFAULT_REFER, 10, 0);
        ROYALTY_ADDR.registerUser(DEFAULT_REFER, 11, 0);
        ROYALTY_ADDR.registerUser(DEFAULT_REFER, 12, 0);
        ROYALTY_ADDR.registerUser(DEFAULT_REFER, 13, 0);
        
        emit RootUserCreated(DEFAULT_REFER, _rootUserAddress, block.timestamp);
        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    // ============ LEVEL COST HELPER ============
    
    /**
     * @dev Get level cost in USDT (uses adjustable levelCosts array)
     * @param _level Level index (0-12 for L1-L13)
     * @return USDT cost in wei (18 decimals)
     */
    function _getLevelCost(uint _level) private view returns (uint) {
        require(_level < MAX_LEVELS, "Invalid level");
        return levelCosts[_level];
    }
    
    // ============ USER-FACING FUNCTIONS ============
    
    /**
        if (_level == 7) return 320e18;     // $320
        if (_level == 8) return 640e18;     // $640
        if (_level == 9) return 1320e18;    // $1,320
        if (_level == 10) return 2740e18;   // $2,740
        if (_level == 11) return 5480e18;   // $5,480
        if (_level == 12) return 10960e18;  // $10,960
        revert("Invalid level");
    }
    
    // ============ USER FUNCTIONS ============
    
    /**
     * @notice Register new user with USDT payment
     * @param _ref Referrer user ID (0 = default)
     * @param _newAcc New user wallet address
     */
    function register(uint _ref, address _newAcc) external nonReentrant {
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
        require(
            USDT.transferFrom(msg.sender, address(this), requiredAmount),
            "USDT transfer failed"
        );
        
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
    }
    
    /**
     * @notice BSCScan-friendly registration using referrer address
     */
    function registerMe(address _referrerAddress) external {
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
        require(
            USDT.transferFrom(msg.sender, address(this), requiredAmount),
            "USDT transfer failed"
        );
        
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
    }
    
    /**
     * @notice Upgrade user to higher levels with USDT
     */
    function upgrade(uint _id, uint _lvls) external nonReentrant validUser(_id) {
        require(msg.sender == userInfo[_id].account, "Unauthorized");
        require(userInfo[_id].level + _lvls <= MAX_LEVELS, "Exceeds max level");
        
        uint totalCost;
        
        // Calculate total cost
        for (uint i = 0; i < _lvls; i++) {
            uint levelCost = _getLevelCost(userInfo[_id].level + i - 1);
            totalCost += levelCost + (levelCost * ADMIN_FEE_PERCENT / 100);
        }
        
        // Transfer USDT from user
        require(USDT.transferFrom(msg.sender, address(this), totalCost), "USDT transfer failed");
        
        // Process each level
        for (uint i = 0; i < _lvls; i++) {
            uint levelCost = _getLevelCost(userInfo[_id].level + i - 1);
            uint adminFee = (levelCost * ADMIN_FEE_PERCENT) / 100;
            
            userInfo[_id].level++;
            userIncome[_id].totalDeposit += levelCost;
            
            // Pay admin fee
            if (adminFee > 0) {
                require(USDT.transfer(FEE_RECEIVER, adminFee), "Admin fee failed");
                emit AdminFeePaid(adminFee, userInfo[_id].level - 1, block.timestamp);
            }
            
            // Fund royalty pool (5% of levelCost)
            uint royaltyFundAmt = (levelCost * ROYALTY_FUND_PERCENT) / 100;
            if (royaltyFundAmt > 0) {
                require(USDT.transfer(address(ROYALTY_ADDR), royaltyFundAmt), "Royalty fund failed");
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
    }
    
    /**
     * @notice BSCScan-friendly upgrade for caller
     */
    function upgradeMe(uint _levels) external {
        uint myId = id[msg.sender];
        require(myId > 0, "Not registered");
        require(msg.sender == userInfo[myId].account, "Unauthorized");
        require(userInfo[myId].level + _levels <= MAX_LEVELS, "Exceeds max level");
        
        uint totalCost;
        for (uint i = 0; i < _levels; i++) {
            uint levelCost = _getLevelCost(userInfo[myId].level + i - 1);
            totalCost += levelCost + (levelCost * ADMIN_FEE_PERCENT / 100);
        }
        
        require(USDT.transferFrom(msg.sender, address(this), totalCost), "USDT transfer failed");
        
        for (uint i = 0; i < _levels; i++) {
            uint levelCost = _getLevelCost(userInfo[myId].level + i - 1);
            uint adminFee = (levelCost * ADMIN_FEE_PERCENT) / 100;
            
            userInfo[myId].level++;
            userIncome[myId].totalDeposit += levelCost;
            
            if (adminFee > 0) {
                require(USDT.transfer(FEE_RECEIVER, adminFee), "Admin fee failed");
                emit AdminFeePaid(adminFee, userInfo[myId].level - 1, block.timestamp);
            }
            
            uint royaltyFundAmt = (levelCost * ROYALTY_FUND_PERCENT) / 100;
            if (royaltyFundAmt > 0) {
                require(USDT.transfer(address(ROYALTY_ADDR), royaltyFundAmt), "Royalty fund failed");emit RoyaltyPoolFunded(myId, royaltyFundAmt, block.timestamp);
            }
            
            uint remaining = _processSponsorCommission(myId, levelCost);
            _distributeMatrixIncome(myId, userInfo[myId].level - 1, remaining - royaltyFundAmt, false);
            
            ROYALTY_ADDR.registerUser(myId, userInfo[myId].level, userInfo[myId].directTeam);
            
            emit UserUpgraded(myId, userInfo[myId].level, levelCost, block.timestamp);
            activity.push(Activity(myId, userInfo[myId].level, block.timestamp));
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
    function renounceOwnership() external onlyOwner {
        emit OwnershipRenounced(owner, block.timestamp);
        owner = address(0);
    }
    
    /**
     * @notice Transfer ownership to new address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    /**
     * @notice Update level cost (owner only, before renouncing)
     * @dev Allows flexibility during initial phase, becomes immutable after renounce
     */
    function setLevelCost(uint8 _level, uint256 _newCost) external onlyOwner {
        require(_level < MAX_LEVELS, "Invalid level");
        require(_newCost > 0, "Cost must be positive");
        require(_newCost >= 1e18, "Minimum cost is 1 USDT");
        require(_newCost <= 100000e18, "Maximum cost is 100,000 USDT");
        
        uint256 oldCost = levelCosts[_level];
        levelCosts[_level] = _newCost;
        
        emit LevelCostUpdated(_level, oldCost, _newCost, block.timestamp);
    }
    
    // ============ INTERNAL FUNCTIONS - PAYMENT DISTRIBUTION ============
    
    function _processRegistrationPayments(uint _newId, uint _levelCost, uint _adminFee) private {
        // Pay admin fee (5%)
        if (_adminFee > 0) {
            require(USDT.transfer(FEE_RECEIVER, _adminFee), "Admin fee failed");
            emit AdminFeePaid(_adminFee, 0, block.timestamp);
        }
        
        // Fund royalty pool (5% of levelCost)
        uint royaltyFundAmt = (_levelCost * ROYALTY_FUND_PERCENT) / 100;
        if (royaltyFundAmt > 0) {
            require(USDT.transfer(address(ROYALTY_ADDR), royaltyFundAmt), "Royalty fund failed");
            emit RoyaltyPoolFunded(_newId, royaltyFundAmt, block.timestamp);
        }
        
        // Referral income (95% = levelCost - royaltyFund)
        uint _referrer = userInfo[_newId].referrer;
        uint referralAmount = _levelCost - royaltyFundAmt;
        
        if (_referrer != 0 && userInfo[_referrer].exists) {
            require(USDT.transfer(userInfo[_referrer].account, referralAmount), "Referral failed");
            userIncome[_referrer].referralIncome += referralAmount;
            userIncome[_referrer].totalIncome += referralAmount;
            emit ReferralPayment(_referrer, _newId, referralAmount, block.timestamp);
        } else {
            require(USDT.transfer(userInfo[DEFAULT_REFER].account, referralAmount), "Default referral failed");
            userIncome[DEFAULT_REFER].referralIncome += referralAmount;
            userIncome[DEFAULT_REFER].totalIncome += referralAmount;
            emit ReferralPayment(DEFAULT_REFER, _newId, referralAmount, block.timestamp);
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
                bool success = USDT.transfer(userInfo[_referrer].account, reward);
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
        
        // Silent fallback to root for unpaid commission
        if (totalPaid < totalSponsorAllocation) {
            uint unpaid = totalSponsorAllocation - totalPaid;
            require(USDT.transfer(userInfo[DEFAULT_REFER].account, unpaid), "Root fallback failed");
            userIncome[DEFAULT_REFER].sponsorIncome += unpaid;
            userIncome[DEFAULT_REFER].totalIncome += unpaid;
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
                bool success = USDT.transfer(userInfo[_upline].account, _amount);
                if (success) {
                    userIncome[_upline].levelIncome += _amount;
                    userIncome[_upline].totalIncome += _amount;
                    paid = true;
                    
                    emit MatrixPayment(_userId, _upline, _amount, _level, i + 1, true, block.timestamp);
                }
                break;  // Stop after first qualified upline gets paid
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
        
        // Silent fallback to root if no qualified upline found
        if (!paid && _amount > 0) {
            require(USDT.transfer(userInfo[DEFAULT_REFER].account, _amount), "Root fallback failed");
            userIncome[DEFAULT_REFER].levelIncome += _amount;
            userIncome[DEFAULT_REFER].totalIncome += _amount;
            // No event emission - users only see their own missed income
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
     * If no spot found within depth limit, falls back to placing under root.
     * This prevents infinite loops but may cluster users in very deep trees.
     */
    function _placeInBinaryMatrix(uint _newId, uint _ref) private {
        uint[] memory queue = new uint[](MAX_PLACEMENT_DEPTH);
        uint front = 0;
        uint back = 0;
        queue[back++] = _ref;
        
        bool placed = false;
        uint iterations = 0;
        
        while (front < back && iterations < MAX_PLACEMENT_DEPTH) {
            uint _upline = queue[front++];
            iterations++;
            
            if (teams[_upline][0].length < 2) {
                teams[_upline][0].push(_newId);
                userInfo[_newId].upline = _upline;
                matrixDirect[_upline]++;
                placed = true;
                break;
            }
            
            for (uint i = 0; i < teams[_upline][0].length && back < MAX_PLACEMENT_DEPTH; i++) {
                queue[back++] = teams[_upline][0][i];
            }
        }
        
        // Fallback to referrer if no spot found within depth limit
        if (!placed) {
            teams[_ref][0].push(_newId);
            userInfo[_newId].upline = _ref;
            matrixDirect[_ref]++;

        }
    }
    
    function _updateTeamCounts(uint _userId) private {
        uint _upline = userInfo[_userId].referrer;
        uint depth = 0;
        
        while (_upline != 0 && depth < MAX_PLACEMENT_DEPTH) {
            userInfo[_upline].team++;
            _upline = userInfo[_upline].referrer;
            depth++;
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function isAutonomous() external view returns (bool) {
        return owner == address(0);
    }
    
    /**
     * @notice Get user account address by ID (used by Royalty contract)
     */
    function getUserAccount(uint _userId) external view returns (address) {
        return userInfo[_userId].account;
    }
    
    function getLevelCost(uint _level) external view returns (uint cost, uint adminFee, uint total) {
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
    
    function getContractBalance() external view returns (uint) {
        return USDT.balanceOf(address(this));
    }
}
