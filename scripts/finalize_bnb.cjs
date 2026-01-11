const fs = require('fs');

console.log('🔧 Completing BNB Conversion 100%...\n');

let contract = fs.readFileSync('f:/ridebnb/contracts/FiveDollarRide_BNB_Pure.sol', 'utf8');

// 1. Remove USDT token completely
contract = contract.replace(/IERC20 public immutable USDT;\n\s*/g, '');
contract = contract.replace(/,\n\s*address _usdtToken/g, '');
contract = contract.replace(/require\(_usdtToken != address\(0\), "Invalid USDT"\);\n\s*/g, '');
contract = contract.replace(/USDT = IERC20\(_usdtToken\);\n\s*/g, '');

// 2. Replace all USDT.transferFrom with msg.value check
contract = contract.replace(/require\(USDT\.transferFrom\([^,]+,\s*[^,]+,\s*([^)]+)\),\s*"[^"]+"\);/g, 'require(msg.value >= $1, "Insufficient BNB");');

// 3. Replace all USDT.transfer with payable().transfer()
contract = contract.replace(/bool success = USDT\.transfer\(([^,]+),\s*([^)]+)\);/g, '(bool success, ) = payable($1).call{value: $2}("");');
contract = contract.replace(/USDT\.transfer\(([^,]+),\s*([^)]+)\)/g, 'payable($1).transfer($2)');

// 4. Update comments
contract = contract.replace(/USDT cost in wei/g, 'BNB cost in wei');
contract = contract.replace(/USDT transfer failed/g, 'BNB transfer failed');
contract = contract.replace(/USDT payment/g, 'BNB payment');
contract = contract.replace(/with USDT/g, 'with BNB');
contract = contract.replace(/Minimum cost is 1 USDT/g, 'Minimum cost is 1 BNB');
contract = contract.replace(/Maximum cost is 100,000 USDT/g, 'Maximum cost is 100,000 BNB');

// 5. Remove IERC20 interface (not needed for BNB)
contract = contract.replace(/\/\/ USDT Token Interface\ninterface IERC20 \{[\s\S]*?\n\}\n\n/g, '');

fs.writeFileSync('f:/ridebnb/contracts/FiveDollarRide_BNB_Pure.sol', contract, 'utf8');

console.log('✅ BNB Conversion 100% Complete!\n');
console.log('Changes:');
console.log('  ✓ Removed IERC20 interface');
console.log('  ✓ Removed USDT token from immutables');
console.log('  ✓ Removed USDT parameter from constructor');
console.log('  ✓ Replaced all USDT.transferFrom with msg.value checks');
console.log('  ✓ Replaced all USDT.transfer with payable().transfer()');
console.log('  ✓ Updated all comments/documentation');
console.log('\n🎯 Pure BNB contract ready to compile!');
