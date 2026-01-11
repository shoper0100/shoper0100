// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Chainlink BNB Price Updater
 * @notice Fetches BNB/USD price from Chainlink and updates FiveDollarRide contract
 */

interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function decimals() external view returns (uint8);
}

interface IFiveDollarRide {
    function updateBNBPrice(uint256 _price) external;
    function owner() external view returns (address);
}

contract ChainlinkPriceUpdater {
    // Chainlink BNB/USD Price Feed on BSC Mainnet
    AggregatorV3Interface public priceFeed;
    
    // FiveDollarRide Main Contract
    IFiveDollarRide public mainContract;
    
    // Owner/Updater address
    address public owner;
    
    // Last update timestamp
    uint256 public lastUpdateTime;
    
    // Minimum time between updates (to prevent spam)
    uint256 public minUpdateInterval = 1 hours;
    
    // Price deviation threshold (%)
    uint256 public priceDeviationPercent = 5; // 5% change triggers update
    
    // Last stored price
    uint256 public lastStoredPrice;
    
    // Events
    event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 timestamp);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);
    event MinIntervalChanged(uint256 oldInterval, uint256 newInterval);
    event DeviationThresholdChanged(uint256 oldThreshold, uint256 newThreshold);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    /**
     * @notice Constructor
     * @param _priceFeed Chainlink BNB/USD price feed address
     * @param _mainContract FiveDollarRide main contract address
     */
    constructor(address _priceFeed, address _mainContract) {
        require(_priceFeed != address(0), "Invalid price feed");
        require(_mainContract != address(0), "Invalid main contract");
        
        priceFeed = AggregatorV3Interface(_priceFeed);
        mainContract = IFiveDollarRide(_mainContract);
        owner = msg.sender;
        
        // Set initial price
        lastStoredPrice = getLatestPrice();
        lastUpdateTime = block.timestamp;
    }
    
    /**
     * @notice Get latest BNB price from Chainlink
     * @return price BNB/USD price in 18 decimals
     */
    function getLatestPrice() public view returns (uint256) {
        (
            /* uint80 roundID */,
            int256 price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        
        require(price > 0, "Invalid price");
        
        // Chainlink returns 8 decimals, convert to 18
        uint8 decimals = priceFeed.decimals();
        return uint256(price) * (10 ** (18 - decimals));
    }
    
    /**
     * @notice Check if price update is needed
     * @return needed Whether update is needed
     * @return currentPrice Current Chainlink price
     */
    function shouldUpdate() public view returns (bool needed, uint256 currentPrice) {
        currentPrice = getLatestPrice();
        
        // Check time interval
        if (block.timestamp < lastUpdateTime + minUpdateInterval) {
            return (false, currentPrice);
        }
        
        // Check price deviation
        uint256 priceDiff;
        if (currentPrice > lastStoredPrice) {
            priceDiff = currentPrice - lastStoredPrice;
        } else {
            priceDiff = lastStoredPrice - currentPrice;
        }
        
        uint256 deviationPercent = (priceDiff * 100) / lastStoredPrice;
        needed = deviationPercent >= priceDeviationPercent;
        
        return (needed, currentPrice);
    }
    
    /**
     * @notice Update main contract price from Chainlink
     * @dev Can be called by anyone if conditions are met
     */
    function updatePrice() external {
        (bool needed, uint256 newPrice) = shouldUpdate();
        require(needed, "Update not needed yet");
        
        uint256 oldPrice = lastStoredPrice;
        
        // Update main contract
        mainContract.updateBNBPrice(newPrice);
        
        // Store new price
        lastStoredPrice = newPrice;
        lastUpdateTime = block.timestamp;
        
        emit PriceUpdated(oldPrice, newPrice, block.timestamp);
    }
    
    /**
     * @notice Force update regardless of time/deviation (owner only)
     */
    function forceUpdate() external onlyOwner {
        uint256 newPrice = getLatestPrice();
        uint256 oldPrice = lastStoredPrice;
        
        mainContract.updateBNBPrice(newPrice);
        
        lastStoredPrice = newPrice;
        lastUpdateTime = block.timestamp;
        
        emit PriceUpdated(oldPrice, newPrice, block.timestamp);
    }
    
    /**
     * @notice Set minimum update interval (owner only)
     * @param _interval New interval in seconds
     */
    function setMinUpdateInterval(uint256 _interval) external onlyOwner {
        require(_interval >= 5 minutes, "Interval too short");
        require(_interval <= 7 days, "Interval too long");
        
        uint256 old = minUpdateInterval;
        minUpdateInterval = _interval;
        
        emit MinIntervalChanged(old, _interval);
    }
    
    /**
     * @notice Set price deviation threshold (owner only)
     * @param _percent New threshold percentage (1-50)
     */
    function setPriceDeviationPercent(uint256 _percent) external onlyOwner {
        require(_percent >= 1 && _percent <= 50, "Invalid percentage");
        
        uint256 old = priceDeviationPercent;
        priceDeviationPercent = _percent;
        
        emit DeviationThresholdChanged(old, _percent);
    }
    
    /**
     * @notice Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        
        address old = owner;
        owner = newOwner;
        
        emit OwnerChanged(old, newOwner);
    }
    
    /**
     * @notice Get current price info
     * @return chainlinkPrice Current Chainlink price
     * @return storedPrice Last stored price
     * @return deviation Price deviation percentage
     * @return canUpdate Whether update is allowed now
     */
    function getPriceInfo() external view returns (
        uint256 chainlinkPrice,
        uint256 storedPrice,
        uint256 deviation,
        bool canUpdate
    ) {
        chainlinkPrice = getLatestPrice();
        storedPrice = lastStoredPrice;
        
        uint256 priceDiff;
        if (chainlinkPrice > storedPrice) {
            priceDiff = chainlinkPrice - storedPrice;
        } else {
            priceDiff = storedPrice - chainlinkPrice;
        }
        deviation = (priceDiff * 100) / storedPrice;
        
        (canUpdate, ) = shouldUpdate();
    }
}
