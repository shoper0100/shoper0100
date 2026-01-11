'use client';

import { useContract } from '@/hooks/useContract';
import { useState, useEffect } from 'react';

export default function GovernanceManagementSection() {
    const { contract, account } = useContract();
    const [daoAddress, setDaoAddress] = useState<string>('');
    const [ownerAddress, setOwnerAddress] = useState<string>('');
    const [newDAO, setNewDAO] = useState<string>('');
    const [newOwner, setNewOwner] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadGovernanceInfo();
    }, [contract]);

    const loadGovernanceInfo = async () => {
        if (!contract) return;

        try {
            const [dao, owner] = await contract.getGovernanceAddresses();
            setDaoAddress(dao);
            setOwnerAddress(owner);
        } catch (err) {
            console.error('Error loading governance:', err);
        }
    };

    const transferDAO = async () => {
        if (!contract || !newDAO) return;

        try {
            setLoading(true);
            setMessage(null);

            const tx = await contract.transferDAOControl(newDAO);
            await tx.wait();

            setMessage({ type: 'success', text: `DAO control transferred to ${newDAO}` });
            setNewDAO('');
            await loadGovernanceInfo();
        } catch (err: any) {
            console.error('Error transferring DAO:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to transfer DAO' });
        } finally {
            setLoading(false);
        }
    };

    const transferOwner = async () => {
        if (!contract || !newOwner) return;

        try {
            setLoading(true);
            setMessage(null);

            const tx = await contract.transferOwnership(newOwner);
            await tx.wait();

            setMessage({ type: 'success', text: `Ownership transferred to ${newOwner}` });
            setNewOwner('');
            await loadGovernanceInfo();
        } catch (err: any) {
            console.error('Error transferring ownership:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to transfer ownership' });
        } finally {
            setLoading(false);
        }
    };

    const isCurrentOwner = account?.toLowerCase() === ownerAddress?.toLowerCase();
    const isDAO = account?.toLowerCase() === daoAddress?.toLowerCase();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">🏛️ Governance Management</h2>
                <p className="text-gray-400">Transfer control between owner and DAO addresses</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {message.text}
                </div>
            )}

            {/* Current Governance */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Current Governance</h3>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-2">DAO Address (Multisig)</p>
                        <p className="text-white text-sm font-mono break-all">
                            {daoAddress || 'Not set'}
                        </p>
                        {isDAO && (
                            <span className="inline-block mt-2 px-2 py-1 bg-blue-500/20 text-blue-500 text-xs rounded">
                                You are DAO
                            </span>
                        )}
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-2">Owner Address (Emergency)</p>
                        <p className="text-white text-sm font-mono break-all">
                            {ownerAddress || 'Not set'}
                        </p>
                        {isCurrentOwner && (
                            <span className="inline-block mt-2 px-2 py-1 bg-green-500/20 text-green-500 text-xs rounded">
                                You are Owner
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Transfer Controls */}
            {isCurrentOwner && (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Transfer DAO Control */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-blue-500">
                        <h3 className="text-lg font-bold text-white mb-4">Transfer DAO Control</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Set new DAO multisig address (Gnosis Safe 2-of-5)
                        </p>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={newDAO}
                                onChange={(e) => setNewDAO(e.target.value)}
                                placeholder="0x... (New DAO Address)"
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                            />

                            <button
                                onClick={transferDAO}
                                disabled={loading || !newDAO}
                                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                            >
                                {loading ? 'Transferring...' : 'Transfer DAO Control'}
                            </button>
                        </div>
                    </div>

                    {/* Transfer Ownership */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-purple-500">
                        <h3 className="text-lg font-bold text-white mb-4">Transfer Ownership</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Set new owner address (emergency controller)
                        </p>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={newOwner}
                                onChange={(e) => setNewOwner(e.target.value)}
                                placeholder="0x... (New Owner Address)"
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                            />

                            <button
                                onClick={transferOwner}
                                disabled={loading || !newOwner}
                                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                            >
                                {loading ? 'Transferring...' : 'Transfer Ownership'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!isCurrentOwner && (
                <div className="bg-yellow-500/10 border border-yellow-500 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-yellow-500 mb-2">⚠️ Access Required</h3>
                    <p className="text-gray-300 text-sm">
                        Only the current owner can transfer governance control
                    </p>
                </div>
            )}

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-500 mb-2">💡 How It Works</h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                    <li>• <strong>DAO Address:</strong> Controls critical functions (price updates, level costs, etc.)</li>
                    <li>• <strong>Owner Address:</strong> Emergency controls (pause, withdraw, etc.)</li>
                    <li>• Transfer DAO control to Gnosis Safe 2-of-5 multisig</li>
                    <li>• Keep owner as hardware wallet for emergencies</li>
                    <li>• Can transfer either independently or together</li>
                </ul>
            </div>
        </div>
    );
}
