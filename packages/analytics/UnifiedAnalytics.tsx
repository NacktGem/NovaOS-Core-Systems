'use client'
import React, { useState, useEffect } from 'react';

// Simple icon components
const TrendingUp = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const BarChart = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const PieChart = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    </svg>
);

const Activity = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const Users = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
);

const DollarSign = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
);

interface AnalyticsMetric {
    id: string;
    title: string;
    value: string | number;
    change: number;
    changeLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}

interface Platform {
    id: string;
    name: string;
    metrics: AnalyticsMetric[];
    summary: {
        totalUsers: number;
        activeUsers: number;
        revenue?: number;
        engagement: number;
    };
}

interface UnifiedAnalyticsProps {
    platform?: 'novaos' | 'blackrose' | 'gypsycove' | 'all';
    timeRange?: '24h' | '7d' | '30d' | '90d';
    onPlatformChange?: (platform: string) => void;
    onTimeRangeChange?: (range: string) => void;
}

export default function UnifiedAnalytics({
    platform = 'all',
    timeRange = '7d',
    onPlatformChange,
    onTimeRangeChange
}: UnifiedAnalyticsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [analyticsData, setAnalyticsData] = useState<Platform[]>([]);
    const [selectedMetric, setSelectedMetric] = useState<string>('overview');

    // Mock data for demonstration - in production this would come from Velora agent
    const mockPlatforms: Platform[] = [
        {
            id: 'novaos',
            name: 'NovaOS Console',
            metrics: [
                {
                    id: 'active_agents',
                    title: 'Active Agents',
                    value: 7,
                    change: 0,
                    changeLabel: 'stable',
                    icon: Activity,
                    color: 'indigo'
                },
                {
                    id: 'system_health',
                    title: 'System Health',
                    value: '98.5%',
                    change: 2.1,
                    changeLabel: 'improved',
                    icon: TrendingUp,
                    color: 'emerald'
                },
                {
                    id: 'admin_users',
                    title: 'Admin Users',
                    value: 12,
                    change: 1,
                    changeLabel: 'new admin',
                    icon: Users,
                    color: 'purple'
                }
            ],
            summary: {
                totalUsers: 45,
                activeUsers: 23,
                engagement: 85.2
            }
        },
        {
            id: 'blackrose',
            name: 'Black Rose Collective',
            metrics: [
                {
                    id: 'creator_revenue',
                    title: 'Creator Revenue',
                    value: '$12,450',
                    change: 15.3,
                    changeLabel: 'vs last week',
                    icon: DollarSign,
                    color: 'emerald'
                },
                {
                    id: 'active_creators',
                    title: 'Active Creators',
                    value: 156,
                    change: 8,
                    changeLabel: 'new this week',
                    icon: Users,
                    color: 'purple'
                },
                {
                    id: 'content_engagement',
                    title: 'Engagement Rate',
                    value: '76.8%',
                    change: 4.2,
                    changeLabel: 'improvement',
                    icon: TrendingUp,
                    color: 'blue'
                }
            ],
            summary: {
                totalUsers: 1250,
                activeUsers: 892,
                revenue: 12450,
                engagement: 76.8
            }
        },
        {
            id: 'gypsycove',
            name: 'GypsyCove Academy',
            metrics: [
                {
                    id: 'family_members',
                    title: 'Family Members',
                    value: 2847,
                    change: 12,
                    changeLabel: 'new families',
                    icon: Users,
                    color: 'emerald'
                },
                {
                    id: 'lessons_completed',
                    title: 'Lessons Completed',
                    value: 1534,
                    change: 23,
                    changeLabel: 'this week',
                    icon: BarChart,
                    color: 'indigo'
                },
                {
                    id: 'safety_score',
                    title: 'Safety Score',
                    value: '99.2%',
                    change: 0.3,
                    changeLabel: 'maintained',
                    icon: TrendingUp,
                    color: 'emerald'
                }
            ],
            summary: {
                totalUsers: 2847,
                activeUsers: 1923,
                engagement: 89.4
            }
        }
    ];

    useEffect(() => {
        setAnalyticsData(mockPlatforms);
    }, []);

    const filteredPlatforms = platform === 'all'
        ? analyticsData
        : analyticsData.filter(p => p.id === platform);

    const getMetricColorClasses = (color: string) => {
        const colorMap: Record<string, string> = {
            indigo: 'bg-indigo-100 text-indigo-700',
            emerald: 'bg-emerald-100 text-emerald-700',
            purple: 'bg-purple-100 text-purple-700',
            blue: 'bg-blue-100 text-blue-700',
            amber: 'bg-amber-100 text-amber-700'
        };
        return colorMap[color] || colorMap.indigo;
    };

    const aggregateMetrics = () => {
        if (platform !== 'all' || filteredPlatforms.length === 0) return null;

        const totalUsers = filteredPlatforms.reduce((sum, p) => sum + p.summary.totalUsers, 0);
        const activeUsers = filteredPlatforms.reduce((sum, p) => sum + p.summary.activeUsers, 0);
        const totalRevenue = filteredPlatforms.reduce((sum, p) => sum + (p.summary.revenue || 0), 0);
        const avgEngagement = filteredPlatforms.reduce((sum, p) => sum + p.summary.engagement, 0) / filteredPlatforms.length;

        return {
            totalUsers,
            activeUsers,
            totalRevenue,
            avgEngagement,
            activationRate: (activeUsers / totalUsers) * 100
        };
    };

    const globalMetrics = aggregateMetrics();

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Unified Analytics</h2>
                    <p className="text-gray-600">Cross-platform insights powered by Velora</p>
                </div>

                <div className="flex items-center gap-4">
                    <select
                        value={platform}
                        onChange={(e) => onPlatformChange?.(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="all">All Platforms</option>
                        <option value="novaos">NovaOS</option>
                        <option value="blackrose">Black Rose</option>
                        <option value="gypsycove">GypsyCove</option>
                    </select>

                    <select
                        value={timeRange}
                        onChange={(e) => onTimeRangeChange?.(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                    </select>
                </div>
            </div>

            {/* Global Overview (when viewing all platforms) */}
            {platform === 'all' && globalMetrics && (
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white mb-6">
                    <h3 className="text-xl font-bold mb-6">Global Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-indigo-200 text-sm font-medium">Total Users</p>
                            <p className="text-3xl font-bold">{globalMetrics.totalUsers.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-indigo-200 text-sm font-medium">Active Users</p>
                            <p className="text-3xl font-bold">{globalMetrics.activeUsers.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-indigo-200 text-sm font-medium">Total Revenue</p>
                            <p className="text-3xl font-bold">${globalMetrics.totalRevenue.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-indigo-200 text-sm font-medium">Avg Engagement</p>
                            <p className="text-3xl font-bold">{globalMetrics.avgEngagement.toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Platform Metrics */}
            <div className="space-y-8">
                {filteredPlatforms.map(platformData => (
                    <div key={platformData.id} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-800">{platformData.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>{platformData.summary.totalUsers.toLocaleString()} total users</span>
                                <span>{platformData.summary.activeUsers.toLocaleString()} active</span>
                                <span>{platformData.summary.engagement.toFixed(1)}% engagement</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {platformData.metrics.map(metric => {
                                const IconComponent = metric.icon;
                                return (
                                    <div key={metric.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getMetricColorClasses(metric.color)}`}>
                                                <IconComponent className="w-6 h-6" />
                                            </div>
                                            {metric.change !== 0 && (
                                                <div className={`flex items-center gap-1 text-xs font-medium ${metric.change > 0 ? 'text-emerald-600' : 'text-red-600'
                                                    }`}>
                                                    <TrendingUp className={`w-3 h-3 ${metric.change < 0 ? 'transform rotate-180' : ''}`} />
                                                    {Math.abs(metric.change)}%
                                                </div>
                                            )}
                                        </div>

                                        <h4 className="text-sm font-medium text-gray-600 mb-1">{metric.title}</h4>
                                        <p className="text-2xl font-bold text-gray-800 mb-2">{metric.value}</p>
                                        <p className="text-xs text-gray-500">{metric.changeLabel}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Enhanced Metrics Toggle */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Enhanced Analytics</h3>
                    <button
                        onClick={() => setSelectedMetric(selectedMetric === 'overview' ? 'detailed' : 'overview')}
                        className="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
                    >
                        {selectedMetric === 'overview' ? 'View Details' : 'View Overview'}
                    </button>
                </div>

                {selectedMetric === 'detailed' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-4 bg-indigo-50 rounded-2xl">
                            <div className="flex items-center gap-3 mb-3">
                                <PieChart className="w-5 h-5 text-indigo-500" />
                                <h4 className="font-medium text-gray-800">User Distribution</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">NovaOS</span>
                                    <span className="font-medium">45 users</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Black Rose</span>
                                    <span className="font-medium">1,250 users</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">GypsyCove</span>
                                    <span className="font-medium">2,847 users</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-50 rounded-2xl">
                            <div className="flex items-center gap-3 mb-3">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                <h4 className="font-medium text-gray-800">Growth Trends</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Weekly Growth</span>
                                    <span className="font-medium text-emerald-600">+12.3%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Monthly Growth</span>
                                    <span className="font-medium text-emerald-600">+28.7%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Retention Rate</span>
                                    <span className="font-medium">78.5%</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-2xl">
                            <div className="flex items-center gap-3 mb-3">
                                <BarChart className="w-5 h-5 text-purple-500" />
                                <h4 className="font-medium text-gray-800">Platform Health</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">System Uptime</span>
                                    <span className="font-medium text-emerald-600">99.8%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Response Time</span>
                                    <span className="font-medium">45ms</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Error Rate</span>
                                    <span className="font-medium text-emerald-600">0.02%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {selectedMetric === 'overview' && (
                    <p className="text-gray-600 text-center py-8">
                        Cross-platform analytics provide unified insights across NovaOS, Black Rose, and GypsyCove.
                        Click "View Details" for comprehensive metrics.
                    </p>
                )}
            </div>
        </div>
    );
}