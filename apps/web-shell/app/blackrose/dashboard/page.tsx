"use client";

import { useState } from "react";
import Link from "next/link";

interface CreatorStats {
    totalEarnings: number;
    monthlyEarnings: number;
    subscribers: number;
    totalContent: number;
    avgRating: number;
    payoutPending: number;
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
}

interface RevenueData {
    month: string;
    earnings: number;
    purchases: number;
}

const MOCK_CREATOR_DATA: {
    stats: CreatorStats;
    content: ContentItem[];
    revenue: RevenueData[];
} = {
    stats: {
        totalEarnings: 2847.50,
        monthlyEarnings: 456.20,
        subscribers: 1247,
        totalContent: 23,
        avgRating: 4.7,
        payoutPending: 234.15
    },
    content: [
        {
            id: "content_001",
            title: "Behind the Scenes Collection",
            type: "photo_set",
            studio: "scarlet",
            price: 15.99,
            purchases: 67,
            earnings: 887.49,
            rating: 4.8,
            createdAt: "2025-01-02",
            status: "published"
        },
        {
            id: "content_002",
            title: "Intimate Moments",
            type: "photo_set",
            studio: "scarlet",
            price: 34.99,
            purchases: 23,
            earnings: 612.14,
            rating: 4.9,
            createdAt: "2025-01-10",
            status: "published"
        },
        {
            id: "content_003",
            title: "New Character Reveal",
            type: "video",
            studio: "expression",
            price: 19.99,
            purchases: 0,
            earnings: 0,
            rating: 0,
            createdAt: "2025-01-15",
            status: "draft"
        }
    ],
    revenue: [
        { month: "Dec 2024", earnings: 423.80, purchases: 34 },
        { month: "Jan 2025", earnings: 456.20, purchases: 42 },
    ]
};

