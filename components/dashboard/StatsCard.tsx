'use client';

interface StatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    trend?: {
        value: string;
        isPositive: boolean;
    };
}

export default function StatsCard({ title, value, subtitle, icon, trend }: StatsCardProps) {
    return (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <p className="text-gray-400 text-sm font-medium">{title}</p>
                    <h3 className="text-white text-2xl font-bold mt-1">{value}</h3>
                    {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
                </div>
                {icon && (
                    <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center text-blue-500">
                        {icon}
                    </div>
                )}
            </div>
            {trend && (
                <div className="flex items-center gap-1">
                    <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {trend.isPositive ? '↑' : '↓'} {trend.value}
                    </span>
                    <span className="text-gray-500 text-xs">vs last period</span>
                </div>
            )}
        </div>
    );
}
