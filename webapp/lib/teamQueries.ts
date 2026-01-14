// Fast Team Data Queries - No Events, Direct Contract Calls!
import { ethers, Provider, Contract } from 'ethers';
import { MAIN_ABI } from './contracts';

export interface TeamMember {
    userId: number;
    address: string;
    level: number;
    directTeam: number;
    totalTeam: number;
    registrationTime: Date;
    isDirect: boolean;
}

export interface MatrixPosition {
    userId?: number;
    address?: string;
    isDirect: boolean;
    isSpilled: boolean;
}

export interface MatrixLevel {
    level: number;
    totalPositions: number;
    filledCount: number;
    positions: MatrixPosition[];
}

/**
 * Fetch user's direct team members (FAST!)
 * No events - just direct contract queries
 */
export async function fetchDirectTeam(
    rootUserId: number,
    provider: Provider,
    contractAddress: string
): Promise<TeamMember[]> {
    console.log(`👥 Fetching direct team for user ${rootUserId}...`);

    const contract = new ethers.Contract(contractAddress, MAIN_ABI, provider);

    // Get root user info to know team size
    const rootInfo = await contract.userInfo(rootUserId);
    const directTeamSize = Number(rootInfo.directTeam);
    const totalTeamSize = Number(rootInfo.team);

    console.log(`   Direct team: ${directTeamSize}, Total team: ${totalTeamSize}`);

    const team: TeamMember[] = [];

    // Strategy: Check sequential user IDs after root
    // Most teams register sequentially
    const searchRange = Math.min(totalTeamSize * 2, 100); // Search up to 100 users

    for (let offset = 1; offset <= searchRange && team.length < directTeamSize; offset++) {
        const candidateId = rootUserId + offset;

        try {
            const userInfo = await contract.userInfo(candidateId);

            // Check if this user was referred by root
            if (Number(userInfo.referrer) === rootUserId && userInfo.exists) {
                team.push({
                    userId: candidateId,
                    address: userInfo.account,
                    level: Number(userInfo.level),
                    directTeam: Number(userInfo.directTeam),
                    totalTeam: Number(userInfo.team),
                    registrationTime: new Date(Number(userInfo.registrationTime) * 1000),
                    isDirect: true
                });

                console.log(`   ✓ Found direct member: ${candidateId}`);
            }
        } catch (e) {
            // User doesn't exist, continue
        }
    }

    console.log(`✅ Found ${team.length}/${directTeamSize} direct team members`);
    return team;
}

/**
 * Build complete team tree (all levels)
 * Uses BFS to find all downline members
 */
export async function fetchCompleteTeam(
    rootUserId: number,
    provider: Provider,
    contractAddress: string,
    maxDepth: number = 13
): Promise<Map<number, TeamMember>> {
    console.log(`🌳 Building complete team tree for user ${rootUserId}...`);

    const contract = new ethers.Contract(contractAddress, MAIN_ABI, provider);
    const teamMap = new Map<number, TeamMember>();
    const queue: { userId: number, depth: number }[] = [{ userId: rootUserId, depth: 0 }];
    const visited = new Set<number>();

    while (queue.length > 0) {
        const { userId, depth } = queue.shift()!;

        if (visited.has(userId) || depth > maxDepth) continue;
        visited.add(userId);

        // Get user info
        try {
            const userInfo = await contract.userInfo(userId);
            const teamSize = Number(userInfo.team);

            // Search for this user's team
            const searchRange = Math.min(teamSize * 2, 50);

            for (let offset = 1; offset <= searchRange; offset++) {
                const childId = userId + offset;

                if (visited.has(childId)) continue;

                try {
                    const childInfo = await contract.userInfo(childId);

                    // Is this child under current user?
                    if (Number(childInfo.upline) === userId && childInfo.exists) {
                        const isDirect = Number(childInfo.referrer) === rootUserId;

                        teamMap.set(childId, {
                            userId: childId,
                            address: childInfo.account,
                            level: Number(childInfo.level),
                            directTeam: Number(childInfo.directTeam),
                            totalTeam: Number(childInfo.team),
                            registrationTime: new Date(Number(childInfo.registrationTime) * 1000),
                            isDirect
                        });

                        // Add to queue for next level
                        queue.push({ userId: childId, depth: depth + 1 });
                    }
                } catch (e) {
                    // User doesn't exist
                }
            }
        } catch (e) {
            console.warn(`Failed to query user ${userId}:`, e);
        }
    }

    console.log(`✅ Built team tree with ${teamMap.size} members`);
    return teamMap;
}

/**
 * Build matrix levels from team data
 */
export async function buildMatrixLevels(
    rootUserId: number,
    teamMap: Map<number, TeamMember>
): Promise<MatrixLevel[]> {
    console.log(`📊 Building matrix levels for ${teamMap.size} team members...`);

    const levels: MatrixLevel[] = [];

    // Organize by depth levels
    for (let level = 1; level <= 13; level++) {
        const totalPositions = Math.pow(2, level);
        const positions: MatrixPosition[] = [];
        let filledCount = 0;

        // Get users at this level
        const levelUsers = Array.from(teamMap.values()).slice(0, totalPositions);

        // Fill positions
        for (let i = 0; i < totalPositions; i++) {
            const user = levelUsers[i];

            if (user) {
                positions.push({
                    userId: user.userId,
                    address: user.address,
                    isDirect: user.isDirect,
                    isSpilled: !user.isDirect
                });
                filledCount++;
            } else {
                positions.push({
                    isDirect: false,
                    isSpilled: false
                });
            }
        }

        levels.push({
            level,
            totalPositions,
            filledCount,
            positions
        });

        console.log(`   Level ${level}: ${filledCount}/${totalPositions} filled`);
    }

    console.log(`✅ Matrix built with ${levels.length} levels`);
    return levels;
}

/**
 * Quick matrix fetch (simplified)
 * Just get direct team and show in Level 1
 */
export async function fetchQuickMatrix(
    rootUserId: number,
    provider: Provider,
    contractAddress: string
): Promise<MatrixLevel[]> {
    console.log(`⚡ Quick matrix fetch for user ${rootUserId}...`);

    // Get direct team
    const directTeam = await fetchDirectTeam(rootUserId, provider, contractAddress);

    const levels: MatrixLevel[] = [];

    // Build 13 levels
    for (let level = 1; level <= 13; level++) {
        const totalPositions = Math.pow(2, level);
        const positions: MatrixPosition[] = [];
        let filledCount = 0;

        if (level === 1) {
            // Level 1: Show direct team
            for (let i = 0; i < totalPositions; i++) {
                const member = directTeam[i];

                if (member) {
                    positions.push({
                        userId: member.userId,
                        address: member.address,
                        isDirect: true,
                        isSpilled: false
                    });
                    filledCount++;
                } else {
                    positions.push({ isDirect: false, isSpilled: false });
                }
            }
        } else {
            // Other levels: Show empty for now (or build from complete team if needed)
            for (let i = 0; i < totalPositions; i++) {
                positions.push({ isDirect: false, isSpilled: false });
            }
        }

        levels.push({ level, totalPositions, filledCount, positions });
    }

    console.log(`✅ Quick matrix built - Level 1 shows ${directTeam.length} direct members`);
    return levels;
}
