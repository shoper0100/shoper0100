'use client';

import { useState } from 'react';

interface MatrixPosition {
    userId?: number;
    isDirect: boolean;
    isSpilled: boolean;
}

interface MatrixLevel {
    level: number;
    totalPositions: number;
    filledCount: number;
    positions: MatrixPosition[];
}

interface HierarchicalMatrixProps {
    levels: MatrixLevel[];
    onRefresh?: () => void;
}

export default function HierarchicalMatrixView({ levels, onRefresh }: HierarchicalMatrixProps) {
    const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set());

    const toggleLevel = (level: number) => {
        setExpandedLevels(prev => {
            const newSet = new Set(prev);
            if (newSet.has(level)) {
                newSet.delete(level);
            } else {
                newSet.add(level);
            }
            return newSet;
        });
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold text-lg">📊 Matrix Hierarchy (13 Levels)</h3>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="text-white/60 hover:text-white text-sm"
                    >
                        🔄 Refresh
                    </button>
                )}
            </div>

            <div className="space-y-1">
                {levels.map((levelData) => {
                    const isExpanded = expandedLevels.has(levelData.level);
                    const hasPositions = levelData.filledCount > 0;

                    return (
                        <div key={levelData.level}>
                            {/* Level Row */}
                            <div
                                onClick={() => hasPositions && toggleLevel(levelData.level)}
                                className={`flex items-center justify-between px-4 py-2 rounded ${hasPositions
                                        ? 'bg-white/10 hover:bg-white/20 cursor-pointer'
                                        : 'bg-white/5'
                                    } transition-colors`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Expand/Collapse Icon */}
                                    {hasPositions && (
                                        <span className="text-white/60 text-sm">
                                            {isExpanded ? '▼' : '▶'}
                                        </span>
                                    )}
                                    {!hasPositions && <span className="w-4"></span>}

                                    {/* Level Number */}
                                    <span className="text-white font-bold w-16">L{levelData.level}</span>

                                    {/* Filled/Total Ratio */}
                                    <span className={`font-bold ${levelData.filledCount > 0 ? 'text-green-400' : 'text-gray-500'
                                        }`}>
                                        {levelData.filledCount}/{levelData.totalPositions}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="flex-1 mx-4 max-w-md">
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all"
                                            style={{
                                                width: `${(levelData.filledCount / levelData.totalPositions) * 100}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Capacity Info */}
                                <span className="text-white/40 text-xs">
                                    {levelData.totalPositions} slots
                                </span>
                            </div>

                            {/* Expanded Position Details */}
                            {isExpanded && hasPositions && (
                                <div className="ml-12 mt-1 mb-2 px-4 py-3 bg-black/30 rounded">
                                    <div className="grid grid-cols-8 md:grid-cols-16 lg:grid-cols-32 gap-1">
                                        {levelData.positions.map((pos, idx) => (
                                            <div
                                                key={idx}
                                                className={`w-6 h-6 rounded flex items-center justify-center text-xs ${pos.userId
                                                        ? pos.isDirect
                                                            ? 'bg-blue-500 text-white' // Direct placement
                                                            : 'bg-green-500 text-white' // Spilled placement
                                                        : 'bg-gray-700 text-gray-400' // Vacant
                                                    }`}
                                                title={
                                                    pos.userId
                                                        ? `User ${pos.userId} - ${pos.isDirect ? 'Direct' : 'Spilled'}`
                                                        : 'Vacant'
                                                }
                                            >
                                                {pos.userId ? '✓' : '○'}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Legend */}
                                    <div className="flex gap-4 mt-3 text-xs text-white/60">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                            <span>Direct</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                                            <span>Spilled</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-gray-700 rounded"></div>
                                            <span>Vacant</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary Stats */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-500/20 rounded p-2">
                    <p className="text-blue-300 text-xs">Total Capacity</p>
                    <p className="text-white font-bold">
                        {levels.reduce((sum, l) => sum + l.totalPositions, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-green-500/20 rounded p-2">
                    <p className="text-green-300 text-xs">Filled Positions</p>
                    <p className="text-white font-bold">
                        {levels.reduce((sum, l) => sum + l.filledCount, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-purple-500/20 rounded p-2">
                    <p className="text-purple-300 text-xs">Fill Rate</p>
                    <p className="text-white font-bold">
                        {(
                            (levels.reduce((sum, l) => sum + l.filledCount, 0) /
                                levels.reduce((sum, l) => sum + l.totalPositions, 0)) * 100
                        ).toFixed(1)}%
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * Helper to generate sample matrix data
 */
export function getSampleMatrixData(): MatrixLevel[] {
    const levels: MatrixLevel[] = [];

    for (let level = 1; level <= 13; level++) {
        const totalPositions = Math.pow(2, level); // 2^level
        const filledCount = Math.floor(Math.random() * totalPositions); // Random for demo

        const positions: MatrixPosition[] = [];
        for (let i = 0; i < totalPositions; i++) {
            if (i < filledCount) {
                positions.push({
                    userId: 36999 + i + 1,
                    isDirect: i < filledCount / 2, // First half direct
                    isSpilled: i >= filledCount / 2 // Second half spilled
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
