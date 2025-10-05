"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CreatorStats {
    totalEarnings: number;
    monthlyEarnings: number;
    weeklyEarnings: number;
    dailyEarnings: number;
    subscribers: number;
    totalContent: number;
    avgRating: number;
    payoutPending: number;
    conversionRate: number;
    viewsToday: number;
    engagementRate: number;
    topEarningContent: string;
}

interface ContentItem {
    id: string;
    title: string;
    type: "photo_set" | "video" | "audio" | "text" | "bundle";
    studio: string;
    price: number;
    purchases: number;
    earnings: number;
    rating: number;
    createdAt: string;
    status: "published" | "draft" | "review" | "rejected";
    views: number;
    likes: number;
    aiOptimizationScore: number;
    suggestedPrice: number;
    trending: boolean;
}

interface RevenueData {
    month: string;
    earnings: number;
    purchases: number;
    subscribers: number;
    views: number;
}

interface AIInsight {
    id: string;
    type: "pricing" | "content" | "timing" | "audience";
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    actionRequired: boolean;
}

const MOCK_CREATOR_DATA = {
    stats: {
        totalEarnings: 12847.50,
        monthlyEarnings: 3456.20,
        weeklyEarnings: 892.15,
        dailyEarnings: 127.45,
        subscribers: 4247,
        totalContent: 67,
        avgRating: 4.8,
        payoutPending: 1234.15,
        conversionRate: 12.5,
        viewsToday: 2341,
        engagementRate: 8.7,
        topEarningContent: "Premium Photo Series #3"
    },
    content: [
        {
            id: "content_001",
            title: "Behind the Scenes Collection",
            type: "photo_set" as const,
            studio: "Rose Studio",
            price: 24.99,
            purchases: 156,
            earnings: 3898.44,
            rating: 4.9,
            createdAt: "2024-01-15",
            status: "published" as const,
            views: 1847,
            likes: 523,
            aiOptimizationScore: 87,
            suggestedPrice: 27.99,
            trending: true
        },
        {
            id: "content_002",
            title: "Exclusive Video Session",
            type: "video" as const,
            studio: "Rose Studio",
            price: 49.99,
            purchases: 89,
            earnings: 4449.11,
            rating: 4.7,
            createdAt: "2024-01-10",
            status: "published" as const,
            views: 934,
            likes: 267,
            aiOptimizationScore: 92,
            suggestedPrice: 54.99,
            trending: true
        }
    ],
    revenue: [
        { month: "Jan", earnings: 3456.20, purchases: 145, subscribers: 87, views: 12450 },
        { month: "Dec", earnings: 2891.30, purchases: 123, subscribers: 67, views: 10234 },
        { month: "Nov", earnings: 3102.45, purchases: 134, subscribers: 73, views: 11567 }
    ],
    aiInsights: [
        {
            id: "insight_001",
            type: "pricing" as const,
            title: "Price Optimization Opportunity",
            description: "Your photo sets are underpriced by 15% compared to similar creators. Consider increasing prices by $3-5.",
            impact: "high" as const,
            actionRequired: true
        },
        {
            id: "insight_002",
            type: "timing" as const,
            title: "Peak Engagement Window",
            description: "Your audience is most active between 8-10 PM EST. Schedule content releases during this time.",
            impact: "medium" as const,
            actionRequired: false
        },
        {
            id: "insight_003",
            type: "content" as const,
            title: "Content Gap Analysis",
            description: "Video content performs 40% better than photos. Consider increasing video production.",
            impact: "high" as const,
            actionRequired: true
        }
    ]
};

