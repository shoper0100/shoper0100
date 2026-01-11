# FiveDollarRide Smart Contract Documentation

## Overview

FiveDollarRide is a decentralized matrix platform on BSC Mainnet featuring a 13-level upgrade system, binary matrix income distribution, sponsor commissions, and daily royalty pools.

## Smart Contracts

### 1. FiveDollarRide_BNB_Pure.sol (Main Contract)
- **Purpose:** Core platform logic, registrations, upgrades, and income distribution
- **Payment:** Native BNB (no token approvals needed)
- **Oracle:** Chainlink BNB/USD price feed for dynamic USD pricing

### 2. FiveDollarRideRoyalty_BNB.sol (Royalty Contract)
- **Purpose:** Royalty pool management and distribution
- **Tiers:** 4 royalty levels (L10, L11, L12, L13)
- **Distribution:** Daily rounds with equal sharing among eligible users

---

## Main Contract Features

### Level Structure (13 Levels)

| Level | USD Cost | BNB Cost (Dynamic) |
|-------|----------|-------------------|
| L1 | $5 | ~0.0055 BNB |
| L2 | $5 | ~0.0055 BNB |
| L3 | $10 | ~0.011 BNB |
| L4 | $20 | ~0.022 BNB |
| L5 | $40 | ~0.044 BNB |
| L6 | $80 | ~0.089 BNB |
| L7 | $160 | ~0.177 BNB |
| L8 | $320 | ~0.354 BNB |
| L9 | $640 | ~0.709 BNB |
| L10 | $1,280 | ~1.418 BNB |
| L11 | $2,560 | ~2.836 BNB |
| L12 | $5,120 | ~5.673 BNB |
| L13 | $10,240 | ~11.346 BNB |

*BNB amounts calculated at $903/BNB (dynamic via Chainlink oracle)*

### Fee Structure

**On Every Transaction:**
- **Admin Fee:** 5% (goes to FEE_RECEIVER)
- **Royalty Fund:** 5% (goes to royalty pool)
- **Sponsor Commission:** 5% (distributed across 13 sponsor levels)
- **Matrix Income:** 85% (distributed to qualified uplines)

**Total:** 100%

### Income Streams

#### 1. Direct Referral Income (Registration Only)
- **Amount:** 95% of registration cost (Level 1)
- **Requirement:** Direct referral registers under you
- **Payment:** Immediate on registration
- **Example:** L1 registration = $5, you earn $4.75 (95% after royalty fund)

#### 2. Matrix Level Income (Upgrades)
- **Amount:** 85% of upgrade cost
- **Requirement:** 
  - Your level must be higher than the payer's level
  - You need 2+ direct referrals to qualify
- **Distribution:** First qualified upline within 13 layers gets full amount
- **Fallback:** If no qualified upline, goes to root user

#### 3. Sponsor Commission (5% Total)
- **Distribution:** Across 13 sponsor levels
- **Percentages:**
  - L1: 1.0% | L2: 0.8% | L3: 0.6% | L4: 0.5%
  - L5: 0.5% | L6: 0.4% | L7: 0.3% | L8: 0.25%
  - L9: 0.2% | L10: 0.15% | L11-13: 0.1% each
- **Requirements:**
  - L1-L5: Must be active (Level 1+)
  - L6-L8: Need 2+ direct referrals
  - L9-L10: Need 3+ direct referrals
  - L11-L13: Need 5+ direct referrals
- **Fallback:** Unqualified portions go to root user

#### 4. Daily Royalty Pools
- **Tiers:** L10, L11, L12, L13
- **Funding:** 5% of every upgrade goes to royalty contract
- **Distribution:** Daily rounds, equal sharing among eligible users
- **Income Cap:** 150% of total deposits (except root user)
- **Claim:** Manual claim required via `claimRoyalty()` or `claimMyRoyalty()`

---

## Royalty System Details

### 4 Royalty Tiers

| Tier | Level Required | Users Share |
|------|---------------|-------------|
| T1 | Level 10+ | Daily pool ÷ eligible users |
| T2 | Level 11+ | Daily pool ÷ eligible users |
| T3 | Level 12+ | Daily pool ÷ eligible users |
| T4 | Level 13 | Daily pool ÷ eligible users |

### How Royalty Works

1. **Funding:** 5% of every upgrade is sent to royalty contract
2. **Distribution:** Funds split equally across all 4 tiers (25% each)
3. **Rounds:** New round every 24 hours
4. **Eligibility:** Must be registered for tier and have active tier
5. **Claiming:** Users claim accumulated rewards from multiple rounds
6. **Sharing:** Pool amount ÷ number of eligible users in that round
7. **Minimum Claim:** 0.001 BNB (~$0.90)
8. **Income Cap:** Max 150% of total deposits (lifetime limit)

