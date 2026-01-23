'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS, MAIN_ABI } from '@/lib/contracts';
import PresentationSection from '@/components/PresentationSection';

export default function Home() {
  const [wallet, setWallet] = useState('');
  const [userId, setUserId] = useState(0);
  const [registering, setRegistering] = useState(false);
  const [referralId, setReferralId] = useState(CONTRACTS.ROOT_USER_ID);
  const [levelCosts, setLevelCosts] = useState<string[]>([]);
  const [sponsorInfo, setSponsorInfo] = useState<{ id: number, address: string } | null>(null);

  useEffect(() => {
    // Get referral ID from URL
    const params = new URLSearchParams(window.location.search);
    const refId = params.get('refid') || params.get('ref');
    if (refId) {
      const refIdNum = Number(refId);
      setReferralId(refIdNum);

      // Fetch sponsor information
      const fetchSponsorInfo = async () => {
        try {
          const provider = new ethers.JsonRpcProvider(CONTRACTS.rpcUrls[0]);
          const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
          const sponsorAddress = await contract.userList(refIdNum);
          setSponsorInfo({ id: refIdNum, address: sponsorAddress });
        } catch (error) {
          console.error('Failed to fetch sponsor info:', error);
        }
      };
      fetchSponsorInfo();
    }

    // Set level costs - using hardcoded USD values
    // Contract returns BNB amounts, not USD costs for display
    setLevelCosts([
      '$5', '$5', '$10', '$20', '$40', '$80', '$160',
      '$320', '$640', '$1,280', '$2,560', '$5,120', '$10,240'
    ]);
  }, []);

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
                  rpcUrls: CONTRACTS.rpcUrls,
                  blockExplorerUrls: ['https://bscscan.com']
                }]
              });
            } else {
              throw switchError;
            }
          }
        }

        setWallet(accounts[0]);

        // Check if user is registered using MetaMask provider
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
        const id = await contract.id(accounts[0]);
        setUserId(Number(id));

        console.log(`User ID: ${Number(id)}`);
      } catch (error) {
        console.error('Failed to connect:', error);
        alert('Failed to connect wallet');
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const handleRegister = async () => {
    if (!wallet) {
      alert('Please connect wallet first');
      return;
    }

    try {
      setRegistering(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, signer);

      // Get BNB price from contract
      let bnbPriceUsd = 903n; // Default fallback in wei (903e18)
      try {
        bnbPriceUsd = await contract.bnbPrice();
      } catch (e) {
        console.log('Using fallback BNB price');
        bnbPriceUsd = ethers.parseEther('903'); // Convert to wei
      }

      // Get level cost from contract (returns USD in wei with 18 decimals)
      const levelCostUsd = await contract.getLevelCost(0); // Level 1 cost
      const adminFeePercent = 5n; // 5% admin fee
      const adminFee = (levelCostUsd * adminFeePercent) / 100n;
      const totalCostUsd = levelCostUsd + adminFee;

      // Calculate BNB amount needed
      // Formula: (totalCostUsd * 1e18) / bnbPriceUsd
      const bnbRequired = (totalCostUsd * ethers.parseEther('1')) / bnbPriceUsd;

      // Add 5% buffer to ensure sufficient payment
      const bnbWithBuffer = (bnbRequired * 105n) / 100n;

      console.log('Registration cost:', {
        levelCostUsd: ethers.formatEther(levelCostUsd) + ' USD',
        totalCostUsd: ethers.formatEther(totalCostUsd) + ' USD',
        bnbPrice: ethers.formatEther(bnbPriceUsd) + ' USD',
        bnbRequired: ethers.formatEther(bnbRequired) + ' BNB',
        bnbWithBuffer: ethers.formatEther(bnbWithBuffer) + ' BNB',
      });

      // Check user balance BEFORE attempting transaction
      const userBalance = await provider.getBalance(wallet);
      if (userBalance < bnbWithBuffer) {
        const needed = ethers.formatEther(bnbWithBuffer);
        const has = ethers.formatEther(userBalance);
        const shortage = ethers.formatEther(bnbWithBuffer - userBalance);

        alert(
          `❌ Insufficient BNB Balance!\n\n` +
          `Required: ${needed} BNB\n` +
          `Your Balance: ${has} BNB\n` +
          `Need: ${shortage} more BNB\n\n` +
          `Please add more BNB to your wallet and try again.`
        );
        return;
      }

      // CRITICAL: Check if already registered
      const existingUserId = await contract.id(wallet);
      if (Number(existingUserId) > 0) {
        alert(`❌ Already Registered!\n\nYour User ID: ${existingUserId}\n\nRedirecting to dashboard...`);
        window.location.href = '/income';
        return;
      }

      // Use ROOT_ADDRESS as referrer
      const refAddress = CONTRACTS.ROOT_ADDRESS;
      const tx = await contract.registerMe(refAddress, { value: bnbWithBuffer });

      alert('⏳ Transaction sent! Waiting for confirmation...');
      await tx.wait();

      alert('✅ Registration successful! Redirecting to dashboard...');
      window.location.href = '/income';
    } catch (error: any) {
      console.error('Registration failed:', error);

      // Provide specific error messages
      let errorMsg = 'Registration failed: ';
      if (error.code === 'ACTION_REJECTED') {
        errorMsg = '❌ Transaction cancelled by user';
      } else if (error.message?.includes('already registered')) {
        errorMsg = '❌ This wallet is already registered!';
      } else if (error.message?.includes('invalid referrer') || error.message?.includes('Referrer not registered')) {
        errorMsg = '❌ Invalid referrer. Please check your referral link.';
      } else if (error.message?.includes('insufficient funds')) {
        errorMsg = '❌ Insufficient BNB for gas fees. Please add more BNB to your wallet.';
      } else if (error.reason) {
        errorMsg = '❌ ' + error.reason;
      } else {
        errorMsg += error.message || 'Unknown error. Please try again or contact support.';
      }

      alert(errorMsg);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-extrabold text-yellow-300 mb-6 drop-shadow-2xl leading-tight" style={{ textShadow: '4px 4px 8px rgba(0,0,0,0.7)' }}>
          <span className="inline-block">💎</span> <span className="inline-block">FiveDollarCLUB</span>
        </h1>
        <p className="text-3xl md:text-4xl text-white font-bold mb-4 drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}>
          Your Gateway to Blockchain Passive Income
        </p>
        <p className="text-xl md:text-2xl text-blue-200 mb-12 max-w-4xl mx-auto">
          Start with just <span className="text-green-400 font-extrabold text-3xl">$5</span> and unlock{' '}
          <span className="text-yellow-300 font-extrabold">4 automated income streams</span> on Binance Smart Chain
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8">
          {!wallet ? (
            <>
              <button
                onClick={connectWallet}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-12 py-6 rounded-xl text-2xl font-extrabold hover:scale-110 transition-transform shadow-2xl"
                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
              >
                🔗 Connect Wallet
              </button>
              <a
                href={`https://bscscan.com/address/${CONTRACTS.MAIN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 backdrop-blur-md text-yellow-300 px-12 py-6 rounded-xl text-2xl font-extrabold hover:bg-white/20 transition-all border-2 border-yellow-400/50"
                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
              >
                🔍 Verify Contract
              </a>
            </>
          ) : userId > 0 ? (
            <a
              href="/income"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-12 py-6 rounded-xl text-2xl font-extrabold hover:scale-110 transition-transform shadow-2xl"
              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
            >
              📊 Go to Dashboard
            </a>
          ) : (
            <button
              onClick={handleRegister}
              disabled={registering}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-12 py-6 rounded-xl text-2xl font-extrabold hover:scale-110 transition-transform shadow-2xl disabled:opacity-50"
              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
            >
              {registering ? '⏳ Registering...' : '🚀 Register Now ($5)'}
            </button>
          )}
        </div>

        {/* Sponsor Information Display */}
        {sponsorInfo && wallet && userId === 0 && (
          <div className="mb-6 mx-auto max-w-md">
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-md border-2 border-purple-400/50 rounded-xl p-6">
              <p className="text-white font-bold text-lg mb-2">🤝 You're Joining Under:</p>
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-yellow-300 font-bold text-sm mb-1">Sponsor ID: #{sponsorInfo.id}</p>
                <p className="text-blue-200 text-xs font-mono break-all">
                  {sponsorInfo.address}
                </p>
              </div>
              <p className="text-green-300 text-sm mt-3 text-center">✅ Verified Sponsor Link</p>
            </div>
          </div>
        )}

        {wallet && (
          <p className="text-yellow-300 font-bold text-lg">
            {userId > 0 ? '✅ Registered! Access your dashboard' : '👋 Welcome! Register to get started'}
          </p>
        )}

        {!wallet && (
          <p className="text-green-400 font-bold text-lg">✅ 100% Transparent • Fully Automated • Instant Payouts</p>
        )}
      </div>

      {/* 🔥 SPONSOR INCOME HIGHLIGHT BANNER */}
      <div className="container mx-auto px-4 pb-8">
        <div className="mx-auto max-w-5xl">
          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-1 animate-pulse">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 md:p-8">
              <div className="text-center">
                <p className="text-yellow-300 font-extrabold text-xl md:text-3xl mb-3">
                  🤝 PASSIVE SPONSOR INCOME - THE GAME CHANGER!
                </p>
                <p className="text-white text-base md:text-xl mb-4">
                  Earn from <span className="text-green-400 font-bold">EVERY upgrade</span> by <span className="text-green-400 font-bold">ANYONE</span> in your downline!
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-green-600/30 rounded-lg p-3 border border-green-400">
                    <p className="text-green-300 font-bold text-xl md:text-2xl">3.4%</p>
                    <p className="text-gray-300 text-xs">L1-L5<br />No Directs!</p>
                  </div>
                  <div className="bg-yellow-600/30 rounded-lg p-3 border border-yellow-400">
                    <p className="text-yellow-300 font-bold text-xl md:text-2xl">0.95%</p>
                    <p className="text-gray-300 text-xs">L6-L8<br />2+ Directs</p>
                  </div>
                  <div className="bg-orange-600/30 rounded-lg p-3 border border-orange-400">
                    <p className="text-orange-300 font-bold text-xl md:text-2xl">0.35%</p>
                    <p className="text-gray-300 text-xs">L9-L10<br />3+ Directs</p>
                  </div>
                  <div className="bg-red-600/30 rounded-lg p-3 border border-red-400">
                    <p className="text-red-300 font-bold text-xl md:text-2xl">0.30%</p>
                    <p className="text-gray-300 text-xs">L11-L13<br />5+ Directs</p>
                  </div>
                </div>
                <p className="text-lg md:text-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 inline-block px-6 py-3 rounded-xl">
                  🎯 Build 5 Directs = Unlock ALL 13 Levels Forever!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Presentation Section */}
      <PresentationSection />

      {/* Platform Features */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-4xl md:text-5xl font-extrabold text-yellow-300 text-center mb-4 drop-shadow-lg" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.6)' }}>
          🌟 Platform Features & Benefits
        </h2>
        <p className="text-xl text-center text-blue-200 mb-12">Why FiveDollarCLUB is the smartest choice for passive income</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            icon="🔒"
            title="100% Decentralized"
            description="Smart contracts on BSC ensure complete transparency and security. No middleman, no hidden fees."
          />
          <FeatureCard
            icon="⚡"
            title="Instant Payouts"
            description="Earn and receive BNB directly to your wallet in real-time. No waiting, no delays."
          />
          <FeatureCard
            icon="🌍"
            title="Global Matrix System"
            description="Benefit from a 13-level binary matrix that places users automatically for maximum earnings."
          />
          <FeatureCard
            icon="💰"
            title="Up to 95% Commission"
            description="Industry-leading commission rates ensure you keep most of what you earn."
          />
          <FeatureCard
            icon="📈"
            title="4 Income Streams"
            description="Diversify your earnings with referral, sponsor, matrix, and royalty income."
          />
          <FeatureCard
            icon="🎯"
            title="Low Entry Cost"
            description="Start with just $5 and scale up to 13 levels. Affordable for everyone."
          />
        </div>
      </div>

      {/* Detailed Earning Breakdown */}
      <div className="container mx-auto px-4 py-16 bg-black/20 backdrop-blur-sm rounded-3xl border-2 border-yellow-400/30 mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold text-yellow-300 text-center mb-4 drop-shadow-lg" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.6)' }}>
          💰 Complete Earning Breakdown
        </h2>
        <p className="text-xl text-center text-blue-200 mb-12">How you earn on every transaction</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <EarningCard
            icon="👥"
            title="Direct Referrals"
            percentage="95%"
            description="Earn 95% instantly when someone joins using your referral link"
            details="One-time payment directly to your wallet"
            color="from-purple-500 to-pink-600"
            isPassive={false}
          />
          <EarningCard
            icon="🎯"
            title="Sponsor Income (Passive)"
            percentage="5% Per Layer"
            description="Passive income from 13 layers of your sponsored team"
            details="Earn 5% on each layer's upgrades automatically"
            color="from-orange-500 to-red-600"
            isPassive={true}
          />
          <EarningCard
            icon="🌐"
            title="Matrix Income"
            percentage="85%"
            description="Earn from global binary matrix on level upgrades"
            details="Automated placement ensures continuous earnings"
            color="from-indigo-500 to-purple-600"
            isPassive={false}
          />
          <EarningCard
            icon="👑"
            title="Royalty Pool"
            percentage="5%"
            description="Share elite royalty pool at levels 10-13"
            details="5% of all upgrades distributed among qualified members"
            color="from-yellow-500 to-orange-600"
            isPassive={false}
          />
        </div>

        <div className="mt-12 bg-green-500/20 border-2 border-green-400 rounded-xl p-6 text-center">
          <p className="text-yellow-300 font-extrabold text-2xl mb-2 drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}>
            🔥 Total Earning Potential: Up to 95% Commission Per Transaction!
          </p>
          <p className="text-white text-lg">Plus ongoing passive income from sponsor commissions on your team's activity</p>
        </div>
      </div>


      {/* Passive Sponsor Income Highlight */}
      <div className="container mx-auto px-4 py-16 mb-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-2xl p-8 border-2 border-green-400/50">
          <h2 className="text-3xl md:text-4xl font-extrabold text-green-300 text-center mb-4">
            🤝 Passive Sponsor Income - The Game Changer!
          </h2>
          <p className="text-xl text-white text-center mb-6">
            This is what separates FDC from ordinary platforms
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-black/30 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-yellow-300 mb-3">💸 Earn from EVERY Level</h3>
              <p className="text-gray-200">
                When anyone in your downline upgrades to a higher level, YOU earn a commission - even if you didn't directly refer them!
              </p>
            </div>
            <div className="bg-black/30 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-yellow-300 mb-3">♾️ Unlimited Depth</h3>
              <p className="text-gray-200">
                Your earning potential has NO LIMIT. As your team grows 10, 100, 1000 levels deep, you keep earning passively forever!
              </p>
            </div>
            <div className="bg-black/30 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-yellow-300 mb-3">🔁 Recurring Income</h3>
              <p className="text-gray-200">
                Members upgrade multiple times (13 levels each). Every upgrade = passive income for you. Build once, profit for life!
              </p>
            </div>
            <div className="bg-black/30 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-yellow-300 mb-3">🚀 Exponential Growth</h3>
              <p className="text-gray-200">
                Your team builds their teams, who build their teams... You earn from ALL of them automatically!
              </p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-2xl font-bold text-white bg-green-600/50 inline-block px-8 py-4 rounded-xl">
              ✨ This is TRUE Passive Income - Your Team Works While You Sleep!
            </p>
          </div>
        </div>
      </div>

      {/* Sponsor Income Tier Breakdown */}
      <div className="container mx-auto px-4 py-16 mb-8">
        <h2 className="text-4xl md:text-5xl font-extrabold text-yellow-300 text-center mb-4 drop-shadow-lg" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.6)' }}>
          💰 Sponsor Income: 13-Level Breakdown
        </h2>
        <p className="text-xl text-center text-blue-200 mb-12">Total: 5% of every transaction distributed across 13 levels</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tier 1: L1-L5 */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-6 border-2 border-green-400">
            <div className="text-4xl mb-3 text-center">🟢</div>
            <h3 className="text-2xl font-bold text-white mb-2 text-center">Tier 1: L1-L5</h3>
            <div className="bg-black/30 rounded-lg p-4 mb-4">
              <p className="text-yellow-300 font-bold text-3xl text-center">3.4%</p>
              <p className="text-gray-200 text-sm text-center mt-1">Combined Total</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Level 1:</span><span className="font-bold text-yellow-300">1.00%</span></div>
              <div className="flex justify-between"><span>Level 2:</span><span className="font-bold text-yellow-300">0.80%</span></div>
              <div className="flex justify-between"><span>Level 3:</span><span className="font-bold text-yellow-300">0.60%</span></div>
              <div className="flex justify-between"><span>Level 4:</span><span className="font-bold text-yellow-300">0.50%</span></div>
              <div className="flex justify-between"><span>Level 5:</span><span className="font-bold text-yellow-300">0.50%</span></div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-green-300 font-bold text-center">✅ NO DIRECTS NEEDED</p>
              <p className="text-gray-200 text-xs text-center mt-1">Just be active (Level 1+)</p>
            </div>
          </div>

          {/* Tier 2: L6-L8 */}
          <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-6 border-2 border-yellow-400">
            <div className="text-4xl mb-3 text-center">🟡</div>
            <h3 className="text-2xl font-bold text-white mb-2 text-center">Tier 2: L6-L8</h3>
            <div className="bg-black/30 rounded-lg p-4 mb-4">
              <p className="text-yellow-300 font-bold text-3xl text-center">0.95%</p>
              <p className="text-gray-200 text-sm text-center mt-1">Combined Total</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Level 6:</span><span className="font-bold text-yellow-300">0.40%</span></div>
              <div className="flex justify-between"><span>Level 7:</span><span className="font-bold text-yellow-300">0.30%</span></div>
              <div className="flex justify-between"><span>Level 8:</span><span className="font-bold text-yellow-300">0.25%</span></div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-yellow-300 font-bold text-center">👥 2+ DIRECTS</p>
              <p className="text-gray-200 text-xs text-center mt-1">Rewards team builders</p>
            </div>
          </div>

          {/* Tier 3: L9-L10 */}
          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-6 border-2 border-orange-400">
            <div className="text-4xl mb-3 text-center">🟠</div>
            <h3 className="text-2xl font-bold text-white mb-2 text-center">Tier 3: L9-L10</h3>
            <div className="bg-black/30 rounded-lg p-4 mb-4">
              <p className="text-yellow-300 font-bold text-3xl text-center">0.35%</p>
              <p className="text-gray-200 text-sm text-center mt-1">Combined Total</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Level 9:</span><span className="font-bold text-yellow-300">0.20%</span></div>
              <div className="flex justify-between"><span>Level 10:</span><span className="font-bold text-yellow-300">0.15%</span></div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-orange-300 font-bold text-center">👥👥 3+ DIRECTS</p>
              <p className="text-gray-200 text-xs text-center mt-1">For serious builders</p>
            </div>
          </div>

          {/* Tier 4: L11-L13 */}
          <div className="bg-gradient-to-br from-red-600 to-pink-600 rounded-xl p-6 border-2 border-red-400">
            <div className="text-4xl mb-3 text-center">🔴</div>
            <h3 className="text-2xl font-bold text-white mb-2 text-center">Tier 4: L11-L13</h3>
            <div className="bg-black/30 rounded-lg p-4 mb-4">
              <p className="text-yellow-300 font-bold text-3xl text-center">0.30%</p>
              <p className="text-gray-200 text-sm text-center mt-1">Combined Total</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Level 11:</span><span className="font-bold text-yellow-300">0.10%</span></div>
              <div className="flex justify-between"><span>Level 12:</span><span className="font-bold text-yellow-300">0.10%</span></div>
              <div className="flex justify-between"><span>Level 13:</span><span className="font-bold text-yellow-300">0.10%</span></div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-red-300 font-bold text-center">👥👥👥 5+ DIRECTS</p>
              <p className="text-gray-200 text-xs text-center mt-1">Top-tier leaders</p>
            </div>
          </div>
        </div>

        {/* Real Example */}
        <div className="mt-12 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-2 border-purple-400/50 rounded-2xl p-8">
          <h3 className="text-3xl font-bold text-white text-center mb-6">📊 Real Example</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-black/30 rounded-xl p-6">
              <h4 className="text-xl font-bold text-yellow-300 mb-4">Scenario:</h4>
              <p className="text-gray-200 mb-4">
                • Alice (5 directs) → Bob (1 direct) → Charlie<br />
                • Charlie upgrades to Level 5 ($40)
              </p>
              <h4 className="text-xl font-bold text-green-300 mb-3">Bob Earns (L1-L5):</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>L1: 1.00% of $40</span><span className="font-bold">= $0.40</span></div>
                <div className="flex justify-between"><span>L2: 0.80% of $40</span><span className="font-bold">= $0.32</span></div>
                <div className="flex justify-between"><span>L3: 0.60% of $40</span><span className="font-bold">= $0.24</span></div>
                <div className="flex justify-between"><span>L4: 0.50% of $40</span><span className="font-bold">= $0.20</span></div>
                <div className="flex justify-between"><span>L5: 0.50% of $40</span><span className="font-bold">= $0.20</span></div>
                <div className="flex justify-between border-t border-white/20 pt-2 mt-2 text-yellow-300 font-bold">
                  <span>Bob's Total:</span><span>$1.36</span>
                </div>
              </div>
            </div>
            <div className="bg-black/30 rounded-xl p-6">
              <h4 className="text-xl font-bold text-orange-300 mb-3">Alice Earns (L6-L10):</h4>
              <div className="space-y-1 text-sm mb-4">
                <div className="flex justify-between"><span>L6: 0.40% of $40</span><span className="font-bold">= $0.16</span></div>
                <div className="flex justify-between"><span>L7: 0.30% of $40</span><span className="font-bold">= $0.12</span></div>
                <div className="flex justify-between"><span>L8: 0.25% of $40</span><span className="font-bold">= $0.10</span></div>
                <div className="flex justify-between"><span>L9: 0.20% of $40</span><span className="font-bold">= $0.08</span></div>
                <div className="flex justify-between"><span>L10: 0.15% of $40</span><span className="font-bold">= $0.06</span></div>
                <div className="flex justify-between border-t border-white/20 pt-2 mt-2 text-yellow-300 font-bold">
                  <span>Alice's Total:</span><span>$0.52</span>
                </div>
              </div>
              <p className="text-green-300 text-xs">✅ Alice qualifies! Has 5 directs</p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-white text-lg font-bold bg-purple-600/50 inline-block px-6 py-3 rounded-xl">
              🎯 Build 5 Directs = Unlock ALL 13 Levels!
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-4xl md:text-5xl font-extrabold text-yellow-300 text-center mb-12 drop-shadow-lg" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.6)' }}>
          🚀 How It Works
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          <StepCard
            number="1"
            title="Connect Wallet"
            description="Connect your MetaMask or BSC wallet to get started"
            icon="🔗"
          />
          <StepCard
            number="2"
            title="Register for $5"
            description="Join with just $5 (0.008 BNB) and get Level 1 activated"
            icon="✅"
          />
          <StepCard
            number="3"
            title="Share Your Link"
            description="Share your unique referral link to earn 90% per signup"
            icon="📱"
          />
          <StepCard
            number="4"
            title="Earn Passively"
            description="Enjoy 4 automated income streams including sponsor commissions"
            icon="💵"
          />
        </div>
      </div>

      {/* Level Progression */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-4xl md:text-5xl font-extrabold text-yellow-300 text-center mb-4 drop-shadow-lg" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.6)' }}>
          📊 13 Levels to Financial Freedom
        </h2>
        <p className="text-xl text-center text-blue-200 mb-12">Upgrade to higher levels and multiply your earnings</p>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {(levelCosts.length > 0 ? levelCosts : [
            '$5', '$5', '$10', '$20', '$40', '$80', '$160',
            '$320', '$640', '$1,280', '$2,560', '$5,120', '$10,240'
          ]).map((cost, index) => (
            <div key={index} className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-4 text-center border-2 border-yellow-400/40 hover:scale-105 transition-transform">
              <p className="text-yellow-300 font-extrabold text-lg mb-1" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>L{index + 1}</p>
              <p className="text-white font-bold text-sm">{cost}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-blue-200 text-lg mb-2">Higher levels = Higher earnings from all income streams!</p>
          <p className="text-yellow-300 font-bold text-xl">Levels 10-13 unlock exclusive Royalty Pool access 👑</p>
        </div>
      </div>

      {/* Smart Contracts Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-4xl md:text-5xl font-extrabold text-yellow-300 text-center mb-4 drop-shadow-lg" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.6)' }}>
          🔐 Verified Smart Contracts
        </h2>
        <p className="text-xl text-center text-blue-200 mb-8">100% Transparent & Auditable on BSC</p>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/30">
            <p className="text-yellow-200 font-bold text-lg mb-3 text-center">📄 Main Contract</p>
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <p className="text-blue-300 text-sm break-all font-mono">{CONTRACTS.MAIN}</p>
            </div>
            <a
              href={`https://bscscan.com/address/${CONTRACTS.MAIN}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-bold text-center hover:scale-105 transition-transform"
            >
              View on BscScan →
            </a>
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400/30">
            <p className="text-yellow-200 font-bold text-lg mb-3 text-center">👑 Royalty Contract</p>
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <p className="text-blue-300 text-sm break-all font-mono">{CONTRACTS.ROYALTY}</p>
            </div>
            <a
              href={`https://bscscan.com/address/${CONTRACTS.ROYALTY}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-lg font-bold text-center hover:scale-105 transition-transform"
            >
              View on BscScan →
            </a>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-12 border-4 border-yellow-400/50 shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-xl" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.7)' }}>
            Ready to Start Earning?
          </h2>
          <p className="text-2xl text-white/90 mb-8">Join thousands earning passive income on BSC</p>
          <a
            href="/income"
            className="inline-block bg-yellow-400 hover:bg-yellow-300 text-purple-900 px-16 py-6 rounded-xl text-3xl font-extrabold shadow-2xl transform hover:scale-110 transition-all"
            style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.3)' }}
          >
            🚀 Join Now for $5
          </a>
          <p className="text-white/80 mt-6 text-lg">No hidden fees • Instant activation • Start earning immediately</p>
        </div>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 py-12 border-t border-white/20">
        <div className="text-center">
          <p className="text-gray-400 mb-4 text-lg">
            Built on <span className="text-yellow-400 font-bold">Binance Smart Chain</span> • Fully Transparent • Automated Payments
          </p>
          <p className="text-gray-500 text-sm mb-2">
            Main Contract: <span className="text-blue-400 font-mono">{CONTRACTS.MAIN}</span>
          </p>
          <p className="text-gray-500 text-sm">
            Royalty Contract: <span className="text-orange-400 font-mono">{CONTRACTS.ROYALTY}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-6 shadow-2xl border-2 border-yellow-400/30 hover:scale-105 transition-transform">
      <div className="text-5xl mb-4 text-center">{icon}</div>
      <h3 className="text-yellow-300 font-extrabold text-xl mb-3 text-center drop-shadow-md" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{title}</h3>
      <p className="text-white/90 text-center">{description}</p>
    </div>
  );
}

function EarningCard({ icon, title, percentage, description, details, color, isPassive }: any) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 shadow-2xl border-2 border-yellow-400/40 hover:scale-105 transition-transform relative`}>
      {isPassive && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
          PASSIVE
        </div>
      )}
      <div className="text-5xl mb-4 text-center">{icon}</div>
      <h3 className="text-white font-extrabold text-2xl mb-2 text-center drop-shadow-md" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{title}</h3>
      <p className="text-yellow-300 text-4xl font-extrabold mb-4 text-center drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}>{percentage}</p>
      <p className="text-white/90 text-center mb-2 font-semibold">{description}</p>
      <p className="text-white/70 text-sm text-center italic">{details}</p>
    </div>
  );
}

function StepCard({ number, title, description, icon }: any) {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-6 shadow-2xl border-2 border-yellow-400/30 text-center hover:scale-105 transition-transform">
      <div className="text-6xl mb-2">{icon}</div>
      <div className="text-yellow-300 text-5xl font-extrabold mb-3 drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}>
        {number}
      </div>
      <h3 className="text-white font-extrabold text-xl mb-3 drop-shadow-md" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>{title}</h3>
      <p className="text-white/80">{description}</p>
    </div>
  );
}
