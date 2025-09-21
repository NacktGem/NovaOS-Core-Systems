'use client'
import React, { useState, useEffect } from 'react';

// Simple icon components
const Grid = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

const Star = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);

const BookOpen = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const ExternalLink = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

const ChevronRight = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

interface Platform {
    id: string;
    name: string;
    description: string;
    url: string;
    port?: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    status: 'online' | 'offline' | 'maintenance';
    isExternal?: boolean;
}

interface User {
    id: string;
    username: string;
    email: string;
    role: 'GODMODE' | 'SUPER_ADMIN' | 'ADMIN_AGENT' | 'CREATOR_STANDARD' | 'VERIFIED_USER' | 'GUEST';
    currentPlatform: string;
    permissions: string[];
}

interface UnifiedNavigationProps {
    currentPlatform: string;
    user?: User | null;
    onPlatformSwitch?: (_platform: string) => void;
    showQuickActions?: boolean;
}

export default function UnifiedNavigation({
    currentPlatform,
    user,
    onPlatformSwitch,
    showQuickActions = true
}: UnifiedNavigationProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [platformStatuses, setPlatformStatuses] = useState<Record<string, 'online' | 'offline' | 'maintenance'>>({});

    const platforms: Platform[] = [
        {
            id: 'novaos',
            name: 'NovaOS Console',
            description: 'Master control and agent management',
            url: 'http://localhost:3002',
            port: 3002,
            icon: Grid,
            color: 'indigo',
            status: platformStatuses.novaos || 'online',
            isExternal: currentPlatform !== 'novaos'
        },
        {
            id: 'blackrose',
            name: 'Black Rose Collective',
            description: 'Creator platform with revenue analytics',
            url: 'http://localhost:3000',
            port: 3000,
            icon: Star,
            color: 'purple',
            status: platformStatuses.blackrose || 'online',
            isExternal: currentPlatform !== 'blackrose'
        },
        {
            id: 'gypsycove',
            name: 'GypsyCove Academy',
            description: 'Family-friendly educational platform',
            url: 'http://localhost:3001',
            port: 3001,
            icon: BookOpen,
            color: 'emerald',
            status: platformStatuses.gypsycove || 'online',
            isExternal: currentPlatform !== 'gypsycove'
        }
    ];

    // Check platform statuses
    useEffect(() => {
        const checkPlatformStatus = async (platform: Platform) => {
            try {
                const response = await fetch(`${platform.url}/api/health`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(5000) // 5 second timeout
                });

                return response.ok ? 'online' : 'offline';
            } catch {
                return 'offline';
            }
        };

        const checkAllPlatforms = async () => {
            const statuses: Record<string, 'online' | 'offline' | 'maintenance'> = {};

            await Promise.all(
                platforms.map(async (platform) => {
                    statuses[platform.id] = await checkPlatformStatus(platform);
                })
            );

            setPlatformStatuses(statuses);
        };

        checkAllPlatforms();

        // Check every 30 seconds
        const interval = setInterval(checkAllPlatforms, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'bg-emerald-500';
            case 'offline': return 'bg-red-500';
            case 'maintenance': return 'bg-amber-500';
            default: return 'bg-gray-500';
        }
    };

    const getPlatformColorClasses = (color: string) => {
        const colorMap: Record<string, string> = {
            indigo: 'bg-indigo-500 hover:bg-indigo-600',
            purple: 'bg-purple-500 hover:bg-purple-600',
            emerald: 'bg-emerald-500 hover:bg-emerald-600',
            blue: 'bg-blue-500 hover:bg-blue-600',
            amber: 'bg-amber-500 hover:bg-amber-600'
        };
        return colorMap[color] || colorMap.indigo;
    };

    const handlePlatformSwitch = (platform: Platform) => {
        if (platform.isExternal) {
            // Open in new tab for external platforms
            window.open(platform.url, '_blank');
        } else {
            // Use internal navigation
            onPlatformSwitch?.(platform.id);
        }
    };

    const canAccessPlatform = (platformId: string) => {
        if (!user) return false;
        if (user.role === 'GODMODE' || user.role === 'SUPER_ADMIN') return true;

        // Platform-specific access rules
        switch (platformId) {
            case 'novaos':
                return user.role === 'ADMIN_AGENT' || user.permissions.includes('platform.admin');
            case 'blackrose':
                return user.role === 'CREATOR_STANDARD' || user.permissions.includes('creator.dashboard');
            case 'gypsycove':
                return user.permissions.includes('education.access') || user.permissions.includes('family.manage');
            default:
                return false;
        }
    };

    const quickActions = [
        {
            id: 'agent-status',
            title: 'Agent Status',
            description: 'View all agent health',
            action: () => onPlatformSwitch?.('novaos'),
            icon: Grid,
            available: canAccessPlatform('novaos')
        },
        {
            id: 'creator-analytics',
            title: 'Creator Analytics',
            description: 'Revenue dashboard',
            action: () => window.open('http://localhost:3000/blackrose/dashboard/enhanced', '_blank'),
            icon: Star,
            available: canAccessPlatform('blackrose')
        },
        {
            id: 'family-safety',
            title: 'Family Safety',
            description: 'Educational controls',
            action: () => window.open('http://localhost:3001/dashboard/enhanced', '_blank'),
            icon: BookOpen,
            available: canAccessPlatform('gypsycove')
        }
    ];

    return (
        <div className="fixed top-4 right-4 z-50">
            {/* Navigation Toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
            >
                <Grid className="w-6 h-6" />
            </button>

            {/* Navigation Panel */}
            {isExpanded && (
                <div className="absolute top-16 right-0 w-96 bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">NovaOS Platforms</h3>
                                <p className="text-sm text-gray-600">Navigate across all platforms</p>
                            </div>
                            {user && (
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-800">{user.username}</p>
                                    <p className="text-xs text-gray-500">{user.role}</p>
                                </div>
                            )}
                        </div>

                        {/* Current Platform */}
                        <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center">
                                    {platforms.find(p => p.id === currentPlatform)?.icon &&
                                        React.createElement(platforms.find(p => p.id === currentPlatform)!.icon, { className: "w-5 h-5" })
                                    }
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">Current: {platforms.find(p => p.id === currentPlatform)?.name}</p>
                                    <p className="text-sm text-gray-600">{platforms.find(p => p.id === currentPlatform)?.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Platform List */}
                        <div className="space-y-3 mb-6">
                            <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Switch Platform</h4>
                            {platforms.filter(p => p.id !== currentPlatform).map(platform => {
                                const IconComponent = platform.icon;
                                const canAccess = canAccessPlatform(platform.id);

                                return (
                                    <button
                                        key={platform.id}
                                        onClick={() => canAccess && handlePlatformSwitch(platform)}
                                        disabled={!canAccess}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${canAccess
                                            ? 'hover:bg-gray-50 cursor-pointer'
                                            : 'opacity-50 cursor-not-allowed'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 text-white rounded-2xl flex items-center justify-center ${getPlatformColorClasses(platform.color)}`}>
                                            <IconComponent className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-gray-800">{platform.name}</h4>
                                                <div className={`w-2 h-2 rounded-full ${getStatusColor(platform.status)}`}></div>
                                                {platform.isExternal && <ExternalLink className="w-3 h-3 text-gray-400" />}
                                            </div>
                                            <p className="text-sm text-gray-600">{platform.description}</p>
                                            {platform.port && (
                                                <p className="text-xs text-gray-400">Port: {platform.port}</p>
                                            )}
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </button>
                                );
                            })}
                        </div>

                        {/* Quick Actions */}
                        {showQuickActions && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Quick Actions</h4>
                                {quickActions.filter(action => action.available).map(action => {
                                    const IconComponent = action.icon;
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={action.action}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                                                <IconComponent className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="font-medium text-gray-800 text-sm">{action.title}</p>
                                                <p className="text-xs text-gray-500">{action.description}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Close Button */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
                            >
                                Close Navigation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Backdrop */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
                    onClick={() => setIsExpanded(false)}
                />
            )}
        </div>
    );
}
