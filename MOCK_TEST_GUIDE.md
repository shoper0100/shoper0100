# RideBNB Mock Test Scenarios

## Manual Testing Guide (After Remix Deployment)

### Test Setup
- Deploy to opBNB testnet first
- Get test BNB from faucet
- Use multiple MetaMask accounts (User1, User2, User3, etc.)

## Test Scenario 1: Registration

**Test 1.1: Normal Registration**
```javascript
// User1 registers with root (36999)
await contract.register(36999, user1Address, {
    value: ethers.parseEther("0.0042") // 0.004 + 5% fee
});

Expected:
✓ User1 gets ID (37006)
✓ Root receives 0.004 BNB referral payment
✓ Admin fee collected
✓ User1 added to root's matrix
```

**Test 1.2: Orphan Handling**
```javascript
// User2 registers with invalid ID (99999)
await contract.register(99999, user2Address, {
    value: ethers.parseEther("0.0042")
});

Expected:
✓ User2 auto-assigned to root (36999)
✓ No transaction failure
✓ User2 gets valid ID
```

**Test 1.3: Duplicate Registration**
```javascript
// User1 tries to register again
await contract.register(36999, user1Address, { value: "0.0042" });

Expected:
✗ Transaction reverts: "Already Registered"
```

## Test Scenario 2: Upgrades

**Test 2.1: Single Level Upgrade**
```javascript
const user1Id = await contract.id(user1Address);

// Upgrade to Level 1
await contract.upgrade(user1Id, 1, {
    value: ethers.parseEther("0.0063") // 0.006 + 5%
});

Expected:
✓ User level = 2 (started at 1)
✓ Total deposit = 0.01 BNB
✓ Income distributed to upline
```

**Test 2.2: Multi-Level Upgrade**
```javascript
// Upgrade 3 levels at once (Level 1-3)
const cost = 0.006 + 0.012 + 0.024; // Base costs
const fee = cost * 0.05;
const total = cost + fee;

await contract.upgrade(user1Id, 3, {
    value: ethers.parseEther(total.toString())
});

Expected:
✓ User level increases by 3
✓ All fees collected
✓ Income distributed for each level
```

**Test 2.3: Upgrade to Level 13**
```javascript
// Calculate total cost for all 13 levels
let totalCost = 0;
for(let i = 0; i < 13; i++) {
    const levelCost = await contract.levels(i);
    const fee = levelCost * 5n / 100n;
    totalCost += levelCost + fee;
}

await contract.upgrade(userId, 13, {
    value: totalCost
});

Expected:
✓ User level = 13 (max)
✓ All level costs paid
✓ Ready for royalty pools
```

## Test Scenario 3: Sponsor Commission

**Test 3.1: Qualified Sponsor (Level 4+)**
```javascript
// User1 upgrades to Level 4
await contract.upgrade(user1Id, 4, { value: "..." });

// User2 registers under User1
await contract.register(user1Id, user2Address, { value: "0.0042" });

// User2 upgrades
const user2Id = await contract.id(user2Address);
await contract.upgrade(user2Id, 1, { value: "0.0063" });

const user1Info = await contract.userInfo(user1Id);

Expected:
✓ User1 gets 5% sponsor commission
✓ User1.sponsorIncome > 0
✓ User1.totalIncome increased
```

**Test 3.2: Unqualified Sponsor (Below Level 4)**
```javascript
// User3 at Level 1 (below min sponsor level 4)
// User4 registers under User3
await contract.register(user3Id, user4Address, { value: "0.0042" });

// User4 upgrades
await contract.upgrade(user4Id, 1, { value: "0.0063" });

const user3Info = await contract.userInfo(user3Id);
const rootInfo = await contract.userInfo(36999);
const user3Lost = await contract.lostIncome(user3Id);

Expected:
✓ User3 sponsor commission = 0
✓ Root receives commission instead
✓ user3Lost > 0 (tracked as lost)
✓ Root.sponsorIncome increased
```

## Test Scenario 4: Matrix Income Distribution

**Test 4.1: Direct Sponsor Income**
```javascript
// User1 (Level 5, 2+ directs) has User2 in matrix
// User2 upgrades
await contract.upgrade(user2Id, 1, { value: "0.0063" });

const user1Before = await contract.userInfo(user1Id);
// ... upgrade happens ...
const user1After = await contract.userInfo(user1Id);

Expected:
✓ User1.levelIncome increased
✓ Layer 0 income received
✓ Income proportional to level cost / 26
```

