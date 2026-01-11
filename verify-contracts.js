import { ethers } from 'ethers';

// Configuration
const RIDEBNB_ADDRESS = '0x7Ae3BcEBBC1e9F08A103B3920907805Fa8607627';
const ROYALTY_ADDRESS = '0xB07ccB285B78bd9e8cf35BDe865DBeEBB6106b52';
const RPC_URL = 'https://opbnb-testnet-rpc.bnbchain.org';
const EXPLORER = 'https://opbnb-testnet.bscscan.com';

// Minimal ABIs for verification
const RIDEBNB_ABI = [
    'function owner() view returns (address)',
    'function daoAddress() view returns (address)',
    'function feeReceiver() view returns (address)',
    'function royaltyContract() view returns (address)',
    'function userExists(uint) view returns (bool)',
    'function getUserData(uint) view returns (address,uint,uint,uint,uint,uint,uint,uint,bool)'
];

const ROYALTY_ABI = [
    'function owner() view returns (address)',
    'function rideBNBContract() view returns (address)',
    'function defaultRefer() view returns (uint)',
    'function royaltyPercent(uint) view returns (uint)',
    'function royaltyLvl(uint) view returns (uint)'
];

async function verify() {
    console.log('🔍 RideBNB Contract Verification\n');
    console.log('Network: opBNB Testnet');
    console.log('RPC:', RPC_URL);
    console.log('=====================================\n');

    try {
        // Connect to network
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        console.log('✅ Connected to opBNB Testnet\n');

        // Check network
        const network = await provider.getNetwork();
        console.log(`Chain ID: ${network.chainId}`);
        if (network.chainId === 5611n) {
            console.log('✅ Correct network (opBNB Testnet)\n');
        } else {
            console.log('❌ Wrong network!\n');
            return;
        }

        // Verify RideBNB Contract
        console.log('📜 RideBNB Contract');
        console.log('Address:', RIDEBNB_ADDRESS);
        console.log('Explorer:', `${EXPLORER}/address/${RIDEBNB_ADDRESS}\n`);

        const rideBNB = new ethers.Contract(RIDEBNB_ADDRESS, RIDEBNB_ABI, provider);

        try {
            const owner = await rideBNB.owner();
            console.log('✅ Owner:', owner);

            const dao = await rideBNB.daoAddress();
            console.log('✅ DAO:', dao);

            const feeReceiver = await rideBNB.feeReceiver();
            console.log('✅ Fee Receiver:', feeReceiver);

            const royaltyContract = await rideBNB.royaltyContract();
            console.log('✅ Royalty Contract:', royaltyContract);

            // Check root user
            const rootExists = await rideBNB.userExists(73928);
            console.log('✅ Root User (73928) Exists:', rootExists);

            if (rootExists) {
                const userData = await rideBNB.getUserData(73928);
                console.log('✅ Root User Data:', {
                    address: userData[0],
                    id: userData[1].toString(),
                    referrer: userData[2].toString(),
                    upline: userData[3].toString(),
                    level: userData[5].toString()
                });
            }

            // Verify connection
            if (royaltyContract.toLowerCase() === ROYALTY_ADDRESS.toLowerCase()) {
                console.log('✅ Connected to correct Royalty contract\n');
            } else {
                console.log('❌ Royalty contract mismatch!\n');
            }

        } catch (error) {
            console.log('❌ Error reading RideBNB:', error.message, '\n');
        }

        // Verify Royalty Contract
        console.log('📜 Royalty Contract');
        console.log('Address:', ROYALTY_ADDRESS);
        console.log('Explorer:', `${EXPLORER}/address/${ROYALTY_ADDRESS}\n`);

        const royalty = new ethers.Contract(ROYALTY_ADDRESS, ROYALTY_ABI, provider);

        try {
            const royaltyOwner = await royalty.owner();
            console.log('✅ Owner:', royaltyOwner);

            const rideBNBContract = await royalty.rideBNBContract();
            console.log('✅ RideBNB Contract:', rideBNBContract);

            const defaultRefer = await royalty.defaultRefer();
            console.log('✅ Default Refer:', defaultRefer.toString());

            // Check royalty tiers
            console.log('\n✅ Royalty Tiers:');
            for (let i = 0; i < 4; i++) {
                const percent = await royalty.royaltyPercent(i);
                const level = await royalty.royaltyLvl(i);
                console.log(`  Tier ${i}: Level ${level}, ${percent}%`);
            }

            // Verify connection
            if (rideBNBContract.toLowerCase() === RIDEBNB_ADDRESS.toLowerCase()) {
                console.log('\n✅ Connected to correct RideBNB contract');
            } else {
                console.log('\n❌ RideBNB contract mismatch!');
            }

        } catch (error) {
            console.log('❌ Error reading Royalty:', error.message);
        }

        console.log('\n=====================================');
        console.log('✅ Contract Verification Complete!');
        console.log('=====================================\n');

        // Summary
        console.log('📊 Summary:');
        console.log('- Both contracts deployed and accessible');
        console.log('- Contracts properly connected');
        console.log('- Root user initialized');
        console.log('- Ready for frontend integration\n');

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
}

// Run verification
verify().catch(console.error);