export default function CreatorDashboard() {
    const [activeTab, setActiveTab] = useState<"overview" | "content" | "analytics" | "payouts">("overview");
    const [creatorData] = useState(MOCK_CREATOR_DATA);

    const getContentIcon = (type: string) => {
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
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-blackRose-fg mb-2">Creator Dashboard</h1>
                    <p className="text-blackRose-roseMauve/60">Manage your content, track earnings, and grow your audience</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 mb-8">
                    {[
                        { id: "overview", name: "Overview", icon: "📈" },
                        { id: "content", name: "Content", icon: "📦" },
                        { id: "analytics", name: "Analytics", icon: "📊" },
                        { id: "payouts", name: "Payouts", icon: "💰" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${activeTab === tab.id
                                    ? "bg-blackRose-roseMauve text-blackRose-trueBlack"
                                    : "border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 text-blackRose-roseMauve hover:bg-blackRose-midnightNavy/60"
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === "overview" && (
                    <div className="space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">💰</div>
                                    <div>
                                        <p className="text-sm text-blackRose-roseMauve/60">Total Earnings</p>
                                        <p className="text-2xl font-bold text-blackRose-fg">${creatorData.stats.totalEarnings.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">📈</div>
                                    <div>
                                        <p className="text-sm text-blackRose-roseMauve/60">This Month</p>
                                        <p className="text-2xl font-bold text-blackRose-fg">${creatorData.stats.monthlyEarnings.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">👥</div>
                                    <div>
                                        <p className="text-sm text-blackRose-roseMauve/60">Subscribers</p>
                                        <p className="text-2xl font-bold text-blackRose-fg">{creatorData.stats.subscribers.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">📦</div>
                                    <div>
                                        <p className="text-sm text-blackRose-roseMauve/60">Total Content</p>
                                        <p className="text-2xl font-bold text-blackRose-fg">{creatorData.stats.totalContent}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">⭐</div>
                                    <div>
                                        <p className="text-sm text-blackRose-roseMauve/60">Avg Rating</p>
                                        <p className="text-2xl font-bold text-blackRose-fg">{creatorData.stats.avgRating.toFixed(1)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">🏦</div>
                                    <div>
                                        <p className="text-sm text-blackRose-roseMauve/60">Pending Payout</p>
                                        <p className="text-2xl font-bold text-blackRose-fg">${creatorData.stats.payoutPending.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                            <h3 className="text-xl font-semibold text-blackRose-fg mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Link
                                    href="/blackrose/creator/upload"
                                    className="p-4 rounded-xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/60 hover:border-blackRose-roseMauve/50 hover:bg-blackRose-midnightNavy/80 text-center group"
                                >
                                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📸</div>
                                    <p className="font-medium text-blackRose-fg">Upload Content</p>
                                    <p className="text-xs text-blackRose-roseMauve/60">Add new photos/videos</p>
                                </Link>
                                <Link
                                    href="/blackrose/creator/pricing"
                                    className="p-4 rounded-xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/60 hover:border-blackRose-roseMauve/50 hover:bg-blackRose-midnightNavy/80 text-center group"
                                >
                                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">💰</div>
                                    <p className="font-medium text-blackRose-fg">Set Pricing</p>
                                    <p className="text-xs text-blackRose-roseMauve/60">Manage content prices</p>
                                </Link>
                                <Link
                                    href="/blackrose/creator/promote"
                                    className="p-4 rounded-xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/60 hover:border-blackRose-roseMauve/50 hover:bg-blackRose-midnightNavy/80 text-center group"
                                >
                                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📢</div>
                                    <p className="font-medium text-blackRose-fg">Promote</p>
                                    <p className="text-xs text-blackRose-roseMauve/60">Boost your content</p>
                                </Link>
                                <Link
                                    href="/blackrose/inbox"
                                    className="p-4 rounded-xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/60 hover:border-blackRose-roseMauve/50 hover:bg-blackRose-midnightNavy/80 text-center group"
                                >
                                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">💬</div>
                                    <p className="font-medium text-blackRose-fg">Messages</p>
                                    <p className="text-xs text-blackRose-roseMauve/60">Chat with fans</p>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "content" && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-semibold text-blackRose-fg">Your Content</h2>
                            <Link
                                href="/blackrose/creator/upload"
                                className="px-4 py-2 rounded-xl bg-blackRose-roseMauve text-blackRose-trueBlack font-medium hover:bg-blackRose-roseMauve/90"
                            >
                                Upload New Content
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {creatorData.content.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="text-3xl">{getContentIcon(item.type)}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-blackRose-fg">{item.title}</h3>
                                                    {getStatusBadge(item.status)}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-blackRose-roseMauve/60">
                                                    <span>{item.studio}</span>
                                                    <span>•</span>
                                                    <span>${item.price}</span>
                                                    <span>•</span>
                                                    <span>{item.purchases} purchases</span>
                                                    <span>•</span>
                                                    <span>${item.earnings.toFixed(2)} earned</span>
                                                    {item.rating > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span>⭐ {item.rating.toFixed(1)}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="px-3 py-1 rounded-lg border border-blackRose-bloodBrown bg-blackRose-midnightNavy/60 text-blackRose-roseMauve hover:bg-blackRose-midnightNavy/80 text-sm">
                                                Edit
                                            </button>
                                            <button className="px-3 py-1 rounded-lg border border-blackRose-bloodBrown bg-blackRose-midnightNavy/60 text-blackRose-roseMauve hover:bg-blackRose-midnightNavy/80 text-sm">
                                                View
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "analytics" && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold text-blackRose-fg">Analytics & Insights</h2>

                        <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                            <h3 className="text-lg font-semibold text-blackRose-fg mb-4">Revenue Over Time</h3>
                            <div className="space-y-4">
                                {creatorData.revenue.map((data, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-blackRose-trueBlack/40">
                                        <div>
                                            <p className="font-medium text-blackRose-fg">{data.month}</p>
                                            <p className="text-sm text-blackRose-roseMauve/60">{data.purchases} purchases</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-blackRose-roseMauve">${data.earnings.toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                                <h3 className="text-lg font-semibold text-blackRose-fg mb-4">Top Performing Content</h3>
                                <div className="space-y-3">
                                    {creatorData.content
                                        .filter(item => item.status === "published")
                                        .sort((a, b) => b.earnings - a.earnings)
                                        .slice(0, 3)
                                        .map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-blackRose-trueBlack/40">
                                                <div className="flex items-center gap-2">
                                                    <span>{getContentIcon(item.type)}</span>
                                                    <span className="text-sm text-blackRose-fg">{item.title}</span>
                                                </div>
                                                <span className="text-sm font-bold text-blackRose-roseMauve">${item.earnings.toFixed(2)}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                                <h3 className="text-lg font-semibold text-blackRose-fg mb-4">Studio Performance</h3>
                                <div className="space-y-3">
                                    {["scarlet", "expression", "lightbox"].map((studio) => {
                                        const studioEarnings = creatorData.content
                                            .filter(item => item.studio === studio)
                                            .reduce((sum, item) => sum + item.earnings, 0);

                                        return (
                                            <div key={studio} className="flex items-center justify-between p-3 rounded-lg bg-blackRose-trueBlack/40">
                                                <span className="text-sm text-blackRose-fg capitalize">{studio.replace("_", " ")}</span>
                                                <span className="text-sm font-bold text-blackRose-roseMauve">${studioEarnings.toFixed(2)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "payouts" && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold text-blackRose-fg">Payouts & Earnings</h2>

                        <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-blackRose-fg">Pending Payout</h3>
                                    <p className="text-sm text-blackRose-roseMauve/60">Minimum payout: $50.00</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-blackRose-roseMauve">${creatorData.stats.payoutPending.toFixed(2)}</p>
                                    <button
                                        disabled={creatorData.stats.payoutPending < 50}
                                        className={`mt-2 px-4 py-2 rounded-xl font-medium ${creatorData.stats.payoutPending >= 50
                                                ? "bg-blackRose-roseMauve text-blackRose-trueBlack hover:bg-blackRose-roseMauve/90"
                                                : "bg-blackRose-bloodBrown/40 text-blackRose-roseMauve/40 cursor-not-allowed"
                                            }`}
                                    >
                                        Request Payout
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-blackRose-trueBlack/40">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-blackRose-roseMauve/60">Platform Fee (12%)</span>
                                    <span className="text-blackRose-fg">-${(creatorData.stats.payoutPending * 0.12).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span className="text-blackRose-fg">You Receive</span>
                                    <span className="text-blackRose-roseMauve">${(creatorData.stats.payoutPending * 0.88).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                            <h3 className="text-lg font-semibold text-blackRose-fg mb-4">Payout History</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-blackRose-trueBlack/40">
                                    <div>
                                        <p className="font-medium text-blackRose-fg">December 2024</p>
                                        <p className="text-sm text-blackRose-roseMauve/60">Paid via bank transfer</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-400">$372.94</p>
                                        <p className="text-xs text-blackRose-roseMauve/60">Completed</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-blackRose-trueBlack/40">
                                    <div>
                                        <p className="font-medium text-blackRose-fg">November 2024</p>
                                        <p className="text-sm text-blackRose-roseMauve/60">Paid via bank transfer</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-400">$289.76</p>
                                        <p className="text-xs text-blackRose-roseMauve/60">Completed</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}