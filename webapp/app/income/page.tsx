"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS, MAIN_ABI, ROYALTY_ABI } from '@/lib/contracts';
import BinaryTreeView from '@/components/BinaryTreeView';

export default function Dashboard() {
    const [userAddress, setUserAddress] = useState('');
    const [userId, setUserId] = useState(0);
    const [balance, setBalance] = useState('0');
    const [incomeData, setIncomeData] = useState<any>(null);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [upgrading, setUpgrading] = useState(false);
    const [upgradeLevels, setUpgradeLevels] = useState(1);
    const [upgradeCost, setUpgradeCost] = useState('0');
    const [activeTab, setActiveTab] = useState('overview');
    const [teamData, setTeamData] = useState<any[]>([]);
    const [loadingTeam, setLoadingTeam] = useState(false);
    const [binaryTree, setBinaryTree] = useState<any>(null);
    const [bnbPrice, setBnbPrice] = useState(903); // Default BNB price in USD (fallback)
    const [levelCosts, setLevelCosts] = useState<string[]>([]);

    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

                // Check if on BSC Mainnet (chainId 56)
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                if (chainId !== '0x38') { // 0x38 = 56 in hex (BSC Mainnet)
                    try {
                        // Try to switch to BSC Mainnet
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: '0x38' }],
                        });
                    } catch (switchError: any) {
                        // If BSC Mainnet not added, add it
                        if (switchError.code === 4902) {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: '0x38',
                                    chainName: 'BNB Smart Chain Mainnet',
                                    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                                    rpcUrls: ['https://bsc-dataseed1.binance.org'],
                                    blockExplorerUrls: ['https://bscscan.com']
                                }]
                            });
                        } else {
                            throw switchError;
                        }
                    }
                }

                setUserAddress(accounts[0]);
                loadUserData(accounts[0]);
                loadBalance(accounts[0]);
            } catch (error) {
                console.error('Wallet connection failed:', error);
            }
        } else {
            alert('Please install MetaMask!');
        }
    };

    const disconnectWallet = () => {
        setUserAddress('');
        setUserId(0);
        setBalance('0');
        setIncomeData(null);
        setUserInfo(null);
    };

    const loadBalance = async (address: string) => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const bal = await provider.getBalance(address);
            setBalance(ethers.formatEther(bal));
        } catch (error) {
            console.error('Failed to load balance:', error);
        }
    };

    const loadUserData = async (address: string) => {
        setLoading(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);

            const id = await contract.id(address);
            const userIdNum = Number(id);
            setUserId(userIdNum);

            console.log(`Loaded user ID: ${userIdNum} for address: ${address}`);

            if (userIdNum > 0) {
                const info = await contract.userInfo(userIdNum);
                const income = await contract.userIncome(userIdNum);

                console.log('User Info:', {
                    level: Number(info.level),
                    directTeam: Number(info.directTeam),
                    team: Number(info.team),
                    referrer: Number(info.referrer),
                });

                setUserInfo({
                    level: Number(info.level),
                    directTeam: Number(info.directTeam),
                    team: Number(info.team),
                    referrer: Number(info.referrer),
                    registrationTime: new Date(Number(info.registrationTime) * 1000).toLocaleDateString(),
                });

                setIncomeData({
                    totalDeposit: ethers.formatEther(income.totalDeposit),
                    totalIncome: ethers.formatEther(income.totalIncome),
                    referralIncome: ethers.formatEther(income.referralIncome),
                    sponsorIncome: ethers.formatEther(income.sponsorIncome),
                    levelIncome: ethers.formatEther(income.levelIncome),
                    royaltyIncome: '0',
                });

                loadRoyaltyIncome(userIdNum);
                loadTeamData(userIdNum);
                loadLevelCosts();
                loadBnbPrice();
                if (Number(info.level) < 13) {
                    calculateUpgradeCost(Number(info.level), 1);
                }
            } else {
                console.log('User not registered yet');
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
            alert('Failed to load user data. Please check console for details.');
        } finally {
            setLoading(false);
        }
    };

    const loadRoyaltyIncome = async (userId: number) => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const royaltyContract = new ethers.Contract(CONTRACTS.ROYALTY, ROYALTY_ABI, provider);

            let totalRoyalty = 0;
            for (let tier = 0; tier < 4; tier++) {
                try {
                    const info = await royaltyContract.getUserRoyaltyInfo(userId, tier);
                    totalRoyalty += Number(ethers.formatEther(info.totalClaimed));
                } catch (e) { }
            }

            setIncomeData(prev => prev ? { ...prev, royaltyIncome: totalRoyalty.toString() } : null);
        } catch (error) {
            console.error('Failed to load royalty:', error);
        }
    };

    const loadTeamData = async (userId: number) => {
        setLoadingTeam(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);

            const teamList: any[] = [];
            const userDetails = await contract.userInfo(userId);
            const totalTeam = Number(userDetails.team);

            // Fetch direct team members (simplified - in production you'd need events)
            // For now, we'll show the structure based on user's data
            for (let i = 1; i <= Math.min(totalTeam, 50); i++) {
                try {
                    const memberId = userId + i; // Simplified - actual IDs would come from events
                    const info = await contract.userInfo(memberId);
                    if (info.exists && info.referrer === BigInt(userId)) {
                        teamList.push({
                            id: memberId,
                            address: info.account,
                            level: Number(info.level),
                            joinDate: new Date(Number(info.registrationTime) * 1000).toLocaleDateString(),
                            directTeam: Number(info.directTeam),
                            totalTeam: Number(info.team)
                        });
                    }
                } catch (e) {
                    // Member doesn't exist
                }
            }

            setTeamData(teamList);
        } catch (error) {
            console.error('Failed to load team:', error);
        } finally {
            setLoadingTeam(false);
        }
    };

    const loadBnbPrice = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
            const price = await contract.bnbPrice();
            const priceUsd = Number(ethers.formatEther(price));
            console.log(`BNB Price: $${priceUsd}`);
            setBnbPrice(priceUsd);
        } catch (error) {
            console.error('Failed to load BNB price, using fallback:', error);
            setBnbPrice(903); // Fallback to $903
        }
    };

    const loadLevelCosts = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
            const costs: string[] = [];
            // Levels 0-12 (representing L1-L13 costs)
            for (let i = 0; i < 13; i++) {
                const cost = await contract.getLevelCost(i);
                costs.push(ethers.formatEther(cost));
            }
            console.log('Level costs loaded:', costs);
            setLevelCosts(costs);
        } catch (error) {
            console.error('Failed to load level costs:', error);
        }
    };

    const buildBinaryTree = () => {
        // Create binary tree structure for 13 levels
        const tree: any = { level: 1, filled: true, userId: userId, children: [] };

        const buildLevel = (node: any, currentLevel: number, maxLevel: number) => {
            if (currentLevel >= maxLevel) return;

            // Left child
            const leftFilled = currentLevel <= (userInfo?.level || 0);
            node.children.push({
                level: currentLevel + 1,
                filled: leftFilled,
                userId: leftFilled ? `${userId}.${currentLevel}.L` : null,
                position: 'L',
                children: []
            });

            // Right child  
            const rightFilled = currentLevel <= (userInfo?.level || 0);
            node.children.push({
                level: currentLevel + 1,
                filled: rightFilled,
                userId: rightFilled ? `${userId}.${currentLevel}.R` : null,
                position: 'R',
                children: []
            });

            // Recursively build
            buildLevel(node.children[0], currentLevel + 1, maxLevel);
            buildLevel(node.children[1], currentLevel + 1, maxLevel);
        };

        buildLevel(tree, 1, 13);
        setBinaryTree(tree);
    };

    useEffect(() => {
        if (userInfo) {
            buildBinaryTree();
        }
    }, [userInfo]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getAffiliateLink = () => `${typeof window !== 'undefined' ? window.location.origin : 'https://fivedollar.bnb'}?ref=${userAddress}`;
    const getAffiliateLinkById = () => `${typeof window !== 'undefined' ? window.location.origin : 'https://fivedollar.bnb'}?refid=${userId}`;

    const shareOnSocial = (platform: string) => {
        const text = `🚀 Join me on FiveDollarBNB! Earn passive income with 4 streams. Start with $5!`;
        const url = getAffiliateLinkById();
        const urls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            facebook: `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
        };
        window.open(urls[platform as keyof typeof urls], '_blank');
    };

    const handleRegister = async (referralId?: number) => {
        if (!userAddress) {
            alert('Please connect wallet first');
            return;
        }

        try {
            setUpgrading(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, signer);


            // Try to get BNB price from contract, fallback to 903 if fails
            let bnbPriceUsd = 903; // Default fallback
            try {
                const bnbPriceWei = await contract.bnbPrice();
                bnbPriceUsd = Number(ethers.formatEther(bnbPriceWei));
                setBnbPrice(bnbPriceUsd); // Update UI with latest price
            } catch (e) {
                console.log('Using fallback BNB price:', bnbPriceUsd);
            }

            // Calculate $5 USD + 5% fee in BNB
            const usdAmount = 5;
            const fee = usdAmount * 0.05; // 5% fee = $0.25
            const totalUsd = usdAmount + fee; // $5.25 total
            const bnbAmount = totalUsd / bnbPriceUsd;
            const cost = ethers.parseEther(bnbAmount.toFixed(18)); // Fixed precision

            // Use ROOT_ADDRESS as default referrer (or get it from URL if provided)
            const refAddress = CONTRACTS.ROOT_ADDRESS;

            const tx = await contract.registerMe(refAddress, { value: cost });

            // Notify user of pending transaction
            console.log('Transaction submitted:', tx.hash);
            alert(`⏳ Registering... TX: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`);

            await tx.wait();

            alert('✅ Registration successful! Welcome to FiveDollarBNB!');
            loadUserData(userAddress);
        } catch (error: any) {
            console.error('Registration failed:', error);

            // Provide specific error messages
            let errorMsg = 'Registration failed: ';
            if (error.code === 'ACTION_REJECTED') {
                errorMsg = 'Transaction cancelled by user';
            } else if (error.message?.includes('already registered')) {
                errorMsg = 'This wallet is already registered!';
            } else if (error.message?.includes('invalid referrer')) {
                errorMsg = 'Invalid referrer ID. Please check your referral link.';
            } else if (error.message?.includes('insufficient funds')) {
                errorMsg = 'Insufficient BNB balance. You need ~0.006 BNB for registration.';
            } else if (error.reason) {
                errorMsg += error.reason;
            } else {
                errorMsg += error.message || 'Unknown error. Please try again or contact support.';
            }

            alert(errorMsg);
        } finally {
            setUpgrading(false);
        }
    };

    const calculateUpgradeCost = async (currentLevel: number, levels: number) => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);

            let totalCost = BigInt(0);
            for (let i = 0; i < levels; i++) {
                const cost = await contract.getLevelCost(currentLevel + i);
                totalCost += BigInt(cost);
            }

            const adminFee = (totalCost * BigInt(5)) / BigInt(100);
            setUpgradeCost(ethers.formatEther(totalCost + adminFee));
        } catch (error) {
            console.error('Failed to calculate cost:', error);
        }
    };

    const handleUpgrade = async () => {
        if (!userInfo || upgrading) return;

        setUpgrading(true);
        try {
            if (typeof window.ethereum === 'undefined') {
                alert('Please install MetaMask!');
                return;
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, signer);

            // Check balance first
            const balance = await provider.getBalance(await signer.getAddress());
            const costInWei = ethers.parseEther(upgradeCost);

            if (balance < costInWei) {
                const needed = ethers.formatEther(costInWei);
                const has = ethers.formatEther(balance);
                alert(
                    `❌ Insufficient BNB!\n\n` +
                    `Required: ${needed} BNB\n` +
                    `Your Balance: ${has} BNB\n\n` +
                    `Please add more BNB to your wallet.`
                );
                return;
            }

            // Try to estimate gas first to catch errors early
            try {
                await contract.upgradeMe.estimateGas(upgradeLevels, { value: costInWei });
            } catch (estimateError: any) {
                console.error('Gas estimation failed:', estimateError);

                let errorMsg = '❌ Upgrade will fail!\n\n';

                // Try to extract the actual revert reason
                if (estimateError.data) {
                    try {
                        const iface = new ethers.Interface(MAIN_ABI);
                        const decodedError = iface.parseError(estimateError.data);
                        errorMsg += `Reason: ${decodedError?.name || 'Unknown'}\n`;
                    } catch { }
                }

                // Check common issues
                if (estimateError.message.includes('already at max level') || estimateError.message.includes('Level 13')) {
                    errorMsg += 'You are already at maximum level (13)';
                } else if (estimateError.message.includes('Insufficient BNB')) {
                    errorMsg += 'Not enough BNB sent for upgrade';
                } else if (estimateError.message.includes('Invalid level')) {
                    errorMsg += 'Invalid upgrade level selected';
                } else if (estimateError.message.includes('cooldown')) {
                    errorMsg += 'Please wait before upgrading (cooldown period)';
                } else {
                    errorMsg += estimateError.message || estimateError.reason || 'Unknown error';
                }

                alert(errorMsg);
                throw estimateError;
            }

            const tx = await contract.upgradeMe(upgradeLevels, { value: costInWei });

            alert('⏳ Transaction sent! Waiting for confirmation...');
            await tx.wait();

            alert('✅ Upgrade successful! 🎉');
            loadUserData(userAddress);
            loadBalance(userAddress);
        } catch (error: any) {
            console.error('Upgrade error:', error);

            // More detailed error messages
            let errorMsg = '❌ Upgrade Failed!\n\n';

            if (error.code === 'ACTION_REJECTED') {
                errorMsg = '❌ Transaction cancelled by user';
            } else if (error.message?.includes('insufficient funds')) {
                errorMsg += 'Insufficient BNB for gas fees';
            } else if (error.reason) {
                errorMsg += error.reason;
            } else if (error.message) {
                errorMsg += error.message;
            } else {
                errorMsg += 'Unknown error. Please try again or contact support.';
            }

            alert(errorMsg);
        } finally {
            setUpgrading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-2 sm:p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Compact Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
                    <a href="/" className="text-2xl md:text-4xl font-bold text-white hover:text-yellow-300 transition-colors cursor-pointer">
                        💎 Dashboard
                    </a>
                    {!userAddress ? (
                        <button onClick={connectWallet} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold hover:scale-105 transition-transform text-sm md:text-base">
                            🔐 Connect Wallet
                        </button>
                    ) : (
                        <button onClick={disconnectWallet} className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition-colors text-sm">
                            🔓 Disconnect
                        </button>
                    )}
                </div>

                {userAddress ? (
                    <>
                        {/* Compact User Info Bar */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 md:p-4 mb-4 border border-white/20">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="text-center lg:text-left">
                                    <p className="text-gray-300 text-xs mb-1">ID</p>
                                    <p className="text-white font-bold text-lg">{userId || '-'}</p>
                                </div>
                                <div className="text-center lg:text-left">
                                    <p className="text-gray-300 text-xs mb-1">Level</p>
                                    <p className="text-green-400 font-bold text-lg">{userInfo?.level || '-'}</p>
                                </div>
                                <div className="text-center lg:text-left">
                                    <p className="text-gray-300 text-xs mb-1">Balance</p>
                                    <p className="text-yellow-400 font-bold text-lg">{parseFloat(balance).toFixed(3)}</p>
                                </div>
                                <div className="text-center lg:text-left col-span-2 lg:col-span-1">
                                    <p className="text-gray-300 text-xs mb-1">Wallet</p>
                                    <button onClick={() => copyToClipboard(userAddress, 'Address')} className="text-white text-sm hover:text-blue-300">
                                        {userAddress.slice(0, 6)}...{userAddress.slice(-4)} 📋
                                    </button>
                                </div>
                            </div>
                        </div>

                        {userId > 0 ? (
                            <>
                                {/* Tab Navigation */}
                                <div className="bg-white/10 backdrop-blur-md rounded-xl mb-4 p-1 border border-white/20">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
                                        <TabButton label="Overview" icon="📊" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                                        <TabButton label="Upgrade" icon="⬆️" active={activeTab === 'upgrade'} onClick={() => setActiveTab('upgrade')} />
                                        <TabButton label="Share" icon="🔗" active={activeTab === 'share'} onClick={() => setActiveTab('share')} />
                                        <TabButton label="Team" icon="👥" active={activeTab === 'team'} onClick={() => setActiveTab('team')} />
                                    </div>
                                </div>

                                {/* Tab Content */}
                                {activeTab === 'overview' && incomeData && (
                                    <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-4 md:p-6 shadow-2xl border-2 border-yellow-400/30">
                                        <h2 className="text-2xl md:text-3xl font-extrabold text-yellow-300 mb-4 drop-shadow-xl text-center" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.6)' }}>📊 Income Overview</h2>

                                        {/* Income Stats - Compact Grid */}
                                        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 mb-4 border border-yellow-400/20">
                                            <p className="text-yellow-200 text-sm font-bold mb-3 drop-shadow-md" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>💰 Income Statistics</p>
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                                <CompactStat label="Total" value={`${parseFloat(incomeData.totalIncome || '0').toFixed(4)}`} icon="📈" color="blue" />
                                                <CompactStat label="Referral" value={`${parseFloat(incomeData.referralIncome || '0').toFixed(4)}`} icon="👥" color="purple" />
                                                <CompactStat label="Sponsor" value={`${parseFloat(incomeData.sponsorIncome || '0').toFixed(4)}`} icon="🎯" color="orange" />
                                                <CompactStat label="Matrix" value={`${parseFloat(incomeData.levelIncome || '0').toFixed(4)}`} icon="🌐" color="indigo" />
                                                <CompactStat label="Royalty" value={`${parseFloat(incomeData.royaltyIncome || '0').toFixed(4)}`} icon="👑" color="yellow" />
                                                <CompactStat label="Team" value={userInfo?.team || '0'} icon="👨‍👩‍👧‍👦" color="teal" />
                                            </div>
                                        </div>

                                        {/* Income Breakdown */}
                                        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/20">
                                            <p className="text-yellow-200 text-sm font-bold mb-3 drop-shadow-md" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>📈 Income Breakdown</p>
                                            <div className="space-y-2">
                                                <ProgressBar label="Referral" amount={parseFloat(incomeData.referralIncome || '0')} total={parseFloat(incomeData.totalIncome || '0')} color="purple" />
                                                <ProgressBar label="Sponsor" amount={parseFloat(incomeData.sponsorIncome || '0')} total={parseFloat(incomeData.totalIncome || '0')} color="orange" />
                                                <ProgressBar label="Matrix" amount={parseFloat(incomeData.levelIncome || '0')} total={parseFloat(incomeData.totalIncome || '0')} color="indigo" />
                                                <ProgressBar label="Royalty" amount={parseFloat(incomeData.royaltyIncome || '0')} total={parseFloat(incomeData.totalIncome || '0')} color="yellow" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'overview' && !incomeData && loading && (
                                    <div className="text-center py-8">
                                        <div className="animate-spin text-4xl mb-2">⏳</div>
                                        <p className="text-white">Loading...</p>
                                    </div>
                                )}

                                {activeTab === 'upgrade' && (
                                    <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-4 md:p-6 shadow-2xl">
                                        <h2 className="text-xl md:text-2xl font-bold text-white mb-4">⬆️ Upgrade Levels</h2>

                                        {/* Current Info */}
                                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-white/80 text-xs mb-1">Current Level</p>
                                                    <p className="text-white font-bold text-2xl">Level {userInfo.level}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-white/80 text-xs mb-1">BNB/USD Price</p>
                                                    <p className="text-yellow-300 font-bold text-xl">${bnbPrice.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Level Grid */}
                                        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 mb-4 border border-white/10">
                                            <h3 className="text-white font-bold mb-3 text-sm">
                                                {userInfo?.level >= 13 ? 'All Levels Completed! 🎉' : 'Select Levels to Upgrade'}
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                {Array.from({ length: 13 }, (_, i) => i + 1).map(level => {
                                                    const isCompleted = level <= userInfo.level; // Mark completed if at or below current level
                                                    const costBnb = levelCosts[level - 1] || '0';
                                                    const costUsd = (parseFloat(costBnb) * bnbPrice).toFixed(2);
                                                    const isSelected = level === userInfo.level + upgradeLevels;

                                                    return (
                                                        <div
                                                            key={level}
                                                            className={`p-3 rounded-lg border-2 transition-all ${isCompleted
                                                                ? 'bg-gradient-to-br from-green-400 to-emerald-500 border-green-300 shadow-lg'
                                                                : isSelected
                                                                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-300 shadow-lg scale-105'
                                                                    : 'bg-gradient-to-br from-purple-500/30 to-blue-500/30 border-purple-400/50 hover:from-purple-500/40 hover:to-blue-500/40 cursor-pointer hover:scale-105'
                                                                }`}
                                                            onClick={() => {
                                                                if (!isCompleted) {
                                                                    const levels = level - userInfo.level;
                                                                    if (levels > 0) {
                                                                        setUpgradeLevels(levels);
                                                                        calculateUpgradeCost(userInfo.level, levels);
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <div className="text-center">
                                                                <p className="text-white font-bold text-lg mb-1">
                                                                    {isCompleted ? '✓' : level}
                                                                </p>
                                                                <p className="text-white text-xs font-bold mb-1">Level {level}</p>
                                                                <p className="text-yellow-300 text-sm font-extrabold mt-1 drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>${costUsd}</p>
                                                                <p className="text-white text-xs font-bold drop-shadow-md" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>{parseFloat(costBnb).toFixed(4)} BNB</p>
                                                                {isCompleted && <p className="text-green-100 text-xs mt-1">✓ Completed</p>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {userInfo?.level < 13 ? (
                                            <>
                                                {/* Upgrade Summary */}
                                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
                                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                                        <div>
                                                            <p className="text-white/80 text-xs mb-1">Upgrading To</p>
                                                            <p className="text-yellow-300 font-bold text-2xl">Level {userInfo.level + upgradeLevels}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-white/80 text-xs mb-1">Levels</p>
                                                            <p className="text-white font-bold text-2xl">+{upgradeLevels}</p>
                                                        </div>
                                                    </div>
                                                    <div className="border-t border-white/30 pt-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-white font-bold">Total Cost:</span>
                                                            <div className="text-right">
                                                                <p className="text-yellow-300 font-bold text-xl">{parseFloat(upgradeCost).toFixed(4)} BNB</p>
                                                                <p className="text-white/80 text-sm">${(parseFloat(upgradeCost) * bnbPrice).toFixed(2)} USD</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button onClick={handleUpgrade} disabled={upgrading} className="w-full bg-white text-green-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 disabled:opacity-50">
                                                    {upgrading ? '⏳ Upgrading...' : `🚀 Upgrade to Level ${userInfo.level + upgradeLevels}`}
                                                </button>
                                            </>
                                        ) : (
                                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 text-center">
                                                <div className="text-6xl mb-3">👑</div>
                                                <p className="text-white font-bold text-2xl mb-2">Maximum Level Reached!</p>
                                                <p className="text-white/80">You've completed all 13 levels. Congratulations!</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'share' && (
                                    <div className="bg-gradient-to-r from-pink-600 to-rose-700 rounded-xl p-4 md:p-6 shadow-2xl border-2 border-yellow-400/30">
                                        <h2 className="text-2xl md:text-3xl font-extrabold text-yellow-300 mb-4 drop-shadow-xl text-center" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.6)' }}>🔗 Share & Earn</h2>

                                        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 mb-4 border border-yellow-400/20">
                                            <p className="text-yellow-200 text-sm font-bold mb-2 drop-shadow-md" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>📱 ID Link (Recommended)</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={getAffiliateLinkById()}
                                                    readOnly
                                                    className="flex-1 bg-white/20 text-yellow-100 font-bold text-sm p-3 rounded-lg border-2 border-yellow-400/40 drop-shadow-lg"
                                                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}
                                                />
                                                <button
                                                    onClick={() => copyToClipboard(getAffiliateLinkById(), 'ID link')}
                                                    className="bg-yellow-400 hover:bg-yellow-300 text-purple-900 px-4 py-3 rounded-lg font-extrabold text-sm shadow-xl transform hover:scale-105 transition-all"
                                                    style={{ textShadow: '1px 1px 1px rgba(255,255,255,0.3)' }}
                                                >
                                                    📋 Copy
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 mb-4 border border-yellow-400/20">
                                            <p className="text-yellow-200 text-sm font-bold mb-2 drop-shadow-md" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>🌐 Share on Social Media</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => shareOnSocial('twitter')}
                                                    className="bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-extrabold text-sm shadow-lg transform hover:scale-105 transition-all"
                                                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                                                >
                                                    🐦 Twitter
                                                </button>
                                                <button
                                                    onClick={() => shareOnSocial('facebook')}
                                                    className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white px-4 py-3 rounded-lg font-extrabold text-sm shadow-lg transform hover:scale-105 transition-all"
                                                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                                                >
                                                    📘 Facebook
                                                </button>
                                                <button
                                                    onClick={() => shareOnSocial('telegram')}
                                                    className="bg-gradient-to-r from-sky-500 to-sky-700 hover:from-sky-600 hover:to-sky-800 text-white px-4 py-3 rounded-lg font-extrabold text-sm shadow-lg transform hover:scale-105 transition-all"
                                                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                                                >
                                                    ✈️ Telegram
                                                </button>
                                                <button
                                                    onClick={() => shareOnSocial('whatsapp')}
                                                    className="bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white px-4 py-3 rounded-lg font-extrabold text-sm shadow-lg transform hover:scale-105 transition-all"
                                                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                                                >
                                                    💬 WhatsApp
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-yellow-400/10 backdrop-blur-sm rounded-lg p-4 border-2 border-yellow-400/30">
                                            <p className="text-yellow-300 text-center font-extrabold text-lg drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}>
                                                💰 Earn up to 95% Commission!
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'team' && userInfo && (
                                    <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-4 md:p-6 shadow-2xl border-2 border-yellow-400/30">
                                        <h2 className="text-2xl md:text-3xl font-extrabold text-yellow-300 mb-4 drop-shadow-xl text-center" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.6)' }}>🌳 Binary Matrix Tree</h2>

                                        {/* Summary Stats */}
                                        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 mb-4 border border-yellow-400/20">
                                            <p className="text-yellow-200 text-sm font-bold mb-3 drop-shadow-md" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>👥 Team Statistics</p>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg p-3 text-center shadow-lg">
                                                    <p className="text-yellow-200 text-xs mb-1 font-bold">Direct</p>
                                                    <p className="text-white font-extrabold text-2xl drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{userInfo?.directTeam || 0}</p>
                                                </div>
                                                <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-3 text-center shadow-lg">
                                                    <p className="text-yellow-200 text-xs mb-1 font-bold">Total</p>
                                                    <p className="text-white font-extrabold text-2xl drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{userInfo?.team || 0}</p>
                                                </div>
                                                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-3 text-center shadow-lg">
                                                    <p className="text-yellow-200 text-xs mb-1 font-bold">Active</p>
                                                    <p className="text-white font-extrabold text-2xl drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{teamData.length}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Binary Tree Visualization */}
                                        <BinaryTreeView
                                            rootNode={{
                                                userId: userId,
                                                address: userAddress,
                                                level: userInfo.level,
                                                leftTeam: Math.floor((userInfo.team || 0) / 2),
                                                rightTeam: Math.ceil((userInfo.team || 0) / 2),
                                                positionLeft: userInfo.directTeam || 0,
                                                positionRight: 0,
                                                matrixQualified: userInfo.level >= 10,
                                                leftChild: null,
                                                rightChild: null
                                            }}
                                            onViewTeam={(id) => alert(`View team for user ${id}`)}
                                        />

                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                                            <span className="text-white">Filled (✓) - Has Team Members</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                                            <span className="text-white">Vacant (○) - No Members Yet</span>
                                        </div>

                                        {/* Total Count */}
                                        <div className="mt-3 bg-white/5 rounded-lg p-3">
                                            <div className="grid grid-cols-2 gap-4 text-xs">
                                                <div>
                                                    <p className="text-gray-400 mb-1">Total Matrix Capacity</p>
                                                    <p className="text-white font-bold">{(Math.pow(2, 13) - 1).toLocaleString()} positions</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-gray-400 mb-1">Your Team Size</p>
                                                    <p className="text-green-400 font-bold">{userInfo.team || 0} members</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : teamData.length > 0 ? (
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {teamData.map((member, idx) => (
                                                <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                                        <div>
                                                            <p className="text-gray-400">ID</p>
                                                            <p className="text-white font-bold">#{member.id}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-400">Level</p>
                                                            <p className="text-green-400 font-bold">L{member.level}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-400">Joined</p>
                                                            <p className="text-white font-bold">{member.joinDate}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-400">Team Size</p>
                                                            <p className="text-blue-400 font-bold">{member.totalTeam}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2">
                                                        <p className="text-gray-400 text-xs">Wallet</p>
                                                        <p className="text-white/70 text-xs font-mono">
                                                            {member.address.slice(0, 10)}...{member.address.slice(-8)}
                                                        </p>
                                                    </div>

                                                    {/* Level Fill Status */}
                                                    <div className="mt-2 flex gap-1">
                                                        {Array.from({ length: 13 }, (_, i) => i + 1).map(lvl => (
                                                            <div key={lvl} className={`flex-1 h-1.5 rounded ${member.level >= lvl ? 'bg-green-500' : 'bg-gray-700'
                                                                }`} />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        ) : (
                                        <div className="text-center py-8 bg-white/5 rounded-lg">
                                            <p className="text-gray-400 text-sm">No direct team members yet</p>
                                            <p className="text-gray-500 text-xs mt-1">Share your referral link to build your team</p>
                                        </div>
                                    )}
                                    </div>
                            </div>
                                )}
                    </>
                ) : (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-8 text-center border-2 border-yellow-400/50 shadow-2xl">
                        <div className="text-6xl mb-4">🚀</div>
                        <p className="text-white text-2xl font-bold mb-2">Welcome to FiveDollarBNB!</p>
                        <p className="text-white/90 text-lg mb-6">Start your journey to passive income</p>
                        <button
                            onClick={() => handleRegister()}
                            disabled={upgrading}
                            className="bg-yellow-400 hover:bg-yellow-300 text-purple-900 px-12 py-4 rounded-xl text-xl font-extrabold shadow-2xl hover:scale-105 transition-all disabled:opacity-50"
                            style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.3)' }}
                        >
                            {upgrading ? '⏳ Registering...' : '✨ Register Now ($5)'}
                        </button>
                        <p className="text-white/70 text-sm mt-4">Get instant access to 4 income streams!</p>
                    </div>
                )}
            </>
            ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 text-center border border-white/20">
                <div className="text-6xl mb-4">🔐</div>
                <p className="text-white text-2xl mb-4">Connect Wallet</p>
                <button onClick={connectWallet} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-10 py-4 rounded-xl text-xl font-bold hover:scale-105 transition-transform">
                    Connect MetaMask
                </button>
            </div>
            )
}

            {/* Contract Links Footer */}
            {
                userAddress && (
                    <div className="mt-4 bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/20">
                        <p className="text-yellow-200 text-xs font-bold mb-2 text-center drop-shadow-md" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>📄 Smart Contracts</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/10 rounded p-2">
                                <p className="text-yellow-200 font-bold mb-1">Main Contract:</p>
                                <a
                                    href={`https://bscscan.com/address/${CONTRACTS.MAIN}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-300 hover:text-blue-200 underline break-all"
                                >
                                    {CONTRACTS.MAIN}
                                </a>
                            </div>
                            <div className="bg-white/10 rounded p-2">
                                <p className="text-yellow-200 font-bold mb-1">Royalty Contract:</p>
                                <a
                                    href={`https://bscscan.com/address/${CONTRACTS.ROYALTY}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-300 hover:text-blue-200 underline break-all"
                                >
                                    {CONTRACTS.ROYALTY}
                                </a>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                copied && (
                    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-2xl animate-bounce text-sm">
                        ✅ Copied!
                    </div>
                )
            }
        </div >
        </div >
    );
}

function TabButton({ label, icon, active, onClick }: any) {
    return (
        <button onClick={onClick} className={`px-3 py-2.5 rounded-lg font-bold transition-all text-xs md:text-sm ${active ? 'bg-white text-purple-600' : 'text-white hover:bg-white/10'}`}>
            <span className="hidden md:inline">{icon} {label}</span>
            <span className="md:hidden">{icon}</span>
        </button>
    );
}

function CompactStat({ label, value, icon, color }: any) {
    const colors: any = {
        blue: 'from-blue-500 to-cyan-600',
        purple: 'from-purple-500 to-pink-600',
        orange: 'from-orange-500 to-red-600',
        indigo: 'from-indigo-500 to-purple-600',
        yellow: 'from-yellow-500 to-orange-600',
        teal: 'from-teal-500 to-cyan-600'
    };

    return (
        <div className={`bg-gradient-to-r ${colors[color]} rounded-xl p-3 md:p-4`}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">{icon}</span>
                <p className="text-white/80 text-xs">{label}</p>
            </div>
            <p className="text-white font-bold text-lg md:text-xl">{value}</p>
        </div>
    );
}

function ProgressBar({ label, amount, total, color }: any) {
    const percentage = total > 0 ? (amount / total) * 100 : 0;
    const colors: any = {
        purple: 'bg-purple-500',
        orange: 'bg-orange-500',
        indigo: 'bg-indigo-500',
        yellow: 'bg-yellow-500'
    };

    return (
        <div>
            <div className="flex justify-between text-white text-xs mb-1">
                <span>{label}</span>
                <span className="font-bold">{amount.toFixed(4)} BNB</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
                <div className={`${colors[color]} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
}
