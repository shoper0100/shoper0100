'use client';

import { useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { useUserData } from '@/hooks/useUserData';
import { formatBNB, calculateTotalCost } from '@/lib/utils';
import { LEVEL_COSTS, MAX_LEVELS } from '@/lib/constants';

export default function UpgradePage() {
    const { contract, isConnected } = useContract();
    const { user, isRegistered, refresh } = useUserData();
    const [selectedLevels, setSelectedLevels] = useState(1);
    const [upgrading, setUpgrading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                <p className="text-gray-400">Please connect your wallet to upgrade</p>
            </div>
        );
    }

    if (!isRegistered || !user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Not Registered</h2>
                <p className="text-gray-400 mb-8">Please register first before upgrading</p>
                <a
                    href="/register"
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                    Register Now
                </a>
            </div>
        );
    }

    const currentLevel = Number(user.level);
    const maxAvailableLevels = MAX_LEVELS - currentLevel;

    const calculateUpgradeCost = () => {
        let totalCost = BigInt(0);
        let totalFee = BigInt(0);

        for (let i = currentLevel; i < currentLevel + selectedLevels && i < MAX_LEVELS; i++) {
            const cost = BigInt(LEVEL_COSTS[i]);
            const fee = (cost * BigInt(10)) / BigInt(100);
            totalCost += cost;
            totalFee += fee;
        }

        return { totalCost, totalFee, total: totalCost + totalFee };
    };

    const { totalCost, totalFee, total } = calculateUpgradeCost();

    const handleUpgrade = async () => {
        if (!contract || !user) {
            setError('Please connect your wallet');
            return;
        }

        try {
            setUpgrading(true);
            setError(null);

            const tx = await contract.upgrade(user.id, BigInt(selectedLevels), {
                value: total,
            });

            console.log('Transaction sent:', tx.hash);
            await tx.wait();

            console.log('Upgrade successful!');
            setSuccess(true);

            // Refresh user data
            setTimeout(() => {
                refresh();
                setSuccess(false);
            }, 3000);

        } catch (err: any) {
            console.error('Upgrade failed:', err);
            setError(err.message || 'Upgrade failed');
        } finally {
            setUpgrading(false);
        }
    };

    if (currentLevel >= MAX_LEVELS) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Maximum Level Reached!</h2>
                <p className="text-gray-400 mb-8">Congratulations! You've reached the maximum level of {MAX_LEVELS}</p>
                <a
                    href="/dashboard"
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                    Go to Dashboard
                </a>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Upgrade Level</h1>
            <p className="text-gray-400 mb-8">
                Current Level: <span className="text-white font-bold">{currentLevel}</span> / {MAX_LEVELS}
            </p>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Upgrade Form */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-6">Select Levels to Upgrade</h2>

                    {/* Level Selector */}
                    <div className="mb-6">
                        <label className="block text-white font-medium mb-3">Number of Levels</label>
                        <input
                            type="range"
                            min="1"
                            max={maxAvailableLevels}
                            value={selectedLevels}
                            onChange={(e) => setSelectedLevels(Number(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-400 mt-2">
                            <span>1 Level</span>
                            <span className="text-blue-500 font-bold">{selectedLevels} Level{selectedLevels > 1 ? 's' : ''}</span>
                            <span>{maxAvailableLevels} Levels</span>
                        </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-gray-900 rounded-lg p-4 mb-6">
                        <h3 className="text-white font-medium mb-3">Cost Breakdown</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Base Cost:</span>
                                <span className="text-white">{formatBNB(totalCost)} BNB</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Admin Fee (10%):</span>
                                <span className="text-white">{formatBNB(totalFee)} BNB</span>
                            </div>
                            <div className="border-t border-gray-700 pt-2">
                                <div className="flex justify-between">
                                    <span className="text-white font-bold">Total Cost:</span>
                                    <span className="text-blue-500 font-bold text-xl">
                                        {formatBNB(total)} BNB
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 mb-6">
                            <p className="text-green-500 font-medium">Upgrade successful!</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
                            <p className="text-red-500">{error}</p>
                        </div>
                    )}

                    {/* Upgrade Button */}
                    <button
                        onClick={handleUpgrade}
                        disabled={upgrading}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    >
                        {upgrading ? 'Upgrading...' : `Upgrade to Level ${currentLevel + selectedLevels}`}
                    </button>
                </div>

                {/* Level Information */}
                <div className="space-y-4">
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-white font-bold mb-4">What You Get</h3>
                        <ul className="text-gray-400 text-sm space-y-2">
                            <li>• Higher income potential</li>
                            <li>• Increased matrix earnings</li>
                            <li>• Access to royalty tiers (Level 10-13)</li>
                            <li>• Higher qualification for income</li>
                        </ul>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-white font-bold mb-4">Royalty Tiers</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Level 10:</span>
                                <span className={currentLevel >= 10 ? 'text-green-500' : 'text-gray-500'}>Tier 1 (40%)</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Level 11:</span>
                                <span className={currentLevel >= 11 ? 'text-green-500' : 'text-gray-500'}>Tier 2 (30%)</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Level 12:</span>
                                <span className={currentLevel >= 12 ? 'text-green-500' : 'text-gray-500'}>Tier 3 (20%)</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Level 13:</span>
                                <span className={currentLevel >= 13 ? 'text-green-500' : 'text-gray-500'}>Tier 4 (10%)</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-white font-bold mb-2">Level Progression</h3>
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-blue-600 h-full transition-all duration-300"
                                style={{ width: `${(currentLevel / MAX_LEVELS) * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-gray-400 text-sm mt-2">
                            {currentLevel} / {MAX_LEVELS} Levels Completed
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
