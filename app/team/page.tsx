'use client';

import { useContract } from '@/hooks/useContract';
import { useUserData } from '@/hooks/useUserData';
import { useTeam } from '@/hooks/useTeam';
import { formatBNB, formatNumber, shortenAddress } from '@/lib/utils';

export default function TeamPage() {
    const { isConnected } = useContract();
    const { user, isRegistered } = useUserData();
    const { directTeam, matrixDirect, loading } = useTeam(user?.id);

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                <p className="text-gray-400">Please connect your wallet to view team</p>
            </div>
        );
    }

    if (!isRegistered || !user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Not Registered</h2>
                <p className="text-gray-400 mb-8">Please register first to view team</p>
                <a
                    href="/register"
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                    Register Now
                </a>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Team & Matrix</h1>

            {/* Team Summary */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Direct Team</p>
                    <p className="text-white text-3xl font-bold">{formatNumber(user.directTeam)}</p>
                    <p className="text-gray-500 text-xs mt-2">Personal referrals</p>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Matrix Direct</p>
                    <p className="text-white text-3xl font-bold">{matrixDirect.length}/2</p>
                    <p className="text-gray-500 text-xs mt-2">Binary positions filled</p>
                </div>
            </div>

            {/* Matrix Visualization */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
                <h2 className="text-xl font-bold text-white mb-6">Binary Matrix Position</h2>

                <div className="flex flex-col items-center">
                    {/* User (Root) */}
                    <div className="bg-blue-600 rounded-lg p-4 text-center mb-8">
                        <div className="text-white font-bold">You</div>
                        <div className="text-blue-200 text-sm">ID: {user.id.toString()}</div>
                        <div className="text-blue-300 text-xs mt-1">Level {user.level.toString()}</div>
                    </div>

                    {/* Matrix Direct Positions */}
                    <div className="relative w-full max-w-md">
                        <div className="absolute top-0 left-1/2 w-0.5 h-8 bg-gray-600 -translate-x-1/2"></div>

                        <div className="flex justify-between gap-8">
                            {/* Left Position */}
                            <div className="flex-1 flex flex-col items-center">
                                <div className="w-0.5 h-8 bg-gray-600"></div>
                                {matrixDirect[0] ? (
                                    <div className="bg-green-600 rounded-lg p-4 text-center w-full shadow-lg">
                                        <div className="text-white font-medium text-sm">Position 1</div>
                                        <div className="text-green-100 text-xs">ID: {matrixDirect[0].id.toString()}</div>
                                        <div className="text-green-200 text-xs font-semibold mt-1">Level {matrixDirect[0].level.toString()}</div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-900 rounded-lg p-4 text-center border border-dashed border-gray-600 w-full">
                                        <div className="text-gray-500 text-sm">Empty</div>
                                    </div>
                                )}
                            </div>

                            {/* Right Position */}
                            <div className="flex-1 flex flex-col items-center">
                                <div className="w-0.5 h-8 bg-gray-600"></div>
                                {matrixDirect[1] ? (
                                    <div className="bg-green-600 rounded-lg p-4 text-center w-full shadow-lg">
                                        <div className="text-white font-medium text-sm">Position 2</div>
                                        <div className="text-green-100 text-xs">ID: {matrixDirect[1].id.toString()}</div>
                                        <div className="text-green-200 text-xs font-semibold mt-1">Level {matrixDirect[1].level.toString()}</div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-900 rounded-lg p-4 text-center border border-dashed border-gray-600 w-full">
                                        <div className="text-gray-500 text-sm">Empty</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Direct Team List */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="px-6 py-4 bg-gray-900 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Direct Referrals ({matrixDirect.length})</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading team data...</div>
                ) : matrixDirect.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <p className="mb-4">No direct referrals yet</p>
                        <p className="text-sm">Share your referral link to grow your team!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        User ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Level
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Position
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {matrixDirect.map((member, index) => (
                                    <tr key={member.id.toString()} className="hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                                            #{member.id.toString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-medium">
                                                Level {member.level.toString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                                            Position {index + 1}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}
