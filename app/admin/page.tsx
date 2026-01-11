'use client';

import { useContract } from '@/hooks/useContract';
import { useState, useEffect } from 'react';
import { formatBNB } from '@/lib/utils';
import { ethers } from 'ethers';
import PriceSettingsSection from '@/components/admin/PriceSettingsSection';
import GovernanceManagementSection from '@/components/admin/GovernanceManagementSection';

export default function AdminPage() {
    const { contract, account, isConnected } = useContract();
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);

    // Current values
    const [directRequired, setDirectRequired] = useState<number>(0);
    const [sponsorCommission, setSponsorCommission] = useState<number>(0);
    const [minSponsorLevel, setMinSponsorLevel] = useState<number>(0);
    const [levelCosts, setLevelCosts] = useState<string[]>(Array(13).fill('0'));

    // New values for updates
    const [newDirectRequired, setNewDirectRequired] = useState<string>('');
    const [newSponsorCommission, setNewSponsorCommission] = useState<string>('');
    const [newMinSponsorLevel, setNewMinSponsorLevel] = useState<string>('');
    const [editingLevel, setEditingLevel] = useState<number | null>(null);
    const [newLevelCost, setNewLevelCost] = useState<string>('');

    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [bnbPrice, setBnbPrice] = useState<number>(600); // Default, will be updated from contract

    // Chainlink oracle settings
    const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(true);
    const [priceOracle, setPriceOracle] = useState<string>('');
    const [newPriceOracle, setNewPriceOracle] = useState<string>('');

    useEffect(() => {
        checkOwner();
        loadSettings();
    }, [contract, account]);

    const checkOwner = async () => {
        if (!contract || !account) {
            setLoading(false);
            return;
        }

        try {
            const owner = await contract.getOwner();
            setIsOwner(owner.toLowerCase() === account.toLowerCase());
        } catch (err) {
            console.error('Error checking owner:', err);
            setIsOwner(false);
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        if (!contract) return;

        try {
            // === RIDEBNB CONTRACT SETTINGS ===

            // Fetch BNB price from contract
            try {
                const bnbPriceUSD = await contract.bnbPriceInUSD();
                setBnbPrice(Number(bnbPriceUSD));
            } catch (err) {
                console.error('Error fetching BNB price:', err);
                setBnbPrice(850); // Default to $850 if fetch fails
            }

            // Fetch sponsor settings from contract
            try {
                const direct = await contract.directRequired();
                const commission = await contract.sponsorCommission();
                const level = await contract.minSponsorLevel();

                setDirectRequired(Number(direct));
                setSponsorCommission(Number(commission));
                setMinSponsorLevel(Number(level));
            } catch (err) {
                console.error('Error fetching sponsor settings:', err);
                // Fallback to defaults if fetch fails
                setDirectRequired(2);
                setSponsorCommission(5);
                setMinSponsorLevel(5);
            }

            // Fetch level costs from contract
            try {
                // Contract has private levels array, try to fetch if getter exists
                // Otherwise fallback to calculated values
                const costs: string[] = [];
                for (let i = 0; i < 13; i++) {
                    try {
                        // Try to get level cost - contract might not expose this
                        const cost = await contract.levels(i);
                        costs.push(ethers.formatEther(cost));
                    } catch {
                        // Fallback: Use hardcoded contract values
                        const levelValues = [
                            '0.004', '0.006', '0.012', '0.024', '0.048',
                            '0.096', '0.192', '0.384', '0.768', '1.536',
                            '3.072', '6.144', '12.288'
                        ];
                        costs.push(levelValues[i]);
                    }
                }
                setLevelCosts(costs);
            } catch (err) {
                console.error('Error fetching level costs:', err);
                // Fallback to contract's default values
                const contractLevels = [
                    '0.004', '0.006', '0.012', '0.024', '0.048',
                    '0.096', '0.192', '0.384', '0.768', '1.536',
                    '3.072', '6.144', '12.288'
                ];
                setLevelCosts(contractLevels);
            }

            // Fetch Chainlink oracle settings
            try {
                const autoUpdate = await contract.autoUpdateEnabled();
                const oracle = await contract.priceOracle();

                setAutoUpdateEnabled(autoUpdate);
                setPriceOracle(oracle);
            } catch (err) {
                console.error('Error fetching oracle settings:', err);
                setAutoUpdateEnabled(true);
                setPriceOracle('0x0000000000000000000000000000000000000000');
            }

            setLoading(false);
        } catch (err) {
            console.error('Error loading settings:', err);
            setError('Failed to load settings');
            setMessage({ type: 'error', text: 'Failed to load settings' });
            setLoading(false);
        }
    };

    const updateDirectRequired = async () => {
        if (!contract || !newDirectRequired) return;

        try {
            setUpdating(true);
            setMessage(null);

            const tx = await contract.setDirectRequired(Number(newDirectRequired));
            await tx.wait();

            setMessage({ type: 'success', text: `Direct required updated to ${newDirectRequired}` });
            setNewDirectRequired('');
            await loadSettings();
        } catch (err: any) {
            console.error('Error updating:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to update' });
        } finally {
            setUpdating(false);
        }
    };

    const updateSponsorCommission = async () => {
        if (!contract || !newSponsorCommission) return;

        try {
            setUpdating(true);
            setMessage(null);

            const tx = await contract.setSponsorCommission(Number(newSponsorCommission));
            await tx.wait();

            setMessage({ type: 'success', text: `Sponsor commission updated to ${newSponsorCommission}%` });
            setNewSponsorCommission('');
            await loadSettings();
        } catch (err: any) {
            console.error('Error updating:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to update' });
        } finally {
            setUpdating(false);
        }
    };

    const updateMinSponsorLevel = async () => {
        if (!contract || !newMinSponsorLevel) return;

        try {
            setUpdating(true);
            setMessage(null);

            const tx = await contract.setMinSponsorLevel(Number(newMinSponsorLevel));
            await tx.wait();

            setMessage({ type: 'success', text: `Min sponsor level updated to ${newMinSponsorLevel}` });
            setNewMinSponsorLevel('');
            await loadSettings();
        } catch (err: any) {
            console.error('Error updating:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to update' });
        } finally {
            setUpdating(false);
        }
    };

    const updateLevelCost = async (level: number) => {
        if (!contract || !newLevelCost) return;

        try {
            setUpdating(true);
            setMessage(null);

            // Convert USD to BNB
            const usdAmount = parseFloat(newLevelCost);
            const bnbAmount = usdAmount / bnbPrice;
            const costInWei = ethers.parseEther(bnbAmount.toFixed(18));

            const tx = await contract.setLevelPrice(level, costInWei);
            await tx.wait();

            setMessage({ type: 'success', text: `Level ${level} cost updated to $${usdAmount.toFixed(2)} (${bnbAmount.toFixed(6)} BNB)` });
            setNewLevelCost('');
            setEditingLevel(null);
            await loadSettings();
        } catch (err: any) {
            console.error('Error updating level cost:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to update level cost' });
        } finally {
            setUpdating(false);
        }
    };

    const toggleAutoUpdate = async () => {
        if (!contract) return;

        try {
            setUpdating(true);
            setMessage(null);

            const newState = !autoUpdateEnabled;
            const tx = await contract.setAutoUpdate(newState);
            await tx.wait();

            setAutoUpdateEnabled(newState);
            setMessage({ type: 'success', text: `Auto-update ${newState ? 'enabled' : 'disabled'}` });
            await loadSettings();
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Contract needs setAutoUpdate() - see contract_admin_improvements.md' });
        } finally {
            setUpdating(false);
        }
    };

    const updatePriceOracle = async () => {
        if (!contract || !newPriceOracle) return;

        try {
            setUpdating(true);
            setMessage(null);

            const tx = await contract.setPriceOracle(newPriceOracle);
            await tx.wait();

            setPriceOracle(newPriceOracle);
            setNewPriceOracle('');
            setMessage({ type: 'success', text: 'Oracle updated successfully' });
            await loadSettings();
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Contract needs setPriceOracle() - see contract_admin_improvements.md' });
        } finally {
            setUpdating(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
                <p className="text-gray-400">Please connect your wallet to access admin panel</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h2>
                <p className="text-gray-400">Only the contract owner can access this page</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Admin Settings</h1>
                <p className="text-gray-400 mt-2">Configure contract parameters</p>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {message.text}
                </div>
            )}

            {/* BNB Price & Batch Settings */}
            <PriceSettingsSection />

            {/* Royalty Contract Settings */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-6">💎 Royalty Contract Settings</h2>

                {/* Tier Statistics */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Tier Statistics</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[0, 1, 2, 3].map((tier) => (
                            <div key={tier} className="bg-gray-700/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-blue-400 font-semibold">Tier {tier + 1}</span>
                                    <span className="text-xs text-gray-400">Level {[10, 11, 12, 13][tier]}</span>
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-gray-400 text-xs">Active Users</p>
                                        <p className="text-white text-lg font-bold">-</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Pool Share</p>
                                        <p className="text-green-400 font-semibold">{[40, 30, 20, 10][tier]}%</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Round</p>
                                        <p className="text-gray-300 text-sm">-</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Distribution Percentages */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Distribution Percentages</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gray-700/50 rounded-lg p-4">
                            <h4 className="text-white font-medium mb-3">Current Settings</h4>
                            <div className="space-y-2">
                                {[
                                    { tier: 'Tier 1 (L10)', percent: 40, color: 'text-purple-400' },
                                    { tier: 'Tier 2 (L11)', percent: 30, color: 'text-blue-400' },
                                    { tier: 'Tier 3 (L12)', percent: 20, color: 'text-green-400' },
                                    { tier: 'Tier 4 (L13)', percent: 10, color: 'text-yellow-400' },
                                ].map((item) => (
                                    <div key={item.tier} className="flex justify-between items-center">
                                        <span className="text-gray-300 text-sm">{item.tier}</span>
                                        <span className={`font-bold ${item.color}`}>{item.percent}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-700/50 rounded-lg p-4">
                            <h4 className="text-white font-medium mb-3">Pool Information</h4>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-gray-400 text-xs mb-1">Total Pool Balance</p>
                                    <p className="text-white text-xl font-bold">- BNB</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs mb-1">Funding Rate</p>
                                    <p className="text-green-400 text-lg font-semibold">5%</p>
                                    <p className="text-gray-500 text-xs">From upgrade transactions</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Direct Referral Requirements */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Direct Referral Requirements</h3>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-4">Number of direct referrals required to qualify for each tier</p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { tier: 1, level: 10, required: 10, color: 'text-purple-400' },
                                { tier: 2, level: 11, required: 11, color: 'text-blue-400' },
                                { tier: 3, level: 12, required: 12, color: 'text-green-400' },
                                { tier: 4, level: 13, required: 13, color: 'text-yellow-400' },
                            ].map((item) => (
                                <div key={item.tier} className="bg-gray-800/50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`font-semibold ${item.color}`}>Tier {item.tier}</span>
                                        <span className="text-xs text-gray-500">L{item.level}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max="99"
                                            defaultValue={item.required}
                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                                            disabled
                                        />
                                        <span className="text-xs text-gray-400 whitespace-nowrap">direct</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Fixed in contract</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                            <p className="text-yellow-500 text-sm font-medium mb-1">⚠️ Contract Limitation</p>
                            <p className="text-gray-300 text-xs">
                                These values are stored in the Royalty contract and currently have no setter function.
                                To change them, you need to add <code className="bg-gray-700 px-1">setRoyaltyDirectRequired()</code> function to the contract.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Notice */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                    <div className="flex gap-3">
                        <span className="text-blue-400 text-lg">ℹ️</span>
                        <div>
                            <h3 className="text-blue-400 font-semibold mb-1">Royalty Contract Info</h3>
                            <p className="text-gray-300 text-sm mb-2">
                                Distribution percentages and tier levels are fixed in the contract. Changes require contract redeployment.
                            </p>
                            <p className="text-gray-400 text-xs">
                                💡 Users automatically qualify for royalty when reaching levels 10-13 with 2+ direct referrals.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chainlink Oracle Settings */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-6">🔗 Chainlink Price Oracle</h2>

                {/* Auto-Update Toggle */}
                <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-semibold mb-1">Automatic Price Updates</h3>
                            <p className="text-gray-400 text-sm">
                                {autoUpdateEnabled
                                    ? 'Oracle automatically updates BNB price every 24 hours'
                                    : 'Manual price updates only'}
                            </p>
                        </div>
                        <button
                            onClick={toggleAutoUpdate}
                            disabled={updating}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${autoUpdateEnabled ? 'bg-blue-600' : 'bg-gray-600'
                                } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${autoUpdateEnabled ? 'translate-x-7' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Current Oracle Address */}
                <div className="mb-6">
                    <h3 className="text-white font-semibold mb-2">Current Price Oracle</h3>
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                        <p className="text-gray-300 font-mono text-sm break-all">
                            {priceOracle || '0x0000000000000000000000000000000000000000'}
                        </p>
                        {priceOracle === '0x0000000000000000000000000000000000000000' && (
                            <p className="text-yellow-500 text-xs mt-1">⚠️ No oracle configured</p>
                        )}
                    </div>
                </div>

                {/* Update Oracle */}
                <div>
                    <h3 className="text-white font-semibold mb-2">Update Price Oracle Address</h3>
                    <p className="text-gray-400 text-sm mb-3">
                        Set Chainlink BNB/USD price feed address for opBNB network
                    </p>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={newPriceOracle}
                            onChange={(e) => setNewPriceOracle(e.target.value)}
                            placeholder="0x... (Chainlink price feed address)"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                        <button
                            onClick={updatePriceOracle}
                            disabled={updating || !newPriceOracle}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                            {updating ? 'Updating...' : 'Update Price Oracle'}
                        </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                        💡 Find Chainlink price feeds at: docs.chain.link/data-feeds/price-feeds/addresses
                    </p>
                    <p className="text-yellow-500 text-xs mt-2">
                        ⚠️ Requires contract to have setPriceOracle() function
                    </p>
                </div>
            </div>

            {/* Governance Management */}
            <GovernanceManagementSection />

            {/* Current Settings */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-6">Current Settings</h2>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-1">Direct Required</p>
                        <p className="text-white text-3xl font-bold">{directRequired}</p>
                        <p className="text-gray-500 text-sm mt-1">Min direct referrals</p>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-1">Sponsor Commission</p>
                        <p className="text-white text-3xl font-bold">{sponsorCommission}%</p>
                        <p className="text-gray-500 text-sm mt-1">From referral earnings</p>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-1">Min Sponsor Level</p>
                        <p className="text-white text-3xl font-bold">Level {minSponsorLevel}</p>
                        <p className="text-gray-500 text-sm mt-1">To earn commission</p>
                    </div>
                </div>
            </div>

            {/* Update Settings */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Direct Required */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-4">Update Direct Required</h3>
                    <p className="text-gray-400 text-sm mb-4">Number of direct referrals required for qualification (1-10)</p>

                    <div className="space-y-4">
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={newDirectRequired}
                            onChange={(e) => setNewDirectRequired(e.target.value)}
                            placeholder="Enter new value"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />

                        <button
                            onClick={updateDirectRequired}
                            disabled={updating || !newDirectRequired}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                            {updating ? 'Updating...' : 'Update Direct Required'}
                        </button>
                    </div>
                </div>

                {/* Sponsor Commission */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-4">Update Sponsor Commission</h3>
                    <p className="text-gray-400 text-sm mb-4">Percentage of referral's earnings (0-20%)</p>

                    <div className="space-y-4">
                        <input
                            type="number"
                            min="0"
                            max="20"
                            value={newSponsorCommission}
                            onChange={(e) => setNewSponsorCommission(e.target.value)}
                            placeholder="Enter percentage"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />

                        <button
                            onClick={updateSponsorCommission}
                            disabled={updating || !newSponsorCommission}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                            {updating ? 'Updating...' : 'Update Commission'}
                        </button>
                    </div>
                </div>

                {/* Min Sponsor Level */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-4">Update Min Sponsor Level</h3>
                    <p className="text-gray-400 text-sm mb-4">Minimum level required to earn sponsor commission (1-13)</p>

                    <div className="space-y-4">
                        <input
                            type="number"
                            min="1"
                            max="13"
                            value={newMinSponsorLevel}
                            onChange={(e) => setNewMinSponsorLevel(e.target.value)}
                            placeholder="Enter level"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />

                        <button
                            onClick={updateMinSponsorLevel}
                            disabled={updating || !newMinSponsorLevel}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                            {updating ? 'Updating...' : 'Update Min Level'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Level Costs Management */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-6">Level Costs Management</h2>
                <p className="text-gray-400 text-sm mb-4">Configure the cost for each level (in USD)</p>

                {/* Important Notice */}
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                    <div className="flex gap-3">
                        <span className="text-yellow-500 text-lg">⚠️</span>
                        <div>
                            <h3 className="text-yellow-500 font-semibold mb-1">Fixed BNB Amounts</h3>
                            <p className="text-gray-300 text-sm mb-2">
                                Contract stores <strong>fixed BNB amounts</strong>. When oracle price changes, USD values will shift automatically.
                            </p>
                            <p className="text-gray-400 text-xs">
                                💡 Use <strong>BNB Price & Batch Settings</strong> above to update all levels at once when BNB price changes.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {levelCosts.map((cost, index) => {
                        const levelNum = index + 1;
                        const isEditing = editingLevel === levelNum;
                        const bnbAmount = parseFloat(cost);
                        const usdAmount = bnbAmount * bnbPrice;

                        return (
                            <div key={levelNum} className="bg-gray-700/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-blue-400 font-semibold">Level {levelNum}</span>
                                    {!isEditing && (
                                        <button
                                            onClick={() => {
                                                setEditingLevel(levelNum);
                                                setNewLevelCost(usdAmount.toFixed(2));
                                            }}
                                            className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="space-y-2">
                                        <div>
                                            <label className="text-gray-400 text-xs mb-1 block">USD Amount</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={newLevelCost}
                                                onChange={(e) => setNewLevelCost(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                                            />
                                            <p className="text-gray-500 text-xs mt-1">
                                                ≈ {(parseFloat(newLevelCost || '0') / bnbPrice).toFixed(6)} BNB
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => updateLevelCost(levelNum)}
                                                disabled={updating}
                                                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
                                            >
                                                {updating ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingLevel(null);
                                                    setNewLevelCost('');
                                                }}
                                                className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-white text-2xl font-bold">${usdAmount.toFixed(2)}</p>
                                        <p className="text-gray-400 text-sm mt-1">
                                            {cost} BNB
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Info */}
            <div className="bg-yellow-500/10 border border-yellow-500 rounded-xl p-6">
                <h3 className="text-lg font-bold text-yellow-500 mb-2">⚠️ Important</h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                    <li>• All updates require transaction confirmation</li>
                    <li>• Changes take effect immediately after confirmation</li>
                    <li>• Only the contract owner can modify these settings</li>
                    <li>• Make sure to test changes carefully</li>
                </ul>
            </div>
        </div>
    );
}
