{
    activeTab === 'team' && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/20">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">🌳 Binary Matrix - 13 Levels</h2>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg p-3 text-center">
                    <p className="text-white/80 text-xs mb-1">Your Level</p>
                    <p className="text-white font-bold text-2xl">L{userInfo.level}</p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-3 text-center">
                    <p className="text-white/80 text-xs mb-1">Filled Levels</p>
                    <p className="text-white font-bold text-2xl">{userInfo.level}</p>
                </div>
                <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg p-3 text-center">
                    <p className="text-white/80 text-xs mb-1">Vacant Levels</p>
                    <p className="text-white font-bold text-2xl">{13 - userInfo.level}</p>
                </div>
            </div>

            {/* Binary Tree Visualization */}
            <div className="bg-black/30 rounded-xl p-3 overflow-x-auto">
                <div className="min-w-[700px]">
                    {Array.from({ length: 13 }, (_, levelIdx) => {
                        const level = levelIdx + 1;
                        const nodesInLevel = Math.pow(2, levelIdx);
                        const isFilled = level <= userInfo.level;

                        return (
                            <div key={level} className="mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-white text-xs font-bold w-14">L{level}:</span>
                                    <div className="flex gap-1 flex-1">
                                        {Array.from({ length: Math.min(nodesInLevel, 64) }, (_, nodeIdx) => (
                                            <div
                                                key={nodeIdx}
                                                className={`flex-1 h-7 rounded flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${isFilled
                                                        ? 'bg-green-500 text-white hover:bg-green-600'
                                                        : 'bg-gray-700 text-gray-500 border border-dashed border-gray-600'
                                                    }`}
                                                title={isFilled ? `Position ${nodeIdx + 1} - Filled` : `Position ${nodeIdx + 1} - Vacant`}
                                            >
                                                {isFilled ? '✓' : '○'}
                                            </div>
                                        ))}
                                        {nodesInLevel > 64 && <span className="text-gray-500 text-xs">...+{nodesInLevel - 64}</span>}
                                    </div>
                                    <span className="text-gray-400 text-xs w-24 text-right">
                                        {nodesInLevel.toLocaleString()} {isFilled ? '✓' : 'spots'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-white">Filled (✓)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-700 border border-dashed border-gray-600 rounded"></div>
                    <span className="text-white">Vacant (○)</span>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="mt-4 bg-white/5 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
                    <div>
                        <p className="text-gray-400 mb-1">Total Matrix Capacity</p>
                        <p className="text-white font-bold text-lg">{(Math.pow(2, 13) - 1).toLocaleString()} positions</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-400 mb-1">At Your Level (L{userInfo.level})</p>
                        <p className="text-green-400 font-bold text-lg">{userInfo.level > 0 ? (Math.pow(2, userInfo.level) - 1).toLocaleString() : 0} positions</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
