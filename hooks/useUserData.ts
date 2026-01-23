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
                setError('Please switch to BSC Mainnet network');
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
                    id: id,
                    exists: userInfo[0],           // bool exists
                    account: String(userInfo[1]),  // address account
                    referrer: userInfo[2],         // uint referrer
                    upline: userInfo[3],           // uint upline
                    level: userInfo[4],            // uint level
                    directTeam: userInfo[5],       // uint directTeam
                    totalMatrixTeam: userInfo[6],  // uint team
                    start: userInfo[7],            // uint registrationTime
                    // Income fields filled from userIncome call below
                    totalIncome: BigInt(0),
                    totalDeposit: BigInt(0),
                    royaltyIncome: BigInt(0),
                    referralIncome: BigInt(0),
                    levelIncome: BigInt(0),
                    sponsorIncome: BigInt(0),
                };

                // Process income data (if available)
                const incomeData = incomeFromContract ? {
                    totalDeposit: incomeFromContract[0] || BigInt(0),     // uint totalDeposit
                    totalIncome: incomeFromContract[1] || BigInt(0),      // uint totalIncome
                    referralIncome: incomeFromContract[2] || BigInt(0),   // uint referralIncome
                    sponsorIncome: incomeFromContract[3] || BigInt(0),    // uint sponsorIncome
                    levelIncome: incomeFromContract[4] || BigInt(0),      // uint levelIncome
                    royaltyIncome: BigInt(0),  // Not in contract struct
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
                    setError('Unable to connect to contract. Please ensure you are on BSC Mainnet network.');
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
                id: id,
                exists: userInfo[0],
                account: String(userInfo[1]),
                referrer: userInfo[2],
                upline: userInfo[3],
                level: userInfo[4],
                directTeam: userInfo[5],
                totalMatrixTeam: userInfo[6],
                start: userInfo[7],
                // Income fields
                totalIncome: BigInt(0),
                totalDeposit: BigInt(0),
                royaltyIncome: BigInt(0),
                referralIncome: BigInt(0),
                levelIncome: BigInt(0),
                sponsorIncome: BigInt(0),
            };

            const incomeData = await contract.userIncome(id);
            const userIncomeData: UserIncome = {
                totalDeposit: incomeData[0],     // uint totalDeposit
                totalIncome: incomeData[1],      // uint totalIncome
                referralIncome: incomeData[2],   // uint referralIncome
                sponsorIncome: incomeData[3],    // uint sponsorIncome
                levelIncome: incomeData[4],      // uint levelIncome
                royaltyIncome: BigInt(0),        // Not in contract struct
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
