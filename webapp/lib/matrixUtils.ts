// Matrix Data Fetching from Contract Events
import { ethers } from 'ethers';
import { CONTRACTS, MAIN_ABI } from './contracts';

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
 * Fetch matrix hierarchy from contract events
 * @param rootUserId - User ID to build matrix for
 * @returns Promise<MatrixLevel[]>
 */
export async function fetchMatrixFromContract(rootUserId: number): Promise<MatrixLevel[]> {
    try {
        console.log(`📊 Fetching matrix data for user ${rootUserId}...`);

        // Use private RPC from env if available, otherwise fallback to public RPCs
        const rpcUrls = process.env.NEXT_PUBLIC_RPC_URL
            ? [process.env.NEXT_PUBLIC_RPC_URL, ...CONTRACTS.rpcUrls]
            : CONTRACTS.rpcUrls;

        console.log(`🔌 Using ${rpcUrls.length} RPC endpoint(s) for queries`);

        let provider;
        let contract;
        let events = [];

        for (let rpcIdx = 0; rpcIdx < Math.min(3, rpcUrls.length); rpcIdx++) {
            try {
                const rpcUrl = rpcUrls[rpcIdx];
                console.log(`Trying RPC ${rpcIdx + 1}/${Math.min(3, rpcUrls.length)}...`);
                provider = new ethers.JsonRpcProvider(rpcUrl);
                contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);

                const currentBlock = await provider.getBlockNumber();
                const fromBlock = Math.max(0, currentBlock - 10000); // Last 10k blocks only

                const filter = contract.filters.UserRegistered();
                console.log(`🔍 Querying events from block ${fromBlock} to ${currentBlock}...`);

                events = await contract.queryFilter(filter, fromBlock, currentBlock);
                console.log(`✅ Fetched ${events.length} events successfully!`);
                break;
            } catch (e: any) {
                console.warn(`⚠️ RPC ${rpcIdx + 1} failed:`, e.message);
                if (rpcIdx === Math.min(2, rpcUrls.length - 1)) {
                    console.error('❌ All RPC endpoints failed');
                    throw new Error(`All RPCs failed - last error: ${e.message}`);
                }
                await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay
            }
        }

        // Build user mapping with level info
        const userMap = new Map<number, any>();

        for (const event of events) {
            const userId = Number(event.args?.userId);
            if (!userId) continue;

            try {
                const userInfo = await contract.userInfo(userId);
                userMap.set(userId, {
                    userId,
                    address: userInfo.account,
                    referrer: Number(userInfo.referrer),
                    upline: Number(userInfo.upline),
                    level: Number(userInfo.level)
                });
            } catch (e) {
                console.warn(`⚠️ Failed to fetch user ${userId}:`, e);
            }
        }

        console.log(`✅ Built user map with ${userMap.size} users`);

        // Get root user's team
        const rootUser = userMap.get(rootUserId);
        if (!rootUser) {
            console.warn(`⚠️ Root user ${rootUserId} not found in events`);
            return generateEmptyMatrix();
        }

        // Build matrix levels (1-13)
        const matrixLevels: MatrixLevel[] = [];

        for (let level = 1; level <= 13; level++) {
            const totalPositions = Math.pow(2, level);
            const positions: MatrixPosition[] = [];
            let filledCount = 0;

            // Find users in this level of root user's downline
            const levelUsers = findUsersAtLevel(rootUserId, level, userMap);

            // Fill positions
            for (let i = 0; i < totalPositions; i++) {
                const user = levelUsers[i];
                if (user) {
                    positions.push({
                        userId: user.userId,
                        address: user.address,
                        isDirect: user.referrer === rootUserId, // Direct if referred by root
                        isSpilled: user.referrer !== rootUserId // Spilled if not direct
                    });
                    filledCount++;
                } else {
                    positions.push({
                        isDirect: false,
                        isSpilled: false
                    });
                }
            }

            matrixLevels.push({
                level,
                totalPositions,
                filledCount,
                positions
            });
        }

        console.log(`✅ Matrix built with ${matrixLevels.length} levels`);
        return matrixLevels;

    } catch (error) {
        console.error('❌ Failed to fetch matrix from contract:', error);
        return generateEmptyMatrix();
    }
}

/**
 * Find users at specific depth level in downline
 */
function findUsersAtLevel(
    rootUserId: number,
    targetLevel: number,
    userMap: Map<number, any>
): any[] {
    const result: any[] = [];
    const visited = new Set<number>();

    // BFS to find users at specific depth
    const queue: { userId: number, depth: number }[] = [{ userId: rootUserId, depth: 0 }];

    while (queue.length > 0) {
        const { userId, depth } = queue.shift()!;

        if (visited.has(userId)) continue;
        visited.add(userId);

        // Find children of this user
        for (const [childId, childData] of userMap.entries()) {
            if (childData.upline === userId && !visited.has(childId)) {
                if (depth + 1 === targetLevel) {
                    result.push(childData);
                } else if (depth + 1 < targetLevel) {
                    queue.push({ userId: childId, depth: depth + 1 });
                }
            }
        }
    }

    return result;
}

/**
 * Generate empty matrix (fallback)
 */
function generateEmptyMatrix(): MatrixLevel[] {
    const levels: MatrixLevel[] = [];

    for (let level = 1; level <= 13; level++) {
        const totalPositions = Math.pow(2, level);
        const positions: MatrixPosition[] = [];

        for (let i = 0; i < totalPositions; i++) {
            positions.push({
                isDirect: false,
                isSpilled: false
            });
        }

        levels.push({
            level,
            totalPositions,
            filledCount: 0,
            positions
        });
    }

    return levels;
}

/**
 * Get sample matrix data (for testing)
 */
export function getSampleMatrixData(): MatrixLevel[] {
    const levels: MatrixLevel[] = [];

    for (let level = 1; level <= 13; level++) {
        const totalPositions = Math.pow(2, level);
        // Simulate some filled positions
        const filledCount = Math.floor(Math.random() * Math.min(totalPositions, 50));

        const positions: MatrixPosition[] = [];
        for (let i = 0; i < totalPositions; i++) {
            if (i < filledCount) {
                positions.push({
                    userId: 36999 + i + 1,
                    address: `0x${i.toString(16).padStart(40, '0')}`,
                    isDirect: i < filledCount / 2,
                    isSpilled: i >= filledCount / 2
                });
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
    }

    return levels;
}
