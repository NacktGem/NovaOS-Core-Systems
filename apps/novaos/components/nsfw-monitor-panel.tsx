'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface NSFWFlaggedContent {
    id: string;
    content_type: 'image' | 'text' | 'video';
    content_snippet: string | null;
    user_id: string | null;
    agent_id: string | null;
    model_confidence: number;
    model_name: string;
    flagged_at: string;
    status: 'pending' | 'approved' | 'rejected' | 'escalated';
    reviewed_by: string | null;
    reviewed_at: string | null;
    consent_verified: boolean | null;
}

interface NSFWStats {
    total_flagged: number;
    pending_review: number;
    approved: number;
    rejected: number;
    escalated: number;
    consent_violations: number;
    top_models: Array<{ model_name: string; detections: number; accuracy: number }>;
    flagging_rate_24h: number;
    last_updated: string;
}

export function NSFWMonitorPanel() {
    const [flaggedContent, setFlaggedContent] = useState<NSFWFlaggedContent[]>([]);
    const [stats, setStats] = useState<NSFWStats | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('pending');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [consentVerificationResults, setConsentVerificationResults] = useState<any>(null);
    const [isVerifyingConsent, setIsVerifyingConsent] = useState(false);

    useEffect(() => {
        fetchFlaggedContent();
        fetchStats();
        const interval = setInterval(() => {
            fetchFlaggedContent();
            fetchStats();
        }, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [selectedStatus]);

    const fetchFlaggedContent = async () => {
        try {
            const params = selectedStatus !== 'all' ? `?status=${selectedStatus}` : '';
            const response = await fetch(`/api/analytics/nsfw/flagged${params}`);
            if (!response.ok) throw new Error('Failed to fetch flagged content');
            const data = await response.json();
            setFlaggedContent(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load NSFW data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/analytics/nsfw/stats');
            if (!response.ok) throw new Error('Failed to fetch NSFW stats');
            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch NSFW stats:', err);
        }
    };

    const bulkVerifyConsent = async () => {
        setIsVerifyingConsent(true);
        try {
            const contentIds = flaggedContent.map(item => item.id);
            const response = await fetch('/api/analytics/nsfw/verify-consent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contentIds),
            });
            if (!response.ok) throw new Error('Failed to verify consent');

            const results = await response.json();
            setConsentVerificationResults(results);

            // Refresh the flagged content to update consent status
            await fetchFlaggedContent();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify consent');
        } finally {
            setIsVerifyingConsent(false);
        }
    };

    const takeAction = async (contentId: string, action: 'approve' | 'reject' | 'escalate', notes?: string) => {
        try {
            const response = await fetch('/api/analytics/nsfw/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content_id: contentId, action, notes }),
            });
            if (!response.ok) throw new Error('Failed to take action');

            // Refresh the content list
            await fetchFlaggedContent();
            await fetchStats();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to take action');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-status-warning-light text-status-warning-dark';
            case 'approved': return 'bg-status-success-light text-status-success-dark';
            case 'rejected': return 'bg-status-danger-light text-status-danger-dark';
            case 'escalated': return 'bg-studios-cipherCore-cyberBlue text-white';
            default: return 'bg-blackRose-midnightNavy text-blackRose-fg';
        }
    };

    const getRiskColor = (confidence: number) => {
        if (confidence >= 0.9) return 'text-status-danger';
        if (confidence >= 0.7) return 'text-status-warning';
        return 'text-status-success';
    };

    const formatConfidence = (confidence: number) => `${(confidence * 100).toFixed(1)}%`;

    const getContentPreview = (item: NSFWFlaggedContent) => {
        if (item.content_type === 'text') {
            return item.content_snippet?.substring(0, 100) + '...';
        }
        return `${item.content_type.toUpperCase()} content`;
    };

    if (error) {
        return (
            <Card className="p-6 border-status-danger bg-status-danger/5">
                <div className="text-center">
                    <AlertTriangle className="h-8 w-8 text-status-danger mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-blackRose-fg">NSFW Monitor Error</h3>
                    <p className="text-sm text-status-danger mt-1">{error}</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* NSFW Statistics Header */}
            {stats && (
                <Card className="p-6 border-blackRose-midnightNavy bg-blackRose-deepCharcoal">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-blackRose-fg flex items-center gap-2">
                            <Shield className="h-5 w-5 text-status-danger" />
                            NSFW Content Monitor
                        </h2>
                        <Badge className="bg-status-warning text-status-warning-dark">
                            {stats.flagging_rate_24h.toFixed(2)}% flagging rate
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blackRose-fg">{stats.total_flagged}</div>
                            <div className="text-xs text-blackRose-slate">Total Flagged</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-status-warning">{stats.pending_review}</div>
                            <div className="text-xs text-blackRose-slate">Pending Review</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-status-danger">{stats.consent_violations}</div>
                            <div className="text-xs text-blackRose-slate">Consent Violations</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-studios-cipherCore-cyberBlue">{stats.escalated}</div>
                            <div className="text-xs text-blackRose-slate">Escalated</div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Filter Tabs and Bulk Actions */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2 border-b border-blackRose-midnightNavy">
                        {[
                            { key: 'pending', label: 'Pending', count: stats?.pending_review },
                            { key: 'escalated', label: 'Escalated', count: stats?.escalated },
                            { key: 'all', label: 'All Content', count: stats?.total_flagged },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setSelectedStatus(tab.key)}
                                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${selectedStatus === tab.key
                                        ? 'text-blackRose-fg border-studios-cipherCore-cyberBlue'
                                        : 'text-blackRose-slate border-transparent hover:text-blackRose-fg'
                                    }`}
                            >
                                {tab.label}
                                {tab.count !== undefined && (
                                    <Badge className="ml-2 bg-blackRose-midnightNavy text-blackRose-fg text-xs">
                                        {tab.count}
                                    </Badge>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Bulk Consent Verification */}
                    {flaggedContent.length > 0 && (
                        <Button
                            onClick={bulkVerifyConsent}
                            disabled={isVerifyingConsent}
                            className="bg-status-warning hover:bg-status-warning/80 text-status-warning-dark"
                            size="sm"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isVerifyingConsent ? 'animate-spin' : ''}`} />
                            {isVerifyingConsent ? 'Verifying...' : 'Verify Consent'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Flagged Content List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8 text-blackRose-slate">
                        Loading NSFW flagged content...
                    </div>
                ) : flaggedContent.length === 0 ? (
                    <div className="text-center py-8 text-blackRose-slate">
                        No flagged content found for &quot;{selectedStatus}&quot; status.
                    </div>
                ) : (
                    flaggedContent.map((item) => (
                        <Card key={item.id} className="p-4 border-blackRose-midnightNavy bg-blackRose-deepCharcoal">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </Badge>
                                        <Badge className="bg-blackRose-midnightNavy text-blackRose-fg text-xs">
                                            {item.content_type}
                                        </Badge>
                                        <span className="text-xs text-blackRose-slate">
                                            {item.model_name}
                                        </span>
                                        <span className={`text-xs font-semibold ${getRiskColor(item.model_confidence)}`}>
                                            {formatConfidence(item.model_confidence)}
                                        </span>
                                    </div>

                                    <div className="text-sm text-blackRose-fg">
                                        {getContentPreview(item)}
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-blackRose-slate">
                                        {item.user_id && <span>User: {item.user_id.substring(0, 8)}...</span>}
                                        {item.agent_id && <span>Agent: {item.agent_id}</span>}
                                        <span>Flagged: {new Date(item.flagged_at).toLocaleString()}</span>
                                    </div>

                                    {/* Consent Verification Status */}
                                    <div className="flex items-center gap-2">
                                        {item.consent_verified === true && (
                                            <Badge className="bg-status-success-light text-status-success-dark text-xs">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Consent Verified
                                            </Badge>
                                        )}
                                        {item.consent_verified === false && (
                                            <Badge className="bg-status-danger-light text-status-danger-dark text-xs">
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Consent Violation
                                            </Badge>
                                        )}
                                        {item.consent_verified === null && (
                                            <Badge className="bg-status-warning-light text-status-warning-dark text-xs">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                Consent Unverified
                                            </Badge>
                                        )}
                                    </div>

                                    {item.reviewed_by && (
                                        <div className="text-xs text-blackRose-slate">
                                            Reviewed by {item.reviewed_by} on {new Date(item.reviewed_at!).toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                {item.status === 'pending' && (
                                    <div className="flex flex-col gap-2">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-status-success text-status-success hover:bg-status-success hover:text-white"
                                                        onClick={() => takeAction(item.id, 'approve')}
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Approve Content</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-status-danger text-status-danger hover:bg-status-danger hover:text-white"
                                                        onClick={() => takeAction(item.id, 'reject')}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Reject Content</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-studios-cipherCore-cyberBlue text-studios-cipherCore-cyberBlue hover:bg-studios-cipherCore-cyberBlue hover:text-white"
                                                        onClick={() => takeAction(item.id, 'escalate')}
                                                    >
                                                        <AlertTriangle className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Escalate to Jules</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Top Models Performance */}
            {stats && stats.top_models.length > 0 && (
                <Card className="p-6 border-blackRose-midnightNavy bg-blackRose-deepCharcoal">
                    <h3 className="text-lg font-semibold text-blackRose-fg mb-4">Model Performance</h3>
                    <div className="grid gap-3">
                        {stats.top_models.map((model) => (
                            <div key={model.model_name} className="flex items-center justify-between p-3 bg-blackRose-trueBlack rounded">
                                <div>
                                    <div className="text-sm font-medium text-blackRose-fg">{model.model_name}</div>
                                    <div className="text-xs text-blackRose-slate">{model.detections} detections</div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-semibold ${getRiskColor(model.accuracy)}`}>
                                        {formatConfidence(model.accuracy)}
                                    </div>
                                    <div className="text-xs text-blackRose-slate">accuracy</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
