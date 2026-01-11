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
        // Mock data for testing/visualization
        if (userId) {
            const mockData: Income[] = [
                {
                    id: BigInt(73929),
                    layer: BigInt(1),
                    amount: BigInt('50000000000000000'), // 0.05 BNB
                    time: BigInt(Math.floor(Date.now() / 1000) - 3600),
                    isLost: false,
                    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                },
                {
                    id: BigInt(73930),
                    layer: BigInt(2),
                    amount: BigInt('30000000000000000'), // 0.03 BNB
                    time: BigInt(Math.floor(Date.now() / 1000) - 7200),
                    isLost: false,
                    transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                },
                {
                    id: BigInt(73931),
                    layer: BigInt(1),
                    amount: BigInt('45000000000000000'), // 0.045 BNB
                    time: BigInt(Math.floor(Date.now() / 1000) - 14400),
                    isLost: false,
                    transactionHash: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
                },
                {
                    id: BigInt(73932),
                    layer: BigInt(3),
                    amount: BigInt('25000000000000000'), // 0.025 BNB
                    time: BigInt(Math.floor(Date.now() / 1000) - 21600),
                    isLost: false,
                    transactionHash: '0x90abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
                },
                {
                    id: BigInt(73933),
                    layer: BigInt(2),
                    amount: BigInt('35000000000000000'), // 0.035 BNB
                    time: BigInt(Math.floor(Date.now() / 1000) - 28800),
                    isLost: false,
                    transactionHash: '0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc',
                },
                {
                    id: BigInt(73934),
                    layer: BigInt(4),
                    amount: BigInt('15000000000000000'), // 0.015 BNB
                    time: BigInt(Math.floor(Date.now() / 1000) - 43200),
                    isLost: true,
                    transactionHash: '0x234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1',
                },
                {
                    id: BigInt(73935),
                    layer: BigInt(1),
                    amount: BigInt('55000000000000000'), // 0.055 BNB
                    time: BigInt(Math.floor(Date.now() / 1000) - 86400),
                    isLost: false,
                    transactionHash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
                },
            ];
            setIncome(mockData);
        }
    }, [userId]);

    // Note: Using mock data for testing. Contract doesn't have events or getter functions
    // Remove this mock data when real contract functions are available

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
        refresh: async () => { },
    };
}