export default function CreatorDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [data, setData] = useState(MOCK_CREATOR_DATA);
    const [realTimeStats, setRealTimeStats] = useState(data.stats);

    // Simulate real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            setRealTimeStats(prev => ({
                ...prev,
                dailyEarnings: prev.dailyEarnings + (Math.random() * 5),
                viewsToday: prev.viewsToday + Math.floor(Math.random() * 10),
                subscribers: prev.subscribers + (Math.random() > 0.9 ? 1 : 0)
            }));
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "photo_set": return "📸";
            case "video": return "🎥";
            case "audio": return "🎵";
            case "text": return "📝";
            case "bundle": return "📦";
            default: return "📄";
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "published":
                return <span className="px-2 py-1 rounded text-xs bg-green-900/40 text-green-400">Published</span>;
            case "draft":
                return <span className="px-2 py-1 rounded text-xs bg-yellow-900/40 text-yellow-400">Draft</span>;
            case "review":
                return <span className="px-2 py-1 rounded text-xs bg-blue-900/40 text-blue-400">In Review</span>;
            case "rejected":
                return <span className="px-2 py-1 rounded text-xs bg-red-900/40 text-red-400">Rejected</span>;
            default:
                return null;
        }
    };

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case "high": return "text-red-400 bg-red-900/20";
            case "medium": return "text-yellow-400 bg-yellow-900/20";
            case "low": return "text-green-400 bg-green-900/20";
            default: return "text-gray-400 bg-gray-900/20";
        }
    };

    return (
        <div className="min-h-screen bg-blackRose-trueBlack text-blackRose-fg">
            {/* Navigation */}
            <nav className="border-b border-blackRose-bloodBrown bg-blackRose-midnightNavy/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/blackrose/home" className="text-xl font-bold text-blackRose-roseMauve">
                            📊 Creator Dashboard
                        </Link>
                        <div className="flex gap-4 text-sm">
                            <Link href="/blackrose/home" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">Home</Link>
                            <Link href="/blackrose/creator" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">Studio</Link>
                            <Link href="/blackrose/profile" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">Profile</Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header with Real-time Stats */}
                <div className="mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-blackRose-fg mb-2">Creator Dashboard</h1>
                            <p className="text-blackRose-roseMauve/60">AI-powered insights to maximize your earnings</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-green-400">${realTimeStats.dailyEarnings.toFixed(2)}</div>
                            <div className="text-sm text-blackRose-roseMauve/60">Today's Earnings</div>
                            <div className="text-xs text-blackRose-roseMauve/40 mt-1">🔄 Live Updates</div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-blackRose-midnightNavy/40 border border-blackRose-bloodBrown rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blackRose-roseMauve/60 text-sm">Total Earnings</p>
                                <p className="text-2xl font-bold text-green-400">${realTimeStats.totalEarnings.toLocaleString()}</p>
                                <p className="text-xs text-green-400 mt-1">↗️ +12.5% vs last month</p>
                            </div>
                            <div className="text-3xl">💰</div>
                        </div>
                    </div>

                    <div className="bg-blackRose-midnightNavy/40 border border-blackRose-bloodBrown rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blackRose-roseMauve/60 text-sm">Subscribers</p>
                                <p className="text-2xl font-bold text-blackRose-fg">{Math.floor(realTimeStats.subscribers).toLocaleString()}</p>
                                <p className="text-xs text-green-400 mt-1">↗️ +8.3% growth rate</p>
                            </div>
                            <div className="text-3xl">👥</div>
                        </div>
                    </div>

                    <div className="bg-blackRose-midnightNavy/40 border border-blackRose-bloodBrown rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blackRose-roseMauve/60 text-sm">Conversion Rate</p>
                                <p className="text-2xl font-bold text-blue-400">{realTimeStats.conversionRate}%</p>
                                <p className="text-xs text-yellow-400 mt-1">📊 AI Optimizing</p>
                            </div>
                            <div className="text-3xl">📈</div>
                        </div>
                    </div>

                    <div className="bg-blackRose-midnightNavy/40 border border-blackRose-bloodBrown rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blackRose-roseMauve/60 text-sm">Engagement Rate</p>
                                <p className="text-2xl font-bold text-purple-400">{realTimeStats.engagementRate}%</p>
                                <p className="text-xs text-green-400 mt-1">🎯 Above average</p>
                            </div>
                            <div className="text-3xl">❤️</div>
                        </div>
                    </div>
                </div>

                {/* AI Insights Section */}
                <div className="mb-8 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-700/30 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="text-2xl">🤖</div>
                        <h2 className="text-xl font-bold text-blackRose-fg">AI Revenue Optimizer</h2>
                        <span className="px-2 py-1 text-xs bg-purple-900/40 text-purple-400 rounded">BETA</span>
                    </div>

                    <div className="grid gap-4">
                        {data.aiInsights.map((insight) => (
                            <div key={insight.id} className="bg-blackRose-midnightNavy/40 border border-blackRose-bloodBrown rounded p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-1 rounded text-xs ${getImpactColor(insight.impact)}`}>
                                                {insight.impact.toUpperCase()}
                                            </span>
                                            <h3 className="font-semibold text-blackRose-fg">{insight.title}</h3>
                                        </div>
                                        <p className="text-blackRose-roseMauve/80 text-sm">{insight.description}</p>
                                    </div>
                                    {insight.actionRequired && (
                                        <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors">
                                            Take Action
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 mb-8">
                    {[
                        { id: "overview", name: "Revenue Analytics", icon: "📈" },
                        { id: "content", name: "Content Performance", icon: "📦" },
                        { id: "audience", name: "Audience Insights", icon: "👥" },
                        { id: "optimization", name: "AI Optimization", icon: "🤖" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-t-lg transition-colors ${activeTab === tab.id
                                    ? "bg-blackRose-midnightNavy text-blackRose-roseMauve border-t border-l border-r border-blackRose-bloodBrown"
                                    : "bg-blackRose-midnightNavy/40 text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve"
                                }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-blackRose-midnightNavy/40 border border-blackRose-bloodBrown rounded-lg p-6">
                    {activeTab === "overview" && (
                        <div>
                            <h3 className="text-xl font-bold mb-6">Revenue Analytics</h3>

                            {/* Real-time Revenue Chart Placeholder */}
                            <div className="mb-6 p-6 border border-blackRose-bloodBrown/50 rounded bg-gradient-to-br from-green-900/10 to-blue-900/10">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">📊</div>
                                    <h4 className="text-lg font-semibold mb-2">Real-time Revenue Chart</h4>
                                    <p className="text-blackRose-roseMauve/60 text-sm">Interactive revenue analytics with 7-day, 30-day, and 90-day views</p>
                                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <div className="text-2xl font-bold text-green-400">${realTimeStats.weeklyEarnings.toFixed(2)}</div>
                                            <div className="text-xs text-blackRose-roseMauve/60">This Week</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-blue-400">${realTimeStats.monthlyEarnings.toFixed(2)}</div>
                                            <div className="text-xs text-blackRose-roseMauve/60">This Month</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-purple-400">${realTimeStats.payoutPending.toFixed(2)}</div>
                                            <div className="text-xs text-blackRose-roseMauve/60">Pending Payout</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Revenue Breakdown */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold mb-3 text-blackRose-fg">Revenue Sources</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 bg-blackRose-trueBlack/40 rounded">
                                            <span className="text-blackRose-roseMauve/80">💎 Premium Content</span>
                                            <span className="font-bold text-green-400">$2,847 (82%)</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-blackRose-trueBlack/40 rounded">
                                            <span className="text-blackRose-roseMauve/80">💝 Tips & Gifts</span>
                                            <span className="font-bold text-blue-400">$456 (13%)</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-blackRose-trueBlack/40 rounded">
                                            <span className="text-blackRose-roseMauve/80">📱 Live Sessions</span>
                                            <span className="font-bold text-purple-400">$153 (5%)</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-3 text-blackRose-fg">Performance Metrics</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 bg-blackRose-trueBlack/40 rounded">
                                            <span className="text-blackRose-roseMauve/80">👁️ Views Today</span>
                                            <span className="font-bold text-blackRose-fg">{Math.floor(realTimeStats.viewsToday).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-blackRose-trueBlack/40 rounded">
                                            <span className="text-blackRose-roseMauve/80">⭐ Average Rating</span>
                                            <span className="font-bold text-yellow-400">{realTimeStats.avgRating}/5.0</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-blackRose-trueBlack/40 rounded">
                                            <span className="text-blackRose-roseMauve/80">🏆 Top Content</span>
                                            <span className="font-bold text-blackRose-fg text-sm">{realTimeStats.topEarningContent}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "content" && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Content Performance</h3>
                                <button className="px-4 py-2 bg-blackRose-roseMauve hover:bg-blackRose-roseMauve/80 text-blackRose-trueBlack font-medium rounded transition-colors">
                                    ➕ Upload New Content
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-blackRose-bloodBrown">
                                            <th className="text-left p-3 text-blackRose-roseMauve/80">Content</th>
                                            <th className="text-left p-3 text-blackRose-roseMauve/80">Performance</th>
                                            <th className="text-left p-3 text-blackRose-roseMauve/80">AI Score</th>
                                            <th className="text-left p-3 text-blackRose-roseMauve/80">Revenue</th>
                                            <th className="text-left p-3 text-blackRose-roseMauve/80">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.content.map((item) => (
                                            <tr key={item.id} className="border-b border-blackRose-bloodBrown/30 hover:bg-blackRose-trueBlack/20">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{getTypeIcon(item.type)}</span>
                                                        <div>
                                                            <div className="font-medium text-blackRose-fg">
                                                                {item.title}
                                                                {item.trending && <span className="ml-2 text-orange-400">🔥</span>}
                                                            </div>
                                                            <div className="text-xs text-blackRose-roseMauve/60">{item.studio}</div>
                                                            {getStatusBadge(item.status)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="text-sm">
                                                        <div className="text-blackRose-fg">{item.views.toLocaleString()} views</div>
                                                        <div className="text-blackRose-roseMauve/60">{item.likes} likes • ⭐ {item.rating}</div>
                                                        <div className="text-green-400">{item.purchases} purchases</div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-16 h-2 rounded ${item.aiOptimizationScore >= 90 ? 'bg-green-500' :
                                                                item.aiOptimizationScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}></div>
                                                        <span className="text-xs text-blackRose-roseMauve/80">{item.aiOptimizationScore}/100</span>
                                                    </div>
                                                    {item.suggestedPrice !== item.price && (
                                                        <div className="text-xs text-yellow-400 mt-1">💡 Suggested: ${item.suggestedPrice}</div>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <div className="text-sm">
                                                        <div className="font-bold text-green-400">${item.earnings.toFixed(2)}</div>
                                                        <div className="text-blackRose-roseMauve/60">${item.price} each</div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex gap-1">
                                                        <button className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded">Edit</button>
                                                        <button className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded">Boost</button>
                                                        <button className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded">AI Optimize</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "audience" && (
                        <div>
                            <h3 className="text-xl font-bold mb-6">Audience Insights</h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-blackRose-trueBlack/40 p-6 rounded border border-blackRose-bloodBrown/50">
                                    <h4 className="font-semibold mb-4 text-blackRose-fg">Demographics</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-blackRose-roseMauve/80">🌍 Top Regions</span>
                                            <span className="text-blackRose-fg">US (45%), UK (23%), CA (12%)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blackRose-roseMauve/80">👥 Age Groups</span>
                                            <span className="text-blackRose-fg">25-34 (58%), 35-44 (24%)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blackRose-roseMauve/80">📱 Device Usage</span>
                                            <span className="text-blackRose-fg">Mobile (78%), Desktop (22%)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blackRose-roseMauve/80">⏰ Peak Hours</span>
                                            <span className="text-blackRose-fg">8-10 PM EST</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blackRose-trueBlack/40 p-6 rounded border border-blackRose-bloodBrown/50">
                                    <h4 className="font-semibold mb-4 text-blackRose-fg">Subscriber Behavior</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-blackRose-roseMauve/80">💰 Avg. Spend/Month</span>
                                            <span className="text-green-400 font-bold">$47.30</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blackRose-roseMauve/80">🔄 Retention Rate</span>
                                            <span className="text-blue-400 font-bold">87.3%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blackRose-roseMauve/80">⭐ Satisfaction</span>
                                            <span className="text-yellow-400 font-bold">4.8/5.0</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blackRose-roseMauve/80">🎯 Conversion Rate</span>
                                            <span className="text-purple-400 font-bold">12.5%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Subscriber Growth Chart Placeholder */}
                            <div className="mt-6 p-6 border border-blackRose-bloodBrown/50 rounded bg-gradient-to-br from-blue-900/10 to-purple-900/10">
                                <h4 className="font-semibold mb-4 text-blackRose-fg">Subscriber Growth Trends</h4>
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">📈</div>
                                    <p className="text-blackRose-roseMauve/60">Interactive growth chart showing subscriber acquisition, churn, and engagement patterns</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "optimization" && (
                        <div>
                            <h3 className="text-xl font-bold mb-6">AI Content & Revenue Optimization</h3>

                            <div className="grid gap-6">
                                {/* AI Content Analyzer */}
                                <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-700/30 rounded-lg p-6">
                                    <h4 className="text-lg font-semibold mb-4 text-blackRose-fg flex items-center gap-2">
                                        🎨 Content Quality Analyzer
                                        <span className="px-2 py-1 text-xs bg-purple-900/40 text-purple-400 rounded">AI-POWERED</span>
                                    </h4>
                                    <p className="text-blackRose-roseMauve/80 mb-4">Upload content for AI analysis and optimization suggestions</p>
                                    <div className="flex gap-3">
                                        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors">
                                            📤 Upload for Analysis
                                        </button>
                                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
                                            🤖 Auto-Optimize Existing
                                        </button>
                                    </div>
                                </div>

                                {/* Smart Pricing */}
                                <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/30 rounded-lg p-6">
                                    <h4 className="text-lg font-semibold mb-4 text-blackRose-fg flex items-center gap-2">
                                        💰 Dynamic Pricing Engine
                                        <span className="px-2 py-1 text-xs bg-green-900/40 text-green-400 rounded">BETA</span>
                                    </h4>
                                    <p className="text-blackRose-roseMauve/80 mb-4">AI-driven pricing optimization based on demand, competition, and content quality</p>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="bg-blackRose-trueBlack/40 p-4 rounded">
                                            <div className="text-2xl font-bold text-green-400">+23%</div>
                                            <div className="text-xs text-blackRose-roseMauve/60">Potential Revenue Increase</div>
                                        </div>
                                        <div className="bg-blackRose-trueBlack/40 p-4 rounded">
                                            <div className="text-2xl font-bold text-blue-400">87%</div>
                                            <div className="text-xs text-blackRose-roseMauve/60">Pricing Accuracy</div>
                                        </div>
                                        <div className="bg-blackRose-trueBlack/40 p-4 rounded">
                                            <div className="text-2xl font-bold text-purple-400">12</div>
                                            <div className="text-xs text-blackRose-roseMauve/60">Items Need Repricing</div>
                                        </div>
                                    </div>
                                    <button className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors">
                                        🚀 Apply AI Pricing
                                    </button>
                                </div>

                                {/* Content Scheduler */}
                                <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-700/30 rounded-lg p-6">
                                    <h4 className="text-lg font-semibold mb-4 text-blackRose-fg flex items-center gap-2">
                                        ⏰ Smart Content Scheduler
                                    </h4>
                                    <p className="text-blackRose-roseMauve/80 mb-4">Optimize posting times based on your audience's activity patterns</p>
                                    <div className="text-center py-4 bg-blackRose-trueBlack/40 rounded">
                                        <div className="text-orange-400 font-bold">Next Optimal Post Time</div>
                                        <div className="text-2xl font-bold text-blackRose-fg mt-2">Today 8:30 PM EST</div>
                                        <div className="text-sm text-blackRose-roseMauve/60 mt-1">Expected 2.3x higher engagement</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}