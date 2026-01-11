# Governance Transfer Functions

## Overview
Admin can transfer control between Owner and DAO addresses flexibly.

## Functions

### Transfer DAO Control
```solidity
function transferDAOControl(address _newDAO) external onlyOwner
```
**Purpose:** Move DAO control to new multisig
**Use case:** Switching to new Gnosis Safe

### Transfer Ownership
```solidity
function transferOwnership(address _newOwner) external onlyOwner
```
**Purpose:** Change emergency controller
**Use case:** New owner wallet

### Update Both
```solidity
function updateGovernance(address _newDAO, address _newOwner) external onlyOwner
```
**Purpose:** Coordinated transition
**Use case:** Complete handover

### Get Addresses
```solidity
function getGovernanceAddresses() external view returns(address dao, address owner)
```
**Purpose:** View current governance
**Returns:** (daoAddress, owner)

## Access Control Patterns

### DAO Only
```solidity
modifier onlyDAO() {
    require(msg.sender == daoAddress, "Only DAO");
    _;
}
```
Used for: Critical economic functions

### Owner Only
```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Only owner");
    _;
}
```
Used for: Emergency functions, transfers

### Either DAO or Owner
```solidity
modifier onlyDAOorOwner() {
    require(msg.sender == daoAddress || msg.sender == owner, "Not authorized");
    _;
}
```
Used for: Flexible administration

## Usage Examples

### Setup Gnosis Safe
```javascript
// 1. Deploy Gnosis Safe (2-of-5)
const safeAddress = "0x...";

// 2. Transfer DAO control
await contract.transferDAOControl(safeAddress);

// 3. Verify
const [dao, owner] = await contract.getGovernanceAddresses();
console.log("DAO:", dao);  // Gnosis Safe
console.log("Owner:", owner);  // Still original
```

### Transfer Owner
```javascript
// Move to hardware wallet
await contract.transferOwnership(hardwareWalletAddress);
```

### Complete Transition
```javascript
// Change both at once
await contract.updateGovernance(newSafe, newOwner);
```

## Frontend Integration

Add `GovernanceManagementSection` to admin page:

```typescript
import GovernanceManagementSection from '@/components/admin/GovernanceManagementSection';

// In admin page:
<GovernanceManagementSection />
```

Shows:
- Current DAO address
- Current owner address
- Transfer forms
- Status indicators

## Security

✅ Only current owner can transfer
✅ Addresses validated (not zero)
✅ Events emitted for tracking
✅ Both independent transfers
✅ Emergency owner retained

## Events

```solidity
event DAOTransferred(address indexed oldDAO, address indexed newDAO);
event OwnerTransferred(address indexed oldOwner, address indexed newOwner);
```

Monitor these events to track governance changes.
