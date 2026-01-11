'use client';

import { useEffect, useState } from 'react';
import { useContract } from './useContract';
import { RoyaltyInfo } from '@/types';
import { ROYALTY_LEVELS, ROYALTY_PERCENTAGES } from '@/lib/constants';

export function useRoyalty(userId?: bigint, userLevel?: bigint) {
    const { contract } = useContract();
    const [royaltyTiers, setRoyaltyTiers] = useState<RoyaltyInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRoyalty = async () => {
            if (!contract || !userId || !userLevel) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const currentDay = await contract.getCurRoyaltyDay();
                const tierInfos: RoyaltyInfo[] = [];

                for (let tier = 0; tier < ROYALTY_LEVELS.length; tier++) {
                    const level = ROYALTY_LEVELS[tier];

                    // Check if user is eligible for this tier
                    const isEligible = Number(userLevel) === level;

                    if (isEligible) {
                        // Get royalty pool for this tier
                        const poolAmount = await contract.royalty(currentDay, tier);

                        // Get number of eligible users
                        const eligibleUsers = await contract.royaltyUsers(tier);

                        // Check if user is active in this tier
                        const isActive = await contract.royaltyActive(userId, tier);

                        // Check if user has claimed
                        const hasClaimed = await contract.royaltyTaken(currentDay, userId);

                        // Calculate user's share
                        const userShare = eligibleUsers > BigInt(0)
                            ? poolAmount / eligibleUsers
                            : BigInt(0);

                        tierInfos.push({
                            tier,
                            level,
                            percentage: ROYALTY_PERCENTAGES[tier],
                            totalPool: poolAmount,
                            userShare: BigInt(userShare),
                            eligibleUsers,
                            canClaim: isActive && !hasClaimed && userShare > BigInt(0),
                            hasClaimed,
                        });
                    }
                }

                setRoyaltyTiers(tierInfos);
            } catch (err) {
                console.error('Error fetching royalty:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch royalty');
            } finally {
                setLoading(false);
            }
        };

        fetchRoyalty();
    }, [contract, userId, userLevel]);

    const refresh = async () => {
        if (!contract || !userId || !userLevel) return;

        try {
            setError(null);

            const currentDay = await contract.getCurRoyaltyDay();
            const tierInfos: RoyaltyInfo[] = [];

            for (let tier = 0; tier < ROYALTY_LEVELS.length; tier++) {
                const level = ROYALTY_LEVELS[tier];
                const isEligible = Number(userLevel) === level;

                if (isEligible) {
                    const poolAmount = await contract.royalty(currentDay, tier);
                    const eligibleUsers = await contract.royaltyUsers(tier);
                    const isActive = await contract.royaltyActive(userId, tier);
                    const hasClaimed = await contract.royaltyTaken(currentDay, userId);
                    const userShare = eligibleUsers > BigInt(0)
                        ? poolAmount / eligibleUsers
                        : BigInt(0);

                    tierInfos.push({
                        tier,
                        level,
                        percentage: ROYALTY_PERCENTAGES[tier],
                        totalPool: poolAmount,
                        userShare: BigInt(userShare),
                        eligibleUsers,
                        canClaim: isActive && !hasClaimed && userShare > BigInt(0),
                        hasClaimed,
                    });
                }
            }

            setRoyaltyTiers(tierInfos);
        } catch (err) {
            console.error('Error refreshing royalty:', err);
            setError(err instanceof Error ? err.message : 'Failed to refresh royalty');
        }
    };

    const claimableRoyalty = royaltyTiers.find(tier => tier.canClaim);

    return {
        royaltyTiers,
        claimableRoyalty,
        loading,
        error,
        refresh,
    };
}
