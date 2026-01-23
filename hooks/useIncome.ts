'use client';

import { useEffect, useState } from 'react';
import { useContract } from './useContract';
import { Income } from '@/types';

export function useIncome(userId?: bigint) {
    const { contract } = useContract();
    const [income, setIncome] = useState<Income[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchIncome = async () => {
            if (!contract || !userId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                try {
                    // Try to fetch last 100 income transactions from contract
                    const incomeData = await contract.getIncome(userId, 100);

                    // Map to Income type
                    const transactions: Income[] = incomeData.map((item: any) => ({
                        id: item.id,
                        layer: item.layer,
                        amount: item.amount,
                        time: item.time,
                        isLost: item.isLost,
                        transactionHash: '',
                    }));

                    setIncome(transactions);
                } catch (contractErr) {
                    // Function doesn't exist or reverted - use empty array
                    // In production, you would fetch from event logs here
                    console.log('getIncome not available, would fetch from events');
                    setIncome([]);
                }
            } catch (err) {
                console.error('Error fetching income:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch income');
                setIncome([]);
            } finally {
                setLoading(false);
            }
        };

        fetchIncome();
    }, [contract, userId]);

    const refresh = async () => {
        if (!contract || !userId) return;

        try {
            setLoading(true);
            setError(null);

            try {
                const incomeData = await contract.getIncome(userId, 100);
                const transactions: Income[] = incomeData.map((item: any) => ({
                    id: item.id,
                    layer: item.layer,
                    amount: item.amount,
                    time: item.time,
                    isLost: item.isLost,
                    transactionHash: '',
                }));

                setIncome(transactions);
            } catch (contractErr) {
                console.log('getIncome not available');
                setIncome([]);
            }
        } catch (err) {
            console.error('Error refreshing income:', err);
            setError(err instanceof Error ? err.message : 'Failed to refresh income');
        } finally {
            setLoading(false);
        }
    };

    // Filter income by type
    const referralIncome = income.filter(i => Number(i.layer) === 1 && !i.isLost);
    const levelIncome = income.filter(i => Number(i.layer) > 1 && !i.isLost);
    const lostIncome = income.filter(i => i.isLost);

    return {
        income,
        referralIncome,
        levelIncome,
        lostIncome,
        loading,
        error,
        refresh,
    };
}
