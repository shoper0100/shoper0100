'use client';

import { useContract } from '@/hooks/useContract';
import { shortenAddress, formatBNB } from '@/lib/utils';
import { EXPLORER_URL } from '@/lib/constants';
import { useState, useEffect } from 'react';

export default function WalletConnect() {
    const { account, isConnected, isCorrectNetwork, connect, disconnect, switchNetwork, error, provider } = useContract();
    const [connecting, setConnecting] = useState(false);
    const [balance, setBalance] = useState<bigint>(BigInt(0));
    const [showDropdown, setShowDropdown] = useState(false);

    // Fetch balance
    useEffect(() => {
        const fetchBalance = async () => {
            if (provider && account && isCorrectNetwork) {
                try {
                    const bal = await provider.getBalance(account);
                    setBalance(bal);
                } catch (err) {
                    console.error('Failed to fetch balance:', err);
                }
            }
        };

        fetchBalance();

        // Refresh balance every 10 seconds
        const interval = setInterval(fetchBalance, 10000);
        return () => clearInterval(interval);
    }, [provider, account, isCorrectNetwork]);

    const handleConnect = async () => {
        try {
            setConnecting(true);
            await connect(); // Call original connect from useContract
        } catch (err: any) {
            console.error('Failed to connect:', err);

            // Show user-friendly error messages
            // useContract already handles most errors, this is just for logging
        } finally {
            setConnecting(false);
        }
    };

    if (isConnected && account) {
        return (
            <div className="flex items-center gap-2">
                {!isCorrectNetwork && (
                    <button
                        onClick={switchNetwork}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                        Switch to opBNB
                    </button>
                )}

                {/* Wallet Info Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-2 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-white font-medium">{shortenAddress(account)}</span>
                        </div>

                        {isCorrectNetwork && (
                            <div className="flex items-center gap-1 text-sm">
                                <span className="text-gray-400">|</span>
                                <span className="text-blue-400 font-semibold">{formatBNB(balance)}</span>
                                <span className="text-gray-400">BNB</span>
                            </div>
                        )}

                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                            <div className="p-4 space-y-3">
                                {/* Address */}
                                <div>
                                    <div className="text-xs text-gray-400 mb-1">Address</div>
                                    <div className="flex items-center justify-between bg-gray-900 rounded px-3 py-2">
                                        <span className="text-white text-sm font-mono">{shortenAddress(account, 8)}</span>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(account)}
                                            className="text-blue-400 hover:text-blue-300 text-xs"
                                            title="Copy address"
                                        >
                                            📋
                                        </button>
                                    </div>
                                </div>

                                {/* Balance */}
                                {isCorrectNetwork && (
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">Balance</div>
                                        <div className="bg-gray-900 rounded px-3 py-2">
                                            <span className="text-white text-lg font-bold">{formatBNB(balance)}</span>
                                            <span className="text-gray-400 text-sm ml-2">BNB</span>
                                        </div>
                                    </div>
                                )}

                                {/* Network */}
                                <div>
                                    <div className="text-xs text-gray-400 mb-1">Network</div>
                                    <div className="bg-gray-900 rounded px-3 py-2">
                                        <span className="text-white text-sm">
                                            {isCorrectNetwork ? 'opBNB Testnet' : 'Wrong Network'}
                                        </span>
                                    </div>
                                </div>

                                {/* Links */}
                                <div className="pt-2 border-t border-gray-700 space-y-2">
                                    <a
                                        href={`${EXPLORER_URL}/address/${account}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between px-3 py-2 bg-gray-900 hover:bg-gray-700 rounded transition-colors"
                                    >
                                        <span className="text-white text-sm">View on Explorer</span>
                                        <span className="text-gray-400">↗</span>
                                    </a>

                                    <button
                                        onClick={async () => {
                                            try {
                                                setShowDropdown(false);
                                                // Trigger MetaMask account selector
                                                await window.ethereum?.request({
                                                    method: 'wallet_requestPermissions',
                                                    params: [{ eth_accounts: {} }],
                                                });
                                            } catch (err) {
                                                console.error('Failed to switch account:', err);
                                            }
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-2 bg-gray-900 hover:bg-gray-700 rounded transition-colors"
                                    >
                                        <span className="text-white text-sm">Switch Account</span>
                                        <span className="text-gray-400">🔄</span>
                                    </button>

                                    {!isCorrectNetwork && (
                                        <button
                                            onClick={() => {
                                                switchNetwork();
                                                setShowDropdown(false);
                                            }}
                                            className="w-full px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition-colors text-sm font-medium"
                                        >
                                            Switch to opBNB Testnet
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            disconnect();
                                            setShowDropdown(false);
                                        }}
                                        className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors text-sm font-medium"
                                    >
                                        Disconnect Wallet
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                onClick={handleConnect}
                disabled={connecting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
                {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
            {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
    );
}
