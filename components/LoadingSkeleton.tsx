export function CardSkeleton() {
    return (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-700 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="animate-pulse">
                <div className="h-8 bg-gray-700 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/3"></div>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>

            {/* Content Section */}
            <div className="space-y-4 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/5"></div>
                <div className="h-32 bg-gray-800 rounded"></div>
                <div className="h-32 bg-gray-800 rounded"></div>
            </div>
        </div>
    );
}

export function TierSkeleton() {
    return (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-700 rounded w-1/3"></div>
                <div className="h-6 bg-gray-700 rounded w-16"></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <div className="h-3 bg-gray-700 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-700 rounded w-24"></div>
                </div>
                <div>
                    <div className="h-3 bg-gray-700 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-700 rounded w-16"></div>
                </div>
                <div>
                    <div className="h-3 bg-gray-700 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-700 rounded w-24"></div>
                </div>
            </div>
        </div>
    );
}

export function PageSkeleton() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <CardSkeleton />
                <CardSkeleton />
            </div>

            <div className="space-y-4">
                <TierSkeleton />
                <TierSkeleton />
                <TierSkeleton />
                <TierSkeleton />
            </div>
        </div>
    );
}
