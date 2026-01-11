# RideBNB Web3 Application

A decentralized matrix platform built on opBNB network with multi-level income distribution and royalty rewards.

## Features

- 🔐 **Wallet Integration** - MetaMask wallet connection with automatic network switching
- 👥 **User Registration** - On-chain registration with referral system
- 📈 **Level Upgrades** - 13 progressive levels with batch upgrade support
- 💰 **Income Tracking** - Real-time income history with filtering (referral, level, royalty)
- 🌳 **Binary Matrix** - Visual matrix tree representation
- 👨‍👩‍👧‍👦 **Team Management** - Direct referrals and matrix team tracking
- 👑 **Royalty System** - 4-tier daily royalty distribution
- 📊 **Dashboard** - Comprehensive stats and analytics

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Web3:** ethers.js v6
- **UI:** Custom components with Radix UI primitives
- **Network:** opBNB Mainnet (Chain ID: 204)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MetaMask browser extension
- BNB on opBNB network

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Contract Information

- **Contract Address:** `0xae9a7740352Bd4E3f23D7725AcF7D91b8091059D`
- **Network:** opBNB Mainnet
- **Chain ID:** 204
- **Explorer:** [https://opbnb.bscscan.com](https://opbnb.bscscan.com)

## Project Structure

```
f:/ridebnb/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard page
│   ├── register/          # Registration page
│   ├── upgrade/           # Level upgrade page
│   ├── income/            # Income history page
│   ├── team/              # Team & matrix page
│   ├── royalty/           # Royalty rewards page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/
│   ├── layout/            # Header, Footer components
│   ├── wallet/            # Wallet connection
│   └── dashboard/         # Dashboard components
├── hooks/
│   ├── useContract.ts     # Contract instance & wallet
│   ├── useUserData.ts     # User data fetching
│   ├── useIncome.ts       # Income history
│   ├── useTeam.ts         # Team data
│   └── useRoyalty.ts      # Royalty information
├── lib/
│   ├── contract.ts        # Contract ABI
│   ├── constants.ts       # Constants & config
│   └── utils.ts           # Utility functions
└── types/
    └── index.ts           # TypeScript types
```

## Key Pages

### Landing Page (`/`)
- Platform overview
- Features showcase
- Call-to-action buttons

### Dashboard (`/dashboard`)
- User statistics
- Income breakdown
- Quick action links
- Recent transactions

### Register (`/register`)
- New user registration
- Referrer ID input
- Cost breakdown
- Transaction handling

### Upgrade (`/upgrade`)
- Level selection (1-13)
- Batch upgrade support
- Cost calculation
- Progress tracking

### Income (`/income`)
- Complete income history
- Filter by type (referral/level/lost)
- Transaction details
- Income statistics

### Team (`/team`)
- Binary matrix visualization
- Direct referrals list
- Team statistics
- Member details

### Royalty (`/royalty`)
- Royalty tier information
- Claim functionality
- Eligibility tracking
- Pool distribution

## Smart Contract Features

- **13 Levels:** Progressive level system with increasing costs
- **Binary Matrix:** Automatic 2x26 matrix placement
- **Direct Referral:** Instant income from direct referrals
- **Level Income:** Earn from matrix team upgrades
- **Royalty Tiers:** 4 tiers (levels 10-13) with daily distribution
- **Income Cap:** 150% ROI limit per user
- **Lost Income Tracking:** Transparent tracking of unqualified income

## Development

### Environment Variables

Create a `.env.local` file (optional, defaults are set in constants.ts):

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xae9a7740352Bd4E3f23D7725AcF7D91b8091059D
NEXT_PUBLIC_CHAIN_ID=204
NEXT_PUBLIC_RPC_URL=https://opbnb-mainnet-rpc.bnbchain.org
NEXT_PUBLIC_EXPLORER_URL=https://opbnb.bscscan.com
```

### Network Configuration

The app automatically configures opBNB network:
- **Chain ID:** 204 (0xCC)
- **RPC URL:** https://opbnb-mainnet-rpc.bnbchain.org
- **Currency:** BNB
- **Explorer:** https://opbnb.bscscan.com

## Usage

1. **Connect Wallet** - Click "Connect Wallet" and approve MetaMask
2. **Switch Network** - App will prompt to switch to opBNB if needed
3. **Register** - Enter referrer ID (default: 17534) and register
4. **Upgrade** - Select levels to upgrade and confirm transaction
5. **Track Income** - View all income transactions in real-time
6. **Manage Team** - See your direct and matrix team members
7. **Claim Royalty** - Claim daily royalty rewards when eligible

## Security

- All transactions require user confirmation
- Read-only contract access for data fetching
- No private keys stored locally
- MetaMask handles all signing

## Browser Support

- Chrome/Brave (with MetaMask)
- Firefox (with MetaMask)
- Edge (with MetaMask)

## License

This project is for demonstration purposes.

## Support

For issues or questions, please contact the development team.
