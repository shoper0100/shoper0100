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

                // Note: getIncome function doesn't exist on deployed contract
                // Would need to fetch from event logs instead
                // For now, return empty data
                setSponsorIncome([]);
                setTotalSponsorIncome(BigInt(0));
            } catch (err) {
                console.error('Error fetching sponsor data:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch sponsor data');
                setSponsorIncome([]);
                setTotalSponsorIncome(BigInt(0));
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
            // Function doesn't exist - return empty
            setSponsorIncome([]);
            setTotalSponsorIncome(BigInt(0));
        } catch (err) {
            console.error('Error refreshing sponsor data:', err);
            setError(err instanceof Error ? err.message : 'Failed to refresh sponsor data');
            setSponsorIncome([]);
            setTotalSponsorIncome(BigInt(0));
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
