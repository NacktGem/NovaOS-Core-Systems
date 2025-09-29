"use client";

import { useCallback, useEffect, useState } from "react";
import { coreApiJson } from "@/lib/core-api";

interface RevenueStats {
    total_revenue_cents: number;
    platform_cut_cents: number;
    creator_cut_cents: number;
    transaction_count: number;
    period: string;
}

interface Transaction {
    id: string;
    item_type: string;
    item_id: string;
    gross_cents: number;
    platform_cut_cents: number;
    creator_cut_cents: number;
    created_at: string;
    user_id: string;
}

interface ContentSale {
    id: string;
    sale_type: string; // "vault_unlock", "subscription", "inbox_content"
    content_id: string | null; // null for subscriptions
    content_type: string | null; // "photo", "video", "live_stream", null for subscriptions
    buyer_id: string;
    buyer_username: string | null;
    creator_id: string;
    creator_username: string;
    creator_studio: string; // "scarlet", "lightbox", "ink_steel", "expression", "cipher_core"
    sale_price_cents: number;
    platform_cut_cents: number;
    creator_cut_cents: number;
    sale_date: string;
    status: string; // "completed", "pending", "refunded", "failed"
    is_nsfw: boolean;
    consent_verified: boolean;
    recurring: boolean; // true for monthly subscriptions
    subscription_period: string | null; // "monthly" for recurring subscriptions
}

interface PayoutRecord {
    id: string;
    creator_id: string;
    creator_username: string;
    amount_cents: number;
    period_start: string;
    period_end: string;
    status: string;
    created_at: string;
    processed_at: string | null;
    payment_method: string | null;
    transaction_reference: string | null;
}

interface CreatorStats {
    creator_id: string;
    creator_username: string;
    creator_studio: string; // "scarlet", "lightbox", "ink_steel", "expression", "cipher_core"
    total_earnings_cents: number;
    total_sales: number;
    average_sale_cents: number;
    pending_payout_cents: number;
    last_sale_date: string | null;
    // Revenue breakdown by type
    vault_earnings_cents: number;
    subscription_earnings_cents: number;
    inbox_earnings_cents: number;
    // Subscription metrics
    active_subscribers: number;
    monthly_recurring_revenue_cents: number;
    // Content metrics
    nsfw_content_percentage: number;
    consent_verified: boolean;
    payout_threshold_met: boolean; // >= $50 USD
}

// Black Rose Collective User Management Interfaces
interface BlackRoseUser {
    id: string;
    username: string;
    display_name: string | null;
    creator_studio: string | null; // "scarlet", "lightbox", "ink_steel", "expression", "cipher_core"
    role: string; // "creator", "user"
    is_verified: boolean;
    consent_verified: boolean;
    total_earnings_cents: number;
    active_subscriptions: number;
    content_count: number;
    nsfw_content_percentage: number;
    last_active: string | null;
    created_at: string;
    profile_private: boolean;
    vault_locked: boolean;
}

interface UserSearchResult {
    users: BlackRoseUser[];
    total_count: number;
    page: number;
    has_more: boolean;
}

interface GodVaultProps {
    className?: string;
}

const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const getStudioDisplayName = (studio: string) => {
    const studioNames: Record<string, string> = {
        'scarlet': 'Scarlet Studio',
        'lightbox': 'Lightbox Studio',
        'ink_steel': 'Ink & Steel',
        'expression': 'Expression Studio',
        'cipher_core': 'Cipher Core'
    };
    return studioNames[studio] || studio;
};

const getSaleTypeDisplayName = (saleType: string) => {
    const saleTypeNames: Record<string, string> = {
        'vault_unlock': 'Vault Unlock',
        'subscription': 'Monthly Sub',
        'inbox_content': 'Inbox Purchase'
    };
    return saleTypeNames[saleType] || saleType;
};

const getSaleTypeColor = (saleType: string) => {
    const colors: Record<string, string> = {
        'vault_unlock': 'bg-status-success-dark/20 text-status-success border-status-success-dark',
        'subscription': 'bg-blackRose-roseMauve/20 text-blackRose-roseMauve border-blackRose-roseMauve',
        'inbox_content': 'bg-studios-cipherCore-cyberBlue/20 text-studios-cipherCore-cyberBlue border-studios-cipherCore-cyberBlue'
    };
    return colors[saleType] || 'bg-status-warning-dark/20 text-status-warning border-status-warning-dark';
};

