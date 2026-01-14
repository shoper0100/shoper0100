// Fast Royalty Data Queries
import { ethers, Provider, Signer } from 'ethers';
import { ROYALTY_ABI } from './contracts';

export interface TierData {
    tier: number;
    poolAmount: string;
    userShare: string;
    claimed: string;
    claimable: string;
    isEligible: boolean;
    eligibleUsers: number;
    userLevel: number;
}

export interface RoyaltyData {
    userId: number;
    tiers: TierData[];
    totalClaimable: string;
    totalClaimed: string;
}

/**
 * Fetch user's royalty data for all tiers (FAST!)
 */
export async function fetchRoyaltyData(
    userId: number,
    provider: Provider,
    royaltyAddress: string
): Promise<RoyaltyData> {
    console.log(`👑 Fetching royalty data for user ${userId}...`);

    const contract = new ethers.Contract(royaltyAddress, ROYALTY_ABI, provider);

    const tiers: TierData[] = [];
    let totalClaimable = BigInt(0);
    let totalClaimed = BigInt(0);

    // Query all 4 tiers (L10, L11, L12, L13)
    for (let tier = 0; tier < 4; tier++) {
        try {
            const info = await contract.getUserRoyaltyInfo(userId, tier);

            const claimable = BigInt(info.claimable || 0);
            const claimed = BigInt(info.totalClaimed || 0);

            tiers.push({
                tier,
                poolAmount: ethers.formatEther(info.poolAmount || 0),
                userShare: ethers.formatEther(info.userShare || 0),
                claimed: ethers.formatEther(claimed),
                claimable: ethers.formatEther(claimable),
                isEligible: info.isEligible || false,
                eligibleUsers: Number(info.eligibleUsers || 0),
                userLevel: tier + 10 // L10, L11, L12, L13
            });

            totalClaimable += claimable;
            totalClaimed += claimed;

            console.log(`   Tier ${tier} (L${tier + 10}): ${ethers.formatEther(claimable)} claimable`);
        } catch (e) {
            console.warn(`Failed to fetch tier ${tier}:`, e);

            // Add empty tier data
            tiers.push({
                tier,
                poolAmount: '0',
                userShare: '0',
                claimed: '0',
                claimable: '0',
                isEligible: false,
                eligibleUsers: 0,
                userLevel: tier + 10
            });
        }
    }

    console.log(`✅ Total claimable: ${ethers.formatEther(totalClaimable)} BNB`);

    return {
        userId,
        tiers,
        totalClaimable: ethers.formatEther(totalClaimable),
        totalClaimed: ethers.formatEther(totalClaimed)
    };
}

/**
 * Claim royalty for a specific tier
 */
export async function claimRoyalty(
    tier: number,
    signer: Signer,
    royaltyAddress: string
): Promise<ethers.TransactionReceipt> {
    console.log(`💰 Claiming royalty for tier ${tier}...`);

    const contract = new ethers.Contract(royaltyAddress, ROYALTY_ABI, signer);

    const tx = await contract.claimRoyalty(tier);
    console.log(`   Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Royalty claimed! Gas used: ${receipt.gasUsed}`);

    return receipt;
}

/**
 * Get total royalty pool info (global stats)
 */
export async function fetchRoyaltyPoolStats(
    provider: Provider,
    royaltyAddress: string
): Promise<{
    totalPool: string;
    tierPools: string[];
}> {
    console.log(`📊 Fetching global royalty pool stats...`);

    const contract = new ethers.Contract(royaltyAddress, ROYALTY_ABI, provider);

    const tierPools: string[] = [];
    let total = BigInt(0);

    for (let tier = 0; tier < 4; tier++) {
        try {
            const poolInfo = await contract.getRoyaltyPoolInfo(tier);
            const poolAmount = BigInt(poolInfo.totalPool || 0);

            tierPools.push(ethers.formatEther(poolAmount));
            total += poolAmount;
        } catch (e) {
            tierPools.push('0');
        }
    }

    console.log(`✅ Total pool: ${ethers.formatEther(total)} BNB`);

    return {
        totalPool: ethers.formatEther(total),
        tierPools
    };
}
