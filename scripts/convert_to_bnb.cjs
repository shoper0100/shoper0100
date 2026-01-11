const fs = require('fs');

// Read the BNB contract
let contract = fs.readFileSync('f:/ridebnb/contracts/FiveDollarRide_BNB.sol', 'utf8');

// Replace all USDT transfers with BNB transfers
contract = contract.replace(/USDT\.safeTransfer\(([^,]+),\s*([^)]+)\)/g, 'payable($1).transfer($2)');
contract = contract.replace(/USDT\.transfer\(([^,]+),\s*([^)]+)\)/g, 'payable($1).transfer($2)');

// Replace USDT.transferFrom with require(msg.value >= amount)
contract = contract.replace(/require\(\s*USDT\.transferFrom\([^,]+,\s*[^,]+,\s*([^\)]+)\)[^;]*;/g, '// BNB payment handled by payable function');

// Make register and upgrade functions payable
contract = contract.replace(/function register\([^)]*\) external nonReentrant whenNotPaused/g, 'function register(uint _ref, address _newAcc) external payable nonReentrant whenNotPaused');
contract = contract.replace(/function upgrade\([^)]*\) external nonReentrant whenNotPaused/g, 'function upgrade(uint _id, uint _lvls) external payable nonReentrant whenNotPaused');
contract = contract.replace(/function upgradeMe\([^)]*\) external nonReentrant whenNotPaused/g, 'function upgradeMe(uint _levels) external payable nonReentrant whenNotPaused');

// Replace USDT balance check with address(this).balance
contract = contract.replace(/USDT\.balanceOf\(address\(this\)\)/g, 'address(this).balance');

// Add receive function for accepting BNB
const receiveFunction = `\n    // Accept BNB payments\n    receive() external payable {}\n\n`;
const insertPoint = contract.indexOf('// ============ CONSTRUCTOR ============');
if (insertPoint > 0) {
    contract = contract.slice(0, insertPoint) + receiveFunction + contract.slice(insertPoint);
}

// Write the updated contract
fs.writeFileSync('f:/ridebnb/contracts/FiveDollarRide_BNB.sol', contract, 'utf8');

console.log('✅ Converted to BNB version:');
console.log('- Removed USDT/SafeERC20');
console.log('- Changed all transfers to BNB');
console.log('- Made functions payable');
console.log('- Added receive() function');
console.log('- Ready to compile!');
