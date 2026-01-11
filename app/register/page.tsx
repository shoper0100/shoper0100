'use client';

import { useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { useUserData } from '@/hooks/useUserData';
import { formatBNB, calculateTotalCost } from '@/lib/utils';
import { LEVEL_COSTS, ROOT_USER_ID } from '@/lib/constants';
import { parseEther } from 'ethers';

export default function RegisterPage() {
    const { contract, account, isConnected } = useContract();
    const { isRegistered, refresh } = useUserData();
    const [referrerId, setReferrerId] = useState(ROOT_USER_ID.toString());
    const [registering, setRegistering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const registrationCost = calculateTotalCost(BigInt(LEVEL_COSTS[0]), 10);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!contract || !account) {
            setError('Please connect your wallet');
            return;
        }

        try {
            setRegistering(true);
            setError(null);

            const refId = BigInt(referrerId);

            // Call register function
            const tx = await contract.register(refId, account, {
                value: registrationCost,
            });

            console.log('Transaction sent:', tx.hash);
            await tx.wait();

            console.log('Registration successful!');
            setSuccess(true);

            // Refresh user data
            setTimeout(() => {
                refresh();
            }, 2000);

        } catch (err: any) {
            console.error('Registration failed:', err);

            // Parse error message to show user-friendly text
            let errorMessage = 'Registration failed. Please try again.';

            if (err.code === 'CALL_EXCEPTION') {
                errorMessage = 'Transaction reverted. Please check:\n• You have enough BNB for gas fees\n• Referrer ID exists and is valid\n• You haven\'t registered before';
            } else if (err.code === 'INSUFFICIENT_FUNDS') {
                errorMessage = 'Insufficient BNB balance for registration';
            } else if (err.message?.includes('user rejected')) {
                errorMessage = 'Transaction canceled by user';
            } else if (err.message) {
                // Clean up error message
                const msg = err.message;
                if (msg.includes('execution reverted')) {
                    const match = msg.match(/execution reverted: (.+?)"/);
                    errorMessage = match ? match[1] : 'Transaction failed';
                } else if (msg.length < 200) {
                    errorMessage = msg;
                }
            }

            setError(errorMessage);
        } finally {
            setRegistering(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                <p className="text- gray-400">Please connect your wallet to register</p>
            </div>
        );
    }

    if (isRegistered) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Already Registered</h2>
                <p className="text-gray-400 mb-8">You are already registered on RideBNB</p>
                <a
                    href="/dashboard"
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                    Go to Dashboard
                </a>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="bg-green-500/10 border border-green-500 rounded-xl p-8 max-w-md">
                    <h2 className="text-2xl font-bold text-green-500 mb-4">Registration Successful!</h2>
                    <p className="text-gray-300 mb-6">
                        Welcome to RideBNB! Your registration has been confirmed.
                    </p>
                    <a
                        href="/dashboard"
                        className="block w-full px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-center"
                    >
                        Go to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Register</h1>
            <p className="text-gray-400 mb-8">Join the RideBNB platform and start earning</p>

            <form onSubmit={handleRegister} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                {/* Referrer ID Input */}
                <div className="mb-6">
                    <label htmlFor="referrerId" className="block text-white font-medium mb-2">
                        Referrer ID
                    </label>
                    <input
                        type="number"
                        id="referrerId"
                        value={referrerId}
                        onChange={(e) => setReferrerId(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        required
                        min={ROOT_USER_ID}
                    />
                    <p className="text-gray-500 text-sm mt-1">
                        Default: {ROOT_USER_ID} (Root user)
                    </p>
                </div>

                {/* Registration Cost */}
                <div className="bg-gray-900 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400">Level 0 Cost:</span>
                        <span className="text-white font-medium">{formatBNB(LEVEL_COSTS[0])} BNB</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400">Admin Fee (10%):</span>
                        <span className="text-white font-medium">
                            {formatBNB(BigInt(LEVEL_COSTS[0]) * BigInt(10) / BigInt(100))} BNB
                        </span>
                    </div>
                    <div className="border-t border-gray-700 pt-2">
                        <div className="flex items-center justify-between">
                            <span className="text-white font-bold">Total Cost:</span>
                            <span className="text-blue-500 font-bold text-xl">
                                {formatBNB(registrationCost)} BNB
                            </span>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
                        <p className="text-red-500 font-semibold mb-2">⚠️ Error</p>
                        <p className="text-red-400 text-sm whitespace-pre-line">{error}</p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={registering}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                    {registering ? 'Registering...' : 'Register Now'}
                </button>

                <p className="text-gray-500 text-sm mt-4 text-center">
                    By registering, you agree to the platform terms and conditions
                </p>
            </form>

            {/* Info Cards */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-white font-bold mb-2">What You Get</h3>
                    <ul className="text-gray-400 text-sm space-y-2">
                        <li>• Entry to Level 0</li>
                        <li>• Binary matrix position</li>
                        <li>• Referral income potential</li>
                        <li>• Upgrade options to 13 levels</li>
                    </ul>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-white font-bold mb-2">Income Opportunities</h3>
                    <ul className="text-gray-400 text-sm space-y-2">
                        <li>• Direct referral income</li>
                        <li>• Level-based matrix income</li>
                        <li>• 4-tier royalty system</li>
                        <li>• Up to 150% ROI cap</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
