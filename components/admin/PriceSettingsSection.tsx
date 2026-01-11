'use client';

import { useContract } from '@/hooks/useContract';
import { useEffect, useState } from 'react';
import { formatBNB } from '@/lib/utils';

export default function PriceSettingsSection() {
    const { contract, account } = useContract();
    const [bnbPrice, setBnbPrice] = useState<number>(600);
    const [newBnbPrice, setNewBnbPrice] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // USD target amounts for each level
    const usdTargets = [2, 3, 6, 12, 24, 48, 96, 192, 384, 768, 1536, 3072, 6144];

    useEffect(() => {
        const loadCurrentPrice = async () => {
            if (!contract) return;

            try {
                // Fetch current BNB price from contract
                const priceData = await contract.bnbPriceInUSD();
                setBnbPrice(Number(priceData));
            } catch (err) {
                console.error('Error loading BNB price:', err);
                // Default to $850 if fetch fails
                setBnbPrice(850);
            }
        };

        loadCurrentPrice();
    }, [contract]);

    const updateBnbPrice = async () => {
        if (!contract || !newBnbPrice) return;

        try {
            setLoading(true);
            setMessage(null);

            const tx = await contract.setBnbPrice(Number(newBnbPrice));
            await tx.wait();

            setMessage({ type: 'success', text: `BNB price updated to $${newBnbPrice}` });
            setNewBnbPrice('');
            await loadBnbPrice();
        } catch (err: any) {
            console.error('Error updating price:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to update price' });
        } finally {
            setLoading(false);
        }
    };

    const loadBnbPrice = async () => {
        if (!contract) return;
        try {
            const price = await contract.bnbPriceInUSD();
            setBnbPrice(Number(price));
        } catch (err) {
            console.error('Error loading BNB price:', err);
        }
    };

    const applyUsdPricing = async () => {
        if (!contract) return;

        try {
            setLoading(true);
            setMessage(null);

            // Apply USD targets to all 13 levels
            const tx = await contract.batchUpdateLevels(usdTargets);
            await tx.wait();

            setMessage({
                type: 'success',
                text: `All 13 levels updated based on $${bnbPrice} BNB price!`
            });
        } catch (err: any) {
            console.error('Error applying USD pricing:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to apply pricing' });
        } finally {
            setLoading(false);
        }
    };

    const calculateBnbAmount = (usd: number) => {
        return (usd / bnbPrice).toFixed(6);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">💰 BNB Price & Batch Settings</h2>
                <p className="text-gray-400">Set BNB price and apply USD-based pricing to all levels at once</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {message.text}
                </div>
            )}

            {/* Current BNB Price */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-2">Current BNB Price</h2>
                <p className="text-4xl font-bold text-blue-400 mb-4">
                    ${bnbPrice.toLocaleString()}
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-white text-sm font-medium mb-2">
                            Update BNB Price (USD)
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={newBnbPrice}
                            onChange={(e) => setNewBnbPrice(e.target.value)}
                            placeholder="Enter new BNB price in USD"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <button
                        onClick={updateBnbPrice}
                        disabled={loading || !newBnbPrice}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                        {loading ? 'Updating...' : 'Update BNB Price'}
                    </button>
                </div>
            </div>

            {/* Batch Apply USD Pricing */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-purple-500">
                <h3 className="text-lg font-bold text-white mb-2">🚀 Batch Apply USD Pricing</h3>
                <p className="text-gray-400 text-sm mb-4">
                    Update all 13 levels at once based on USD targets and current BNB price
                </p>

                {/* Preview Table */}
                <div className="bg-gray-800 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="text-left py-2 text-gray-400">Level</th>
                                <th className="text-left py-2 text-gray-400">USD Target</th>
                                <th className="text-left py-2 text-gray-400">BNB Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usdTargets.map((usd, index) => (
                                <tr key={index} className="border-b border-gray-700/50">
                                    <td className="py-2 text-white font-medium">Level {index + 1}</td>
                                    <td className="py-2 text-green-500">${usd}</td>
                                    <td className="py-2 text-blue-500">{calculateBnbAmount(usd)} BNB</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button
                    onClick={applyUsdPricing}
                    disabled={loading}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105"
                >
                    {loading ? 'Applying...' : '✨ Apply USD Pricing to All Levels'}
                </button>

                <p className="text-xs text-gray-500 mt-2 text-center">
                    This will update all 13 levels based on the table above
                </p>
            </div>

            {/* Info */}
            <div className="bg-yellow-500/10 border border-yellow-500 rounded-xl p-6">
                <h3 className="text-lg font-bold text-yellow-500 mb-2">💡 How It Works</h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                    <li>• Set BNB price to current market value</li>
                    <li>• USD targets maintain stable pricing (Level 1 = $2, Level 13 = $6144, etc.)</li>
                    <li>• Click "Apply" to update all 13 levels at once</li>
                    <li>• Level costs automatically adjust based on BNB price</li>
                    <li>• Users pay the same USD value regardless of BNB price fluctuations</li>
                </ul>
            </div>
        </div>
    );
}
