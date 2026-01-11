# Affiliate Link System - Complete Logic

## Overview

The RideBNB affiliate system allows every user to recruit others and earn income through a unique referral link.

## How It Works

### 1. User Registration & ID Assignment

**When a user registers:**

```solidity
function register(uint _ref, address _newAcc) external payable {
    // Generate unique ID
    uint _newId = defaultRefer + totalUsers + 7;
    
    // Example:
    // Root ID: 36999
    // User 1: 36999 + 0 + 7 = 37006
    // User 2: 36999 + 1 + 7 = 37007
    // User 3: 36999 + 2 + 7 = 37008
    
    id[_newAcc] = _newId;  // Map address to ID
    userInfo[_newId].referrer = _ref;  // Set referrer
}
```

**Result:**
- Every user gets a unique numeric ID
- ID is used as their referral code
- Address maps to ID in smart contract

### 2. Affiliate Link Generation

**Frontend creates shareable link:**

```
Format: https://yourapp.com/?ref=37006

Where:
- Base URL: https://yourapp.com
- Parameter: ?ref=37006
- 37006 = User A's ID (referral code)
```

**Example Links:**

```
User A (ID 37006): https://yourapp.com/?ref=37006
User B (ID 37007): https://yourapp.com/?ref=37007
Root User: https://yourapp.com/?ref=36999
```

### 3. New User Clicks Link

**Step 1: Extract Referral ID**

```javascript
// Frontend JavaScript
const urlParams = new URLSearchParams(window.location.search);
const referrerId = urlParams.get('ref');

// Example: URL is https://yourapp.com/?ref=37006
// referrerId = "37006"
```

**Step 2: Store Referrer**

```javascript
// Save in frontend state
localStorage.setItem('referrer', referrerId);

// Or store in React state
const [referrer, setReferrer] = useState(referrerId);
```

**Step 3: Pre-fill Registration**

```javascript
// When user clicks "Register" button
const referrerId = localStorage.getItem('referrer') || 36999; // Default to root

// Call smart contract
await contract.register(
    referrerId,  // The person who referred them
    userAddress,
    { value: registrationFee }
);
```

### 4. Smart Contract Processing

**Contract receives registration:**

```solidity
function register(uint _ref, address _newAcc) external payable {
    // Validate referrer exists
    if(_ref == 0 || userInfo[_ref].account == address(0)) {
        _ref = defaultRefer;  // Fallback to root if invalid
    }
    
    // Create new user
    uint _newId = defaultRefer + totalUsers + 7;
    userInfo[_newId].referrer = _ref;  // Store referrer permanently
    
    // Pay referrer
    payable(userInfo[_ref].account).transfer(levels[0]);  // 0.004 BNB
    userInfo[_ref].referralIncome += levels[0];
    
    // Add to referrer's direct team
    directTeam[_ref].push(_newId);
    userInfo[_ref].directTeam++;
}
```

**Result:**
- New user created with referrer link
- Referrer receives registration income (0.004 BNB)
- New user added to referrer's team

## Complete Flow Example

### Scenario: User A Shares Link

**Step 1: User A Gets Their Link**

```javascript
// User A logged in, ID = 37006
const userId = await contract.id(userAddress);  // Returns 37006
const affiliateLink = `https://ridebnb.com/?ref=${userId}`;

// affiliateLink = "https://ridebnb.com/?ref=37006"
```

**Step 2: User A Shares on Social Media**

```
User A posts:
"Join RideBNB and earn passive income! 
Use my link: https://ridebnb.com/?ref=37006"
```

**Step 3: User B Clicks Link**

```
Browser opens: https://ridebnb.com/?ref=37006
                                    ↑
                            This is User A's ID
```

**Step 4: Frontend Captures Referrer**

```javascript
// Frontend code runs automatically
const params = new URLSearchParams(window.location.search);
const referrer = params.get('ref');  // "37006"

// Save for later
localStorage.setItem('referrer', referrer);

