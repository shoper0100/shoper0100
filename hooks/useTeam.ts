'use client';

import { useEffect, useState } from 'react';
import { useContract } from './useContract';
import { TeamMember } from '@/types';

interface MatrixPosition {
    id: bigint;
    level: bigint;
}

export function useTeam(userId?: bigint) {
    const { contract } = useContract();
    const [directTeam, setDirectTeam] = useState<TeamMember[]>([]);
    const [matrixDirect, setMatrixDirect] = useState<MatrixPosition[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTeam = async () => {
            if (!contract || !userId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Note: The deployed BSC Mainnet contract doesn't have getMatrixDirect function
                // It only has a public matrixDirect mapping that returns count
                // For now, we'll skip matrix direct positions until we have proper event logs

                try {
                    // Attempt to fetch matrix direct positions (may not exist in deployed contract)
                    const matrixDirectData = await contract.getMatrixDirect(userId);
                    const matrixDirectIds: bigint[] = [matrixDirectData[0], matrixDirectData[1]].filter(
                        (id: bigint) => id !== BigInt(0)
                    );

                    // Fetch user info for each matrix position to get their level
                    const matrixPositions: MatrixPosition[] = [];
                    for (const id of matrixDirectIds) {
                        try {
                            const userInfo = await contract.userInfo(id);
                            matrixPositions.push({
                                id: id,
                                level: userInfo[4], // level is at index 4 (after exists, account, referrer, upline)
                            });
                        } catch (err) {
                            console.error(`Error fetching info for user ${id}:`, err);
                        }
                    }

                    setMatrixDirect(matrixPositions);
                } catch (matrixErr) {
                    // getMatrixDirect function doesn't exist in deployed contract
                    console.log('Matrix direct function not available in deployed contract');
                    setMatrixDirect([]);
                }

                // Note: Contract doesn't have event logs available for referral list on BSC Mainnet
                // Direct team would need to be fetched from events or subgraph
                setDirectTeam([]);
            } catch (err) {
                console.error('Error fetching team:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch team');
            } finally {
                setLoading(false);
            }
        };

        fetchTeam();
    }, [contract, userId]);

    const refresh = async () => {
        if (!contract || !userId) return;

        try {
            setError(null);

            try {
                const matrixDirectData = await contract.getMatrixDirect(userId);
                const matrixDirectIds: bigint[] = [matrixDirectData[0], matrixDirectData[1]].filter(
                    (id: bigint) => id !== BigInt(0)
                );

                const matrixPositions: MatrixPosition[] = [];
                for (const id of matrixDirectIds) {
                    try {
                        const userInfo = await contract.userInfo(id);
                        matrixPositions.push({
                            id: id,
                            level: userInfo[4], // level is at index 4
                        });
                    } catch (err) {
                        console.error(`Error fetching info for user ${id}:`, err);
                    }
                }
                setMatrixDirect(matrixPositions);
            } catch (matrixErr) {
                // Function doesn't exist in deployed contract
                console.log('Matrix direct function not available');
                setMatrixDirect([]);
            }
        } catch (err) {
            console.error('Error refreshing team:', err);
            setError(err instanceof Error ? err.message : 'Failed to refresh team');
        }
    };

    return {
        directTeam,
        matrixDirect,
        loading,
        error,
        refresh,
    };
}
