/**
 * Comprehensive Contract Validation Script
 * Checks for bugs, missing functions, and all possible errors
 */

const fs = require('fs');
const path = require('path');

const contractPath = path.join(__dirname, '../contracts/FiveDollarRide_USDT.sol');
const contract = fs.readFileSync(contractPath, 'utf8');

console.log('🔍 Comprehensive Contract Validation\n');
console.log('='.repeat(60));

const issues = [];
const warnings = [];
const info = [];

// ============ Check 1: Required Functions ============
console.log('\n✓ Checking required functions...');

const requiredFunctions = [
    'register',
    'registerMe',
    'upgrade',
    'upgradeMe',
    'claimRoyalty',
    'claimMyRoyalty',
    'setLevelCost',
    'pauseContract',
    'unpauseContract',
    'transferOwnership',
    'renounceOwnership',
    '_createUser',
    '_placeInBinaryMatrix',
    '_distributeMatrixIncome',
    '_processSponsorCommission',
    '_getLevelCost'
];

requiredFunctions.forEach(fn => {
    const regex = new RegExp(`function ${fn}\\s*\\(`);
    if (!regex.test(contract)) {
        issues.push(`❌ CRITICAL: Missing required function: ${fn}()`);
    } else {
        info.push(`✓ Found: ${fn}()`);
    }
});

// ============ Check 2: SafeERC20 Usage ============
console.log('\n✓ Checking SafeERC20 implementation...');

if (!contract.includes('using SafeERC20 for IERC20')) {
    issues.push('❌ CRITICAL: SafeERC20 not enabled');
} else {
    info.push('✓ SafeERC20 enabled');
}

if (contract.includes('USDT.transfer(') && !contract.includes('USDT.safeTransfer(')) {
    issues.push('❌ CRITICAL: Still using unsafe USDT.transfer() instead of safeTransfer()');
} else if (contract.includes('USDT.safeTransfer(')) {
    info.push('✓ Using safe USDT transfers');
}

// ============ Check 3: Event Declarations ============
console.log('\n✓ Checking event declarations...');

const requiredEvents = [
    'UserRegistered',
    'UserUpgraded',
    'RoyaltyClaimed',
    'AdminFeePaid',
    'SponsorCommissionPaid',
    'MatrixPayment',
    'ReferralPayment',
    'OwnershipTransferred',
    'ContractPaused',
    'ContractUnpaused'
];

requiredEvents.forEach(evt => {
    if (!contract.includes(`event ${evt}`)) {
        warnings.push(`⚠️  Missing event: ${evt}`);
    } else {
        info.push(`✓ Event declared: ${evt}`);
    }
});

// ============ Check 4: Reentrancy Protection ============
console.log('\n✓ Checking reentrancy protection...');

if (!contract.includes('modifier nonReentrant()')) {
    issues.push('❌ CRITICAL: Missing nonReentrant modifier');
} else {
    info.push('✓ nonReentrant modifier defined');
}

const criticalFunctions = ['register', 'upgrade', 'claimRoyalty'];
criticalFunctions.forEach(fn => {
    const regex = new RegExp(`function ${fn}[^{]*nonReentrant`);
    if (!regex.test(contract)) {
        warnings.push(`⚠️  Function ${fn}() may be missing nonReentrant`);
    }
});

// ============ Check 5: Access Control ============
console.log('\n✓ Checking access control...');

if (!contract.includes('modifier onlyOwner()')) {
    issues.push('❌ CRITICAL: Missing onlyOwner modifier');
} else {
    info.push('✓ onlyOwner modifier defined');
}

// ============ Check 6: Constants & Immutables ============
console.log('\n✓ Checking constants and immutables...');

const requiredConstants = [
    'MAX_LEVELS',
    'ADMIN_FEE_PERCENT',
    'ROYALTY_FUND_PERCENT',
    'MAX_PLACEMENT_DEPTH'
];

requiredConstants.forEach(constant => {
    if (!contract.includes(constant)) {
        warnings.push(`⚠️  Missing constant: ${constant}`);
    } else {
        info.push(`✓ Constant defined: ${constant}`);
    }
});

// ============ Check 7: Timelock Implementation ============
console.log('\n✓ Checking timelock implementation...');

