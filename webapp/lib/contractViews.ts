// Contract View Functions - Easy-to-use wrappers for all read-only queries
import { ethers } from 'ethers';
import { MAIN_ABI, ROYALTY_ABI, CONTRACTS } from './contracts';

/**
 * Get user information by ID
 */
export async function getUserInfo(userId: number, provider: ethers.Provider) {
    const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
    const info = await contract.getUserInfo(userId);

    return {
        address: info.userAddress,
        id: Number(info.id),
        referrerId: Number(info.referrerId),
        level: Number(info.level),
        directReferrals: Number(info.directReferrals),
        totalTeamSize: Number(info.totalTeamSize),
        registrationTime: new Date(Number(info.registrationTime) * 1000),
        isActive: info.isActive
    };
}

/**
 * Get all income data for a user
 */
export async function getUserIncome(userId: number, provider: ethers.Provider) {
    const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
    const income = await contract.userIncome(userId);

    return {
        totalIncome: ethers.formatEther(income.totalIncome),
        referralIncome: ethers.formatEther(income.referralIncome),
        sponsorIncome: ethers.formatEther(income.sponsorIncome),
        levelIncome: ethers.formatEther(income.levelIncome),
        royaltyIncome: ethers.formatEther(income.royaltyIncome),
        lostAmount: ethers.formatEther(income.lostAmount || 0)
    };
}

/**
 * Get BNB cost for a specific level
 */
export async function getLevelCost(level: number, provider: ethers.Provider) {
    const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
    const cost = await contract.getLevelCost(level);
    return ethers.formatEther(cost);
}

/**
 * Get user's current level
 */
export async function getCurrentLevel(userAddress: string, provider: ethers.Provider) {
    const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
    const level = await contract.currentLevel(userAddress);
    return Number(level);
}

/**
 * Get matrix position for user at specific level
 */
export async function getMatrixPosition(userId: number, level: number, provider: ethers.Provider) {
    const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
    const position = await contract.getMatrixPosition(userId, level);

    return {
        parentId: Number(position.parentId),
        children: position.children.map((id: bigint) => Number(id)),
        position: Number(position.position),
        layer: Number(position.layer),
        isFull: position.isFull
    };
}

/**
 * Get matrix tree structure (recursive)
 */
export async function getMatrixTree(userId: number, level: number, depth: number, provider: ethers.Provider) {
    const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
    return await contract.getMatrixTree(userId, level, depth);
}

/**
 * Get user ID from wallet address
 */
export async function getUserIdByAddress(address: string, provider: ethers.Provider) {
    const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
    const userId = await contract.getUserIdByAddress(address);
    return Number(userId);
}

/**
 * Get wallet address from user ID
 */
export async function getUserAddress(userId: number, provider: ethers.Provider) {
    const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
    return await contract.getUserAddress(userId);
}

/**
 * Check if address is registered
 */
export async function isUserExists(address: string, provider: ethers.Provider) {
    const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
    return await contract.isUserExists(address);
}

/**
 * Get array of direct referral IDs
 */
export async function getDirectReferrals(userId: number, provider: ethers.Provider) {
    const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
    const referrals = await contract.getDirectReferrals(userId);
    return referrals.map((id: bigint) => Number(id));
}

/**
 * Get total team size (recursive count)
 */
export async function getTotalTeamSize(userId: number, provider: ethers.Provider) {
    const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
    const size = await contract.getTotalTeamSize(userId);
    return Number(size);
}

/**
 * Get royalty information
 */
export async function getRoyaltyInfo(userId: number, provider: ethers.Provider) {
    const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
    const royalty = await contract.getRoyaltyInfo(userId);

    return {
        tier: Number(royalty.tier),
        poolBalance: ethers.formatEther(royalty.poolBalance),
        eligibleUsers: Number(royalty.eligibleUsers),
        userShare: ethers.formatEther(royalty.userShare),
        canClaim: royalty.canClaim,
        lastClaimTime: new Date(Number(royalty.lastClaimTime) * 1000)
    };
}

/**
 * Get total registered users
 */
export async function getTotalUsers(provider: ethers.Provider) {
    const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
    const total = await contract.totalUsers();
    return Number(total);
}

/**
 * Get last registered user ID
 */
export async function getLastUserId(provider: ethers.Provider) {
    const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
    const lastId = await contract.lastUserId();
    return Number(lastId);
}

/**
 * Get contract owner address
 */
export async function getOwner(provider: ethers.Provider) {
    const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);
    return await contract.owner();
}

/**
 * Load complete user dashboard data (batched queries)
 */
export async function loadUserDashboard(userId: number, userAddress: string, provider: ethers.Provider) {
    const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);

    // Batch all queries for better performance
    const [info, income, referrals, teamSize, royalty] = await Promise.all([
        contract.getUserInfo(userId),
        contract.userIncome(userId),
        contract.getDirectReferrals(userId),
        contract.getTotalTeamSize(userId),
        contract.getRoyaltyInfo(userId)
    ]);

    return {
        user: {
            id: Number(info.id),
            address: info.userAddress,
            referrerId: Number(info.referrerId),
            level: Number(info.level),
            directReferrals: Number(info.directReferrals),
            totalTeamSize: Number(info.totalTeamSize),
            registrationTime: new Date(Number(info.registrationTime) * 1000),
            isActive: info.isActive
        },
        income: {
            totalIncome: ethers.formatEther(income.totalIncome),
            referralIncome: ethers.formatEther(income.referralIncome),
            sponsorIncome: ethers.formatEther(income.sponsorIncome),
            levelIncome: ethers.formatEther(income.levelIncome),
            royaltyIncome: ethers.formatEther(income.royaltyIncome),
            lostAmount: ethers.formatEther(income.lostAmount || 0)
        },
        team: {
            directReferrals: referrals.map((id: bigint) => Number(id)),
            totalSize: Number(teamSize)
        },
        royalty: {
            tier: Number(royalty.tier),
            poolBalance: ethers.formatEther(royalty.poolBalance),
            eligibleUsers: Number(royalty.eligibleUsers),
            userShare: ethers.formatEther(royalty.userShare),
            canClaim: royalty.canClaim,
            lastClaimTime: new Date(Number(royalty.lastClaimTime) * 1000)
        }
    };
}
