'use client';

import { useContract } from '@/hooks/useContract';
import { useUserData } from '@/hooks/useUserData';
import { useIncome } from '@/hooks/useIncome';
import { formatBNB, formatDate, formatNumber } from '@/lib/utils';
import { useState } from 'react';

export default function IncomePage() {
    const { isConnected } = useContract();
    const { user, income: userIncomeData, isRegistered } = useUserData();
    const { income, referralIncome, levelIncome, lostIncome, loading } = useIncome(user?.id);
    const [filter, setFilter] = useState<'all' | 'referral' | 'level' | 'lost'>('all');

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                <p className="text-gray-400">Please connect your wallet to view income</p>
            </div>
        );
    }

    if (!isRegistered || !user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Not Registered</h2>
                <p className="text-gray-400 mb-8">Please register first to view income</p>
                <a
                    href="/register"
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                    Register Now
                </a>
            </div>
        );
    }

    const filteredIncome =
        filter === 'referral' ? referralIncome :
            filter === 'level' ? levelIncome :
                filter === 'lost' ? lostIncome :
                    income;

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Income History</h1>

            {/* Income Summary */}
            {userIncomeData && (
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Total Income</p>
                        <p className="text-white text-2xl font-bold">{formatBNB(userIncomeData.totalIncome)} BNB</p>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Referral Income</p>
                        <p className="text-green-500 text-2xl font-bold">{formatBNB(userIncomeData.referralIncome)} BNB</p>
                        <p className="text-gray-500 text-xs mt-1">{referralIncome.length} transactions</p>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Level Income</p>
                        <p className="text-blue-500 text-2xl font-bold">{formatBNB(userIncomeData.levelIncome)} BNB</p>
                        <p className="text-gray-500 text-xs mt-1">{levelIncome.length} transactions</p>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Royalty Income</p>
                        <p className="text-purple-500 text-2xl font-bold">{formatBNB(userIncomeData.royaltyIncome)} BNB</p>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${filter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                >
                    All ({income.length})
                </button>
                <button
                    onClick={() => setFilter('referral')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${filter === 'referral'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                >
                    Referral ({referralIncome.length})
                </button>
                <button
                    onClick={() => setFilter('level')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${filter === 'level'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                >
                    Level ({levelIncome.length})
                </button>
                <button
                    onClick={() => setFilter('lost')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${filter === 'lost'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                >
                    Lost ({lostIncome.length})
                </button>
            </div>

            {/* Income Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading income history...</div>
                ) : filteredIncome.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No income transactions yet</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        From User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Layer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Transaction
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {filteredIncome.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${item.isLost
                                                ? 'bg-red-500/10 text-red-500'
                                                : Number(item.layer) === 1
                                                    ? 'bg-green-500/10 text-green-500'
                                                    : 'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                {item.isLost ? 'Lost' : Number(item.layer) === 1 ? 'Referral' : 'Level'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-white">
                                            #{item.id.toString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                                            {item.layer.toString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`font-bold ${item.isLost ? 'text-red-500' : 'text-green-500'}`}>
                                                {formatBNB(item.amount)} BNB
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                                            {formatDate(Number(item.time))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.transactionHash ? (
                                                <a
                                                    href={`https://opbnb-testnet.bscscan.com/tx/${item.transactionHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:text-blue-400 font-mono text-sm"
                                                >
                                                    {item.transactionHash.slice(0, 10)}...{item.transactionHash.slice(-8)}
                                                </a>
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`w-2 h-2 rounded-full ${item.isLost ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {filteredIncome.length > 0 && (
                <div className="mt-4 text-center text-gray-400 text-sm">
                    Showing {filteredIncome.length} transaction{filteredIncome.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}
