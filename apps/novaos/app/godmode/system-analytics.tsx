"use client";

import { useCallback, useEffect, useState } from "react";
import { coreApiJson } from "@/lib/core-api";

interface SystemStats {
    active_users_daily: number;
    active_users_weekly: number;
    total_transactions: number;
    total_events: number;
    last_updated: string;
}

interface RecentEvent {
    id: string;
    event_name: string;
    props: Record<string, unknown>;
    created_at: string;
    user_id: string | null;
}

interface SystemAnalyticsProps {
    className?: string;
}

export default function SystemAnalytics({ className = "" }: SystemAnalyticsProps) {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [systemStats, events] = await Promise.all([
                coreApiJson<SystemStats>("/analytics/system/stats"),
                coreApiJson<RecentEvent[]>("/analytics/events/recent?limit=8")
            ]);

            setStats(systemStats);
            setRecentEvents(events);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load analytics data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatEventName = (eventName: string) => {
        return eventName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getEventIcon = (eventName: string) => {
        if (eventName.includes('login') || eventName.includes('auth')) return '🔐';
        if (eventName.includes('payment') || eventName.includes('purchase')) return '💳';
        if (eventName.includes('upload') || eventName.includes('content')) return '📤';
        if (eventName.includes('message') || eventName.includes('chat')) return '💬';
        if (eventName.includes('error') || eventName.includes('fail')) return '⚠️';
        return '📊';
    };

    if (loading) {
        return (
            <section className={`space-y-4 ${className}`}>
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-blackRose-fg">System Analytics</h2>
                    <div className="h-4 w-16 animate-pulse rounded bg-blackRose-midnightNavy"></div>
                </div>
                <div className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 animate-pulse rounded-3xl bg-blackRose-midnightNavy/50"></div>
                        ))}
                    </div>
                    <div className="h-64 animate-pulse rounded-3xl bg-blackRose-midnightNavy/50"></div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className={`space-y-4 ${className}`}>
                <h2 className="text-2xl font-semibold text-blackRose-fg">System Analytics</h2>
                <div className="rounded-3xl border border-status-danger-dark bg-status-danger-dark/10 p-6">
                    <p className="text-sm text-status-danger-light">{error}</p>
                    <button
                        onClick={fetchData}
                        className="mt-3 rounded-full border border-status-danger-dark px-4 py-1 text-xs text-status-danger-light hover:bg-status-danger-dark/20"
                    >
                        Retry
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className={`space-y-4 ${className}`}>
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-blackRose-fg">System Analytics</h2>
                <span className="text-xs uppercase tracking-wide text-studios-cipherCore-cyberBlue">
                    Live dashboard
                </span>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 lg:grid-cols-4">
                    <div className="rounded-3xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/80 p-6 shadow-[0_45px_120px_rgba(0,0,0,0.55)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-semibold text-studios-azureLight-glacierBlue">
                                    {formatNumber(stats.active_users_daily)}
                                </p>
                                <p className="text-xs uppercase tracking-wide text-blackRose-roseMauve">Daily Active Users</p>
                            </div>
                            <span className="text-2xl">👥</span>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/80 p-6 shadow-[0_45px_120px_rgba(0,0,0,0.55)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-semibold text-studios-cryptPink-orchidLush">
                                    {formatNumber(stats.active_users_weekly)}
                                </p>
                                <p className="text-xs uppercase tracking-wide text-blackRose-roseMauve">Weekly Active Users</p>
                            </div>
                            <span className="text-2xl">📈</span>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/80 p-6 shadow-[0_45px_120px_rgba(0,0,0,0.55)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-semibold text-studios-velvetCrimson-burgundy">
                                    {formatNumber(stats.total_transactions)}
                                </p>
                                <p className="text-xs uppercase tracking-wide text-blackRose-roseMauve">Total Transactions</p>
                            </div>
                            <span className="text-2xl">💰</span>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/80 p-6 shadow-[0_45px_120px_rgba(0,0,0,0.55)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-semibold text-studios-cipherCore-cyberBlue">
                                    {formatNumber(stats.total_events)}
                                </p>
                                <p className="text-xs uppercase tracking-wide text-blackRose-roseMauve">Total Events</p>
                            </div>
                            <span className="text-2xl">⚡</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div className="rounded-3xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/80 p-6 shadow-[0_45px_120px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-blackRose-fg">Recent Activity</h3>
                    <span className="text-xs text-blackRose-roseMauve/60">
                        Last {recentEvents.length} events
                    </span>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {recentEvents.map((event) => (
                        <div
                            key={event.id}
                            className="flex items-center gap-4 rounded-xl border border-blackRose-bloodBrown/50 bg-blackRose-trueBlack/60 p-4"
                        >
                            <span className="text-xl" role="img" aria-hidden>
                                {getEventIcon(event.event_name)}
                            </span>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-blackRose-fg">
                                        {formatEventName(event.event_name)}
                                    </span>
                                    {Object.keys(event.props).length > 0 && (
                                        <span className="rounded-full bg-blackRose-bloodBrown px-2 py-0.5 text-xs text-blackRose-roseMauve">
                                            {Object.keys(event.props).length} props
                                        </span>
                                    )}
                                </div>
                                <div className="mt-1 flex items-center gap-3 text-xs text-blackRose-roseMauve/60">
                                    <span>
                                        User: {event.user_id ? `${event.user_id.substring(0, 8)}...` : "System"}
                                    </span>
                                    <span>
                                        {new Date(event.created_at).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {recentEvents.length === 0 && (
                        <div className="py-8 text-center">
                            <div className="text-blackRose-roseMauve/60">No recent activity</div>
                            <div className="mt-1 text-xs text-blackRose-roseMauve/40">
                                Events will appear here as users interact with the system
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-blackRose-bloodBrown mt-4 pt-4">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-blackRose-roseMauve/60">
                            Auto-refresh every 30 seconds • Last updated: {stats ? new Date(stats.last_updated).toLocaleTimeString() : 'Never'}
                        </div>
                        <button
                            onClick={fetchData}
                            className="rounded-full border border-blackRose-bloodBrown bg-blackRose-trueBlack px-4 py-2 text-xs text-blackRose-fg hover:bg-blackRose-midnightNavy"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
