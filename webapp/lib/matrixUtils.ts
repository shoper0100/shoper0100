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
        const envRpc = process.env.NEXT_PUBLIC_RPC_URL;
        const rpcUrls = envRpc ? [envRpc, ...CONTRACTS.rpcUrls] : CONTRACTS.rpcUrls;

        console.log(`🔌 RPC Configuration:`);
        console.log(`  - Private RPC: ${envRpc ? '✓ Configured' : '✗ Not set'}`);
        console.log(`  - Total endpoints: ${rpcUrls.length}`);
        if (envRpc) {
            console.log(`  - Using: ${envRpc.substring(0, 40)}...`);
        }

        let provider;
        let contract;
        let events = [];

        for (let rpcIdx = 0; rpcIdx < Math.min(3, rpcUrls.length); rpcIdx++) {
            try {
                const rpcUrl = rpcUrls[rpcIdx];
                const rpcName = rpcIdx === 0 && envRpc ? 'Private RPC' : `Public RPC ${rpcIdx + 1}`;

                console.log(`\n🔄 Attempt ${rpcIdx + 1}/${Math.min(3, rpcUrls.length)}: ${rpcName}`);
                console.log(`   URL: ${rpcUrl.substring(0, 40)}...`);

                provider = new ethers.JsonRpcProvider(rpcUrl);
                contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);

                console.log(`   ⏳ Getting current block...`);
                const currentBlock = await provider.getBlockNumber();

                // For Alchemy Free tier: 10 block limit per query!
                // Query in chunks with delay between each chunk
                const CHUNK_SIZE = 10; // Alchemy Free tier limit
                const TOTAL_BLOCKS = 500; // Reduced from 5000 to finish faster
                const fromBlock = Math.max(0, currentBlock - TOTAL_BLOCKS);
                const totalChunks = Math.ceil(TOTAL_BLOCKS / CHUNK_SIZE);

                console.log(`   📦 Total range: ${fromBlock} → ${currentBlock} (${TOTAL_BLOCKS} blocks)`);
                console.log(`   🔍 Querying in ${totalChunks} chunks of ${CHUNK_SIZE} blocks each...`);
                console.log(`   ⚠️  This may take ~${Math.ceil(totalChunks / 2)} seconds (Free tier limits)`);

                const filter = contract.filters.UserRegistered();
                events = [];

                for (let i = 0; i < totalChunks; i++) {
                    const chunkStart = fromBlock + (i * CHUNK_SIZE);
                    const chunkEnd = Math.min(chunkStart + CHUNK_SIZE - 1, currentBlock);

                    try {
                        const chunkEvents = await contract.queryFilter(filter, chunkStart, chunkEnd);
                        events.push(...chunkEvents);

                        if ((i + 1) % 10 === 0 || i === totalChunks - 1) {
                            console.log(`   📊 Progress: ${i + 1}/${totalChunks} chunks (${events.length} events so far)`);
                        }

                        // Rate limiting: 200ms delay between chunks to respect free tier
                        if (i < totalChunks - 1) {
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                    } catch (chunkError: any) {
                        console.warn(`   ⚠️  Chunk ${i + 1} failed: ${chunkError.message}`);
                        // Continue with other chunks
                    }
                }

                console.log(`   ✅ SUCCESS! Fetched ${events.length} events from ${totalChunks} chunks`);
                break;
            } catch (e: any) {
                console.error(`   ❌ FAILED: ${e.message}`);
                console.error(`   Error code: ${e.code || 'unknown'}`);

                if (rpcIdx === Math.min(2, rpcUrls.length - 1)) {
                    console.error(`\n💥 All ${Math.min(3, rpcUrls.length)} RPC endpoints failed`);
                    console.error(`Last error: ${e.message}`);
                    throw new Error(`All RPCs failed - ${e.message}`);
                }

                // Exponential backoff: 500ms, 1000ms, 1500ms
                const delay = (rpcIdx + 1) * 500;
                console.log(`   ⏸️  Waiting ${delay}ms before next attempt...`);
                await new Promise(resolve => setTimeout(resolve, delay));
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
        console.log(`🔍 User IDs in map:`, Array.from(userMap.keys()).sort((a, b) => a - b));

        // Get root user's team
        const rootUser = userMap.get(rootUserId);
        if (!rootUser) {
            console.warn(`⚠️ Root user ${rootUserId} not found in events`);
            return generateEmptyMatrix();
        }

        console.log(`👤 Root user ${rootUserId} loaded:`, rootUser);

        // Build matrix levels (1-13)
        const matrixLevels: MatrixLevel[] = [];

        for (let level = 1; level <= 13; level++) {
            const totalPositions = Math.pow(2, level);
            const positions: MatrixPosition[] = [];
            let filledCount = 0;

            // Find users in this level of root user's downline
            const levelUsers = findUsersAtLevel(rootUserId, level, userMap);

            console.log(`📊 Level ${level}: Found ${levelUsers.length} users (need ${totalPositions} positions)`);
            if (levelUsers.length > 0) {
                console.log(`   User IDs:`, levelUsers.map(u => `${u.userId}(${u.referrer === rootUserId ? 'D' : 'S'})`).join(', '));
            }

            // Fill positions
            for (let i = 0; i < totalPositions; i++) {
                const user = levelUsers[i];
                if (user) {
                    const isDirect = user.referrer === rootUserId;
                    positions.push({
                        userId: user.userId,
                        address: user.address,
                        isDirect: isDirect, // Direct if referred by root
                        isSpilled: !isDirect // Spilled if not direct
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