const getStudioColor = (studio: string) => {
    const colors: Record<string, string> = {
        'scarlet': 'bg-red-500/20 text-red-400 border-red-500',
        'lightbox': 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
        'ink_steel': 'bg-gray-500/20 text-gray-400 border-gray-500',
        'expression': 'bg-purple-500/20 text-purple-400 border-purple-500',
        'cipher_core': 'bg-studios-cipherCore-cyberBlue/20 text-studios-cipherCore-cyberBlue border-studios-cipherCore-cyberBlue'
    };
    return colors[studio] || 'bg-blackRose-roseMauve/20 text-blackRose-roseMauve border-blackRose-roseMauve';
};

const PERIOD_LABELS = {
    daily: "Today",
    monthly: "This Month",
    all_time: "All Time"
};

export default function GodVault({ className = "" }: GodVaultProps) {
    const [dailyStats, setDailyStats] = useState<RevenueStats | null>(null);
    const [monthlyStats, setMonthlyStats] = useState<RevenueStats | null>(null);
    const [allTimeStats, setAllTimeStats] = useState<RevenueStats | null>(null);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [contentSales, setContentSales] = useState<ContentSale[]>([]);
    const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
    const [creatorStats, setCreatorStats] = useState<CreatorStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingPayout, setProcessingPayout] = useState<string | null>(null);

    // Black Rose Collective User Search
    const [userSearchQuery, setUserSearchQuery] = useState<string>("");
    const [userSearchResults, setUserSearchResults] = useState<BlackRoseUser[]>([]);
    const [userSearchLoading, setUserSearchLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<BlackRoseUser | null>(null);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [daily, monthly, allTime, transactions, sales, payoutData, creators] = await Promise.all([
                coreApiJson<RevenueStats>("/payments/revenue/stats?period=daily"),
                coreApiJson<RevenueStats>("/payments/revenue/stats?period=monthly"),
                coreApiJson<RevenueStats>("/payments/revenue/stats?period=all_time"),
                coreApiJson<Transaction[]>("/payments/revenue/transactions?limit=5"),
                coreApiJson<ContentSale[]>("/payments/sales?limit=8"),
                coreApiJson<PayoutRecord[]>("/payments/payouts?limit=6"),
                coreApiJson<CreatorStats[]>("/payments/creators/stats?limit=5&sort_by=earnings")
            ]);

            setDailyStats(daily);
            setMonthlyStats(monthly);
            setAllTimeStats(allTime);
            setRecentTransactions(transactions);
            setContentSales(sales);
            setPayouts(payoutData);
            setCreatorStats(creators);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load revenue data");
        } finally {
            setLoading(false);
        }
    }, []);

    const handlePayoutAction = useCallback(async (payoutId: string, action: string, notes?: string) => {
        try {
            setProcessingPayout(payoutId);

            await coreApiJson("/payments/payouts/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payout_id: payoutId, action, notes })
            });

            // Refresh data after action
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to process payout action");
        } finally {
            setProcessingPayout(null);
        }
    }, [fetchData]);

    // Black Rose Collective User Search Functions
    const searchUsers = useCallback(async (query: string) => {
        if (query.trim().length < 2) {
            setUserSearchResults([]);
            return;
        }

        try {
            setUserSearchLoading(true);
            const result = await coreApiJson<UserSearchResult>(`/payments/blackrose/users/search?query=${encodeURIComponent(query)}&limit=20`);
            setUserSearchResults(result.users);
        } catch (err) {
            console.error("Failed to search users:", err);
            setUserSearchResults([]);
        } finally {
            setUserSearchLoading(false);
        }
    }, []);

    const handleUserSelect = useCallback(async (user: BlackRoseUser) => {
        setSelectedUser(user);
        setShowUserDropdown(false);

        // Log the audit access
        try {
            await coreApiJson(`/payments/blackrose/users/${user.id}/audit`, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'profile_select',
                    reason: 'GodMode user search and selection'
                }),
            });
        } catch (err) {
            console.error("Failed to log audit:", err);
        }
    }, []);

    const handleProfileAccess = useCallback(async (userId: string, reason?: string) => {
        try {
            const profileData = await coreApiJson(`/payments/blackrose/users/${userId}/profile?reason=${encodeURIComponent(reason || 'GodMode profile access')}`) as { profile_url: string; vault_url: string };

            // In a real implementation, this would redirect to the profile
            // For now, we'll just show an alert with the profile URL
            const user = userSearchResults.find(u => u.id === userId) || selectedUser;
            alert(`Profile access granted for ${user?.username}!\n\nProfile URL: ${profileData.profile_url}\nVault URL: ${profileData.vault_url}\n\nAll security bypassed for auditing.`);

            return profileData;
        } catch (err) {
            console.error("Failed to access user profile:", err);
            throw err;
        }
    }, [userSearchResults, selectedUser]);

    useEffect(() => {
        fetchData();
        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    if (loading) {
        return (
            <section className={`space-y-4 ${className}`}>
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-blackRose-fg">GodVault Revenue</h2>
                    <div className="h-4 w-16 animate-pulse rounded bg-blackRose-midnightNavy"></div>
                </div>
                <div className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-32 animate-pulse rounded-3xl bg-blackRose-midnightNavy/50"></div>
                        ))}
                    </div>
                    <div className="h-48 animate-pulse rounded-3xl bg-blackRose-midnightNavy/50"></div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className={`space-y-4 ${className}`}>
                <h2 className="text-2xl font-semibold text-blackRose-fg">GodVault Revenue</h2>
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

    const stats = [dailyStats, monthlyStats, allTimeStats].filter(Boolean) as RevenueStats[];

    return (
        <section className={`space-y-4 ${className}`}>
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-blackRose-fg">GodVault Revenue</h2>
                <span className="text-xs uppercase tracking-wide text-studios-cipherCore-cyberBlue">
                    Black Rose Collective • 12% platform cut
                </span>
            </div>

            {/* Black Rose Collective User Search & Audit */}
            <div className="rounded-3xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/80 p-6 shadow-[0_45px_120px_rgba(0,0,0,0.55)]">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-blackRose-fg">User Audit & Profile Access</h3>
                    <span className="text-xs text-red-400 font-medium">⚡ GODMODE BYPASS ACTIVE</span>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    {/* User Search */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-blackRose-roseMauve">Search Users</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={userSearchQuery}
                                onChange={(e) => {
                                    setUserSearchQuery(e.target.value);
                                    searchUsers(e.target.value);
                                    setShowUserDropdown(true);
                                }}
                                onFocus={() => setShowUserDropdown(true)}
                                placeholder="Type username or display name..."
                                className="w-full rounded-xl border border-blackRose-bloodBrown bg-blackRose-trueBlack/60 px-4 py-3 text-sm text-blackRose-fg placeholder-blackRose-roseMauve/40 focus:border-studios-cipherCore-cyberBlue focus:outline-none focus:ring-2 focus:ring-studios-cipherCore-cyberBlue/20"
                            />

                            {/* Search Results Dropdown */}
                            {showUserDropdown && userSearchQuery.length >= 2 && (
                                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy shadow-lg">
                                    {userSearchLoading ? (
                                        <div className="p-3 text-center text-sm text-blackRose-roseMauve/60">
                                            Searching...
                                        </div>
                                    ) : userSearchResults.length === 0 ? (
                                        <div className="p-3 text-center text-sm text-blackRose-roseMauve/60">
                                            No users found
                                        </div>
                                    ) : (
                                        userSearchResults.map((user) => (
                                            <button
                                                key={user.id}
                                                onClick={() => handleUserSelect(user)}
                                                className="w-full border-b border-blackRose-bloodBrown/30 p-3 text-left hover:bg-blackRose-trueBlack/60 last:border-b-0"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-blackRose-fg">{user.username}</p>
                                                        {user.display_name && (
                                                            <p className="text-xs text-blackRose-roseMauve/60">{user.display_name}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <span className={`px-2 py-1 rounded border ${user.role === 'creator' ? 'bg-studios-cipherCore-cyberBlue/20 text-studios-cipherCore-cyberBlue border-studios-cipherCore-cyberBlue' : 'bg-blackRose-roseMauve/20 text-blackRose-roseMauve border-blackRose-roseMauve'
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                        {user.creator_studio && (
                                                            <span className={`px-2 py-1 rounded border ${getStudioColor(user.creator_studio)}`}>
                                                                {getStudioDisplayName(user.creator_studio)}
                                                            </span>
                                                        )}
                                                        {user.profile_private && <span className="text-yellow-400">🔒</span>}
                                                        {user.vault_locked && <span className="text-red-400">🔐</span>}
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected User Profile Access */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-blackRose-roseMauve">Selected User</label>
                        {selectedUser ? (
                            <div className="rounded-xl border border-blackRose-bloodBrown/50 bg-blackRose-trueBlack/60 p-4">
                                <div className="mb-3 flex items-start justify-between">
                                    <div>
                                        <h4 className="font-medium text-blackRose-fg">{selectedUser.username}</h4>
                                        {selectedUser.display_name && (
                                            <p className="text-sm text-blackRose-roseMauve/60">{selectedUser.display_name}</p>
                                        )}
                                        <div className="mt-1 flex items-center gap-2 text-xs">
                                            <span className={`px-2 py-1 rounded border ${selectedUser.role === 'creator' ? 'bg-studios-cipherCore-cyberBlue/20 text-studios-cipherCore-cyberBlue border-studios-cipherCore-cyberBlue' : 'bg-blackRose-roseMauve/20 text-blackRose-roseMauve border-blackRose-roseMauve'
                                                }`}>
                                                {selectedUser.role}
                                            </span>
                                            {selectedUser.creator_studio && (
                                                <span className={`px-2 py-1 rounded border ${getStudioColor(selectedUser.creator_studio)}`}>
                                                    {getStudioDisplayName(selectedUser.creator_studio)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-blackRose-roseMauve/60">
                                        <p>Earnings: {formatCurrency(selectedUser.total_earnings_cents)}</p>
                                        <p>Content: {selectedUser.content_count} items</p>
                                        {selectedUser.nsfw_content_percentage > 0 && (
                                            <p className="text-red-400">NSFW: {selectedUser.nsfw_content_percentage.toFixed(0)}%</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleProfileAccess(selectedUser.id, 'Profile inspection')}
                                        className="flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors bg-studios-cipherCore-cyberBlue/20 text-studios-cipherCore-cyberBlue border border-studios-cipherCore-cyberBlue hover:bg-studios-cipherCore-cyberBlue/40"
                                    >
                                        🔍 Access Profile
                                    </button>
                                    <button
                                        onClick={() => handleProfileAccess(selectedUser.id, 'Vault audit and content review')}
                                        className="flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors bg-status-warning-dark/20 text-status-warning border border-status-warning-dark hover:bg-status-warning-dark/40"
                                    >
                                        🔐 Bypass Vault
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-blackRose-bloodBrown/30 bg-blackRose-trueBlack/30 p-4 text-center text-sm text-blackRose-roseMauve/60">
                                Search and select a user to access their profile
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Black Rose Collective Revenue Analytics */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-blackRose-fg">Black Rose Collective Revenue</h3>
                <div className="text-right text-xs text-blackRose-roseMauve/60">
                    <p>House of Roses Studios</p>
                    <p>Vault • Subscriptions • Inbox Sales</p>
                </div>
            </div>

            {/* Revenue Stats Cards */}
            <div className="grid gap-4 lg:grid-cols-3">
                {stats.map((stat) => (
                    <div
                        key={stat.period}
                        className="rounded-3xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/80 p-6 shadow-[0_45px_120px_rgba(0,0,0,0.55)]"
                    >
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-blackRose-roseMauve">
                                    {PERIOD_LABELS[stat.period as keyof typeof PERIOD_LABELS]}
                                </h3>
                                <span className="text-xs text-studios-cipherCore-cyberBlue">
                                    {stat.transaction_count} transactions
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-2xl font-semibold text-blackRose-fg">
                                        {formatCurrency(stat.total_revenue_cents)}
                                    </p>
                                    <p className="text-xs text-blackRose-roseMauve/60">Gross Revenue</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="font-medium text-studios-cipherCore-cyberBlue">
                                            {formatCurrency(stat.platform_cut_cents)}
                                        </p>
                                        <p className="text-xs text-blackRose-roseMauve/60">Platform (12%)</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-blackRose-fg">
                                            {formatCurrency(stat.creator_cut_cents)}
                                        </p>
                                        <p className="text-xs text-blackRose-roseMauve/60">Creator (88%)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Transactions */}
            {recentTransactions.length > 0 && (
                <div className="rounded-3xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/80 p-6 shadow-[0_45px_120px_rgba(0,0,0,0.55)]">
                    <h3 className="mb-4 text-lg font-semibold text-blackRose-fg">Recent Transactions</h3>
                    <div className="space-y-3">
                        {recentTransactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="flex items-center justify-between rounded-xl border border-blackRose-bloodBrown/50 bg-blackRose-trueBlack/60 p-4"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full border border-blackRose-bloodBrown bg-blackRose-midnightNavy px-2 py-1 text-xs uppercase tracking-wide text-blackRose-roseMauve">
                                            {transaction.item_type}
                                        </span>
                                        <span className="text-sm text-blackRose-fg">{transaction.item_id}</span>
                                    </div>
                                    <p className="mt-1 text-xs text-blackRose-roseMauve/60">
                                        {new Date(transaction.created_at).toLocaleDateString()} • User {transaction.user_id.substring(0, 8)}...
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-blackRose-fg">
                                        {formatCurrency(transaction.gross_cents)}
                                    </p>
                                    <p className="text-xs text-studios-cipherCore-cyberBlue">
                                        Platform: {formatCurrency(transaction.platform_cut_cents)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Enhanced Content Sales and Payouts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Sales Ledger */}
                <div className="rounded-3xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/80 p-6 shadow-[0_45px_120px_rgba(0,0,0,0.55)]">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-blackRose-fg">Content Sales</h3>
                        <span className="text-xs text-studios-cipherCore-cyberBlue">
                            {contentSales.length} recent sales
                        </span>
                    </div>
                    <div className="space-y-3">
                        {contentSales.length === 0 ? (
                            <p className="text-sm text-blackRose-roseMauve/60">No recent sales data available</p>
                        ) : (
                            contentSales.map((sale) => (
                                <div
                                    key={sale.id}
                                    className="rounded-xl border border-blackRose-bloodBrown/50 bg-blackRose-trueBlack/60 p-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {/* Sale Type Badge */}
                                                <span className={`rounded-full px-2 py-1 text-xs font-medium uppercase tracking-wide border ${getSaleTypeColor(sale.sale_type)}`}>
                                                    {getSaleTypeDisplayName(sale.sale_type)}
                                                </span>

                                                {/* Content Type Badge (only for vault/inbox) */}
                                                {sale.content_type && (
                                                    <span className={`rounded px-2 py-1 text-xs border ${sale.content_type === 'photo' ? 'bg-green-500/20 text-green-400 border-green-500' :
                                                        sale.content_type === 'video' ? 'bg-blue-500/20 text-blue-400 border-blue-500' :
                                                            'bg-purple-500/20 text-purple-400 border-purple-500'
                                                        }`}>
                                                        {sale.content_type}
                                                    </span>
                                                )}

                                                {/* Studio Badge */}
                                                <span className={`rounded px-2 py-1 text-xs border ${getStudioColor(sale.creator_studio)}`}>
                                                    {getStudioDisplayName(sale.creator_studio)}
                                                </span>

                                                {/* Status Badge */}
                                                <span className={`text-xs px-2 py-1 rounded border ${sale.status === 'completed' ? 'bg-status-success-dark/20 text-status-success border-status-success-dark' :
                                                    sale.status === 'pending' ? 'bg-status-warning-dark/20 text-status-warning border-status-warning-dark' :
                                                        'bg-status-danger-dark/20 text-status-danger border-status-danger-dark'
                                                    }`}>
                                                    {sale.status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-blackRose-fg mb-1">
                                                <span className="font-medium">{sale.creator_username}</span> → <span>{sale.buyer_username || 'Anonymous'}</span>
                                            </div>
                                            <div className="text-xs text-blackRose-roseMauve/60 space-x-2">
                                                {/* Content ID for vault/inbox purchases */}
                                                {sale.content_id && <span>{sale.content_id}</span>}

                                                {/* Recurring indicator for subscriptions */}
                                                {sale.recurring && (
                                                    <span className="text-blackRose-roseMauve font-medium">
                                                        • Monthly Recurring
                                                    </span>
                                                )}

                                                {/* NSFW indicator */}
                                                {sale.is_nsfw && (
                                                    <span className="text-red-400 font-medium">
                                                        • NSFW {sale.consent_verified ? '✓' : '⚠️'}
                                                    </span>
                                                )}

                                                <span>• {new Date(sale.sale_date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-blackRose-fg">
                                                {formatCurrency(sale.sale_price_cents)}
                                            </p>
                                            <div className="text-xs text-studios-cipherCore-cyberBlue">
                                                Platform: {formatCurrency(sale.platform_cut_cents)}
                                            </div>
                                            <div className="text-xs text-blackRose-roseMauve/60">
                                                Creator: {formatCurrency(sale.creator_cut_cents)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Payout Manager */}
                <div className="rounded-3xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/80 p-6 shadow-[0_45px_120px_rgba(0,0,0,0.55)]">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-blackRose-fg">Creator Payouts</h3>
                        <span className="text-xs text-studios-cipherCore-cyberBlue">
                            {payouts.filter(p => p.status === 'pending').length} pending
                        </span>
                    </div>
                    <div className="space-y-3">
                        {payouts.length === 0 ? (
                            <p className="text-sm text-blackRose-roseMauve/60">No payout data available</p>
                        ) : (
                            payouts.map((payout) => (
                                <div
                                    key={payout.id}
                                    className="rounded-xl border border-blackRose-bloodBrown/50 bg-blackRose-trueBlack/60 p-4"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-medium text-blackRose-fg">{payout.creator_username}</span>
                                                <span className={`text-xs px-2 py-1 rounded border ${payout.status === 'pending' ? 'bg-status-warning-dark/20 text-status-warning border-status-warning-dark' :
                                                    payout.status === 'processing' ? 'bg-studios-cipherCore-cyberBlue/20 text-studios-cipherCore-cyberBlue border-studios-cipherCore-cyberBlue' :
                                                        payout.status === 'completed' ? 'bg-status-success-dark/20 text-status-success border-status-success-dark' :
                                                            'bg-status-danger-dark/20 text-status-danger border-status-danger-dark'
                                                    }`}>
                                                    {payout.status}
                                                </span>
                                            </div>
                                            <div className="text-xs text-blackRose-roseMauve/60">
                                                {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                                                {payout.payment_method && (
                                                    <span className="ml-2">• {payout.payment_method}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-blackRose-fg">
                                                {formatCurrency(payout.amount_cents)}
                                            </p>
                                            <div className="text-xs text-blackRose-roseMauve/60">
                                                Created: {new Date(payout.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payout Action Buttons */}
                                    {payout.status === 'pending' && (
                                        <div className="flex gap-2 pt-2 border-t border-blackRose-bloodBrown/30">
                                            <button
                                                onClick={() => handlePayoutAction(payout.id, 'approve')}
                                                disabled={processingPayout === payout.id}
                                                className="flex-1 px-3 py-1 text-xs font-medium rounded transition-colors bg-status-success-dark/20 text-status-success border border-status-success-dark hover:bg-status-success-dark/40 disabled:opacity-50"
                                            >
                                                {processingPayout === payout.id ? 'Processing...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={() => handlePayoutAction(payout.id, 'mark_completed')}
                                                disabled={processingPayout === payout.id}
                                                className="flex-1 px-3 py-1 text-xs font-medium rounded transition-colors bg-studios-cipherCore-cyberBlue/20 text-studios-cipherCore-cyberBlue border border-studios-cipherCore-cyberBlue hover:bg-studios-cipherCore-cyberBlue/40 disabled:opacity-50"
                                            >
                                                Mark Complete
                                            </button>
                                        </div>
                                    )}

                                    {payout.status === 'processing' && (
                                        <div className="pt-2 border-t border-blackRose-bloodBrown/30">
                                            <button
                                                onClick={() => handlePayoutAction(payout.id, 'mark_completed')}
                                                disabled={processingPayout === payout.id}
                                                className="w-full px-3 py-1 text-xs font-medium rounded transition-colors bg-studios-cipherCore-cyberBlue/20 text-studios-cipherCore-cyberBlue border border-studios-cipherCore-cyberBlue hover:bg-studios-cipherCore-cyberBlue/40 disabled:opacity-50"
                                            >
                                                {processingPayout === payout.id ? 'Processing...' : 'Mark Complete'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Creator Statistics Dashboard */}
            {creatorStats.length > 0 && (
                <div className="rounded-3xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/80 p-6 shadow-[0_45px_120px_rgba(0,0,0,0.55)]">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-blackRose-fg">Top Creators</h3>
                        <span className="text-xs text-studios-cipherCore-cyberBlue">
                            Performance metrics
                        </span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        {creatorStats.map((creator) => (
                            <div
                                key={creator.creator_id}
                                className="rounded-xl border border-blackRose-bloodBrown/50 bg-blackRose-trueBlack/60 p-4"
                            >
                                <div className="text-center">
                                    <div className="mb-3">
                                        <h4 className="font-medium text-blackRose-fg mb-1">{creator.creator_username}</h4>
                                        <span className={`inline-block px-2 py-1 text-xs rounded border ${getStudioColor(creator.creator_studio)}`}>
                                            {getStudioDisplayName(creator.creator_studio)}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        {/* Total Earnings */}
                                        <div>
                                            <p className="font-semibold text-studios-cipherCore-cyberBlue text-lg">
                                                {formatCurrency(creator.total_earnings_cents)}
                                            </p>
                                            <p className="text-xs text-blackRose-roseMauve/60">Total Earnings</p>
                                        </div>

                                        {/* Revenue Breakdown */}
                                        <div className="grid grid-cols-3 gap-1 text-xs bg-blackRose-midnightNavy/40 rounded p-2">
                                            <div className="text-center">
                                                <p className="font-medium text-green-400">{formatCurrency(creator.vault_earnings_cents)}</p>
                                                <p className="text-blackRose-roseMauve/60">Vault</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-medium text-blackRose-roseMauve">{formatCurrency(creator.subscription_earnings_cents)}</p>
                                                <p className="text-blackRose-roseMauve/60">Subs</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-medium text-studios-cipherCore-cyberBlue">{formatCurrency(creator.inbox_earnings_cents)}</p>
                                                <p className="text-blackRose-roseMauve/60">Inbox</p>
                                            </div>
                                        </div>

                                        {/* Sales & Subscription Metrics */}
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <p className="font-medium text-blackRose-fg">{creator.total_sales}</p>
                                                <p className="text-blackRose-roseMauve/60">Sales</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-blackRose-fg">{creator.active_subscribers}</p>
                                                <p className="text-blackRose-roseMauve/60">Subscribers</p>
                                            </div>
                                        </div>

                                        {/* Monthly Recurring Revenue */}
                                        {creator.monthly_recurring_revenue_cents > 0 && (
                                            <div className="text-xs">
                                                <p className="font-medium text-blackRose-roseMauve">{formatCurrency(creator.monthly_recurring_revenue_cents)}/mo</p>
                                                <p className="text-blackRose-roseMauve/60">Recurring Revenue</p>
                                            </div>
                                        )}

                                        {/* Content & Compliance Indicators */}
                                        <div className="flex items-center justify-center gap-2 text-xs">
                                            {creator.nsfw_content_percentage > 0 && (
                                                <span className="text-red-400">
                                                    {creator.nsfw_content_percentage.toFixed(0)}% NSFW
                                                </span>
                                            )}
                                            {creator.consent_verified && (
                                                <span className="text-green-400">✓ Verified</span>
                                            )}
                                        </div>

                                        {/* Pending Payout Status */}
                                        {creator.pending_payout_cents > 0 && (
                                            <div className={`pt-2 border-t border-blackRose-bloodBrown/30 ${!creator.payout_threshold_met ? 'opacity-60' : ''}`}>
                                                <p className={`font-medium text-xs ${creator.payout_threshold_met ? 'text-status-warning' : 'text-blackRose-roseMauve/60'}`}>
                                                    {formatCurrency(creator.pending_payout_cents)} pending
                                                    {!creator.payout_threshold_met && <span className="ml-1">(Under $50)</span>}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
