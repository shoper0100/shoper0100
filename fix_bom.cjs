const fs = require('fs');
const path = require('path');

const files = [
    path.join(__dirname, 'contracts', 'FiveDollarRide_BNB.sol'),
    path.join(__dirname, 'contracts', 'FiveDollarRide_USDT.sol')
];

files.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            // Check for BOM
            if (content.charCodeAt(0) === 0xFEFF) {
                console.log(`BOM found in ${path.basename(filePath)}. Stripping...`);
                content = content.slice(1);
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Fixed ${path.basename(filePath)}`);
            } else {
                console.log(`No BOM found in ${path.basename(filePath)}`);
                // Force rewrite just in case invisible char is handled weirdly
                // fs.writeFileSync(filePath, content, 'utf8');
            }
        } catch (err) {
            console.error(`Error processing ${path.basename(filePath)}:`, err);
        }
    } else {
        console.log(`File not found: ${path.basename(filePath)}`);
    }
});
