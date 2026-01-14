'use client';

import { useState } from 'react';
import { Transaction, IncomeHistory, getAllTransactionsSorted } from '@/lib/transactionQueries';

interface TransactionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: IncomeHistory | null;
    bnbPrice: number;
    initialFilter?: 'all' | 'referral' | 'sponsor' | 'matrix' | 'royalty';
}

export default function TransactionHistoryModal({
    isOpen,
    onClose,
    history,
    bnbPrice,
    initialFilter = 'all'
}: TransactionHistoryModalProps) {
    const [filter, setFilter] = useState<'all' | 'referral' | 'sponsor' | 'matrix' | 'royalty'>(initialFilter);

    if (!isOpen || !history) return null;

    // Get filtered transactions
    const getFilteredTransactions = (): Transaction[] => {
        if (filter === 'all') {
            return getAllTransactionsSorted(history);
        }

        const typeMap = {
            referral: history.referralIncome,
            sponsor: history.sponsorIncome,
            matrix: history.matrixIncome,
            royalty: history.royaltyIncome
        };

        return typeMap[filter].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    };

    const transactions = getFilteredTransactions();

    const getTypeIcon = (type: string) => {
        const icons = {
            referral: '💎',
            sponsor: '🤝',
            matrix: '🌳',
            royalty: '👑',
            upgrade: '⬆️',
            registration: '📝'
        };
        return icons[type as keyof typeof icons] || '📊';
    };

    const getTypeLabel = (type: string) => {
        const labels = {
            referral: 'Referral Income',
            sponsor: 'Sponsor Commission',
            matrix: 'Matrix Income',
            royalty: 'Royalty Claim',
            upgrade: 'Upgrade',
            registration: 'Registration'
        };
        return labels[type as keyof typeof labels] || type;
    };

    const formatDate = (date: Date) => {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getExplorerUrl = (txHash: string) => {
        return `https://bscscan.com/tx/${txHash}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-b border-yellow-500/30 p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-yellow-400">📜 Transaction History</h2>
                            <p className="text-gray-400 mt-1">
                                {transactions.length} {filter === 'all' ? 'total' : filter} transaction{transactions.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-3xl leading-none"
                        >
                            ×
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mt-4 flex-wrap">
                        {['all', 'referral', 'sponsor', 'matrix', 'royalty'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-2 rounded-lg font-medium transition ${filter === f
                                        ? 'bg-yellow-500 text-black'
                                        : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Transaction List */}
                <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
                    {transactions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-4xl mb-4">📭</p>
                            <p className="text-lg">No {filter === 'all' ? '' : filter} transactions found</p>
                            <p className="text-sm mt-2">Transactions will appear here as you earn income</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((tx, idx) => {
                                const usdValue = (parseFloat(tx.amount) * bnbPrice).toFixed(2);

                                return (
                                    <div
                                        key={tx.txHash + idx}
                                        className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-yellow-500/50 transition"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                {/* Type and Date */}
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-2xl">{getTypeIcon(tx.type)}</span>
                                                    <div>
                                                        <h3 className="font-semibold text-white">{getTypeLabel(tx.type)}</h3>
                                                        <p className="text-sm text-gray-400">
                                                            {formatDate(tx.timestamp)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Details */}
                                                <div className="ml-11 space-y-1">
                                                    {tx.fromUserId && (
                                                        <p className="text-sm text-gray-400">
                                                            From: <span className="text-yellow-400">User #{tx.fromUserId}</span>
                                                        </p>
                                                    )}
                                                    {tx.level !== undefined && (
                                                        <p className="text-sm text-gray-400">
                                                            Level: <span className="text-yellow-400">L{tx.level}</span>
                                                        </p>
                                                    )}
                                                    <a
                                                        href={getExplorerUrl(tx.txHash)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-400 hover:text-blue-300 hover:underline inline-block"
                                                    >
                                                        🔗 {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                                                    </a>
                                                </div>
                                            </div>

                                            {/* Amount */}
                                            <div className="text-right ml-4">
                                                <p className="text-xl font-bold text-green-400">
                                                    +{parseFloat(tx.amount).toFixed(4)} BNB
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    ≈ ${usdValue}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-800/50 border-t border-slate-700 p-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
