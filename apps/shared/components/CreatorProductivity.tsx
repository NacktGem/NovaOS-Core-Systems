import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, Clock, FileText, Package, Send, Save, Trash2, Eye, EyeOff,
    Settings, Plus, Edit3, CheckCircle, AlertCircle, BarChart3,
    Upload, Image, Video, Music, DollarSign, Tag, Globe, Lock, Heart,
    Users, TrendingUp, Zap, Target, Gift
} from 'lucide-react';

interface PostDraft {
    id: string;
    title: string;
    content: string;
    mediaUrls: string[];
    visibility: 'public' | 'subscribers' | 'vault';
    price?: number;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    autoSave?: boolean;
}

interface ScheduledPost {
    id: string;
    title: string;
    content: string;
    mediaUrls: string[];
    visibility: 'home' | 'explore' | 'vault';
    price?: number;
    tags: string[];
    scheduledFor: string;
    status: 'pending' | 'published' | 'failed' | 'cancelled';
    createdAt: string;
}

interface VaultBundle {
    id: string;
    title: string;
    description: string;
    contentIds: string[];
    originalPrice: number;
    bundlePrice: number;
    discountPercent: number;
    expiresAt?: string;
    purchaseCount: number;
    isActive: boolean;
    createdAt: string;
}

interface CreatorProductivityProps {
    platform: 'black-rose' | 'gypsy-cove';
    userRole: string;
    userId: string;
}

