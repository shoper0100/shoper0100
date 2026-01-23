'use client';

import { useContract } from '@/hooks/useContract';
import { useUserData } from '@/hooks/useUserData';
import { useSponsorData } from '@/hooks/useSponsorData';
import { formatBNB, formatDate, shortenAddress } from '@/lib/utils';
import Link from 'next/link';

export default function SponsorPage() {
    const { isConnected, isCorrectNetwork, switchNetwork } = useContract();
    const { user, loading: userLoading, isRegistered, error } = useUserData();
    const { sponsorIncome, totalSponsorIncome, loading: sponsorLoading } = useSponsorData(user?.id);

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                <p className="text-gray-400 mb-8">Please connect your wallet to view sponsor commissions</p>
            </div>
        );
    }

    if (!isCorrectNetwork) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Wrong Network</h2>
                <p className="text-gray-400 mb-8">Please switch to BSC Mainnet network to continue</p>
                <button
                    onClick={switchNetwork}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                    Switch to BSC Mainnet
                </button>
            </div>
        );
    }

    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Data</h2>
                <p className="text-gray-400 mb-4">{error}</p>
            </div>
        );
    }

    if (!isRegistered || !user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Not Registered</h2>
                <p className="text-gray-400 mb-8">Please register first to view sponsor commissions</p>
                <Link
                    href="/register"
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                    Register Now
                </Link>
            </div>
        );
    }

    const isQualified = user.level >= 4n;
    const earnedIncome = sponsorIncome.filter(item => !item.isLost);
    const lostIncome = sponsorIncome.filter(item => item.isLost);
    const totalLost = lostIncome.reduce((sum, item) => sum + item.amount, BigInt(0));

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Sponsor Commission</h1>
                <p className="text-gray-400 mt-2 font-bold">Earn 5% from your direct referrals' earnings globally</p>
            </div>

            {/* Qualification Status */}
            <div className={`bg-gray-800 rounded-xl p-6 border ${isQualified ? 'border-green-500' : 'border-orange-500'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Qualification Status</h3>
                        <p className="text-gray-400 text-sm">
                            {isQualified ? (
                                <>You are qualified to earn sponsor commissions (Level {user.level.toString()}/4+)</>
                            ) : (
                                <>Upgrade to Level 4 to start earning commissions (Current: Level {user.level.toString()})</>
                            )}
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-bold ${isQualified
                        ? 'bg-green-500 text-white'
                        : 'bg-orange-500 text-white'
                        }`}>
                        {isQualified ? '✓ Qualified' : '! Not Qualified'}
                    </div>
                </div>

                {!isQualified && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-sm text-gray-300 mb-3">
                            💡 Upgrade to Level 4 or higher to start earning 5% commission from your direct referrals' earnings
                        </p>
                        <Link
                            href="/upgrade"
                            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Upgrade Now
                        </Link>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Total Earned</p>
                    <p className="text-white text-3xl font-bold">{formatBNB(totalSponsorIncome)} BNB</p>
                    <p className="text-green-500 text-sm mt-2">{earnedIncome.length} transactions</p>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Lost Income</p>
                    <p className="text-white text-3xl font-bold">{formatBNB(totalLost)} BNB</p>
                    <p className="text-red-500 text-sm mt-2">{lostIncome.length} missed (not qualified)</p>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Direct Referrals</p>
                    <p className="text-white text-3xl font-bold">{user.directTeam.toString()}</p>
                    <p className="text-blue-500 text-sm mt-2">Earning sources</p>
                </div>
            </div>

            {/* How It Works */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">💡 How Sponsor Commission Works</h2>
                <div className="space-y-3 text-gray-300">
                    <p>✅ <strong>Earn 5%</strong> from your direct referrals' level income earnings</p>
                    <p>✅ <strong>Global reach</strong> - doesn't matter where they're placed in the matrix</p>
                    <p>✅ <strong>Qualification required</strong> - You must be Level 4 or higher</p>
                    <p>✅ <strong>Passive income</strong> - Earn automatically when they earn from their downline</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400">
                        <strong>Example:</strong> Your referral earns 1 BNB from their matrix team → You earn 0.05 BNB (5%)
                    </p>
                </div>
            </div>

            {/* Commission History */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-6">Commission History</h2>

                {sponsorLoading ? (
                    <div className="text-center py-8 text-gray-400">Loading transactions...</div>
                ) : sponsorIncome.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-400 mb-2">No commission transactions yet</p>
                        <p className="text-gray-500 text-sm">
                            Start earning when your direct referrals make level income from their teams
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">From Referral</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sponsorIncome.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                        <td className="py-4 px-4">
                                            <span className="text-white font-medium">User #{item.id.toString()}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`font-bold ${item.isLost ? 'text-red-500' : 'text-green-500'}`}>
                                                {formatBNB(item.amount)} BNB
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-gray-400">
                                            {formatDate(Number(item.time))}
                                        </td>
                                        <td className="py-4 px-4">
                                            {item.isLost ? (
                                                <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-sm">
                                                    Lost (Not Qualified)
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm">
                                                    ✓ Earned
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Tips */}
            {!isQualified && lostIncome.length > 0 && (
                <div className="bg-gradient-to-br from-orange-900/40 to-red-900/40 border border-orange-500/50 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-orange-500 opacity-5" style={{
                        backgroundImage: 'radial-gradient(circle at 80% 20%, currentColor 0%, transparent 50%)'
                    }}></div>

                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-orange-400 mb-2">⚠️ You're Missing Out!</h3>
                        <p className="text-gray-200 mb-4">
                            You've lost {formatBNB(totalLost)} BNB in sponsor commissions because you're not Level 4 yet.
                        </p>
                        <Link
                            href="/upgrade"
                            className="inline-block px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-orange-500/50"
                        >
                            Upgrade to Level 4 Now
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

