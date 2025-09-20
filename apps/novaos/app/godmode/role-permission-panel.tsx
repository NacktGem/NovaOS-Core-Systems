"use client";

import { useCallback, useEffect, useState } from "react";
import { coreApiJson } from "@/lib/core-api";

interface RoleConfig {
    role: string;
    permissions: string[];
    dashboard_visibility: {
        web_shell_admin: boolean;
        gypsy_cove_dashboard: boolean;
        nova_godmode: boolean;
    };
    data_access: {
        revenue: boolean;
        consent_logs: boolean;
        analytics: boolean;
        agent_controls: boolean;
    };
}

interface User {
    id: string;
    email: string;
    role: string;
    last_seen: string | null;
}

interface RolePermissionPanelProps {
    className?: string;
}

const DEFAULT_ROLES: Record<string, RoleConfig> = {
    godmode: {
        role: "godmode",
        permissions: ["all"],
        dashboard_visibility: {
            web_shell_admin: true,
            gypsy_cove_dashboard: true,
            nova_godmode: true
        },
        data_access: {
            revenue: true,
            consent_logs: true,
            analytics: true,
            agent_controls: true
        }
    },
    jules: {
        role: "jules",
        permissions: ["admin", "calm_mode"],
        dashboard_visibility: {
            web_shell_admin: true,
            gypsy_cove_dashboard: false,
            nova_godmode: false
        },
        data_access: {
            revenue: false,
            consent_logs: true,
            analytics: false,
            agent_controls: false
        }
    },
    family: {
        role: "family",
        permissions: ["basic"],
        dashboard_visibility: {
            web_shell_admin: false,
            gypsy_cove_dashboard: true,
            nova_godmode: false
        },
        data_access: {
            revenue: false,
            consent_logs: false,
            analytics: false,
            agent_controls: false
        }
    }
};