### Active Tier Logic
- Only ONE royalty tier is active at a time
- Active tier = your current highest level
- Lower tiers automatically deactivated when you upgrade
- Example: At L11, only T2 (L11) is active, T1 (L10) is inactive

---

## Key Functions

### Registration

**registerMe(address _referrerAddress) payable**
- Register using referrer's wallet address
- Sends BNB for L1 cost + admin fee
- Auto-places in binary matrix under referrer

**register(uint _ref, address _newAcc) payable**
- Register with referrer ID and custom wallet
- For advanced users

### Upgrades

**upgradeMe(uint _levels) payable**
- Upgrade your own account
- Can upgrade multiple levels at once
- Sends total BNB for all levels + fees

**upgrade(uint _id, uint _lvls) payable**
- Upgrade specific user ID
- Must be account owner

### Royalty Claims

**claimMyRoyalty(uint _tier) nonReentrant**
- Claim your royalty for specific tier (10, 11, 12, or 13)
- Returns accumulated rewards from all unclaimed rounds
- Applies 150% income cap

**claimRoyalty(uint _id, uint _royaltyLvl) nonReentrant**
- Claim for specific user ID

### View Functions

**getLevelCost(uint _level) view returns (uint)**
- Get BNB cost for a specific level (0-12)
- Returns current BNB amount based on oracle price

**getUserRoyaltyData(uint _userId, uint _tier) view**
- Check claimable royalty amount
- Returns: (claimableAmount, isEligible, hasClaimed)

**getTierStats(uint _tier) view**
- Get royalty tier statistics
- Returns: (userCount, currentRound, pendingUsers)

---

## Security Features

### OpenZeppelin Security
- **ReentrancyGuard:** Prevents reent

rancy attacks on all payable functions
- **Ownable:** Owner-controlled administrative functions
- **Safe Transfers:** Uses `.call{value}()` instead of `.transfer()`

### Access Control
- **Owner:** Can pause, update prices, recoverBNB, adjust settings
- **Main Contract:** Only main contract can call royalty functions
- **User Authorization:** Users can only operate on their own accounts

### Emergency Controls
- **pauseContract():** Stops all user operations
- **unpauseContract():** Resumes operations  
- **recoverBNB():** Owner can recover stuck BNB
- **emergencyWithdraw():** Royalty contract owner can withdraw (emergency)

### Income Protection
- **Direct Required:** Need 2+ directs for matrix income
- **Level Qualification:** Must be higher level to receive matrix income
- **150% Cap:** Royalty income capped at 1.5x deposits (except root)
- **Fallback to Root:** All orphaned income goes to root user
- **Zero Black Holes:** No income is ever lost

---

## Deployment Information

### Constructor Parameters

**FiveDollarRide Constructor:**
```solidity
constructor(
    address _feeReceiver,      // Admin fee receiver address
    address _royalty,          // Royalty contract address
    address _rootUserAddress,  // Root user wallet
    uint _rootUserId,          // Root user ID (usually 36999)
    address _priceFeedAddress  // Chainlink BNB/USD oracle
)
```

**FiveDollarRideRoyalty Constructor:**
```solidity
constructor(
    address _owner,            // Owner address
    address _defaultRefer,     // Default referrer (root user)
    address _mainContract      // Main contract address
)
```

### Deployment Order

1. Deploy `FiveDollarRideRoyalty_BNB.sol` first
2. Deploy `FiveDollarRide_BNB_Pure.sol` with royalty address
3. Call `initializeRoyalty()` on main contract
4. Verify both contracts on BSCScan

---

## Network Configuration

### BSC Mainnet
- **Chain ID:** 56
- **RPC URL:** https://bsc-dataseed1.binance.org
- **Explorer:** https://bscscan.com
- **Currency:** BNB

### Chainlink Oracle
- **Price Feed:** BNB/USD
- **Address:** 0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE (BSC Mainnet)
- **Update Interval:** Configurable (default: 7 days)
- **Price Bounds:** $1 - $100,000

---

## Economic Model

### Total Investment (All Levels)
- **USD:** $20,475 (sum of all 13 levels)
- **BNB:** ~22.68 BNB (at $903/BNB)

### Income Potential
- **Direct Referrals:** Unlimited ($4.75 per referral at L1)
- **Matrix Income:** Up to 85% of team upgrades
- **Sponsor Commission:** 5% of team earnings (13 levels deep)
- **Royalty Pools:** Daily distributions, no upper limit

