import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, FileText, Package, DollarSign,
    Clock, CheckCircle, AlertCircle, BarChart3, Zap, Crown
} from 'lucide-react';

interface ScheduledPost {
    id: string;
    creator_id: string;
    creator_username: string;
    title: string;
    content: string;
    post_type: 'home' | 'explore' | 'vault';
    price?: number;
    scheduled_for: string;
    status: 'pending' | 'published' | 'failed' | 'cancelled';
    created_at: string;
}

interface VaultBundle {
    id: string;
    creator_id: string;
    creator_username: string;
    title: string;
    description: string;
    content_count: number;
    bundle_price: number;
    original_price: number;
    discount_percent: number;
    purchase_count: number;
    revenue_cents: number;
    is_active: boolean;
    expires_at?: string;
    created_at: string;
}

interface ProductivityStats {
    total_scheduled_posts: number;
    scheduled_posts_pending: number;
    total_drafts: number;
    active_bundles: number;
    bundle_revenue_cents: number;
    bundle_purchases_count: number;
    avg_bundle_discount_percent: number;
    top_performing_bundles: VaultBundle[];
}

interface GodModeCreatorProductivityProps {
    className?: string;
}

const GodModeCreatorProductivity: React.FC<GodModeCreatorProductivityProps> = ({ className = "" }) => {
    const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
    const [bundles, setBundles] = useState<VaultBundle[]>([]);
    const [stats, setStats] = useState<ProductivityStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'scheduled' | 'drafts' | 'bundles' | 'analytics'>('overview');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Mock API calls - replace with actual endpoints
            const mockScheduledPosts: ScheduledPost[] = [
                {
                    id: '1',
                    creator_id: 'creator_1',
                    creator_username: 'velora',
                    title: 'New Photoshoot Preview',
                    content: 'Sneak peek at my latest artistic work...',
                    post_type: 'vault',
                    price: 15.99,
                    scheduled_for: '2025-01-20T18:00:00Z',
                    status: 'pending',
                    created_at: '2025-01-18T10:30:00Z'
                },
                {
                    id: '2',
                    creator_id: 'creator_2',
                    creator_username: 'echo_dev',
                    title: 'Tutorial Release',
                    content: 'Advanced React patterns tutorial dropping soon!',
                    post_type: 'explore',
                    scheduled_for: '2025-01-19T15:00:00Z',
                    status: 'pending',
                    created_at: '2025-01-18T09:15:00Z'
                }
            ];

            const mockBundles: VaultBundle[] = [
                {
                    id: '1',
                    creator_id: 'creator_1',
                    creator_username: 'velora',
                    title: 'Ultimate Collection',
                    description: 'Complete Velora premium bundle',
                    content_count: 47,
                    bundle_price: 89.99,
                    original_price: 145.99,
                    discount_percent: 38,
                    purchase_count: 89,
                    revenue_cents: 800911, // $8,009.11
                    is_active: true,
                    expires_at: '2025-02-01T00:00:00Z',
                    created_at: '2025-01-12T10:00:00Z'
                },
                {
                    id: '2',
                    creator_id: 'creator_2',
                    creator_username: 'echo_dev',
                    title: 'Advanced Web Dev Bundle',
                    description: 'Master advanced concepts',
                    content_count: 15,
                    bundle_price: 59.99,
                    original_price: 89.99,
                    discount_percent: 33,
                    purchase_count: 234,
                    revenue_cents: 1403766, // $14,037.66
                    is_active: true,
                    expires_at: '2025-01-25T00:00:00Z',
                    created_at: '2025-01-05T09:30:00Z'
                }
            ];

            const mockStats: ProductivityStats = {
                total_scheduled_posts: 47,
                scheduled_posts_pending: 12,
                total_drafts: 89,
                active_bundles: 23,
                bundle_revenue_cents: 2204677, // $22,046.77
                bundle_purchases_count: 456,
                avg_bundle_discount_percent: 35,
                top_performing_bundles: mockBundles
            };

            setScheduledPosts(mockScheduledPosts);
            setBundles(mockBundles);
            setStats(mockStats);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="h-4 w-4 text-yellow-400" />;
            case 'published': return <CheckCircle className="h-4 w-4 text-green-400" />;
            case 'failed': return <AlertCircle className="h-4 w-4 text-red-400" />;
            case 'cancelled': return <AlertCircle className="h-4 w-4 text-gray-400" />;
            default: return <Clock className="h-4 w-4 text-gray-400" />;
        }
    };

    const getPostTypeColor = (type: string) => {
        switch (type) {
            case 'home': return 'bg-blue-500/20 text-blue-400 border-blue-500';
            case 'explore': return 'bg-green-500/20 text-green-400 border-green-500';
            case 'vault': return 'bg-purple-500/20 text-purple-400 border-purple-500';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
        }
    };

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blackRose-midnightNavy/60 border border-blackRose-bloodBrown rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blackRose-roseMauve/60">Scheduled Posts</p>
                            <p className="text-2xl font-bold text-blackRose-fg">{stats?.scheduled_posts_pending || 0}</p>
                            <p className="text-xs text-green-400">of {stats?.total_scheduled_posts || 0} total</p>
                        </div>
                        <Calendar className="h-8 w-8 text-yellow-400" />
                    </div>
                </div>

                <div className="bg-blackRose-midnightNavy/60 border border-blackRose-bloodBrown rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blackRose-roseMauve/60">Active Drafts</p>
                            <p className="text-2xl font-bold text-blackRose-fg">{stats?.total_drafts || 0}</p>
                            <p className="text-xs text-blue-400">across all creators</p>
                        </div>
                        <FileText className="h-8 w-8 text-blue-400" />
                    </div>
                </div>

                <div className="bg-blackRose-midnightNavy/60 border border-blackRose-bloodBrown rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blackRose-roseMauve/60">Active Bundles</p>
                            <p className="text-2xl font-bold text-blackRose-fg">{stats?.active_bundles || 0}</p>
                            <p className="text-xs text-purple-400">{stats?.avg_bundle_discount_percent || 0}% avg discount</p>
                        </div>
                        <Package className="h-8 w-8 text-purple-400" />
                    </div>
                </div>

                <div className="bg-blackRose-midnightNavy/60 border border-blackRose-bloodBrown rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blackRose-roseMauve/60">Bundle Revenue</p>
                            <p className="text-2xl font-bold text-green-400">{formatCurrency(stats?.bundle_revenue_cents || 0)}</p>
                            <p className="text-xs text-green-400">{stats?.bundle_purchases_count || 0} purchases</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-400" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-blackRose-midnightNavy/60 border border-blackRose-bloodBrown rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blackRose-fg mb-4 flex items-center space-x-2">
                        <Crown className="h-5 w-5 text-yellow-400" />
                        <span>Top Performing Bundles</span>
                    </h3>
                    <div className="space-y-3">
                        {stats?.top_performing_bundles.slice(0, 3).map((bundle) => (
                            <div key={bundle.id} className="flex items-center justify-between p-3 bg-blackRose-trueBlack/40 rounded-lg">
                                <div>
                                    <p className="font-medium text-blackRose-fg">{bundle.title}</p>
                                    <p className="text-sm text-blackRose-roseMauve/60">by @{bundle.creator_username}</p>
                                    <p className="text-xs text-purple-400">{bundle.content_count} items • {bundle.purchase_count} sales</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-400">{formatCurrency(bundle.revenue_cents)}</p>
                                    <p className="text-xs text-yellow-400">-{bundle.discount_percent}% OFF</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-blackRose-midnightNavy/60 border border-blackRose-bloodBrown rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blackRose-fg mb-4 flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        <span>Recent Scheduled Posts</span>
                    </h3>
                    <div className="space-y-3">
                        {scheduledPosts.slice(0, 3).map((post) => (
                            <div key={post.id} className="flex items-start justify-between p-3 bg-blackRose-trueBlack/40 rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                        {getStatusIcon(post.status)}
                                        <p className="font-medium text-blackRose-fg">{post.title}</p>
                                    </div>
                                    <p className="text-sm text-blackRose-roseMauve/60 mb-2">by @{post.creator_username}</p>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 rounded text-xs border ${getPostTypeColor(post.post_type)}`}>
                                            {post.post_type.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-blackRose-roseMauve/40">
                                            {new Date(post.scheduled_for).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                {post.price && (
                                    <span className="text-sm font-bold text-green-400">${post.price}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderScheduledPosts = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-blackRose-fg">All Scheduled Posts</h3>
                <span className="text-sm text-blackRose-roseMauve/60">{scheduledPosts.length} posts</span>
            </div>

            <div className="space-y-3">
                {scheduledPosts.map((post) => (
                    <div key={post.id} className="bg-blackRose-midnightNavy/60 border border-blackRose-bloodBrown rounded-lg p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    {getStatusIcon(post.status)}
                                    <h4 className="font-semibold text-blackRose-fg">{post.title}</h4>
                                    <span className={`px-2 py-1 rounded text-xs border ${getPostTypeColor(post.post_type)}`}>
                                        {post.post_type.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-sm text-blackRose-roseMauve/60 mb-2">{post.content}</p>
                                <div className="flex items-center space-x-4 text-sm text-blackRose-roseMauve/40">
                                    <span>@{post.creator_username}</span>
                                    <span>Scheduled: {new Date(post.scheduled_for).toLocaleString()}</span>
                                    <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            {post.price && (
                                <div className="text-right">
                                    <p className="text-lg font-bold text-green-400">${post.price}</p>
                                    <p className="text-xs text-blackRose-roseMauve/60">Premium Content</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderBundleAnalytics = () => (
        <div className="space-y-6">
            <div className="bg-blackRose-midnightNavy/60 border border-blackRose-bloodBrown rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blackRose-fg mb-4">Bundle Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-purple-400">{bundles.length}</p>
                        <p className="text-sm text-blackRose-roseMauve/60">Total Bundles</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(stats?.bundle_revenue_cents || 0)}</p>
                        <p className="text-sm text-blackRose-roseMauve/60">Total Revenue</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-400">{stats?.avg_bundle_discount_percent || 0}%</p>
                        <p className="text-sm text-blackRose-roseMauve/60">Avg Discount</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blackRose-fg">All Vault Bundles</h3>
                {bundles.map((bundle) => (
                    <div key={bundle.id} className="bg-blackRose-midnightNavy/60 border border-blackRose-bloodBrown rounded-lg p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <Package className="h-5 w-5 text-purple-400" />
                                    <h4 className="font-semibold text-blackRose-fg">{bundle.title}</h4>
                                    <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400 border border-purple-500">
                                        Bundle
                                    </span>
                                    {bundle.is_active ? (
                                        <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 border border-green-500">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 rounded text-xs bg-gray-500/20 text-gray-400 border border-gray-500">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-blackRose-roseMauve/60 mb-2">{bundle.description}</p>
                                <div className="flex items-center space-x-4 text-sm text-blackRose-roseMauve/40">
                                    <span>@{bundle.creator_username}</span>
                                    <span>📦 {bundle.content_count} items</span>
                                    <span>🛒 {bundle.purchase_count} sales</span>
                                    <span>💰 {formatCurrency(bundle.revenue_cents)} earned</span>
                                    {bundle.expires_at && (
                                        <span className="text-orange-400">⏰ Expires {new Date(bundle.expires_at).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-sm text-blackRose-roseMauve/40 line-through">${bundle.original_price}</span>
                                    <span className="text-lg font-bold text-green-400">${bundle.bundle_price}</span>
                                </div>
                                <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 font-bold">
                                    -{bundle.discount_percent}% OFF
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className={`p-6 ${className}`}>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blackRose-roseMauve"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`p-6 ${className}`}>
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
                    <p className="text-red-400">Error loading creator productivity data: {error}</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', name: 'Overview', icon: BarChart3 },
        { id: 'scheduled', name: 'Scheduled Posts', icon: Calendar, count: scheduledPosts.length },
        { id: 'drafts', name: 'Drafts', icon: FileText, count: stats?.total_drafts },
        { id: 'bundles', name: 'Bundle Analytics', icon: Package, count: bundles.length },
    ];

    return (
        <div className={`p-6 ${className}`}>
            <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                    <Zap className="h-6 w-6 text-yellow-400" />
                    <h2 className="text-2xl font-bold text-blackRose-fg">Creator Productivity Dashboard</h2>
                </div>
                <p className="text-blackRose-roseMauve/60">
                    Monitor scheduled posts, drafts, vault bundles, and creator productivity metrics across the platform
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-blackRose-bloodBrown mb-6">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'overview' | 'scheduled' | 'drafts' | 'bundles')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${activeTab === tab.id
                                        ? 'border-blackRose-roseMauve text-blackRose-roseMauve'
                                        : 'border-transparent text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve hover:border-blackRose-roseMauve/30'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{tab.name}</span>
                                {tab.count !== undefined && (
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id
                                            ? 'bg-blackRose-roseMauve text-blackRose-trueBlack'
                                            : 'bg-blackRose-roseMauve/20 text-blackRose-roseMauve'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'scheduled' && renderScheduledPosts()}
                {activeTab === 'drafts' && (
                    <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-blackRose-roseMauve/40 mb-4" />
                        <h3 className="text-lg font-medium text-blackRose-fg mb-2">Draft Management</h3>
                        <p className="text-blackRose-roseMauve/60">
                            Detailed draft analytics and management features coming soon
                        </p>
                    </div>
                )}
                {activeTab === 'bundles' && renderBundleAnalytics()}
            </div>
        </div>
    );
};

export default GodModeCreatorProductivity;