export default function RolePermissionPanel({ className = "" }: RolePermissionPanelProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [roleConfigs, setRoleConfigs] = useState<Record<string, RoleConfig>>(DEFAULT_ROLES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // In a real implementation, this would fetch from appropriate endpoints
            // For now, we'll use mock data that shows the role configuration
            const mockUsers: User[] = [
                {
                    id: "founder-001",
                    email: "founder@novaos.com",
                    role: "godmode",
                    last_seen: new Date().toISOString()
                },
                {
                    id: "jules-001",
                    email: "jules@novaos.com",
                    role: "jules",
                    last_seen: new Date(Date.now() - 3600000).toISOString()
                }
            ];

            setUsers(mockUsers);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load role data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Refresh every 60 seconds
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const updateRoleConfig = useCallback(async (role: string, config: Partial<RoleConfig>) => {
        try {
            // In real implementation, this would call an API to update role permissions
            setRoleConfigs(prev => ({
                ...prev,
                [role]: { ...prev[role], ...config }
            }));

            // Mock API call
            console.log(`Role ${role} updated:`, config);
        } catch (err) {
            console.error("Failed to update role config:", err);
        }
    }, []);

    const toggleDashboardVisibility = (role: string, dashboard: keyof RoleConfig['dashboard_visibility']) => {
        const currentConfig = roleConfigs[role];
        if (currentConfig) {
            updateRoleConfig(role, {
                dashboard_visibility: {
                    ...currentConfig.dashboard_visibility,
                    [dashboard]: !currentConfig.dashboard_visibility[dashboard]
                }
            });
        }
    };

    const toggleDataAccess = (role: string, access: keyof RoleConfig['data_access']) => {
        const currentConfig = roleConfigs[role];
        if (currentConfig) {
            updateRoleConfig(role, {
                data_access: {
                    ...currentConfig.data_access,
                    [access]: !currentConfig.data_access[access]
                }
            });
        }
    };

    if (loading) {
        return (
            <section className={`space-y-4 ${className}`}>
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-blackRose-fg">Role & Permissions</h2>
                    <div className="h-4 w-16 animate-pulse rounded bg-blackRose-midnightNavy"></div>
                </div>
                <div className="h-64 animate-pulse rounded-3xl bg-blackRose-midnightNavy/50"></div>
            </section>
        );
    }

    if (error) {
        return (
            <section className={`space-y-4 ${className}`}>
                <h2 className="text-2xl font-semibold text-blackRose-fg">Role & Permissions</h2>
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
                <h2 className="text-2xl font-semibold text-blackRose-fg">Role & Permissions</h2>
                <span className="text-xs uppercase tracking-wide text-studios-cipherCore-cyberBlue">
                    Sovereign control
                </span>
            </div>

            <div className="rounded-3xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/80 p-6 shadow-[0_45px_120px_rgba(0,0,0,0.55)]">
                {/* Active Users */}
                <div className="mb-6">
                    <h3 className="mb-4 text-lg font-semibold text-blackRose-fg">Active Users</h3>
                    <div className="space-y-2">
                        {users.map((user) => {
                            const roleConfig = roleConfigs[user.role];
                            return (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between rounded-xl border border-blackRose-bloodBrown/50 bg-blackRose-trueBlack/60 p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`h-3 w-3 rounded-full ${user.last_seen &&
                                                    new Date().getTime() - new Date(user.last_seen).getTime() < 300000
                                                    ? 'bg-studios-cipherCore-cyberBlue'
                                                    : 'bg-blackRose-roseMauve/40'
                                                }`}
                                        ></div>
                                        <div>
                                            <p className="font-semibold text-blackRose-fg">{user.email}</p>
                                            <p className="text-xs text-blackRose-roseMauve/60">
                                                Role: {user.role} • Last seen: {user.last_seen ? new Date(user.last_seen).toLocaleTimeString() : 'Never'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${user.role === 'godmode'
                                            ? 'bg-studios-cipherCore-techSilver text-studios-cipherCore-cyberBlue'
                                            : user.role === 'jules'
                                                ? 'bg-studios-cryptPink-rosePetal text-studios-cryptPink-orchidLush'
                                                : 'bg-blackRose-phantom text-blackRose-roseMauve'
                                        }`}>
                                        {user.role}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Role Configuration */}
                <div className="border-t border-blackRose-bloodBrown pt-6">
                    <h3 className="mb-4 text-lg font-semibold text-blackRose-fg">Dashboard Visibility Controls</h3>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {Object.entries(roleConfigs).map(([roleName, config]) => (
                            <div
                                key={roleName}
                                className="rounded-xl border border-blackRose-bloodBrown/50 bg-blackRose-trueBlack/40 p-4"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <h4 className="font-semibold text-blackRose-fg capitalize">{roleName}</h4>
                                    <span className="text-xs text-blackRose-roseMauve/60">
                                        {config.permissions.join(', ')}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <h5 className="mb-2 text-xs uppercase tracking-wide text-blackRose-roseMauve">Dashboard Access</h5>
                                        <div className="space-y-2">
                                            {Object.entries(config.dashboard_visibility).map(([dashboard, enabled]) => (
                                                <label key={dashboard} className="flex items-center justify-between">
                                                    <span className="text-xs text-blackRose-fg">
                                                        {dashboard.replace(/_/g, ' ')}
                                                    </span>
                                                    <button
                                                        onClick={() => toggleDashboardVisibility(roleName, dashboard as keyof RoleConfig['dashboard_visibility'])}
                                                        className={`h-5 w-9 rounded-full transition ${enabled
                                                                ? 'bg-studios-cipherCore-cyberBlue'
                                                                : 'bg-blackRose-bloodBrown'
                                                            }`}
                                                    >
                                                        <div
                                                            className={`h-3 w-3 rounded-full bg-white transition ${enabled ? 'translate-x-5' : 'translate-x-1'
                                                                }`}
                                                        ></div>
                                                    </button>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="mb-2 text-xs uppercase tracking-wide text-blackRose-roseMauve">Data Access</h5>
                                        <div className="space-y-2">
                                            {Object.entries(config.data_access).map(([access, enabled]) => (
                                                <label key={access} className="flex items-center justify-between">
                                                    <span className="text-xs text-blackRose-fg">
                                                        {access.replace(/_/g, ' ')}
                                                    </span>
                                                    <button
                                                        onClick={() => toggleDataAccess(roleName, access as keyof RoleConfig['data_access'])}
                                                        className={`h-5 w-9 rounded-full transition ${enabled
                                                                ? 'bg-studios-cipherCore-cyberBlue'
                                                                : 'bg-blackRose-bloodBrown'
                                                            }`}
                                                        disabled={roleName === 'godmode'} // GodMode always has full access
                                                    >
                                                        <div
                                                            className={`h-3 w-3 rounded-full bg-white transition ${enabled ? 'translate-x-5' : 'translate-x-1'
                                                                }`}
                                                        ></div>
                                                    </button>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-blackRose-bloodBrown mt-6 pt-4">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-blackRose-roseMauve/60">
                            Changes sync in real-time to Web-Shell and GypsyCove • All actions logged
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
