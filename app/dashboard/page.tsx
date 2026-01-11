'use client';

import { useContract } from '@/hooks/useContract';
import { useUserData } from '@/hooks/useUserData';
import { useIncome } from '@/hooks/useIncome';
import StatsCard from '@/components/dashboard/StatsCard';
import { formatBNB, formatNumber } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
    const { isConnected, account, isCorrectNetwork, switchNetwork } = useContract();
    const { user, income, loading: userLoading, isRegistered, error } = useUserData();
    const { income: incomeHistory, loading: incomeLoading } = useIncome(user?.id);

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                <p className="text-gray-400 mb-8">Please connect your wallet to view your dashboard</p>
            </div>
        );
    }

    if (!isCorrectNetwork) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Wrong Network</h2>
                <p className="text-gray-400 mb-8">Please switch to opBNB network to continue</p>
                <button
                    onClick={switchNetwork}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                    Switch to opBNB
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
                <p className="text-gray-500 text-sm">Make sure you're connected to opBNB network</p>
            </div>
        );
    }

    if (!isRegistered || !user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Welcome to RideBNB</h2>
                <p className="text-gray-400 mb-8">You are not registered yet. Register to get started!</p>
                <Link
                    href="/register"
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                    Register Now
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400 mt-1">ID: {user.id.toString()}</p>
                </div>

                <div className="flex gap-3">
                    <Link
                        href="/upgrade"
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Upgrade Level
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Current Level"
                    value={`Level ${user.level.toString()}`}
                    subtitle={`Max Level: 13`}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    }
                />

                <StatsCard
                    title="Total Income"
                    value={`${income ? formatBNB(income.totalIncome) : '0'} BNB`}
                    subtitle={`From all sources`}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />

                <StatsCard
                    title="Direct Team"
                    value={formatNumber(user.directTeam)}
                    subtitle="Direct referrals"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    }
                />

                <StatsCard
                    title="Matrix Team"
                    value={formatNumber(user.totalMatrixTeam)}
                    subtitle="Total matrix members"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    }
                />
            </div>

            {/* Income Breakdown */}
            {income && (
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-6">Income Breakdown</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Referral Income</p>
                            <p className="text-white text-2xl font-bold">{formatBNB(income.referralIncome)} BNB</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Level Income</p>
                            <p className="text-white text-2xl font-bold">{formatBNB(income.levelIncome)} BNB</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Royalty Income</p>
                            <p className="text-white text-2xl font-bold">{formatBNB(income.royaltyIncome)} BNB</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
                <Link
                    href="/income"
                    className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors group"
                >
                    <h3 className="text-white font-bold mb-2 group-hover:text-blue-500">Income History</h3>
                    <p className="text-gray-400 text-sm">View detailed income transactions</p>
                </Link>

                <Link
                    href="/team"
                    className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors group"
                >
                    <h3 className="text-white font-bold mb-2 group-hover:text-blue-500">Team & Matrix</h3>
                    <p className="text-gray-400 text-sm">View your team structure and matrix</p>
                </Link>

                <Link
                    href="/royalty"
                    className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors group"
                >
                    <h3 className="text-white font-bold mb-2 group-hover:text-blue-500">Royalty Rewards</h3>
                    <p className="text-gray-400 text-sm">Check and claim royalty rewards</p>
                </Link>
            </div>

            {/* Recent Income */}
            {incomeHistory.length > 0 && (
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-6">Recent Income</h2>
                    <div className="space-y-3">
                        {incomeHistory.slice(0, 5).map((item, index) => (
                            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${item.isLost ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                    <div>
                                        <p className="text-white font-medium">
                                            {item.isLost ? 'Lost Income' : `Layer ${item.layer.toString()}`}
                                        </p>
                                        <p className="text-gray-500 text-sm">From User #{item.id.toString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${item.isLost ? 'text-red-500' : 'text-green-500'}`}>
                                        {formatBNB(item.amount)} BNB
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
