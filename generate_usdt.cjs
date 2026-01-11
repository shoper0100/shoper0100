const fs = require('fs');
const path = require('path');

const bnbPath = path.join(__dirname, 'contracts', 'FiveDollarRide.sol');
const usdtPath = path.join(__dirname, 'contracts', 'FiveDollarRide_USDT.sol');

try {
    let content = fs.readFileSync(bnbPath, 'utf8');
    // Explicitly strip BOM if present
    content = content.replace(/^\uFEFF/, '');

    // 1. Add Username Mappings
    content = content.replace(
        'uint private userIdCounter;',
        'uint private userIdCounter;\n    \n    // Username registration\n    mapping(string => address) public usernameToAddress;\n    mapping(string => bool) public usernameExists;'
    );

    // 2. Update User Struct
    content = content.replace(
        'address account;',
        'address account;\n        string username;'
    );

    // 3. Initialize Root Username
    content = content.replace(
        '_createUser(DEFAULT_REFER, _rootUserAddress, DEFAULT_REFER, DEFAULT_REFER, 12);',
        '_createUser(DEFAULT_REFER, _rootUserAddress, "root", DEFAULT_REFER, DEFAULT_REFER, 12);\n        usernameToAddress["root"] = _rootUserAddress;\n        usernameExists["root"] = true;'
    );

    // 4. Update Register Logic
    const registerSearch = `_createUser(_newId, _newAcc, _ref, _ref, 0);`;
    const registerReplace = `_createUser(_newId, _newAcc, username, _ref, _ref, 0);
        usernameToAddress[username] = _newAcc;
        usernameExists[username] = true;`;

    if (content.includes(registerSearch)) {
        content = content.replace(registerSearch, registerReplace);
    } else {
        console.error("Could not find register _createUser call");
    }

    // 5. Update _createUser definition (add Overload)
    const createFnSearch = 'function _createUser(uint _userId, address _account, uint _referrer, uint _upline, uint _level) private {';
    const createFnReplace = `function _createUser(uint _userId, address _account, uint _referrer, uint _upline, uint _level) private {
        _createUser(_userId, _account, "", _referrer, _upline, _level);
    }
    
    function _createUser(uint _userId, address _account, string memory _username, uint _referrer, uint _upline, uint _level) private {`;

    content = content.replace(createFnSearch, createFnReplace);

    // 6. Ensure struct assignment includes username
    content = content.replace(
        'account: _account,',
        'account: _account,\n            username: _username,'
    );

    // 7. Add _isValidUsername helper
    const viewHeader = '// ============ VIEW FUNCTIONS ============';
    const validationFn = `// ============ HELPER FUNCTIONS ============

    function _isValidUsername(string memory username) private pure returns (bool) {
        bytes memory b = bytes(username);
        if (b.length < 3 || b.length > 20) return false;
        
        for (uint256 i = 0; i < b.length; i++) {
            bytes1 char = b[i];
            if (!(char >= 0x30 && char <= 0x39) && 
                !(char >= 0x41 && char <= 0x5A) && 
                !(char >= 0x61 && char <= 0x7A)) 
            {
                return false;
            }
        }
        return true;
    }

    // ============ VIEW FUNCTIONS ============`;

    content = content.replace(viewHeader, validationFn);

    // 8. Update Register Function Signature AND Documentation using REGEX
    const regSigRegex = /\/\*\*[\s\S]*?\*\/\s*function register\(uint _ref, address _newAcc\) external nonReentrant whenNotPaused \{[\s\S]*?uint levelCost/m;

    const newRegStart = `/**
     * @notice Register new user with username and USDT payment
     * @param username Username for the new user (3-20 characters)
     * @param referrerUsername Username of referrer (empty = default root)
     */
    function register(string memory username, string memory referrerUsername) external nonReentrant whenNotPaused {
        require(id[msg.sender] == 0, "Already registered");
        require(msg.sender != address(0), "Invalid address");
        require(_isValidUsername(username), "Invalid username");
        require(!usernameExists[username], "Username taken");

        // Validate referrer or use default
        if (bytes(referrerUsername).length == 0) {
            referrerUsername = "root";
        }
        
        address referrerAddr = usernameToAddress[referrerUsername];
        require(referrerAddr != address(0), "Referrer not found");
        require(userInfo[id[referrerAddr]].exists, "Referrer not registered");
        uint _ref = id[referrerAddr];
        address _newAcc = msg.sender;

        // Calculate required USDT amount
        uint levelCost`;

    if (regSigRegex.test(content)) {
        content = content.replace(regSigRegex, newRegStart);
    } else {
        console.error("Could not replace register function signature");
    }

    fs.writeFileSync(usdtPath, content, 'utf8');
    console.log("FiveDollarRide_USDT.sol generated successfully");

} catch (err) {
    console.error("Error:", err);
}