**Test 4.2: 26-Layer Distribution**
```javascript
// Build matrix of 26 users in chain
// Lowest user upgrades
// Check all 26 uplines receive income

Expected:
✓ All 26 qualified uplines get income
✓ Each gets: (levelCost - sponsorCommission) / 26
✓ Unqualified users' income → root
```

## Test Scenario 5: Root User Privileges

**Test 5.1: Unlimited Royalty**
```javascript
// Root user claims royalty multiple times
// Even after 150% income cap would normally apply

await contract.claimRoyalty(36999, 0);
await contract.claimRoyalty(36999, 1);
// ... repeat many times ...

Expected:
✓ No "Max cap reached" error
✓ Root can claim unlimited times
✓ Root never deactivated
```

**Test 5.2: Receives All Unclaimed Income**
```javascript
// User with no qualified upline upgrades
const rootBefore = await contract.userInfo(36999);
// ... unqualified user upgrades ...
const rootAfter = await contract.userInfo(36999);

Expected:
✓ Root.levelIncome increased
✓ Unclaimed income not lost
✓ Zero black holes verified
```

## Test Scenario 6: DAO Governance

**Test 6.1: Price Update**
```javascript
// As owner (initially = DAO)
await contract.setBnbPrice(700);

const newPrice = await contract.getBnbPrice();

Expected:
✓ newPrice = 700
✓ Transaction succeeds
```

**Test 6.2: Transfer to Multisig**
```javascript
const gnosisSafe = "0x..." // Your Gnosis Safe address

await contract.transferDAOControl(gnosisSafe);

const [dao, owner] = await contract.getGovernanceAddresses();

Expected:
✓ dao = gnosisSafe
✓ owner = original owner
✓ DAO functions now require multisig
```

**Test 6.3: Non-DAO Rejected**
```javascript
// As non-owner address
await contract.setBnbPrice(800);

Expected:
✗ Transaction reverts: "Only DAO"
```

## Test Scenario 7: Admin Functions

**Test 7.1: Batch Update Levels**
```javascript
const usdAmounts = [2,3,6,12,24,48,96,192,384,768,1536,3072,6144];

await contract.setBnbPrice(600);
await contract.batchUpdateLevels(usdAmounts);

const level0 = await contract.levels(0);
// Expected: (2 * 1e18) / 600 = 0.00333... BNB

Expected:
✓ All 13 levels updated
✓ Costs based on USD / BNB price
✓ Single transaction
```

**Test 7.2: Update Parameters**
```javascript
await contract.setDirectRequired(3);
await contract.setSponsorCommission(7);
await contract.setMinSponsorLevel(5);

Expected:
✓ All parameters updated
✓ New values active immediately
✓ Affects future transactions
```

## Test Scenario 8: Emergency Controls

**Test 8.1: Sweep to Root**
```javascript
// Send BNB directly to contract
await owner.sendTransaction({
    to: contractAddress,
    value: ethers.parseEther("1.0")
});

const rootBefore = await ethers.provider.getBalance(rootAddress);

await contract.sweepToRoot();

const rootAfter = await ethers.provider.getBalance(rootAddress);

Expected:
✓ Root receives stuck BNB
✓ Contract balance = 0
✓ No funds lost
```

## Quick Test Checklist

After deployment, verify:
- [ ] Contract deploys successfully
- [ ] Owner address correct
- [ ] DAO address = owner initially
- [ ] Default refer = 36999
- [ ] Root user registered
- [ ] Registration works
- [ ] Orphan handling works
- [ ] Upgrades work (all levels)
- [ ] Sponsor commission calculates correctly
- [ ] Matrix income distributes
- [ ] Root receives fallback income
- [ ] Royalty claiming works
- [ ] DAO functions callable by owner
- [ ] Non-DAO rejected
- [ ] Price oracle works
- [ ] Batch updates work
- [ ] Admin setters work
- [ ] Emergency sweep works

## Expected Results Summary

**Registration:** 3 tests, 3 pass
**Upgrades:** 3 tests, 3 pass
**Sponsor Commission:** 2 tests, 2 pass
**Matrix Income:** 2 tests, 2 pass
**Root Privileges:** 2 tests, 2 pass
**DAO Governance:** 3 tests, 3 pass
**Admin Functions:** 2 tests, 2 pass
**Emergency:** 1 test, 1 pass

**Total:** 18 tests, all should pass ✅

## Testing Tools

**Remix IDE:**
- Use "Deploy & Run" tab
- Call functions directly
- View return values
- Check events in console

**Etherscan (opBNB):**
- View all transactions
- Read contract state
- Verify events emitted
- Check BNB transfers

**MetaMask:**
- Monitor balance changes
- Confirm transactions
- Switch between accounts
- View transaction history

Contract is ready for testing! 🚀
