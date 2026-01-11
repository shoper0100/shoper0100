'use client';

import { useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { useUserData } from '@/hooks/useUserData';
import { useRoyalty } from '@/hooks/useRoyalty';
import { formatBNB, formatNumber } from '@/lib/utils';
import { ROYALTY_LEVELS } from '@/lib/constants';

export default function RoyaltyPage() {
    const { contract, isConnected } = useContract();
    const { user, isRegistered, refresh } = useUserData();
    const { royaltyTiers, claimableRoyalty, loading, refresh: refreshRoyalty } = useRoyalty(user?.id, user?.level);
    const [claiming, setClaiming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                <p className="text-gray-400">Please connect your wallet to view royalty</p>
            </div>
        );
    }

    if (!isRegistered || !user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Not Registered</h2>
                <p className="text-gray-400 mb-8">Please register first to earn royalty</p>
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
    const isEligibleForRoyalty = currentLevel >= 10;

    const handleClaim = async (tier: number) => {
        if (!contract || !user) {
            setError('Please connect your wallet');
            return;
        }

        try {
            setClaiming(true);
            setError(null);

            const tx = await contract.claimRoyalty(tier);
            console.log('Claim transaction sent:', tx.hash);
            await tx.wait();

            console.log('Royalty claimed successfully!');

            // Refresh data
            setTimeout(() => {
                refresh();
                refreshRoyalty();
            }, 2000);

        } catch (err: any) {
            console.error('Claim failed:', err);
            setError(err.message || 'Failed to claim royalty');
        } finally {
            setClaiming(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Royalty Rewards</h1>
            <p className="text-gray-400 mb-8">
                Earn daily royalty rewards by reaching levels 10-13 with 2+ direct referrals
            </p>

            {/* Royalty Summary */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Current Level</p>
                    <p className="text-white text-3xl font-bold">Level {user.level.toString()}</p>
                    <p className="text-gray-500 text-xs mt-2">
                        {isEligibleForRoyalty ? 'Royalty eligible' : `Reach level 10 for royalty`}
                    </p>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Total Royalty Income</p>
                    <p className="text-purple-500 text-3xl font-bold">{formatBNB(user.royaltyIncome)} BNB</p>
                    <p className="text-gray-500 text-xs mt-2">Lifetime earnings from royalty</p>
                </div>
            </div>

            {/* Eligibility Notice */}
            {!isEligibleForRoyalty && (
                <div className="bg-yellow-500/10 border border-yellow-500 rounded-xl p-6 mb-8">
                    <h3 className="text-yellow-500 font-bold mb-2">Royalty Not Yet Unlocked</h3>
                    <p className="text-gray-300 mb-4">
                        Upgrade to level 10 or higher to unlock royalty rewards. Also ensure you have at least 2 direct referrals.
                    </p>
                    <a
                        href="/upgrade"
                        className="inline-flex px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-medium transition-colors"
                    >
                        Upgrade Now
                    </a>
                </div>
            )}

            {/* Claimable Royalty */}
            {claimableRoyalty && (
                <div className="bg-green-500/10 border border-green-500 rounded-xl p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-green-500 font-bold mb-1">Royalty Available to Claim!</h3>
                            <p className="text-gray-300 text-sm">
                                Tier {claimableRoyalty.tier + 1} (Level {claimableRoyalty.level}) - {claimableRoyalty.percentage}% share
                            </p>
                            <p className="text-white text-2xl font-bold mt-2">
                                {formatBNB(claimableRoyalty.userShare)} BNB
                            </p>
                        </div>
                        <button
                            onClick={() => handleClaim(claimableRoyalty.tier)}
                            disabled={claiming}
                            className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                        >
                            {claiming ? 'Claiming...' : 'Claim Now'}
                        </button>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 mb-8">
                    <p className="text-red-500">{error}</p>
                </div>
            )}

            {/* Total Fund & Distribution */}
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-purple-500/30 mb-8">
                <h2 className="text-xl font-bold text-white mb-6">💰 Total Royalty Fund</h2>

                {/* Total Pool */}
                <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                    <div className="text-center">
                        <p className="text-gray-400 text-sm mb-2">Global Royalty Pool Balance</p>
                        <p className="text-white text-4xl font-bold">
                            {royaltyTiers.reduce((sum, tier) => sum + tier.totalPool, BigInt(0)) > BigInt(0)
                                ? formatBNB(royaltyTiers.reduce((sum, tier) => sum + tier.totalPool, BigInt(0)))
                                : '-'} BNB
                        </p>
                        <p className="text-gray-500 text-xs mt-2">Updated daily from upgrade transactions</p>
                    </div>
                </div>

                {/* Tier Distribution Breakdown */}
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                    {[
                        { tier: 1, level: 10, percent: 40, color: 'from-purple-500 to-purple-600' },
                        { tier: 2, level: 11, percent: 30, color: 'from-blue-500 to-blue-600' },
                        { tier: 3, level: 12, percent: 20, color: 'from-green-500 to-green-600' },
                        { tier: 4, level: 13, percent: 10, color: 'from-yellow-500 to-yellow-600' },
                    ].map((item, index) => {
                        const tierData = royaltyTiers[index];
                        return (
                            <div key={item.tier} className="bg-gray-800/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-white font-semibold text-sm">Tier {item.tier}</span>
                                    <span className={`text-xs px-2 py-1 rounded bg-gradient-to-r ${item.color} text-white`}>
                                        {item.percent}%
                                    </span>
                                </div>
                                <p className="text-gray-400 text-xs mb-2">L{item.level}</p>
                                <p className="text-white font-bold text-lg">
                                    {tierData ? formatBNB(tierData.totalPool) : '-'} BNB
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                    {tierData ? `${formatNumber(tierData.eligibleUsers)} users` : 'No users'}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Calculation Explanation */}
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                    <h3 className="text-white font-semibold mb-3 text-sm">📊 How It Works</h3>
                    <div className="space-y-2 text-xs text-gray-300">
                        <div className="flex items-start gap-2">
                            <span className="text-purple-400">1.</span>
                            <p>5% of every upgrade transaction goes to the royalty pool</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-purple-400">2.</span>
                            <p>Pool is split: Tier 1 (40%), Tier 2 (30%), Tier 3 (20%), Tier 4 (10%)</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-purple-400">3.</span>
                            <p>Each tier's pool is divided equally among all eligible users in that tier</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-purple-400">4.</span>
                            <p className="font-medium text-yellow-400">Your Share = Tier Pool ÷ Number of Eligible Users</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Royalty Tiers */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Available Tiers</h2>

                {ROYALTY_LEVELS.map((level, index) => {
                    const tierInfo = royaltyTiers.find(t => t.tier === index);
                    const isCurrentTier = currentLevel === level;
                    const isPastTier = currentLevel > level;
                    const isFutureTier = currentLevel < level;
                    const canClaim = tierInfo?.canClaim || false;
                    const hasClaimed = tierInfo?.hasClaimed || false;

                    return (
                        <div
                            key={index}
                            className={`bg-gray-800 rounded-xl p-6 border ${isCurrentTier ? 'border-purple-500' :
                                isPastTier ? 'border-gray-700' :
                                    'border-gray-800 opacity-60'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        Tier {index + 1} - Level {level}
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        {[40, 30, 20, 10][index]}% of daily royalty pool
                                    </p>
                                </div>
                                <div className="text-right">
                                    {isFutureTier && (
                                        <span className="px-3 py-1 bg-gray-700 text-gray-400 rounded-full text-sm">
                                            Locked
                                        </span>
                                    )}
                                    {isPastTier && (
                                        <span className="px-3 py-1 bg-gray-600 text-gray-300 rounded-full text-sm">
                                            Completed
                                        </span>
                                    )}
                                    {isCurrentTier && (
                                        <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm">
                                            Active
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Only show tier details for current tier */}
                            {isCurrentTier && tierInfo && (
                                <div className="grid md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-gray-400 text-xs mb-1">Pool Amount</p>
                                        <p className="text-white font-semibold">
                                            {formatBNB(tierInfo.totalPool)} BNB
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs mb-1">Eligible Users</p>
                                        <p className="text-white font-semibold">
                                            {formatNumber(tierInfo.eligibleUsers)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs mb-1">Your Share</p>
                                        <p className="text-purple-500 font-semibold">
                                            {formatBNB(tierInfo.userShare)} BNB
                                        </p>
                                    </div>
                                </div>
                            )}

                            {isCurrentTier && tierInfo && (
                                <div>
                                    {canClaim && (
                                        <button
                                            onClick={() => handleClaim(index)}
                                            disabled={claiming}
                                            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                                        >
                                            {claiming ? 'Claiming...' : 'Claim Royalty'}
                                        </button>
                                    )}
                                    {hasClaimed && (
                                        <div className="px-6 py-3 bg-green-600/20 border border-green-600 rounded-lg text-green-400 text-center">
                                            ✓ Claimed Today
                                        </div>
                                    )}
                                    {!canClaim && !hasClaimed && (
                                        <div className="px-6 py-3 bg-gray-700 rounded-lg text-gray-400 text-center text-sm">
                                            No royalty available to claim
                                        </div>
                                    )}
                                </div>
                            )}

                            {isPastTier && (
                                <div className="text-center py-4">
                                    <p className="text-gray-500 text-sm">
                                        You've progressed past this tier. You now earn from Tier {currentLevel - 9}.
                                    </p>
                                </div>
                            )}

                            {isFutureTier && (
                                <div className="text-center py-4">
                                    <p className="text-gray-500 text-sm">
                                        Reach Level {level} to unlock this tier
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* How It Works */}
            <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-white font-bold mb-4">How Royalty Works</h3>
                <ul className="text-gray-400 space-y-2">
                    <li>• Achieve level 10, 11, 12, or 13 to qualify for royalty tiers</li>
                    <li>• Maintain at least 2 direct referrals to stay active</li>
                    <li>• Daily royalty pool is distributed among all active tier members</li>
                    <li>• Higher tier = larger percentage of the pool (Tier 1: 40%, Tier 4: 10%)</li>
                    <li>• Maximum royalty earning capped at 150% of total deposits</li>
                    <li>• Claim your share once per day</li>
                </ul>
            </div>
        </div>
    );
}
