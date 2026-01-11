'use client';

import { useEffect, useState } from 'react';
import { useContract } from './useContract';
import { User, UserIncome } from '@/types';

export function useUserData(userAddress?: string) {
    const { contract, account, isCorrectNetwork } = useContract();
    const [user, setUser] = useState<User | null>(null);
    const [income, setIncome] = useState<UserIncome | null>(null);
    const [userId, setUserId] = useState<bigint | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const address = userAddress || account;

    useEffect(() => {
        const fetchUserData = async () => {
            if (!contract || !address) {
                setLoading(false);
                return;
            }

            // Check if on correct network
            if (!isCorrectNetwork) {
                setError('Please switch to opBNB network');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Get user ID from address
                const id = await contract.id(address);

                if (id === BigInt(0)) {
                    // User not registered
                    setUser(null);
                    setUserId(null);
                    setLoading(false);
                    return;
                }

                setUserId(id);

                if (!contract || !id) { // Changed from !userId to !id as userId is set above
                    setLoading(false);
                    return;
                }

                setLoading(true);

                // OPTIMIZED: Batch all contract calls in parallel
                const [userInfo, incomeFromContract] = await Promise.all([
                    contract.userInfo(id), // Use 'id' here
                    contract.userIncome(id).catch(() => null) // Use 'id' here
                ]);

                const userData: User = {
                    id: id, // Use 'id' here
                    account: String(userInfo[0] || ''),
                    referrer: userInfo[2] || BigInt(0), // Adjusted index
                    upline: userInfo[3] || BigInt(0), // Adjusted index
                    start: userInfo[4] || BigInt(0), // Adjusted index
                    level: userInfo[5] || BigInt(0), // Adjusted index
                    directTeam: userInfo[6] || BigInt(0), // Adjusted index
                    totalMatrixTeam: userInfo[7] || BigInt(0), // Adjusted index
                    exists: userInfo[8],
                };

                // Process income data
                const incomeData = incomeFromContract ? {
                    totalIncome: incomeFromContract[0] || BigInt(0),
                    totalDeposit: incomeFromContract[1] || BigInt(0),
                    royaltyIncome: incomeFromContract[2] || BigInt(0),
                    referralIncome: incomeFromContract[3] || BigInt(0),
                    levelIncome: incomeFromContract[4] || BigInt(0),
                    sponsorIncome: incomeFromContract[5] || BigInt(0),
                } : {
                    totalIncome: BigInt(0),
                    totalDeposit: BigInt(0),
                    royaltyIncome: BigInt(0),
                    referralIncome: BigInt(0),
                    levelIncome: BigInt(0),
                    sponsorIncome: BigInt(0),
                };

                setUser({
                    ...userData,
                    ...incomeData,
                });
            } catch (err) {
                console.error('Error fetching user data:', err);
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data';

                // Provide more helpful error messages
                if (errorMessage.includes('could not decode result data')) {
                    setError('Unable to connect to contract. Please ensure you are on opBNB network.');
                } else if (errorMessage.includes('network')) {
                    setError('Network error. Please check your connection and try again.');
                } else {
                    setError(errorMessage);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [contract, address, isCorrectNetwork]);

    const refresh = async () => {
        if (!contract || !address || !isCorrectNetwork) return;

        try {
            setError(null);
            const id = await contract.id(address);

            if (id === BigInt(0)) {
                setUser(null);
                setUserId(null);
                return;
            }

            setUserId(id);
            const userInfo = await contract.userInfo(id);

            const userData: User = {
                account: userInfo[0],
                id: userInfo[1],
                referrer: userInfo[2],
                upline: userInfo[3],
                start: userInfo[4],
                level: userInfo[5],
                directTeam: userInfo[6],
                totalMatrixTeam: userInfo[7],
                exists: userInfo[8],
            };

            const incomeData = await contract.userIncome(id);
            const userIncomeData: UserIncome = {
                totalIncome: incomeData[0],
                totalDeposit: incomeData[1],
                royaltyIncome: incomeData[2],
                referralIncome: incomeData[3],
                levelIncome: incomeData[4],
                sponsorIncome: incomeData[5],
            };

            setUser(userData);
            setIncome(userIncomeData);
        } catch (err) {
            console.error('Error refreshing user data:', err);
            setError(err instanceof Error ? err.message : 'Failed to refresh user data');
        }
    };

    return {
        user,
        income,
        userId,
        loading,
        error,
        refresh,
        isRegistered: user !== null,
    };
}