// Show on page
<div>You were referred by User #{referrer}</div>
```

**Step 5: User B Registers**

```javascript
// User B clicks "Register" button
const referrerId = localStorage.getItem('referrer');  // "37006"

await contract.register(
    37006,  // User A's ID
    userBAddress,
    { value: "4200000000000000" }  // 0.0042 BNB
);
```

**Step 6: Smart Contract Executes**

```solidity
// 1. Create User B
User B ID: 37007
User B referrer: 37006 (User A)

// 2. Pay User A
User A receives: 0.004 BNB (registration income)

// 3. Update teams
directTeam[37006].push(37007)  // User B added to User A's team
userInfo[37006].directTeam = 1  // User A now has 1 direct
```

**Step 7: User B Can Now Share Too**

```javascript
// User B gets their own link
const userBId = 37007;
const userBLink = `https://ridebnb.com/?ref=37007`;

// User B shares and recruits User C, D, E...
```

## Income from Affiliate Links

### Direct Referral Income

**When someone registers using your link:**

```
Registration fee: 0.004 BNB
You receive: 0.004 BNB (100%)
Admin fee: 0.0002 BNB

Total user pays: 0.0042 BNB
```

**Example:**
```
User A refers 10 people
Each pays: 0.0042 BNB
User A receives: 10 × 0.004 = 0.04 BNB
```

### Sponsor Commission (NEW FEATURE)

**When your direct referral upgrades:**

```solidity
// User B (your referral) upgrades to Level 2
Upgrade cost: 0.006 BNB
Your commission: 5% = 0.0003 BNB

// If you're Level 4+, you receive commission
if(userInfo[yourId].level >= 4) {
    userInfo[yourId].sponsorIncome += 0.0003 BNB;
}
```

**Example:**
```
You refer 10 people at Level 4+
Each upgrades all levels (total: 0.024 BNB per person)
Your commission: 10 × (0.024 × 5%) = 0.012 BNB
```

### Matrix Income

**When anyone in your 13-layer matrix upgrades:**

```
You're not just limited to direct referrals!
Your matrix can grow to 16,382 people
When ANYONE upgrades and you're the first qualified upline:
You receive: FULL upgrade amount

Example: User in Layer 5 upgrades Level 3 (0.012 BNB)
If you're qualified: You receive 0.012 BNB
```

## Frontend Implementation

### Basic Affiliate System

```javascript
// 1. Get user's affiliate link
async function getAffiliateLink() {
    const userId = await contract.id(userAddress);
    const baseUrl = window.location.origin;
    return `${baseUrl}/?ref=${userId}`;
}

// 2. Display to user
const link = await getAffiliateLink();
document.getElementById('affiliateLink').value = link;
// Shows: https://ridebnb.com/?ref=37006

// 3. Copy to clipboard function
function copyLink() {
    navigator.clipboard.writeText(link);
    alert('Affiliate link copied!');
}

// 4. Share on social media
function shareOnTwitter() {
    const text = "Join RideBNB and earn passive income!";
    const url = encodeURIComponent(link);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
}
```

### Advanced Features

**Track Referrals:**

```javascript
// Get user's direct team
const directTeam = await contract.getDirectTeam(userId);
console.log(`You have ${directTeam.length} direct referrals`);

