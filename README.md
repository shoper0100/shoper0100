# RideBNB - Decentralized Matrix Platform

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Network](https://img.shields.io/badge/network-BSC%20Mainnet-yellow)](https://bscscan.com)
[![Solidity](https://img.shields.io/badge/solidity-0.8.28-brightgreen)](https://soliditylang.org/)

> A powerful decentralized matrix platform built on Binance Smart Chain (BSC) featuring a limitless binary matrix, multi-level income distribution, daily royalty rewards, and sponsor commissions.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Income Streams](#income-streams)
- [Matrix System](#matrix-system)
- [Royalty System](#royalty-system)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Frontend Application](#frontend-application)
- [Security](#security)
- [Documentation](#documentation)
- [Support](#support)

## 🌟 Overview

RideBNB is a next-generation decentralized matrix platform that combines:
- **Limitless Binary Matrix** - Infinite scalability with 2x∞ structure
- **13 Progressive Levels** - Gradual growth from $5 to $8,192
- **Multiple Income Streams** - Direct income, matrix earnings, sponsor commissions, and royalty rewards
- **Daily Royalty Pools** - 4-tier system with automatic distribution
- **Fair Distribution** - Zero black holes with root user...


**Contract Details:**
- **Network:** BSC Mainnet (Chain ID: 56)
- **Main Contract:** `FiveDollarRide_BNB_Pure.sol`
- **Starting User ID:** 36999
- **Starting Level Cost:** $5 USD (in BNB)
- **Maximum Level:** Level 12 ($8,192 USD)

## ✨ Key Features

### 🎯 User Features
- **Wallet Integration** - Seamless MetaMask connection with automatic network switching
- **Simple Registration** - One-click registration with referral system
- **Flexible Upgrades** - Individual or batch level upgrades (1-12)
- **Real-time Dashboard** - Live statistics, income tracking, and team analytics
- **Income History** - Detailed transaction logs with filtering (direct, level, lost income)
- **Team Visualization** - Binary matrix tree view and direct referrals list
- **Royalty Claims** - Daily pool distribution with automatic eligibility tracking

### 🔧 Technical Features
- **Gas Optimized** - Efficient smart contract design
- **Reentrancy Protected** - All critical functions safeguarded
- **Emergency Pause** - Safety mechanism for critical situations
- **Upgradable Parameters** - DAO-controlled economic settings
- **Event Logging** - Complete transaction history on-chain
- **Price Oracle** - BNB/USD conversion for stable pricing

### 🛡️ Security Features
- **Audited Contracts** - Security-first development
- **Safe Transfers** - No vulnerable `.transfer()` or `.send()`
- **Access Control** - Owner and DAO permissions
- **Income Cap** - 150% ROI protection (except root user)
- **Time-based Claims** - Prevents double-claiming royalties
- **Zero Black Holes** - All income distributed or goes to root user

## 🏗️ Smart Contract Architecture

###  Core Contracts

#### 1. FiveDollarRide_BNB_Pure.sol (Main Contract)
The primary contract handling:
- User registration and upgrades
- Matrix placement and income distribution
- Royalty pool management
-  Sponsor commission calculations
- Admin fee collection

#### 2. FiveDollarRideRoyalty_BNB_Pure.sol (Royalty Contract)
Dedicated royalty management:
- Daily pool accumulation
- Tier-based distribution
- Automated fund forwarding to admin

### Architecture Diagram

```
┌─────────────────────────────────────────────┐
│          User Registration/Upgrade          │
└────────────────┬────────────────────────────┘
                 │
                 ├─→ Registration Fee: $5 (in BNB)
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌───────────────┐   ┌──────────────┐
│ Direct Income │   │ Matrix Place │
│    (Instant)  │   │   (Binary)   │
└───────────────┘   └──────┬───────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
             ┌──────────┐  ┌──────────┐
             │  Level   │  │ Sponsor  │
             │  Income  │  │Commission│
             └──────────┘  └────┬─────┘
                                │
                         ┌──────┴──────┐
                         │             │
                         ▼             ▼
                 ┌──────────────┐ ┌────────────┐
                 │  Royalty 5%  │ │ Admin 10%  │
                 └──────────────┘ └────────────┘
```

### Level Structure (13 Levels)

| Level | Cost (USD) | Cost (BNB) | Upgrade Fee | Total Cost |
|-------|------------|------------|-------------|------------|
| 0 | $5 | ~0.004 BNB | Registration | $5 |
| 1 | $10 | ~0.008 BNB | 10% | $11 |
| 2 | $20 | ~0.016 BNB | 10% | $22 |
| 3 | $40 | ~0.032 BNB | 10% | $44 |
| 4 | $80 | ~0.064 BNB | 10% | $88 |
| 5 | $160 | ~0.128 BNB | 10% | $176 |
| 6 | $320 | ~0.256 BNB | 10% | $352 |
| 7 | $640 | ~0.512 BNB | 10% | $704 |
| 8 | $1,280 | ~1.024 BNB | 10% | $1,408 |
| 9 | $2,560 | ~2.048 BNB | 10% | $2,816 |
|  10 | $5,120 | ~4.096 BNB | 10% | $5,632 |
| 11 | $6,144 | ~4.915 BNB | 10% | $6,758 |
| 12 | $8,192 | ~6.554 BNB | 10% | $9,011 |

> Note: BNB amounts are approximate based on $1,250/BNB. Actual amounts calculated on-chain.

## 💰 Income Streams

### 1. Direct Referral Income (Instant)
- **Earn:** 100% of registration fee from direct referrals
- **Amount:** $5 (in BNB) per registration
- **Requirement:** None (automatic)
- **Payment:** Instant

**Example:**
```
You refer User A → You earn $5 instantly ✓
You refer 10 users → You earn $50 ✓
```

### 2. Matrix Level Income (26 Layers Deep)
- **Earn:** From upgrades of users in your matrix (up to 26 layers below)
- **Amount:** Level-specific costs (from your qualified levels)
- **Requirement:** Must be qualified at that level
- **Layers:** Earn from 26 layers deep in binary matrix

**Distribution:**
```
Someone in your matrix upgrades to Level 5
↓
You earn $160 (if you have Level 5) ✓
↓
Passes through 26 layers above them
```

**Qualification:**
- Must have >= 2 direct referrals to earn matrix income
- Must own the level being upgraded
- Unqualified income goes to next qualified upline (or root)

### 3. Sponsor Commission (5% of Referral Earnings)
- **Earn:** 5% of your direct referral's matrix earnings
- **Source:** Your referral's income, not their costs
- **Unlimited:** No cap on this income stream
- **Passive:** Automatic as your team succeeds

**Example:**
```
Your referral User A earns $100 from their matrix
↓
YOU earn 5% = $5 automatically ✓

Your 10 referrals each earn $1,000 total
↓
YOU earn 5% × $10,000 = $500 ✓
```

### 4. Daily Royalty Pools (Levels 10-12)
- **Earn:** Daily share of 5% pool from all platform activity
- **Requirement:** Reach Levels 10, 11, or 12
- **Distribution:** Equal share among tier participants
- **Frequency:** Claimable every 24 hours

**4 Royal Tiers:**

| Tier | Level | Pool Share | Your Share |
|------|-------|------------|------------|
| 1 | Level 10 | 40% | Pool ÷ Users |
| 2 | Level 11 | 30% | Pool ÷ Users |
| 3 | Level 12 | 20% | Pool ÷ Users |
| 4 | Level 13 | 10% | Pool ÷ Users |

**Example:**
```
Daily pool collects 100 BNB from 5% of all activity
Tier 1 (Level 10) gets 40% = 40 BNB
500 users in Tier 1
Your share: 40 ÷ 500 = 0.08 BNB per day ✓
```

**Income Cap:**
- Regular users: 150% of total deposits
- Root user (ID 36999): Unlimited ✓

## 🌲 Matrix System

### Limitless Binary Matrix

RideBNB features a **2x∞ binary matrix** - unlimited depth with binary structure:

```
                    Root (36999)
                         │
           ┌─────────────┴─────────────┐
           │                           │
        User A                      User B
           │                           │
     ┌─────┴─────┐              ┌─────┴─────┐
   User C     User D          User E     User F
     │           │              │           │
   ┌─┴─┐       ┌─┴─┐          ┌─┴─┐       ┌─┴─┐
  ... ...     ... ...        ... ...     ... ...
  
  Continues infinitely → Truly limitless! ✓
```

### Key Matrix Features

✅ **Limitless Placement**
- No maximum depth
- Searches indefinitely until position found
- Never runs out of spots

✅ **Automatic Spillover**
- When your 2 spots fill, new referrals spill to your team
- Helps build depth automatically
- Fair distribution

✅ **Income from 26 Layers**
- Earn from 26 matrix layers below you
- Balanced between earnings and gas efficiency
- Each layer can earn from upgrades

✅ **Zero Black Holes**
- All income goes to qualified users
- Unqualified income goes to next qualified upline
- Ultimate fallback: root user (no income lost)

### Placement Algorithm

```solidity
1. Check direct spots under referrer (0-2)
2. If full, breadth-first search through layers
3. Continue searching all layers until position found
4. Place user in first available spot
5. Update team counters for first 26 layers
6. Result: ALWAYS successful placement ✓
```

## 👑 Royalty System

### How It Works

The royalty system collects **5% from all registrations and upgrades** and distributes it daily among qualified high-level users.

### Daily Pool Mechanism

```
Day 0 (0-24h):   Accumulation Period
Day 1 (24-48h):  Accumulation + Day 0 Claimable  
Day 2 (48-72h):  Accumulation + Day 1 Claimable
...
```

### Eligibility Requirements

To participate in royalty:
1. ✅ Reach required level (10, 11, or 12)
2. ✅ Have >= 2 direct referrals
3. ✅ Within 150% income cap (unlimited for root user)
4. ✅ Not claimed today

### Claim Process

```
1. User reaches Level 10
↓
2. Added to pending list (Tier 1)
↓
3. First claim triggers activation
↓
4. Calculate share: Pool ÷ Active Users
↓
5. Transfer automatically
↓
6. Mark as claimed for today
↓
7. Repeat daily ✓
```

### Rollover System

Unclaimed funds don't disappear:

```
Day 1 Pool: 100 BNB
Day 1 Claimed: 80 BNB
Day 1 Unclaimed: 20 BNB
↓
Day 2 Pool: 100 BNB (new) + 20 BNB (rollover) = 120 BNB ✓
```

Benefits active participants who claim regularly!

### Root User Privilege

**User ID 36999 (Root User):**
- ✅ Unlimited royalty income (no 150% cap)
- ✅ Never deactivated from royalty
- ✅ Receives all overflow income
- ✅ Ultimate fallback for unqualified distributions

## 🚀 Getting Started

### Prerequisites

- **MetaMask** browser extension installed
- **BNB** on BSC Mainnet for transactions
- **Referrer ID** (default: 36999)

### Quick Start Guide

#### 1. Connect Wallet
```
1. Visit the platform
2. Click "Connect Wallet"
3. Approve MetaMask connection
4. Auto-switch to BSC Mainnet if needed
```

#### 2. Register
```
1. Enter referrer ID (or use default 36999)
2. Review cost: $5 + gas
3. Confirm transaction
4. Wait for confirmation
5. You're registered! ✓
```

#### 3. Upgrade Levels
```
1. Go to Upgrade page
2. Select target level (1-12)
3. Review total cost
4. Approve transaction
5. Levels activated ✓
```

#### 4. Build Team
```
1. Share your referral link
2. Get your user ID from dashboard
3. Earn direct income: $5 per referral
4. Earn sponsor commission: 5% of their earnings
5. Build passive income ✓
```

#### 5. Claim Royalty
```
1. Reach Level 10, 11, or 12
2. Have >= 2 direct referrals
3. Visit Royalty page
4. Click "Claim" once per 24 hours
5. Receive your daily share ✓
```

## 📦 Deployment

### Environment Setup

Create `.env` file:

```env
# Network
PRIVATE_KEY=your_deployer_private_key
BSC_RPC_URL=https://bsc-dataseed1.binance.org

# Contract Configuration
FEE_RECEIVER_ADDRESS=0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0
OWNER_ADDRESS=0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0
DEFAULT_REFER_ID=36999

# BSCScan Verification
BSCSCAN_API_KEY=your_bscscan_api_key
```

### Deploy Contracts

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Deploy to BSC Mainnet
npx hardhat run scripts/deploy.js --network bsc

# Verify on BSCScan
npx hardhat run scripts/verify-contracts.js --network bsc
```

### Deploy Frontend

```bash
# Navigate to frontend directory
cd webapp

# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

## 💻 Frontend Application

### Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Web3:** ethers.js v6
- **UI Components:** Custom + Radix UI primitives

### Project Structure

```
webapp/
├── app/
│   ├── dashboard/       # User stats and overview
│   ├── register/        # Registration page
│   ├── upgrade/         # Level upgrade interface
│   ├── income/          # Income history
│   ├── team/            # Team and matrix view
│   └── royalty/         # Royalty claims
├── components/
│   ├── layout/          # Header, Footer
│   ├── wallet/          # Wallet connection
│   └── dashboard/       # Dashboard widgets
├── hooks/
│   ├── useContract.ts   # Contract interactions
│   ├── useUserData.ts   # User data fetching
│   ├── useIncome.ts     # Income tracking
│   ├── useTeam.ts       # Team statistics
│   └── useRoyalty.ts    # Royalty data
├── lib/
│   ├── contract.ts      # Contract ABI
│   ├── constants.ts     # Configuration
│   └── utils.ts         # Utility functions
└── types/
    └── index.ts         # TypeScript definitions
```

### Key Pages

**Dashboard (`/dashboard`)**
- Total income overview
- Level progress
- Quick stats
- Recent activity

**Register (`/register`)**
- Referrer ID input
- Cost breakdown
- One-click registration

**Upgrade (`/upgrade`)**
- Level selector (1-12)
- Batch upgrade option
- Total cost calculator

**Income (`/income`)**
- Complete transaction history
- Filter by type (direct/level/lost)
- Income analytics

**Team (`/team`)**
- Binary matrix tree view
- Direct referrals list
- Team statistics

**Royalty (`/royalty`)**
- Current tier status
- Pool information
- Claim functionality
- Eligibility tracker

### Running Locally

```bash
cd webapp

# Development mode
npm run dev

# Production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## 🔒 Security

### Smart Contract Security

✅ **Reentrancy Protection**
- All state-changing functions use `nonReentrant` modifier
- Critical functions fully protected

✅ **Safe Transfers**
- Never uses vulnerable `.transfer()` or `.send()`
- Always uses `.call{value}()` with proper checks

✅ **Access Control**
- Owner-only functions for admin tasks
- DAO-controlled economic parameters
- Clear permission separation

✅ **Emergency Controls**
- `pause()` / `unpause()` functions
- Emergency fund recovery
- Circuit breakers

✅ **Input Validation**
- All user inputs validated
- Range checks on levels and amounts
- Overflow protection (Solidity 0.8+)

✅ **Economic Safety**
- Income cap: 150% of deposits
- Qualification requirements prevent gaming
- Zero black holes ensure fair distribution

### Known Considerations

⚠️ **Royalty Pool Accounting**
- Pool distribution uses simple division
- Small remainder BNB may accumulate
- Documented and acceptable

⚠️ **Gas Costs at Scale**
- `_incTeamNum()` updates up to 200 layers
- Gas cost increases with depth
- Capped at reasonable limit

### Audits

- Internal security review completed
- Critical functions verified
- Best practices implemented
- See `AUDIT_REPORT.md` for details

## 📚 Documentation

### Core Documentation

- **README.md** (this file) - Complete project overview
- **DEPLOYMENT.md** - Deployment guide and configuration
- **CRITICAL_FUNCTIONS_REFERENCE.md** - All contract functions explained
- **ROYALTY_SYSTEM_LOGIC.md** - Detailed royalty mechanics
- **LIMITLESS_MATRIX.md** - Matrix system architecture
- **SPONSOR_COMMISSION.md** - Commission structure

### User Guides

- **REGISTRATION_GUIDE.md** - How to register
- **ROOT_USER_GUIDE.md** - Root user privileges
- **BSCSCAN_USER_GUIDE.md** - Using BSCScan for transactions

### Admin Guides

- **ADMIN_CONFIG_COMPLETE.md** - Admin configuration
- **ADMIN_ORACLE_GUIDE.md** - Price oracle management
- **DAO_SETUP_GUIDE.md** - DAO governance setup

### Technical Documentation

- **FRONTEND_VIEW_FUNCTIONS.md** - Contract view functions for UI
- **DISTRIBUTION_EXPLAINED.md** - Income distribution mechanics
- **MATRIX_PLACEMENT.md** - Matrix placement algorithm
- **SECURITY_FEATURES.md** - Security implementations

##  📊 Key Statistics

### Platform Metrics

- **Starting User ID:** 36999
- **Total Levels:** 13 (0-12)
- **Matrix Layers (Income):** 26
- **Matrix Structure:** 2x∞ (Binary, Unlimited Depth)
- **Royalty Tiers:** 4
- **Admin Fee:** 10%
- **Royalty Pool:** 5%
- **Sponsor Commission:** 5% of referral earnings
- **Income Cap:** 150% (unlimited for root user)
- **Direct Requirement:** 2 referrals for matrix income

### Economic Model

```
Total Registration Cost: $5
├─ Direct Ref Income: $5 (100%) → Sponsor
├─ Admin Fee: $0.50 (10%) → Fee Receiver
└─ Royalty: $0.25 (5%) → Daily Pool

Total Upgrade Cost: varies by level
├─ Level Income: varies → Matrix uplines (26 layers)
├─ Sponsor Commission: 5% of earner's income → Direct sponsor
├─ Admin Fee: 10% → Fee Receiver
└─ Royalty: 5% → Daily Pool
```

### Contract Addresses

**BSC Mainnet:**
- Main Contract: (deployed address)
- Royalty Contract: (deployed address)
- Fee Receiver: `0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0`

**Explorer:**
- [BSCScan](https://bscscan.com)

## 🤝 Support

### Resources

- **Smart Contracts:** `/contracts` directory
- **Frontend Code:** `/webapp` directory
- **Documentation:** Multiple .md files in root
- **Scripts:** `/scripts` directory

### Development Team

For questions, issues, or contributions:
- Review documentation files
- Check deployment guides
- Examine contract code
- Test on BSC Testnet before mainnet

### Testing

```bash
# Run contract tests
npx hardhat test

# Run specific test file
npx hardhat test test/RideBNB.test.js

# Deploy to testnet first
npx hardhat run scripts/deploy.js --network bscTestnet
```

## 📄 License

This project is provided as-is for demonstration and commercial purposes.

## 🎯 Summary

RideBNB combines the best of decentralized matrix systems:

✅ **Limitless Growth** - Binary matrix with infinite depth
✅ **Multiple Income Streams** - Direct, Matrix, Sponsor, Royalty
✅ **Fair Distribution** - Zero black holes, all income distributed
✅ **Daily Passive Income** - Royalty pools claimable every 24h
✅ **Team Success Rewards** - 5% commission on referral earnings
✅ **Proven Technology** - Secure, audited smart contracts
✅ **Beautiful UI** - Modern Next.js frontend
✅ **BSC Network** - Fast, low-cost transactions

**Start with $5. Build unlimited income potential. Join RideBNB today!** 🚀

---

**Version:** 1.0.0  
**Network:** BSC Mainnet (Chain ID: 56)  
**Last Updated:** January 2026
