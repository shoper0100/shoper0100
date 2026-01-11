// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockChainlinkOracle
 * @notice Mock Chainlink price feed for testing
 */
contract MockChainlinkOracle {
    int256 private price;
    uint80 private roundId = 1;
    
    constructor() {
        price = 600 * 1e8; // $600 with 8 decimals
    }
    
    function setPrice(uint256 _price) external {
        price = int256(_price * 1e8);
        roundId++;
    }
    
    function latestRoundData() external view returns (
        uint80,
        int256,
        uint256,
        uint256,
        uint80
    ) {
        return (
            roundId,
            price,
            block.timestamp,
            block.timestamp,
            roundId
        );
    }
}
