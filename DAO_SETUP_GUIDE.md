# DAO Governance Setup Guide

## RideBNB DAO (2-of-5 Multisig)

### Overview
Critical contract functions are controlled by a Gnosis Safe 2-of-5 multisig wallet for decentralized governance.

## Contract Changes

### Added Variables
```solidity
address public daoAddress;  // Gnosis Safe 2-of-5 multisig
```

### Access Control
```solidity
modifier onlyDAO() {
    require(msg.sender == daoAddress, "Only DAO");
    _;
}
```

## DAO-Controlled Functions

All critical economic parameters:
- `setBnbPrice()` - Market price updates
- `batchUpdateLevels()` - Mass level adjustments  
- `setDirectRequired()` - Qualification rules
- `setSponsorCommission()` - Commission rates
- `setMinSponsorLevel()` - Level requirements
- `setRoyaltyPercents()` - Royalty distribution
- `setRoyaltyLevels()` - Royalty tiers
- `setLevelCost()` - Individual level pricing
- `setLevelFeePercent()` - Admin fees

## Owner Emergency Functions

Immediate response capabilities (single owner):
- `pause()` - Stop all operations
- `unpause()` - Resume operations
- `emergencyWithdraw()` - Fund recovery
- `sweepToRoot()` - Cleanup stuck BNB

## Gnosis Safe Setup (2-of-5)

### Step 1: Deploy Gnosis Safe

Visit: https://app.safe.global/

1. Connect wallet
2. Create new Safe
3. Select opBNB network
4. Add 5 signer addresses
5. Set threshold to 2 (2-of-5)
6. Deploy Safe

### Step 2: Signer Selection

**Recommended distribution:**
1. Project Lead
2. Community Rep  
3. Technical Advisor
4. Core Developer
5. Security Auditor

**Requirements:**
- Each signer uses hardware wallet
- Geographic distribution
- Trusted community members
- Different time zones for coverage

### Step 3: Transfer DAO Control

After contract deployment:

```javascript
// Call as current owner
await contract.transferDAOControl(GNOSIS_SAFE_ADDRESS);
```

### Step 4: Verify

```javascript
const daoAddr = await contract.daoAddress();
console.log("DAO controlled by:", daoAddr);
```

## Using the DAO

### Proposing Changes

1. **Create Transaction** in Gnosis Safe UI
2. **To:** RideBNB Contract Address
3. **Function:** Select from DAO functions
4. **Parameters:** Enter new values
5. **Submit** for signatures

### Collecting Signatures

1. Other signers review proposal
2. At least 2 signers approve
3. Transaction becomes executable
4. Any signer can execute

### Executing Changes

1. Go to Gnosis Safe UI
2. Find approved transaction
3. Click "Execute"
4. Confirm metamask transaction
5. Change applied to contract

## Example: Update BNB Price

### Via Gnosis Safe

```
Function: setBnbPrice
Parameter: 550 (new BNB price in USD)

Steps:
1. Signer 1: Proposes transaction
2. Signer 2: Reviews and approves
3. Transaction ready (2-of-5 met)
4. Any signer executes
5. BNB price updated to $550
```

## Security Best Practices

### For DAO Signers

✅ Use hardware wallet (Ledger/Trezor)
✅ Verify all transaction details
✅ Discuss proposals before signing
✅ Check contract state after execution
✅ Keep private keys secure

❌ Don't sign without understanding
❌ Don't share private keys
❌ Don't rush approvals
❌ Don't sign conflicting proposals

### Proposal Review Checklist

Before signing any proposal:
- [ ] Correct contract address?
- [ ] Correct function called?
- [ ] Parameters make sense?
- [ ] Impact on users understood?
- [ ] Discussed with other signers?
- [ ] Emergency or routine change?

## Transfer DAO Control

### Initial Setup (Constructor)
```solidity
daoAddress = _owner;  // Initially owner controls
```

### Transfer to Multisig
```solidity
function transferDAOControl(address _newDAO) external {
    require(msg.sender == owner, "Only owner");
    require(_newDAO != address(0), "Invalid address");
    address oldDAO = daoAddress;
    daoAddress = _newDAO;
    emit DAOTransferred(oldDAO, _newDAO);
}
```

### Emergency Revert
If multisig compromised, owner can transfer control to new Safe:
```javascript
await contract.transferDAOControl(NEW_SAFE_ADDRESS);
```

## Frontend Integration

### Display DAO Info
```typescript
const daoAddress = await contract.daoAddress();
const isDAOSigner = await checkIfSigner(userAddress, daoAddress);
```

### Show Pending Proposals
Link to Gnosis Safe UI for current proposals.

### Admin Access Control
```typescript
if (userAddress !== daoAddress && userAddress !== owner) {
    return <AccessDenied />;
}
```

## Governance Process

### Timeline for Changes

**Routine Updates (Price/Fees):**
1. Proposal: Day 1
2. Discussion: 1-2 days  
3. Voting: Signatures collected
4. Execution: Immediate after 2 signatures

**Critical Changes (Level Costs/Commission):**
1. Proposal: Day 1
2. Community Discussion: 3-7 days
3. Voting: Signatures collected
4. Execution: After consensus

### Communication Channels

- Telegram: DAO discussion group
- Discord: Governance channel
- Forum: Formal proposals
- Safe UI: Transaction details

## Monitoring & Transparency

### View Past Changes
All DAO transactions visible on:
- Gnosis Safe transaction history
- opBNB explorer (contract events)
- Frontend governance dashboard

### Key Events
```solidity
event DAOTransferred(address indexed oldDAO, address indexed newDAO);
event BnbPriceUpdated(uint oldPrice, uint newPrice);
event LevelCostUpdated(uint level, uint oldCost, uint newCost);
// ... etc
```

## Deployment Checklist

- [ ] Deploy Gnosis Safe 2-of-5
- [ ] Add all 5 signers
- [ ] Test Safe with small transaction
- [ ] Deploy RideBNB contract  
- [ ] Call transferDAOControl
- [ ] Verify DAO address
- [ ] Test DAO function call
- [ ] Announce to community
- [ ] Publish signer addresses
- [ ] Begin DAO operations

## Summary

**Governance Model:**
- 2-of-5 Gnosis Safe Multisig
- Decentralized control
- Emergency owner fallback
- Community transparency

**Benefits:**
✅ No single point of failure
✅ Quick decisions (only 2 signatures)
✅ Distributed power
✅ Emergency capability maintained

**Risk Mitigation:**
- Hardware wallet enforcement
- Review process for proposals
- Emergency transfer available
- Owner retains pause functionality

Ready for deployment! 🏛️