const CreatorProductivity: React.FC<CreatorProductivityProps> = ({
    platform,
    userRole,
    userId
}) => {
    const [activeTab, setActiveTab] = useState<'drafts' | 'scheduled' | 'bundles' | 'analytics'>('drafts');
    const [drafts, setDrafts] = useState<PostDraft[]>([]);
    const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
    const [vaultBundles, setVaultBundles] = useState<VaultBundle[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const platformConfig = {
        'black-rose': {
            name: 'Black Rose Collective',
            color: 'rose',
            canMonetize: true,
            supportsVault: true
        },
        'gypsy-cove': {
            name: 'GypsyCove',
            color: 'purple',
            canMonetize: false,
            supportsVault: false
        }
    };

    const config = platformConfig[platform];

    // Fetch data from our new API endpoints
    const fetchDrafts = useCallback(async () => {
        try {
            const response = await fetch('/api/posts/drafts', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data = await response.json();
                setDrafts(data.drafts || []);
            }
        } catch (error) {
            console.error('Failed to fetch drafts:', error);
        }
    }, []);

    const fetchScheduledPosts = useCallback(async () => {
        try {
            const response = await fetch('/api/posts/scheduled', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data = await response.json();
                setScheduledPosts(data.scheduled_posts || []);
            }
        } catch (error) {
            console.error('Failed to fetch scheduled posts:', error);
        }
    }, []);

    const fetchVaultBundles = useCallback(async () => {
        if (!config.supportsVault) return;

        try {
            const response = await fetch('/api/vault/bundles', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data = await response.json();
                setVaultBundles(data.bundles || []);
            }
        } catch (error) {
            console.error('Failed to fetch vault bundles:', error);
        }
    }, [config.supportsVault]);

    useEffect(() => {
        fetchDrafts();
        fetchScheduledPosts();
        fetchVaultBundles();
    }, [fetchDrafts, fetchScheduledPosts, fetchVaultBundles]);

    // Auto-save drafts every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            drafts.forEach(async (draft) => {
                if (draft.autoSave) {
                    try {
                        await fetch(`/api/posts/drafts/${draft.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({
                                title: draft.title,
                                content: draft.content,
                                media_urls: draft.mediaUrls,
                                visibility: draft.visibility,
                                price: draft.price,
                                tags: draft.tags
                            })
                        });
                    } catch (error) {
                        console.error('Auto-save failed:', error);
                    }
                }
            });
        }, 30000);

        return () => clearInterval(interval);
    }, [drafts]);

    const createDraft = async (draftData: Partial<PostDraft>) => {
        try {
            const response = await fetch('/api/posts/drafts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    title: draftData.title || 'Untitled Draft',
                    content: draftData.content || '',
                    media_urls: draftData.mediaUrls || [],
                    visibility: draftData.visibility || 'public',
                    price: draftData.price,
                    tags: draftData.tags || []
                })
            });

            if (response.ok) {
                const newDraft = await response.json();
                setDrafts(prev => [newDraft, ...prev]);
                setShowCreateModal(false);
            }
        } catch (error) {
            console.error('Failed to create draft:', error);
        }
    };

    const schedulePost = async (postData: any, scheduledFor: string) => {
        try {
            const response = await fetch('/api/posts/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...postData,
                    scheduled_for: scheduledFor
                })
            });

            if (response.ok) {
                const scheduledPost = await response.json();
                setScheduledPosts(prev => [scheduledPost, ...prev]);
                fetchScheduledPosts(); // Refresh list
            }
        } catch (error) {
            console.error('Failed to schedule post:', error);
        }
    };

    const createVaultBundle = async (bundleData: Partial<VaultBundle>) => {
        if (!config.supportsVault) return;

        try {
            const response = await fetch('/api/vault/bundles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    title: bundleData.title,
                    description: bundleData.description,
                    content_ids: bundleData.contentIds || [],
                    bundle_price: bundleData.bundlePrice,
                    expires_at: bundleData.expiresAt
                })
            });

            if (response.ok) {
                const newBundle = await response.json();
                setVaultBundles(prev => [newBundle, ...prev]);
            }
        } catch (error) {
            console.error('Failed to create vault bundle:', error);
        }
    };

    const getColorClasses = () => {
        const colors = {
            rose: {
                primary: 'bg-rose-600 hover:bg-rose-700 text-white',
                secondary: 'text-rose-600 bg-rose-50 border-rose-200',
                accent: 'text-rose-600',
                light: 'bg-rose-50'
            },
            purple: {
                primary: 'bg-purple-600 hover:bg-purple-700 text-white',
                secondary: 'text-purple-600 bg-purple-50 border-purple-200',
                accent: 'text-purple-600',
                light: 'bg-purple-50'
            }
        };
        return colors[config.color];
    };

    const colorClasses = getColorClasses();

    const renderDraftsTab = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Draft Posts</h2>
                    <p className="text-sm text-gray-600">Manage your draft content and ideas</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${colorClasses.primary} inline-flex items-center space-x-2`}
                >
                    <Plus className="h-4 w-4" />
                    <span>New Draft</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drafts.map((draft) => (
                    <div key={draft.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="font-medium text-gray-900 truncate">{draft.title}</h3>
                            <div className="flex items-center space-x-2">
                                {draft.autoSave && (
                                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" title="Auto-saving" />
                                )}
                                <button className="text-gray-400 hover:text-gray-600">
                                    <Edit3 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-3 mb-3">{draft.content}</p>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <span>Updated {new Date(draft.updatedAt).toLocaleDateString()}</span>
                            <div className="flex items-center space-x-1">
                                {draft.visibility === 'public' ? <Globe className="h-3 w-3" /> :
                                    draft.visibility === 'subscribers' ? <Heart className="h-3 w-3" /> :
                                        <Lock className="h-3 w-3" />}
                                <span className="capitalize">{draft.visibility}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => schedulePost(draft, new Date(Date.now() + 3600000).toISOString())}
                                    className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                >
                                    Schedule
                                </button>
                                <button className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100">
                                    Publish Now
                                </button>
                            </div>
                            <button className="text-xs text-red-600 hover:text-red-800">
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                ))}

                {drafts.length === 0 && (
                    <div className="col-span-full text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts yet</h3>
                        <p className="text-gray-600 mb-4">Create your first draft to get started</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${colorClasses.primary}`}
                        >
                            Create First Draft
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderScheduledTab = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Scheduled Posts</h2>
                    <p className="text-sm text-gray-600">Manage your scheduled content pipeline</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                        {scheduledPosts.filter(p => p.status === 'pending').length} pending
                    </span>
                    <button className={`px-4 py-2 rounded-md text-sm font-medium ${colorClasses.primary} inline-flex items-center space-x-2`}>
                        <Calendar className="h-4 w-4" />
                        <span>Schedule New</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {scheduledPosts.map((post) => (
                    <div key={post.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <h3 className="font-medium text-gray-900">{post.title}</h3>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${post.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            post.status === 'published' ? 'bg-green-100 text-green-800' :
                                                post.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'}`}
                                    >
                                        {post.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                        {post.status === 'published' && <CheckCircle className="h-3 w-3 mr-1" />}
                                        {post.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.content}</p>

                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center space-x-4">
                                        <span className="flex items-center space-x-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>Scheduled for {new Date(post.scheduledFor).toLocaleString()}</span>
                                        </span>
                                        <span className="capitalize flex items-center space-x-1">
                                            {post.visibility === 'home' ? <Users className="h-3 w-3" /> :
                                                post.visibility === 'explore' ? <Globe className="h-3 w-3" /> :
                                                    <Lock className="h-3 w-3" />}
                                            <span>{post.visibility}</span>
                                        </span>
                                    </div>
                                    {post.price && (
                                        <span className="flex items-center space-x-1 text-green-600">
                                            <DollarSign className="h-3 w-3" />
                                            <span>${post.price}</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 ml-4">
                                {post.status === 'pending' && (
                                    <>
                                        <button className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                                            Reschedule
                                        </button>
                                        <button className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">
                                            Cancel
                                        </button>
                                    </>
                                )}
                                {post.status === 'published' && (
                                    <button className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100">
                                        View Post
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {scheduledPosts.length === 0 && (
                    <div className="text-center py-12">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled posts</h3>
                        <p className="text-gray-600 mb-4">Schedule posts to maintain consistent content flow</p>
                        <button className={`px-4 py-2 rounded-md text-sm font-medium ${colorClasses.primary}`}>
                            Schedule Your First Post
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderBundlesTab = () => {
        if (!config.supportsVault) {
            return (
                <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Vault Bundles Not Available</h3>
                    <p className="text-gray-600">This feature is only available on platforms that support monetization</p>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Vault Bundles</h2>
                        <p className="text-sm text-gray-600">Create bundled content packages with automatic discounts</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${colorClasses.primary} inline-flex items-center space-x-2`}
                    >
                        <Package className="h-4 w-4" />
                        <span>Create Bundle</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vaultBundles.map((bundle) => (
                        <div key={bundle.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="font-medium text-gray-900">{bundle.title}</h3>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${bundle.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {bundle.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{bundle.description}</p>

                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <span className="text-lg font-semibold text-green-600">${bundle.bundlePrice}</span>
                                    <span className="text-sm text-gray-500 line-through">${bundle.originalPrice}</span>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses.secondary}`}>
                                    {bundle.discountPercent}% OFF
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                <span>{bundle.contentIds.length} items</span>
                                <span>{bundle.purchaseCount} purchases</span>
                            </div>

                            {bundle.expiresAt && (
                                <div className="text-xs text-amber-600 mb-3 flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>Expires {new Date(bundle.expiresAt).toLocaleDateString()}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <button className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                                    Edit Bundle
                                </button>
                                <div className="flex space-x-2">
                                    <button className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100">
                                        Analytics
                                    </button>
                                    <button className="text-xs text-red-600 hover:text-red-800">
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {vaultBundles.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <Gift className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No bundles created</h3>
                            <p className="text-gray-600 mb-4">Create your first vault bundle to increase sales</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${colorClasses.primary}`}
                            >
                                Create First Bundle
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderAnalyticsTab = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-900">Creator Analytics</h2>
                <p className="text-sm text-gray-600">Track your content performance and productivity metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Drafts</p>
                            <p className="text-2xl font-semibold text-gray-900">{drafts.length}</p>
                        </div>
                        <FileText className="h-8 w-8 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Scheduled Posts</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {scheduledPosts.filter(p => p.status === 'pending').length}
                            </p>
                        </div>
                        <Calendar className="h-8 w-8 text-green-500" />
                    </div>
                </div>

                {config.supportsVault && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Bundles</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {vaultBundles.filter(b => b.isActive).length}
                                </p>
                            </div>
                            <Package className="h-8 w-8 text-purple-500" />
                        </div>
                    </div>
                )}

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Success Rate</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {scheduledPosts.length > 0
                                    ? Math.round((scheduledPosts.filter(p => p.status === 'published').length / scheduledPosts.length) * 100)
                                    : 0}%
                            </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-rose-500" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Productivity Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Publishing Schedule</h4>
                        <p className="text-sm text-gray-600 mb-4">Optimize your posting times for better engagement</p>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Morning (6-12 PM)</span>
                                <span>23% of posts</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Content Performance</h4>
                        <p className="text-sm text-gray-600 mb-4">Track which content types perform best</p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Average engagement rate</span>
                            <span className="text-lg font-semibold text-green-600">8.4%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const tabs = [
        { id: 'drafts', name: 'Drafts', icon: FileText, count: drafts.length },
        { id: 'scheduled', name: 'Scheduled', icon: Calendar, count: scheduledPosts.filter(p => p.status === 'pending').length },
        ...(config.supportsVault ? [{ id: 'bundles', name: 'Bundles', icon: Package, count: vaultBundles.filter(b => b.isActive).length }] : []),
        { id: 'analytics', name: 'Analytics', icon: BarChart3, count: 0 }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className={`${colorClasses.light} p-4 rounded-lg`}>
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg">
                        <Zap className={`h-6 w-6 ${colorClasses.accent}`} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Creator Productivity Suite</h2>
                        <p className="text-sm text-gray-600">Streamline your content creation and scheduling workflow</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${activeTab === tab.id
                                        ? `border-${config.color}-500 text-${config.color}-600`
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{tab.name}</span>
                                {tab.count > 0 && (
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === tab.id
                                            ? `bg-${config.color}-100 text-${config.color}-600`
                                            : 'bg-gray-100 text-gray-600'
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
                {activeTab === 'drafts' && renderDraftsTab()}
                {activeTab === 'scheduled' && renderScheduledTab()}
                {activeTab === 'bundles' && renderBundlesTab()}
                {activeTab === 'analytics' && renderAnalyticsTab()}
            </div>
        </div>
    );
};

export default CreatorProductivity;