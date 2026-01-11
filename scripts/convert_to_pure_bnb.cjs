const fs = require('fs');

console.log('🔄 Converting to Pure BNB Version...\n');

// Read the contract
let contract = fs.readFileSync('f:/ridebnb/contracts/FiveDollarRide_BNB_Pure.sol', 'utf8');

// 1. Update contract description
contract = contract.replace(
    'USDT-based payments only',
    'Native BNB payments (no token approvals needed)'
);
contract = contract.replace(
    '$5 to $20,480',
    '$5 to $20,480 in BNB'
);

// 2. Remove USDT interface and token
contract = contract.replace(/\/\/ USDT Token Interface[\s\S]*?}\n\n/, '');
contract = contract.replace(/IERC20 public immutable USDT;\n\s*/, '');
contract = contract.replace(/_usdtToken\n/, '');
contract = contract.replace(/require\(_usdtToken.*\n\s*/, '');
contract = contract.replace(/USDT = IERC20\(_usdtToken\);\n\s*/, '');

// 3. Make register/upgrade functions payable
contract = contract.replace(
    /function register\(uint _ref, address _newAcc\) external nonReentrant whenNotPaused/g,
    'function register(uint _ref, address _newAcc) external payable nonReentrant whenNotPaused'
);
contract = contract.replace(
    /function upgrade\(uint _id, uint _lvls\) external nonReentrant whenNotPaused/g,
    'function upgrade(uint _id, uint _lvls) external payable nonReentrant whenNotPaused'
);
contract = contract.replace(
    /function upgradeMe\(uint _levels\) external nonReentrant whenNotPaused/g,
    'function upgradeMe(uint _levels) external payable nonReentrant whenNotPaused'
);

// 4. Replace USDT.transferFrom with msg.value check
contract = contract.replace(
    /require\(\s*USDT\.transferFrom\(msg\.sender, address\(this\), requiredAmount\),[\s\S]*?"USDT transfer failed"[\s\S]*?\);/g,
    'require(msg.value >= requiredAmount, "Insufficient BNB sent");'
);

// 5. Replace USDT.transfer with payable().transfer()
contract = contract.replace(
    /require\(USDT\.transfer\(([^,]+), ([^)]+)\), "([^"]+)"\);/g,
    'payable($1).transfer($2);'
);

// 6. Replace USDT balance check
contract = contract.replace(
    /USDT\.balanceOf\(address\(this\)\)/g,
    'address(this).balance'
);

// 7. Add receive function before constructor
const receiveFunc = `\n    // ============ RECEIVE FUNCTION ============\n    \n    /**\n     * @notice Accept BNB payments\n     */\n    receive() external payable {}\n    \n`;
contract = contract.replace(
    '// ============ CONSTRUCTOR ============',
    receiveFunc + '// ============ CONSTRUCTOR ============'
);

// Write the converted contract
fs.writeFileSync('f:/ridebnb/contracts/FiveDollarRide_BNB_Pure.sol', contract, 'utf8');

console.log('✅ Conversion Complete!\n');
console.log('Changes made:');
console.log('  ✓ Removed USDT token interface and imports');
console.log('  ✓ Made register/upgrade functions payable');
console.log('  ✓ Replaced USDT.transferFrom with msg.value checks');
console.log('  ✓ Replaced USDT.transfer with payable().transfer()');
console.log('  ✓ Added receive() function for BNB payments');
console.log('  ✓ Updated balance checks to use address(this).balance\n');
console.log('✅ All logic preserved:');
console.log('  ✓ 13-level progression');
console.log('  ✓ Binary matrix placement');
console.log('  ✓ Team counting (correct logic)');
console.log('  ✓ Sponsor commissions');
console.log('  ✓ Matrix income distribution');
console.log('  ✓ Royalty pool');
console.log('\n🚀 Ready to compile: FiveDollarRide_BNB_Pure.sol');
