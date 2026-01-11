// Export ABIs properly using Node.js
const fs = require('fs');
const path = require('path');

// Read the compiled contracts
const rideBNB = require('../artifacts/contracts/RideBNB.sol/RideBNB.json');
const royalty = require('../artifacts/contracts/Royalty.sol/Royalty.json');

// Extract and save ABIs
fs.writeFileSync(
    path.join(__dirname, '../lib/RideBNB_ABI.json'),
    JSON.stringify(rideBNB.abi, null, 2),
    'utf8'
);

fs.writeFileSync(
    path.join(__dirname, '../lib/Royalty_ABI.json'),
    JSON.stringify(royalty.abi, null, 2),
    'utf8'
);

console.log('✅ ABIs exported successfully');

// Verify userInfo exists
const userInfoFunc = rideBNB.abi.find(item => item.name === 'userInfo');
if (userInfoFunc) {
    console.log('✅ userInfo function found in RideBNB ABI');
    console.log('   Fields:', userInfoFunc.outputs.map(o => o.name).join(', '));
} else {
    console.log('❌ userInfo function NOT found in ABI');
}
