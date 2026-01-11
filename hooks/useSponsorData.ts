'use client';

import { useEffect, useState } from 'react';
import { useContract } from './useContract';
import { Income } from '@/types';

export function useSponsorData(userId?: bigint) {
    const { contract } = useContract();
    const [sponsorIncome, setSponsorIncome] = useState<Income[]>([]);
    const [totalSponsorIncome, setTotalSponsorIncome] = useState<bigint>(BigInt(0));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSponsorData = async () => {
            if (!contract || !userId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Get last 100 income transactions
                const incomeData = await contract.getIncome(userId, 100);

                // Filter for sponsor income (layer = 0)
                const sponsorTransactions: Income[] = incomeData
                    .filter((item: any) => item.layer === BigInt(0))
                    .map((item: any) => ({
                        id: item.id,
                        layer: item.layer,
                        amount: item.amount,
                        time: item.time,
                        isLost: item.isLost,
                    }));

                setSponsorIncome(sponsorTransactions);

                //Calculate total sponsor income
                const total = sponsorTransactions
                    .filter((item) => !item.isLost)
                    .reduce((sum, item) => sum + item.amount, BigInt(0));

                setTotalSponsorIncome(total);
            } catch (err) {
                console.error('Error fetching sponsor data:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch sponsor data');
            } finally {
                setLoading(false);
            }
        };

        fetchSponsorData();
    }, [contract, userId]);

    const refresh = async () => {
        if (!contract || !userId) return;
        setLoading(true);
        try {
            const incomeData = await contract.getIncome(userId, 100);
            const sponsorTransactions: Income[] = incomeData
                .filter((item: any) => item.layer === BigInt(0))
                .map((item: any) => ({
                    id: item.id,
                    layer: item.layer,
                    amount: item.amount,
                    time: item.time,
                    isLost: item.isLost,
                }));

            setSponsorIncome(sponsorTransactions);

            const total = sponsorTransactions
                .filter((item) => !item.isLost)
                .reduce((sum, item) => sum + item.amount, BigInt(0));

            setTotalSponsorIncome(total);
        } catch (err) {
            console.error('Error refreshing sponsor data:', err);
            setError(err instanceof Error ? err.message : 'Failed to refresh sponsor data');
        } finally {
            setLoading(false);
        }
    };

    return {
        sponsorIncome,
        totalSponsorIncome,
        loading,
        error,
        refresh,
    };
}
