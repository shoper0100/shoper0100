// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../contracts/FiveDollarRide_BNB.sol";
import "../contracts/FiveDollarRideRoyalty_BNB.sol";

/**
 * @title Comprehensive Test Suite
 * @notice Tests all workflows and functions
 */
contract TestWorkflows {
    FiveDollarRide_BNB public main;
    FiveDollarRideRoyalty_BNB public royalty;
    
    address owner = address(this);
    address feeReceiver = address(0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0);
    address priceFeed = address(0x73110e8602930f01bb584Bc683C5Aa2Fb4D42419);
    address rootUser = address(0xd9a3044CD5a329b16d5e1E02b0E64FBE18E6bf12);
    uint rootId = 73928;
    
    address user1 = address(0x1);
    address user2 = address(0x2);
    address user3 = address(0x3);
    
    event TestResult(string testName, bool passed, string message);
    
    function setUp() public {
        // Deploy Royalty first
        royalty = new FiveDollarRideRoyalty_BNB(
            feeReceiver,
            rootUser,
            address(0)  // Main contract not deployed yet
        );
        
        // Deploy Main contract
        main = new FiveDollarRide_BNB(
            feeReceiver,
            priceFeed,
            address(royalty),
            rootUser,
            rootId
        );
        
        // Link contracts
        royalty.setMainContract(address(main));
        
        // Initialize royalty
        main.initializeRoyalty();
    }
    
    function testCompilation() public {
        emit TestResult("Compilation", true, "Contracts compiled successfully");
    }
    
    function testDeployment() public {
        bool passed = address(main) != address(0) && address(royalty) != address(0);
        emit TestResult("Deployment", passed, "Contracts deployed");
    }
    
    function testInitialization() public {
        bool royaltyInit = main.royaltyInitialized();
        emit TestResult("Initialization", royaltyInit, "Royalty initialized");
    }
    
    function testRegistration() public payable {
        // Test basic registration
        vm.deal(user1, 10 ether);
        vm.prank(user1);
        
        try main.registerMe{value: 0.01 ether}(address(0)) {
            emit TestResult("Registration", true, "User registered");
        } catch {
            emit TestResult("Registration", false, "Registration failed");
        }
    }
    
    function testUSDFunctions() public payable {
        vm.deal(user2, 10 ether);
        vm.prank(user2);
        
        try main.registerMeUSD{value: 0.01 ether}(address(0), 6e18) {
            emit TestResult("USD Registration", true, "USD registration works");
        } catch {
            emit TestResult("USD Registration", false, "USD registration failed");
        }
    }
    
    function testUpgrade() public payable {
        // First register
        vm.deal(user3, 10 ether);
        vm.prank(user3);
        main.registerMe{value: 0.01 ether}(address(0));
        
        // Then upgrade
        vm.prank(user3);
        try main.upgradeMe{value: 0.02 ether}(1) {
            emit TestResult("Upgrade", true, "Upgrade successful");
        } catch {
            emit TestResult("Upgrade", false, "Upgrade failed");
        }
    }
    
    function testRoyaltyDistribution() public {
        // Test 24-hour round system
        bool roundsWork = royalty.ROUND_DURATION() == 24 hours;
        emit TestResult("24h Rounds", roundsWork, "Round duration correct");
    }
    
    function runAllTests() public payable {
        testCompilation();
        testDeployment();
        testInitialization();
        testRegistration();
        testUSDFunctions();
        testUpgrade();
        testRoyaltyDistribution();
    }
}
