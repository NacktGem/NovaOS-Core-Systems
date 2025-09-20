"use client";

import { useCallback, useEffect, useState } from "react";
import { coreApiJson } from "@/lib/core-api";

interface ConsentRecord {
    id: string;
    user_id: string;
    partner_name: string;
    content_ids: string[];
    signed_at: string | null;
    meta: Record<string, unknown> | null;
    created_at: string;
}

interface CompliancePanelProps {
    className?: string;
}

export default function CompliancePanel({ className = "" }: CompliancePanelProps) {
    const [consents, setConsents] = useState<ConsentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await coreApiJson<ConsentRecord[]>("/consent/all");
            setConsents(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load consent data");
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

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Pending";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getComplianceStatus = (consent: ConsentRecord) => {
        if (!consent.signed_at) return { status: "pending", color: "status-warning" };
        if (consent.content_ids.length === 0) return { status: "incomplete", color: "status-danger" };
        return { status: "active", color: "studios-cipherCore-cyberBlue" };
    };

    if (loading) {
        return (
            <section className={`space-y-4 ${className}`}>
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-blackRose-fg">Consent & Compliance</h2>
                    <div className="h-4 w-16 animate-pulse rounded bg-blackRose-midnightNavy"></div>
                </div>
                <div className="h-64 animate-pulse rounded-3xl bg-blackRose-midnightNavy/50"></div>
            </section>
        );
    }

    if (error) {
        return (
            <section className={`space-y-4 ${className}`}>
                <h2 className="text-2xl font-semibold text-blackRose-fg">Consent & Compliance</h2>
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

    const pendingConsents = consents.filter(c => !c.signed_at);
    const activeConsents = consents.filter(c => c.signed_at);

    return (
        <section className={`space-y-4 ${className}`}>
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-blackRose-fg">Consent & Compliance</h2>
                <div className="flex items-center gap-4 text-xs uppercase tracking-wide">
                    <span className="text-status-warning-light">
                        {pendingConsents.length} pending
                    </span>
                    <span className="text-studios-cipherCore-cyberBlue">
                        {activeConsents.length} active
                    </span>
                </div>
            </div>

            <div className="rounded-3xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/80 shadow-[0_45px_120px_rgba(0,0,0,0.55)]">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 divide-x divide-blackRose-bloodBrown border-b border-blackRose-bloodBrown">
                    <div className="p-6 text-center">
                        <div className="text-2xl font-semibold text-blackRose-fg">{consents.length}</div>
                        <div className="text-xs uppercase tracking-wide text-blackRose-roseMauve">Total Records</div>
                    </div>
                    <div className="p-6 text-center">
                        <div className="text-2xl font-semibold text-status-warning-light">{pendingConsents.length}</div>
                        <div className="text-xs uppercase tracking-wide text-blackRose-roseMauve">Pending Review</div>
                    </div>
                    <div className="p-6 text-center">
                        <div className="text-2xl font-semibold text-studios-cipherCore-cyberBlue">{activeConsents.length}</div>
                        <div className="text-xs uppercase tracking-wide text-blackRose-roseMauve">Fully Compliant</div>
                    </div>
                </div>

                {/* Recent Records */}
                <div className="p-6">
                    <h3 className="mb-4 text-lg font-semibold text-blackRose-fg">Recent Submissions</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {consents.slice(0, 10).map((consent) => {
                            const { status, color } = getComplianceStatus(consent);
                            return (
                                <div
                                    key={consent.id}
                                    className="flex items-center justify-between rounded-xl border border-blackRose-bloodBrown/50 bg-blackRose-trueBlack/60 p-4"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex h-2 w-2 rounded-full bg-${color}`}></span>
                                            <span className="font-semibold text-blackRose-fg">
                                                {consent.partner_name}
                                            </span>
                                            <span className={`rounded-full border border-blackRose-bloodBrown px-2 py-0.5 text-xs uppercase tracking-wide text-${color}`}>
                                                {status}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex items-center gap-4 text-xs text-blackRose-roseMauve/60">
                                            <span>User: {consent.user_id.substring(0, 8)}...</span>
                                            <span>{consent.content_ids.length} content IDs</span>
                                            <span>Signed: {formatDate(consent.signed_at)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-blackRose-roseMauve/60">
                                            {formatDate(consent.created_at)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {consents.length === 0 && (
                            <div className="py-8 text-center">
                                <div className="text-blackRose-roseMauve/60">No consent records found</div>
                                <div className="mt-1 text-xs text-blackRose-roseMauve/40">
                                    Consent forms will appear here once users submit them
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="border-t border-blackRose-bloodBrown p-6">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-blackRose-roseMauve/60">
                            Auto-refresh every 60 seconds • Last updated: {new Date().toLocaleTimeString()}
                        </div>
                        <button
                            onClick={fetchData}
                            className="rounded-full border border-blackRose-bloodBrown bg-blackRose-trueBlack px-4 py-2 text-xs text-blackRose-fg hover:bg-blackRose-midnightNavy"
                        >
                            Refresh Now
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
