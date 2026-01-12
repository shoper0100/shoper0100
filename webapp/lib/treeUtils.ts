// Binary Tree Data Fetching Utilities
import { ethers } from 'ethers';
import { CONTRACTS, MAIN_ABI } from './contracts';

interface TreeNode {
    userId: number;
    address: string;
    level: number;
    leftTeam: number;
    rightTeam: number;
    positionLeft: number;
    positionRight: number;
    matrixQualified: boolean;
    leftChild?: TreeNode | null;
    rightChild?: TreeNode | null;
}

/**
 * Fetch binary tree structure from smart contract events
 * @param rootUserId - The user ID to build tree from
 * @param maxDepth - Maximum depth to fetch (default 3 levels)
 * @returns Promise<TreeNode | null>
 */
export async function fetchBinaryTreeFromContract(
    rootUserId: number,
    maxDepth: number = 3
): Promise<TreeNode | null> {
    try {
        console.log(`\ud83c\udf33 Fetching binary tree for user ${rootUserId} (max depth: ${maxDepth})`);

        const provider = new ethers.JsonRpcProvider(CONTRACTS.rpcUrls[0]);
        const contract = new ethers.Contract(CONTRACTS.MAIN, MAIN_ABI, provider);

        // Query all UserRegistered events from blockchain
        const filter = contract.filters.UserRegistered();
        console.log('\ud83d\udd0d Querying UserRegistered events from blockchain...');

        const events = await contract.queryFilter(filter, 0, 'latest');
        console.log(`\u2705 Found ${events.length} registration events`);

        // Build children mapping from upline relationships
        const childrenMap = new Map<number, number[]>();

        console.log('\ud83d\udee0\ufe0f Building children mapping...');
        for (const event of events) {
            const userId = Number(event.args?.userId);

            if (!userId) continue;

            try {
                const userInfo = await contract.userInfo(userId);
                const uplineId = Number(userInfo.upline);

                if (uplineId > 0) {
                    if (!childrenMap.has(uplineId)) {
                        childrenMap.set(uplineId, []);
                    }
                    const children = childrenMap.get(uplineId)!;
                    // Binary tree - max 2 children (left and right)
                    if (children.length < 2) {
                        children.push(userId);
                    }
                }
            } catch (e) {
                console.warn(`\u26a0\ufe0f Failed to get info for user ${userId}:`, e);
            }
        }

        console.log(`\u2705 Children mapping built: ${childrenMap.size} parents found`);
        console.log(`\ud83d\udcc4 Root user ${rootUserId} has children:`, childrenMap.get(rootUserId) || 'None');

        // Build tree recursively
        const tree = await buildTreeNode(rootUserId, childrenMap, contract, 0, maxDepth);

        console.log(`\u2705 Binary tree built successfully!`);
        return tree;

    } catch (error) {
        console.error('\u274c Failed to fetch binary tree from contract:', error);
        return null;
    }
}

/**
 * Recursively build tree node from contract data
 */
async function buildTreeNode(
    userId: number,
    childrenMap: Map<number, number[]>,
    contract: any,
    currentDepth: number,
    maxDepth: number
): Promise<TreeNode> {
    // Get user info from contract
    const userInfo = await contract.userInfo(userId);

    // Stop recursion at max depth
    if (currentDepth >= maxDepth) {
        return {
            userId,
            address: userInfo.account,
            level: Number(userInfo.level),
            leftTeam: 0,
            rightTeam: 0,
            positionLeft: Number(userInfo.directTeam),
            positionRight: 0,
            matrixQualified: Number(userInfo.level) >= 10,
            leftChild: null,
            rightChild: null
        };
    }

    const children = childrenMap.get(userId) || [];

    // Recursively build left and right children
    const leftChild = children[0]
        ? await buildTreeNode(children[0], childrenMap, contract, currentDepth + 1, maxDepth)
        : null;

    const rightChild = children[1]
        ? await buildTreeNode(children[1], childrenMap, contract, currentDepth + 1, maxDepth)
        : null;

    return {
        userId,
        address: userInfo.account,
        level: Number(userInfo.level),
        leftTeam: Math.floor(Number(userInfo.team) / 2),
        rightTeam: Math.ceil(Number(userInfo.team) / 2),
        positionLeft: Number(userInfo.directTeam),
        positionRight: 0,
        matrixQualified: Number(userInfo.level) >= 10,
        leftChild,
        rightChild
    };
}

/**
 * Get sample tree data (fallback)
 */
export function getSampleTree(rootUserId: number): TreeNode {
    return {
        userId: rootUserId,
        address: CONTRACTS.ROOT_ADDRESS,
        level: 2,
        leftTeam: 10,
        rightTeam: 8,
        positionLeft: 5,
        positionRight: 3,
        matrixQualified: false,
        leftChild: {
            userId: 37000,
            address: '0x0000000000000000000000000000000000000001',
            level: 3,
            leftTeam: 5,
            rightTeam: 3,
            positionLeft: 2,
            positionRight: 1,
            matrixQualified: false,
            leftChild: null,
            rightChild: null
        },
        rightChild: {
            userId: 37001,
            address: '0x0000000000000000000000000000000000000002',
            level: 5,
            leftTeam: 10,
            rightTeam: 8,
            positionLeft: 4,
            positionRight: 3,
            matrixQualified: true,
            leftChild: null,
            rightChild: null
        }
    };
}