### ROI Calculation
- **Direct + Matrix:** Depends on team size and activity
- **Sponsor Commission:** Passive income from team growth
- **Royalty:** 150% cap (max 1.5x your deposits)
- **Root User:** Unlimited (no caps, receives all fallback income)

---

## Integration Guide

### Frontend Integration

**Contract ABIs needed:**
1. FiveDollarRide_BNB_Pure ABI
2. FiveDollarRideRoyalty_BNB ABI

**Key Environment Variables:**
```
NEXT_PUBLIC_CONTRACT_ADDRESS=<main_contract_address>
NEXT_PUBLIC_ROYALTY_ADDRESS=<royalty_contract_address>
NEXT_PUBLIC_CHAIN_ID=56
NEXT_PUBLIC_RPC_URL=https://bsc-dataseed1.binance.org
NEXT_PUBLIC_EXPLORER_URL=https://bscscan.com
NEXT_PUBLIC_DEFAULT_REFER=36999
```

**Web3 Connection:**
- Use ethers.js v6
- Connect to BSC Mainnet
- Request MetaMask or WalletConnect

### Common Usage Patterns

**1. Register New User:**
```javascript
const levelCost = await contract.getLevelCost(0); // L1 cost
const adminFee = levelCost * 5n / 100n;
const total = levelCost + adminFee;

await contract.registerMe(referrerAddress, { value: total });
```

**2. Upgrade User:**
```javascript
let totalCost = 0n;
for (let i = currentLevel; i < currentLevel + numLevels; i++) {
  const cost = await contract.getLevelCost(i);
  totalCost += cost + (cost * 5n / 100n);
}

await contract.upgradeMe(numLevels, { value: totalCost });
```

**3. Claim Royalty:**
```javascript
const tier = 13; // L13 royalty tier
await royaltyContract.claimMyRoyalty(tier);
```

---

## Constants & Configuration

### Hardcoded Constants
- `MAX_LEVELS`: 13
- `MAX_INCOME_LAYER`: 13 (matrix income depth)
- `DIRECT_REQUIRED`: 2 (minimum directs for matrix income)
- `ADMIN_FEE_PERCENT`: 5%
- `ROYALTY_FUND_PERCENT`: 5%
- `SPONSOR_LEVELS`: 13
- `MIN_CLAIM`: 0.001 BNB (royalty minimum)
- `ROUND_DURATION`: 24 hours (royalty rounds)

### Owner-Configurable
- `levelCosts[13]`: USD cost per level
- `bnbPrice`: Current BNB/USD price
- `priceUpdateInterval`: Oracle update frequency
- `minBNBPrice`, `maxBNBPrice`: Price validation bounds
- `maxPlacementDepth`: Matrix placement depth limit (default: 100)
- `registrationCooldown`: Anti-spam cooldown (default: 1 hour)

---

## Events Emitted

### Main Contract Events
- `UserRegistered(userId, account, referrer, timestamp)`
- `UserUpgraded(userId, newLevel, amount, timestamp)`
- `ReferralPayment(referrerId, userId, amount, timestamp)`
- `SponsorCommissionPaid(sponsorId, fromUserId, amount, level, timestamp)`
- `MatrixPayment(fromUserId, toUserId, amount, level, layer, qualified, timestamp)`
- `RoyaltyPoolFunded(userId, amount, timestamp)`
- `RoyaltyClaimed(userId, tier, amount, timestamp)`
- `IncomeLost(userId, fromUser, amount, reason, timestamp)`

### Royalty Contract Events
- `UserRegistered(userId, tier, round, timestamp)`
- `RoyaltyDistributed(userId, tier, bnbAmount, round, timestamp)`
- `PoolFunded(tier, bnbAmount, timestamp)`
- `RoundAdvanced(tier, newRound, timestamp)`

---

## Summary

This dual-contract system provides:
✅ **Main Contract:** Registration, upgrades, matrix income, sponsor commissions
✅ **Royalty Contract:** Daily pools, tier-based distribution, 150% cap system
✅ **Security:** OpenZeppelin standards, reentrancy protection, safe transfers
✅ **Flexibility:** Dynamic BNB pricing, owner controls, emergency functions
✅ **Transparency:** Comprehensive events, public view functions
✅ **Scalability:** 13-layer matrix, unlimited team depth, efficient storage

**Network:** BSC Mainnet (Chain ID: 56)  
**Payment:** Native BNB only  
**Oracle:** Chainlink BNB/USD  
**Total Levels:** 13 ($5 to $10,240)
