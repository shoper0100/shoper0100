'use client';

import { useState } from 'react';

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

interface BinaryTreeViewProps {
    rootNode: TreeNode;
    onViewTeam?: (userId: number) => void;
}

export default function BinaryTreeView({ rootNode, onViewTeam }: BinaryTreeViewProps) {
    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([rootNode.userId]));

    const toggleExpand = (userId: number) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const isExpanded = (userId: number) => expandedNodes.has(userId);

    return (
        <div className="w-full overflow-x-auto pb-8">
            <div className="min-w-max px-4">
                <h2 className="text-2xl font-bold text-white mb-2">Your Binary Network</h2>
                <p className="text-gray-300 text-sm mb-6">Visual representation of your team structure (unlimited depth, collapsible)</p>
                <div className="flex justify-center">
                    <TreeNodeCard
                        node={rootNode}
                        position="root"
                        isExpanded={isExpanded(rootNode.userId)}
                        onToggleExpand={() => toggleExpand(rootNode.userId)}
                        onViewTeam={onViewTeam}
                        expandedNodes={expandedNodes}
                        toggleExpand={toggleExpand}
                    />
                </div>
            </div>
        </div>
    );
}

interface TreeNodeCardProps {
    node: TreeNode;
    position: 'left' | 'right' | 'root';
    isExpanded: boolean;
    onToggleExpand: () => void;
    onViewTeam?: (userId: number) => void;
    expandedNodes: Set<number>;
    toggleExpand: (userId: number) => void;
}

function TreeNodeCard({
    node,
    position,
    isExpanded,
    onToggleExpand,
    onViewTeam,
    expandedNodes,
    toggleExpand
}: TreeNodeCardProps) {
    const hasChildren = node.leftChild || node.rightChild;

    return (
        <div className="flex flex-col items-center">
            {/* User Card */}
            <div className="bg-white rounded-lg border-2 border-gray-200 shadow-lg p-4 w-72 mb-4">
                {/* User ID with refresh icon */}
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-sm">✓</span>
                        </div>
                        <div>
                            <p className="text-gray-900 font-bold">{node.userId}</p>
                        </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                        <p className="text-xs text-gray-500">L: <span className="text-blue-600 font-semibold">{node.leftTeam}</span></p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">R: <span className="text-orange-600 font-semibold">{node.rightTeam}</span></p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">PL: <span className="text-blue-600 font-semibold">{node.positionLeft}</span></p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">PR: <span className="text-orange-600 font-semibold">{node.positionRight}</span></p>
                    </div>
                </div>

                {/* Matrix Qualification Badge */}
                <div className="mb-3">
                    {node.matrixQualified ? (
                        <div className="bg-green-500 text-white text-xs font-bold py-1 px-2 rounded text-center">
                            ✓ Qualified
                        </div>
                    ) : (
                        <p className="text-gray-600 text-xs text-center">Not Qualified</p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                    {hasChildren && (
                        <button
                            onClick={onToggleExpand}
                            className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                            </svg>
                            {isExpanded ? 'Collapse' : 'Expand'}
                        </button>
                    )}
                    <button
                        onClick={() => onViewTeam?.(node.userId)}
                        className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        View Team
                    </button>
                </div>
            </div>

            {/* Children - Only show if expanded */}
            {isExpanded && hasChildren && (
                <div className="flex gap-8 items-start relative">
                    {/* Connection line */}
                    <div className="absolute top-0 left-1/2 w-px h-8 bg-gray-300 -translate-x-1/2 -translate-y-4"></div>

                    {/* Left Label */}
                    <div className="absolute -top-2 left-1/4 -translate-x-1/2">
                        <span className="text-xs text-blue-500 font-semibold bg-white px-2 py-1 rounded border border-blue-200">Left</span>
                    </div>

                    {/* Right Label */}
                    <div className="absolute -top-2 right-1/4 translate-x-1/2">
                        <span className="text-xs text-orange-500 font-semibold bg-white px-2 py-1 rounded border border-orange-200">Right</span>
                    </div>

                    {/* Left Child */}
                    <div className="flex-1 flex justify-center relative">
                        {/* Connection line down */}
                        <div className="absolute top-0 left-1/2 w-px h-8 bg-gray-300 -translate-x-1/2"></div>
                        {node.leftChild ? (
                            <TreeNodeCard
                                node={node.leftChild}
                                position="left"
                                isExpanded={expandedNodes.has(node.leftChild.userId)}
                                onToggleExpand={() => toggleExpand(node.leftChild!.userId)}
                                onViewTeam={onViewTeam}
                                expandedNodes={expandedNodes}
                                toggleExpand={toggleExpand}
                            />
                        ) : (
                            <EmptySpot position="left" />
                        )}
                    </div>

                    {/* Right Child */}
                    <div className="flex-1 flex justify-center relative">
                        {/* Connection line down */}
                        <div className="absolute top-0 left-1/2 w-px h-8 bg-gray-300 -translate-x-1/2"></div>
                        {node.rightChild ? (
                            <TreeNodeCard
                                node={node.rightChild}
                                position="right"
                                isExpanded={expandedNodes.has(node.rightChild.userId)}
                                onToggleExpand={() => toggleExpand(node.rightChild!.userId)}
                                onViewTeam={onViewTeam}
                                expandedNodes={expandedNodes}
                                toggleExpand={toggleExpand}
                            />
                        ) : (
                            <EmptySpot position="right" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function EmptySpot({ position }: { position: 'left' | 'right' }) {
    return (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 w-72 mb-4 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Empty Spot</p>
        </div>
    );
}
