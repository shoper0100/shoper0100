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

                // Fetch matrix direct positions
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
                            level: userInfo[5], // level is at index 5
                        });
                    } catch (err) {
                        console.error(`Error fetching info for user ${id}:`, err);
                    }
                }

                setMatrixDirect(matrixPositions);

                // Note: Contract doesn't have events or getter functions for referral list
                // Matrix direct positions are displayed as direct referrals in the UI
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
                        level: userInfo[5],
                    });
                } catch (err) {
                    console.error(`Error fetching info for user ${id}:`, err);
                }
            }
            setMatrixDirect(matrixPositions);
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