// Get detailed team info
const teamData = await contract.getDirectTeamUsers(userId, 10);
// Returns full User struct for each team member
```

**Show Earnings:**

```javascript
// Get referral income
const userData = await contract.getUserData(userId);
console.log(`Referral Income: ${userData.referralIncome} BNB`);
console.log(`Sponsor Income: ${userData.sponsorIncome} BNB`);
console.log(`Matrix Income: ${userData.levelIncome} BNB`);
```

**Leaderboard:**

```javascript
// Track who has most referrals
const allUsers = await contract.getGlobalUsers(0, 100);
const leaderboard = allUsers.sort((a, b) => 
    b.directTeam - a.directTeam
);
// Display top recruiters
```

## Referral Link Validation

### Frontend Validation

```javascript
function validateReferrer(referrerId) {
    // Check if exists
    const exists = await contract.userExists(referrerId);
    
    if(!exists) {
        // Fallback to root
        return 36999;
    }
    
    return referrerId;
}
```

### Smart Contract Validation

```solidity
// Built-in validation in register()
if(_ref == 0 || userInfo[_ref].account == address(0)) {
    _ref = defaultRefer;  // Use root if invalid
}
```

**Protection:**
- Invalid referrer ID → Defaults to root (36999)
- Orphan protection → All users get placed
- No broken links → System always works

## Tracking & Analytics

### User Dashboard

**Show user their affiliate performance:**

```javascript
// Overview
Total Referrals: ${directTeam.length}
Registration Income: ${referralIncome} BNB
Sponsor Commission: ${sponsorIncome} BNB
Matrix Income: ${levelIncome} BNB
Total Earned: ${totalIncome} BNB

// Recent referrals (last 10)
const recentTeam = await contract.getDirectTeamUsers(userId, 10);
recentTeam.forEach(user => {
    console.log(`User #${user.id} joined ${timeAgo(user.start)}`);
});

// Matrix size
Total Matrix Team: ${userData.totalMatrixTeam}
Matrix Layer 1: 2 users max
Matrix Layers 1-13: Up to 16,382 users
```

### Global Statistics

```javascript
// Platform stats
Total Users: await contract.totalUsers()
Total Registrations Today: [calculate from events]
Top Recruiter: [user with most directTeam]
Most Active: [user with most income]
```

## Social Sharing

### Share Buttons

```javascript
// Twitter
function shareTwitter() {
    const url = affiliateLink;
    const text = "Join the limitless global matrix!";
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
}

// Telegram
function shareTelegram() {
    const url = affiliateLink;
    const text = "Join RideBNB";
    window.open(`https://t.me/share/url?url=${url}&text=${text}`);
}

// WhatsApp
function shareWhatsApp() {
    const url = affiliateLink;
    const text = `Join RideBNB: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
}

// Copy Link
function copyLink() {
    navigator.clipboard.writeText(affiliateLink);
    showNotification('Link copied!');
}
```

## QR Code Generation

```javascript
// Generate QR code for affiliate link
import QRCode from 'qrcode';

async function generateQR() {
    const qrDataUrl = await QRCode.toDataURL(affiliateLink);
    document.getElementById('qrCode').src = qrDataUrl;
}
```

**User can:**
- Show QR code to friends
- Print QR code on materials
- Share QR in presentations

## Complete User Journey

### 1. User A Registers (from Root)
```
URL: https://ridebnb.com/?ref=36999
↓
Registers with Root as referrer
↓
Gets ID: 37006
↓
Gets own link: https://ridebnb.com/?ref=37006
```

### 2. User A Shares Link
```
Posts on social media
Sends to friends
Shares in groups
↓
10 people click link
```

### 3. Those 10 People Register
```
Each uses: ?ref=37006
↓
User A receives: 10 × 0.004 = 0.04 BNB
User A's directTeam: 10
```

### 4. Chain Continues
```
User A's referrals refer others
↓
User A gets sponsor commission (5%)
User A earns from matrix (full amounts)
↓
Perpetual income stream!
```

## Summary

### How Affiliate Links Work:

✅ **Generation:** User ID becomes referral code
✅ **Format:** yourapp.com/?ref=[USER_ID]
✅ **Tracking:** Frontend extracts ref parameter
✅ **Registration:** Contract stores referrer permanently
✅ **Income:** Referrer earns from registration + upgrades + matrix

### Income Breakdown:

1. **Registration:** 0.004 BNB per referral (100%)
2. **Sponsor Commission:** 5% of direct referral upgrades
3. **Matrix Income:** Full amounts from 13-layer downline

### Key Features:

- ✅ Unique link per user
- ✅ Automatic tracking
- ✅ Perpetual income
- ✅ Team building tools
- ✅ Social sharing
- ✅ QR code support
- ✅ Analytics dashboard

**The affiliate system makes recruitment easy and profitable!** 🚀
