const fs = require('fs');

const buildInfo = JSON.parse(fs.readFileSync('artifacts/build-info/e4508a12b08e25b26d4579970e62bbaf.json', 'utf8'));
const standardInput = buildInfo.input;

fs.writeFileSync('StandardInput_Clean.json', JSON.stringify(standardInput, null, 2));
console.log('✓ Created StandardInput_Clean.json');
