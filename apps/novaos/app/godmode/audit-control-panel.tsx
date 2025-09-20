import React, { useState, useEffect, useCallback } from 'react';
import {
    Shield, ShieldCheck, ShieldOff, Users, Activity,
    AlertTriangle, TrendingUp, Clock, Settings,
    Trash2, Download, RefreshCw, Eye, EyeOff
} from 'lucide-react';

interface AuditConfig {
    enabled: boolean;
    retention_days: number;
    excluded_paths: string[];
    log_response_bodies: boolean;
}

interface AuditConfigResponse {
    config: AuditConfig;
    updated_by: string;
    updated_at: string;
    founder_bypass_active: boolean;
}

interface AuditStats {
    timeframe_hours: number;
    total_events: number;
    successful_events: number;
    error_events: number;
    unique_users: number;
    success_rate: number;
    top_actions: Array<{ action: string; count: number }>;
    top_users: Array<{ username: string; role: string; count: number }>;
    founder_bypass_note: string;
}

interface AuditControlPanelProps {
    className?: string;
}

const AuditControlPanel: React.FC<AuditControlPanelProps> = ({ className = "" }) => {
    const [config, setConfig] = useState<AuditConfigResponse | null>(null);
    const [stats, setStats] = useState<AuditStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const fetchConfig = useCallback(async () => {
        try {
            const response = await fetch('/api/system/audit/config', {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch config: ${response.statusText}`);
            }

            const data = await response.json();
            setConfig(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch audit config');
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch('/api/system/audit/stats?hours=24', {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch stats: ${response.statusText}`);
            }

            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch audit stats:', err);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);

            await Promise.all([fetchConfig(), fetchStats()]);

            setLoading(false);
        };

        loadData();
    }, [fetchConfig, fetchStats]);

    const toggleAuditEnabled = async () => {
        if (!config) return;

        setUpdating(true);
        try {
            const response = await fetch('/api/system/audit/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    enabled: !config.config.enabled,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update config: ${response.statusText}`);
            }

            const updatedConfig = await response.json();
            setConfig(updatedConfig);

            // Refresh stats after config change
            await fetchStats();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update audit config');
        } finally {
            setUpdating(false);
        }
    };

    const updateRetentionDays = async (days: number) => {
        if (!config) return;

        setUpdating(true);
        try {
            const response = await fetch('/api/system/audit/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    retention_days: days,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update retention: ${response.statusText}`);
            }

            const updatedConfig = await response.json();
            setConfig(updatedConfig);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update retention days');
        } finally {
            setUpdating(false);
        }
    };

    const purgeLogs = async (days: number) => {
        if (!confirm(`Are you sure you want to purge audit logs older than ${days} days? This action cannot be undone.`)) {
            return;
        }

        setUpdating(true);
        try {
            const response = await fetch(`/api/system/audit/logs?days=${days}&confirm=true`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to purge logs: ${response.statusText}`);
            }

            const result = await response.json();
            alert(`Successfully purged ${result.deleted_count} audit log entries.`);

            // Refresh stats after purge
            await fetchStats();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to purge audit logs');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className={`bg-blackRose-midnightNavy/60 border border-blackRose-bloodBrown rounded-lg p-6 ${className}`}>
                <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 text-blackRose-roseMauve animate-spin" />
                </div>
            </div>
        );
    }

    if (error || !config) {
        return (
            <div className={`bg-blackRose-midnightNavy/60 border border-blackRose-bloodBrown rounded-lg p-6 ${className}`}>
                <div className="flex items-center space-x-3 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Error loading audit configuration: {error || 'Unknown error'}</span>
                </div>
            </div>
        );
    }

    const isEnabled = config.config.enabled;
    const successRate = stats?.success_rate || 0;

    return (
        <div className={`bg-blackRose-midnightNavy/60 border border-blackRose-bloodBrown rounded-lg p-6 space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-yellow-400" />
                    <div>
                        <h3 className="text-lg font-semibold text-blackRose-fg">Audit Control Panel</h3>
                        <p className="text-sm text-blackRose-roseMauve/60">
                            System-wide audit logging configuration
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="px-3 py-1 rounded-md bg-blackRose-trueBlack/40 text-blackRose-roseMauve hover:text-blackRose-fg border border-blackRose-bloodBrown/50 text-xs"
                    >
                        {showAdvanced ? 'Simple' : 'Advanced'}
                    </button>
                    <button
                        onClick={() => Promise.all([fetchConfig(), fetchStats()])}
                        disabled={updating}
                        className="p-2 rounded-md bg-blackRose-trueBlack/40 text-blackRose-roseMauve hover:text-blackRose-fg border border-blackRose-bloodBrown/50"
                    >
                        <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Founder Bypass Notice */}
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <ShieldCheck className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-yellow-400">Founder Bypass Active</h4>
                        <p className="text-sm text-yellow-400/80 mt-1">
                            As a founder (GodMode role), <strong>all your actions bypass audit logging</strong> regardless
                            of the toggle state below. This ensures sovereign founder access is never tracked or recorded.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blackRose-trueBlack/40 rounded-lg border border-blackRose-bloodBrown/50">
                        <div className="flex items-center space-x-3">
                            {isEnabled ? (
                                <ShieldCheck className="h-8 w-8 text-green-400" />
                            ) : (
                                <ShieldOff className="h-8 w-8 text-red-400" />
                            )}
                            <div>
                                <h4 className="font-semibold text-blackRose-fg">
                                    Audit Logging: {isEnabled ? 'Enabled' : 'Disabled'}
                                </h4>
                                <p className="text-sm text-blackRose-roseMauve/60">
                                    {isEnabled
                                        ? 'All non-founder actions are being logged'
                                        : 'No audit logs are being collected (except system-critical)'
                                    }
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={toggleAuditEnabled}
                            disabled={updating}
                            className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${isEnabled
                                    ? 'bg-green-600'
                                    : 'bg-red-600'
                                }
                ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
                        >
                            <span
                                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
                `}
                            />
                        </button>
                    </div>

                    {/* Quick Stats */}
                    {stats && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-blackRose-trueBlack/40 rounded-lg border border-blackRose-bloodBrown/50">
                                <div className="flex items-center space-x-2">
                                    <Activity className="h-4 w-4 text-blue-400" />
                                    <span className="text-sm text-blackRose-roseMauve/60">24h Events</span>
                                </div>
                                <p className="text-lg font-bold text-blackRose-fg">{stats.total_events.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-blackRose-trueBlack/40 rounded-lg border border-blackRose-bloodBrown/50">
                                <div className="flex items-center space-x-2">
                                    <Users className="h-4 w-4 text-purple-400" />
                                    <span className="text-sm text-blackRose-roseMauve/60">Unique Users</span>
                                </div>
                                <p className="text-lg font-bold text-blackRose-fg">{stats.unique_users}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Configuration Details */}
                <div className="space-y-4">
                    <div className="p-4 bg-blackRose-trueBlack/40 rounded-lg border border-blackRose-bloodBrown/50">
                        <h4 className="font-medium text-blackRose-fg mb-3">Configuration</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-blackRose-roseMauve/60">Retention:</span>
                                <span className="text-blackRose-fg">{config.config.retention_days} days</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blackRose-roseMauve/60">Response Bodies:</span>
                                <span className={config.config.log_response_bodies ? 'text-yellow-400' : 'text-blackRose-fg'}>
                                    {config.config.log_response_bodies ? 'Logged' : 'Not Logged'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blackRose-roseMauve/60">Updated:</span>
                                <span className="text-blackRose-fg">
                                    {new Date(config.updated_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {stats && (
                        <div className="p-4 bg-blackRose-trueBlack/40 rounded-lg border border-blackRose-bloodBrown/50">
                            <h4 className="font-medium text-blackRose-fg mb-3">Success Rate</h4>
                            <div className="flex items-center space-x-3">
                                <div className="flex-1 bg-blackRose-bloodBrown/30 rounded-full h-2">
                                    <div
                                        className={`h-full rounded-full ${successRate >= 90 ? 'bg-green-400' : successRate >= 75 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                        style={{ width: `${Math.max(successRate, 5)}%` }}
                                    />
                                </div>
                                <span className={`text-sm font-bold ${successRate >= 90 ? 'text-green-400' : successRate >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {successRate.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Advanced Controls */}
            {showAdvanced && (
                <div className="space-y-4 pt-4 border-t border-blackRose-bloodBrown/50">
                    <h4 className="font-medium text-blackRose-fg">Advanced Controls</h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-blackRose-trueBlack/40 rounded-lg border border-blackRose-bloodBrown/50">
                            <h5 className="font-medium text-blackRose-fg mb-2 flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>Retention Period</span>
                            </h5>
                            <div className="space-y-2">
                                {[30, 60, 90, 180, 365].map((days) => (
                                    <button
                                        key={days}
                                        onClick={() => updateRetentionDays(days)}
                                        disabled={updating || config.config.retention_days === days}
                                        className={`
                      w-full px-3 py-1 rounded text-xs transition-colors
                      ${config.config.retention_days === days
                                                ? 'bg-blackRose-roseMauve text-blackRose-trueBlack'
                                                : 'bg-blackRose-bloodBrown/30 text-blackRose-roseMauve hover:bg-blackRose-bloodBrown/50'
                                            }
                      ${updating ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                                    >
                                        {days} days
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-blackRose-trueBlack/40 rounded-lg border border-blackRose-bloodBrown/50">
                            <h5 className="font-medium text-blackRose-fg mb-2 flex items-center space-x-2">
                                <Trash2 className="h-4 w-4" />
                                <span>Purge Logs</span>
                            </h5>
                            <div className="space-y-2">
                                {[30, 60, 90, 180].map((days) => (
                                    <button
                                        key={days}
                                        onClick={() => purgeLogs(days)}
                                        disabled={updating}
                                        className={`
                      w-full px-3 py-1 rounded text-xs bg-red-600/20 text-red-400 
                      hover:bg-red-600/30 border border-red-600/50 transition-colors
                      ${updating ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                                    >
                                        Purge {days}d+
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-blackRose-trueBlack/40 rounded-lg border border-blackRose-bloodBrown/50">
                            <h5 className="font-medium text-blackRose-fg mb-2 flex items-center space-x-2">
                                <Download className="h-4 w-4" />
                                <span>Export</span>
                            </h5>
                            <div className="space-y-2">
                                <button
                                    onClick={() => window.open('/api/system/audit/logs?page_size=1000', '_blank')}
                                    className="w-full px-3 py-1 rounded text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/50 transition-colors"
                                >
                                    Export CSV
                                </button>
                                <button
                                    onClick={() => window.open('/api/system/audit/stats?hours=168', '_blank')}
                                    className="w-full px-3 py-1 rounded text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/50 transition-colors"
                                >
                                    Weekly Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Actions (if stats available) */}
            {stats && stats.top_actions.length > 0 && (
                <div className="pt-4 border-t border-blackRose-bloodBrown/50">
                    <h4 className="font-medium text-blackRose-fg mb-3 flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Top Actions (24h)</span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {stats.top_actions.slice(0, 8).map((action, index) => (
                            <div
                                key={action.action}
                                className="p-2 bg-blackRose-trueBlack/40 rounded border border-blackRose-bloodBrown/50"
                            >
                                <p className="text-xs text-blackRose-roseMauve/60 capitalize">
                                    {action.action.replace(/_/g, ' ')}
                                </p>
                                <p className="text-sm font-bold text-blackRose-fg">
                                    {action.count.toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditControlPanel;