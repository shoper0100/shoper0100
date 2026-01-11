# BSCScan User Guide - RideBNB/FiveDollarRide

## Table of Contents
1. [USDT Approval Process](#usdt-approval-process)
2. [Register Me Function](#register-me-function)
3. [Upgrade Me Function](#upgrade-me-function)
4. [Gas Estimates](#gas-estimates)
5. [Troubleshooting](#troubleshooting)

---

## USDT Approval Process

Before you can register or upgrade on the RideBNB platform, you **MUST** approve the contract to spend your USDT tokens.

### Step-by-Step Approval on BSCScan

#### 1. Navigate to USDT Token Contract
- **BSC Mainnet USDT**: `0x55d398326f99059fF775485246999027B3197955`
- **BSC Testnet USDT**: Use your deployed TestUSDT contract address
- Go to: `https://bscscan.com/address/[USDT_ADDRESS]#writeContract`

#### 2. Connect Your Wallet
1. Click **"Connect to Web3"** button
2. Select your wallet (MetaMask, Trust Wallet, WalletConnect, etc.)
3. Approve the connection request

#### 3. Approve USDT Spending
1. Scroll down to find the **`approve`** function
2. Fill in the parameters:
   - **`spender (address)`**: Enter the RideBNB contract address
     - Example: `0xYourRideBNBContractAddress`
   - **`amount (uint256)`**: Enter the USDT amount in wei (18 decimals)
     - For unlimited approval: `115792089237316195423570985008687907853269984665640564039457584007913129639935`
     - For specific amount: Use amount × 10^18
       - $100 USDT = `100000000000000000000` (100 followed by 18 zeros)
       - $500 USDT = `500000000000000000000`
       - $1000 USDT = `1000000000000000000000`

#### 4. Confirm Transaction
1. Click **"Write"** button
2. Confirm the transaction in your wallet
3. Wait for transaction confirmation (usually 3 seconds on BSC)

> **💡 Pro Tip**: Approve a large amount once (like $10,000 USDT) to avoid approving before each transaction. This saves gas fees!

![Visual guide showing the complete USDT approval process on BSCScan](C:/Users/user/.gemini/antigravity/brain/b58da71c-6c1c-491d-9857-c22042a562e9/bscscan_approval_flow_1767630589133.png)

---

## Register Me Function

After approving USDT, you can register on the platform.

### Function: `registerMe(address _referrerAddress)`

#### Parameters
- **`_referrerAddress (address)`**: Wallet address of your referrer
  - If you don't have a referrer, use: `0x0000000000000000000000000000000000000000`
  - This will automatically assign you to the default root user

#### Steps on BSCScan

1. **Navigate to RideBNB Contract**
   - Go to: `https://bscscan.com/address/[RIDEBNB_CONTRACT]#writeContract`

2. **Connect Your Wallet**
   - Click "Connect to Web3"
   - Approve the connection

3. **Find `registerMe` Function**
   - Scroll to the `registerMe` function

4. **Enter Referrer Address**
   ```
   _referrerAddress: 0x1234567890abcdef... (or 0x0000... if no referrer)
   ```

5. **Click "Write"**
   - Confirm the transaction in your wallet
   - Registration cost: **$5 USDT + 5% admin fee** = **5.25 USDT total**

6. **Wait for Confirmation**
   - Once confirmed, you're registered!
   - Check your user ID by calling `id(address)` with your wallet address

---

## Upgrade Me Function

Once registered, you can upgrade your level to unlock higher earnings.

### Function: `upgradeMe(uint256 _levels)`

#### Parameters
- **`_levels (uint256)`**: Number of levels to upgrade
  - **Use simple decimal numbers**: `1`, `2`, `3`, `4`, `5`, etc.
  - **NOT** in wei format!
  - You can upgrade multiple levels at once (e.g., if you're Level 1, you can upgrade by 12 levels to reach Level 13)

#### Level Costs
| Level | Cost (USDT) | + Admin Fee (5%) | Total Cost |
|-------|-------------|------------------|------------|
| L1    | $5          | $0.25           | $5.25      |
| L2    | $10         | $0.50           | $10.50     |
| L3    | $20         | $1.00           | $21.00     |
| L4    | $40         | $2.00           | $42.00     |
| L5    | $80         | $4.00           | $84.00     |
| L6    | $160        | $8.00           | $168.00    |
| L7    | $320        | $16.00          | $336.00    |
| L8    | $640        | $32.00          | $672.00    |
| L9    | $1,280      | $64.00          | $1,344.00  |
| L10   | $2,560      | $128.00         | $2,688.00  |
| L11   | $5,120      | $256.00         | $5,376.00  |
| L12   | $10,240     | $512.00         | $10,752.00 |
| L13   | $20,480     | $1,024.00       | $21,504.00 |

![Complete pricing chart showing all 13 levels with costs and admin fees](C:/Users/user/.gemini/antigravity/brain/b58da71c-6c1c-491d-9857-c22042a562e9/upgrade_levels_chart_1767630620497.png)

#### Steps on BSCScan

1. **Navigate to RideBNB Contract**
   - Go to: `https://bscscan.com/address/[RIDEBNB_CONTRACT]#writeContract`

2. **Connect Your Wallet**

3. **Find `upgradeMe` Function**

4. **Enter Number of Levels**
   ```
   Example 1 - Upgrade 1 level:
   _levels: 1

   Example 2 - Upgrade 3 levels at once:
   _levels: 3

   Example 3 - Upgrade 5 levels:
   _levels: 5
   ```

![BSCScan interface example showing the upgradeMe function with simple decimal input](C:/Users/user/.gemini/antigravity/brain/b58da71c-6c1c-491d-9857-c22042a562e9/bscscan_interface_example_1767630641700.png)

5. **Click "Write"**
   - The contract will automatically calculate the total cost
   - Confirm the transaction in your wallet

6. **Wait for Confirmation**
   - Once confirmed, your level is upgraded!

#### Example Scenarios

**Scenario 1**: You're at Level 1, want to reach Level 2
- Enter: `_levels: 1`
- Cost: $10 + $0.50 = **$10.50 USDT**

**Scenario 2**: You're at Level 1, want to reach Level 4
- Enter: `_levels: 3`
- Cost: L2 ($10.50) + L3 ($21) + L4 ($42) = **$73.50 USDT**

**Scenario 3**: You're at Level 5, want to reach Level 13
- Enter: `_levels: 8`
- Cost: Sum of L6 through L13 = **$40,996.00 USDT**

---

## Gas Estimates

| Function     | Estimated Gas | BNB Cost (@ 3 Gwei) | USD Cost (@ $600/BNB) |
|-------------|---------------|---------------------|------------------------|
| Approve USDT | ~45,000       | 0.000135 BNB        | ~$0.08                |
| registerMe   | ~250,000      | 0.00075 BNB         | ~$0.45                |
| upgradeMe (1)| ~180,000      | 0.00054 BNB         | ~$0.32                |
| upgradeMe (5)| ~650,000      | 0.00195 BNB         | ~$1.17                |

> **Note**: Gas costs vary based on network congestion. Always check current gas prices.

---

## Troubleshooting

### Error: "USDT transfer failed"
**Cause**: Insufficient USDT approval or balance

**Solution**:
1. Check your USDT balance
2. Check your approval amount on BSCScan:
   - Go to USDT contract → Read Contract → `allowance`
   - Enter: `owner = your_address`, `spender = RideBNB_contract`
3. If allowance is too low, approve more USDT (see [USDT Approval Process](#usdt-approval-process))

### Error: "Already registered"
**Cause**: Your wallet is already registered

**Solution**:
- Use `getMyInfo()` function to check your current status
- If you want to upgrade, use `upgradeMe()` instead

### Error: "Exceeds max level"
**Cause**: Trying to upgrade beyond Level 13

**Solution**:
- Check your current level with `getMyInfo()`
- Maximum level is 13
- Adjust the `_levels` parameter accordingly

### Error: "Not registered"
**Cause**: Trying to upgrade before registering

**Solution**:
- First call `registerMe()` to register
- Then you can call `upgradeMe()`

### Error: "Unauthorized"
**Cause**: Connected wallet doesn't match registered address

**Solution**:
- Make sure you're connected with the same wallet you used to register
- Check the connected wallet in your browser extension

---

## Quick Reference

### Contract Functions Summary

| Function | Parameters | Purpose | Example |
|----------|-----------|---------|---------|
| `approve` (USDT) | `spender`, `amount` | Allow contract to spend USDT | `spender: 0x...`, `amount: 1000000000000000000000` |
| `registerMe` | `_referrerAddress` | Register new account | `0x1234...` or `0x0000...` |
| `upgradeMe` |## Helper View Functions

Before using write functions, you can check costs and your account status using **Read Contract** tab:

### 1. `getRegistrationCost()`
Check how much USDT you need to register:
- Go to "Read Contract" tab
- Find `getRegistrationCost`
- Click "Query"
- Returns: `cost`, `levelCost`, `adminFee` (all in wei - divide by 10^18)

**Example Output:**
- `levelCost`: 5000000000000000000 (5 USDT)
- `adminFee`: 250000000000000000 (0.25 USDT)
- `cost`: 5250000000000000000 (5.25 USDT total)

### 2. `getUpgradeCostFor()` ⭐ NEW BSCScan-Friendly!
Check upgrade cost for YOUR address:
- Go to "Read Contract" tab
- Find `getUpgradeCostFor`
- Enter **your wallet address** in `_userAddress`
- Enter number of levels in `_levels` (e.g., `1`, `3`, `5`)
- Click "Query"
- Returns: `totalCost` and `breakdown` array

**Important**: Use `getUpgradeCostFor()` NOT `getUpgradeCost()`!  
The old `getUpgradeCost()` doesn't work on BSCScan.

**Example**:
```
_userAddress: 0xYourAddress
_levels: 3
```
Returns the total USDT cost to upgrade 3 levels and cost breakdown per level.

### 3. `getMyInfo()`
**Note**: This function uses `msg.sender` so it won't work on BSCScan Read Contract.  
- Use it from your dApp/frontend
- Or query `userInfo(userId)` directly with your user ID

### 4. `getAllLevelCosts()`
Get pricing for all 13 levels:
- Returns arrays: `costs`, `fees`, `totals`
- All values in wei (divide by 10^18)ls
- **`getRegistrationCost()`**: Returns cost to register
- **`id(address)`**: Get user ID from wallet address
- **`userInfo(uint)`**: Get full user info by ID

---

## Security Tips

1. **Always verify the contract address** before approving or sending transactions
2. **Start with small amounts** when testing on mainnet
3. **Use BSC Testnet first** to familiarize yourself with the process
4. **Double-check referrer addresses** - once set, it cannot be changed
5. **Keep your wallet secure** - never share your seed phrase
6. **Verify transactions** on BSCScan after each operation

---

## Need Help?

- Check transaction on BSCScan for detailed error messages
- Join our Telegram/Discord community
- Contact support with your transaction hash

---

**Last Updated**: January 2026
**Contract Version**: RideBNB v1.0 (USDT)