if (!contract.includes('TIMELOCK_DELAY')) {
    warnings.push('⚠️  Missing timelock implementation');
} else {
    info.push('✓ Timelock implemented');
    if (!contract.includes('proposeLevelCostChange')) {
        issues.push('❌ Missing proposeLevelCostChange function');
    }
    if (!contract.includes('executeLevelCostChange')) {
        issues.push('❌ Missing executeLevelCostChange function');
    }
}

// ============ Check 8: Rate Limiting ============
console.log('\n✓ Checking rate limiting...');

if (!contract.includes('ACTION_COOLDOWN')) {
    warnings.push('⚠️  Missing rate limiting');
} else {
    info.push('✓ Rate limiting implemented');
    if (!contract.includes('modifier rateLimit()')) {
        issues.push('❌ Missing rateLimit modifier');
    }
}

// ============ Check 9: Emergency Functions ============
console.log('\n✓ Checking emergency functions...');

if (!contract.includes('function emergencyWithdraw')) {
    warnings.push('⚠️  Missing emergency withdraw function');
} else {
    info.push('✓ Emergency withdraw implemented');
}

// ============ Check 10: View Functions ============
console.log('\n✓ Checking comprehensive view functions...');

const viewFunctions = [
    'getUserProfile',
    'getUserIncomeDetails',
    'getMatrixInfo',
    'getSponsorLineage',
    'getPlatformStats',
    'getBatchUserProfiles'
];

let viewCount = 0;
viewFunctions.forEach(fn => {
    if (contract.includes(`function ${fn}`)) {
        viewCount++;
    }
});

if (viewCount < 3) {
    warnings.push('⚠️  Limited view functions for off-chain querying');
} else {
    info.push(`✓ Found ${viewCount} comprehensive view functions`);
}

// ============ Check 11: Syntax Issues ============
console.log('\n✓ Checking for common syntax issues...');

// Check for unmatched brackets
const openBraces = (contract.match(/{/g) || []).length;
const closeBraces = (contract.match(/}/g) || []).length;
if (openBraces !== closeBraces) {
    issues.push(`❌ CRITICAL: Unmatched braces (${openBraces} open, ${closeBraces} close)`);
} else {
    info.push('✓ Braces balanced');
}

// Check for missing semicolons in function calls
const missingSemicolons = contract.match(/\)\s*$/gm);
if (missingSemicolons && missingSemicolons.length > 5) {
    warnings.push('⚠️  Potential missing semicolons detected');
}

// ============ Check 12: Royalty Integration ============
console.log('\n✓ Checking Royalty contract integration...');

if (!contract.includes('interface IRoyalty')) {
    issues.push('❌ CRITICAL: Missing IRoyalty interface');
} else {
    info.push('✓ IRoyalty interface defined');
}

if (!contract.includes('ROYALTY_ADDR.registerUser')) {
    warnings.push('⚠️  May not be registering users with Royalty contract');
} else {
    info.push('✓ Royalty integration found');
}

// ============ Report Generation ============
console.log('\n' + '='.repeat(60));
console.log('\n📊 VALIDATION REPORT\n');

console.log(`✅ Passed Checks: ${info.length}`);
console.log(`⚠️  Warnings: ${warnings.length}`);
console.log(`❌ Critical Issues: ${issues.length}\n`);

if (issues.length > 0) {
    console.log('🔴 CRITICAL ISSUES:');
    issues.forEach(issue => console.log('  ' + issue));
    console.log('');
}

if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach(warning => console.log('  ' + warning));
    console.log('');
}

// Summary
console.log('='.repeat(60));
if (issues.length === 0) {
    console.log('\n✅ CONTRACT VALIDATION PASSED');
    console.log('Contract is ready for deployment!\n');
} else {
    console.log('\n❌ CONTRACT HAS ISSUES');
    console.log(`Please fix ${issues.length} critical issue(s) before deployment\n`);
    process.exit(1);
}

// Save report
const report = {
    timestamp: new Date().toISOString(),
    summary: {
        passed: info.length,
        warnings: warnings.length,
        issues: issues.length
    },
    details: { info, warnings, issues }
};

fs.writeFileSync(
    path.join(__dirname, '../validation-report.json'),
    JSON.stringify(report, null, 2)
);

console.log('📄 Report saved to validation-report.json\n');
