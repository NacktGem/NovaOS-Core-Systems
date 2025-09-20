'use client';

import { useEffect, useState } from 'react';
import { Shield, ShieldAlert, ShieldOff, Eye, EyeOff, Ban, Target, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface LeakGuardSession {
    id: string;
    user_id: string | null;
    agent_id: string;
    session_start: string;
    flagged_at: string;
    flagged_reason: string;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    enforcement_status: 'active' | 'blackout' | 'revoked' | 'honeypot';
    content_preview: string | null;
    enforced_by: string | null;
    enforced_at: string | null;
}

interface LeakGuardAgentStatus {
    agent_id: string;
    agent_name: string;
    enforcement_mode: 'monitor' | 'enforce' | 'disabled';
    flagged_sessions: number;
    active_enforcements: number;
    last_activity: string | null;
}

export function LeakGuardPanel() {
    const [sessions, setSessions] = useState<LeakGuardSession[]>([]);
    const [agentStatus, setAgentStatus] = useState<LeakGuardAgentStatus[]>([]);
    const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('active');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSessions();
        fetchAgentStatus();
        const interval = setInterval(() => {
            fetchSessions();
            fetchAgentStatus();
        }, 15000); // Refresh every 15 seconds for real-time monitoring
        return () => clearInterval(interval);
    }, [selectedRiskLevel, selectedStatus]);

    const fetchSessions = async () => {
        try {
            const params = new URLSearchParams();
            if (selectedStatus !== 'all') params.append('status', selectedStatus);
            if (selectedRiskLevel !== 'all') params.append('risk_level', selectedRiskLevel);

            const response = await fetch(`/api/agents/leakguard/sessions?${params}`);
            if (!response.ok) throw new Error('Failed to fetch LeakGuard sessions');
            const data = await response.json();
            setSessions(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load LeakGuard data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAgentStatus = async () => {
        try {
            const response = await fetch('/api/agents/leakguard/status');
            if (!response.ok) throw new Error('Failed to fetch agent status');
            const data = await response.json();
            setAgentStatus(data);
        } catch (err) {
            console.error('Failed to fetch agent status:', err);
        }
    };

    const enforceAction = async (sessionId: string, action: 'blackout' | 'revoke' | 'honeypot' | 'restore', reason?: string) => {
        try {
            const response = await fetch('/api/agents/leakguard/enforce', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, action, reason }),
            });
            if (!response.ok) throw new Error('Failed to enforce action');

            // Refresh sessions and agent status
            await fetchSessions();
            await fetchAgentStatus();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to enforce action');
        }
    };

    const getRiskLevelColor = (level: string) => {
        switch (level) {
            case 'low': return 'bg-status-success-light text-status-success-dark';
            case 'medium': return 'bg-status-warning-light text-status-warning-dark';
            case 'high': return 'bg-status-danger-light text-status-danger-dark';
            case 'critical': return 'bg-status-danger text-white';
            default: return 'bg-blackRose-midnightNavy text-blackRose-fg';
        }
    };

    const getEnforcementColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-status-success-light text-status-success-dark';
            case 'blackout': return 'bg-blackRose-trueBlack text-status-warning border-status-warning';
            case 'revoked': return 'bg-status-danger-light text-status-danger-dark';
            case 'honeypot': return 'bg-studios-cipherCore-cyberBlue text-white';
            default: return 'bg-blackRose-midnightNavy text-blackRose-fg';
        }
    };

    const getEnforcementIcon = (status: string) => {
        switch (status) {
            case 'blackout': return <EyeOff className="h-4 w-4" />;
            case 'revoked': return <Ban className="h-4 w-4" />;
            case 'honeypot': return <Target className="h-4 w-4" />;
            default: return <Eye className="h-4 w-4" />;
        }
    };

    const getModeIcon = (mode: string) => {
        switch (mode) {
            case 'enforce': return <ShieldAlert className="h-4 w-4 text-status-danger" />;
            case 'monitor': return <Shield className="h-4 w-4 text-status-warning" />;
            case 'disabled': return <ShieldOff className="h-4 w-4 text-blackRose-slate" />;
            default: return <Shield className="h-4 w-4" />;
        }
    };

    const formatReason = (reason: string) => {
        return reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    if (error) {
        return (
            <Card className="p-6 border-status-danger bg-status-danger/5">
                <div className="text-center">
                    <AlertTriangle className="h-8 w-8 text-status-danger mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-blackRose-fg">LeakGuard Error</h3>
                    <p className="text-sm text-status-danger mt-1">{error}</p>
                </div>
            </Card>
        );
    }

    const activeSessions = sessions.filter(s => s.enforcement_status === 'active').length;
    const totalEnforcements = sessions.filter(s => s.enforcement_status !== 'active').length;
    const criticalSessions = sessions.filter(s => s.risk_level === 'critical').length;

    return (
        <div className="space-y-6">
            {/* LeakGuard Statistics Header */}
            <Card className="p-6 border-blackRose-midnightNavy bg-blackRose-deepCharcoal">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-blackRose-fg flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-status-danger" />
                        LeakGuard Enforcement
                    </h2>
                    <Badge className="bg-status-danger text-white">
                        {criticalSessions} Critical Sessions
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blackRose-fg">{sessions.length}</div>
                        <div className="text-xs text-blackRose-slate">Flagged Sessions</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-status-warning">{activeSessions}</div>
                        <div className="text-xs text-blackRose-slate">Active Monitoring</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-status-danger">{totalEnforcements}</div>
                        <div className="text-xs text-blackRose-slate">Under Enforcement</div>
                    </div>
                </div>
            </Card>

            {/* Agent Status Grid */}
            <Card className="p-6 border-blackRose-midnightNavy bg-blackRose-deepCharcoal">
                <h3 className="text-lg font-semibold text-blackRose-fg mb-4">Agent Enforcement Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {agentStatus.map((agent) => (
                        <div key={agent.agent_id} className="p-4 bg-blackRose-trueBlack rounded border border-blackRose-midnightNavy">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-blackRose-fg">{agent.agent_name}</h4>
                                {getModeIcon(agent.enforcement_mode)}
                            </div>
                            <div className="space-y-1 text-xs text-blackRose-slate">
                                <div className="flex justify-between">
                                    <span>Mode:</span>
                                    <span className={`font-medium ${agent.enforcement_mode === 'enforce' ? 'text-status-danger' :
                                            agent.enforcement_mode === 'monitor' ? 'text-status-warning' :
                                                'text-blackRose-slate'
                                        }`}>
                                        {agent.enforcement_mode}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Flagged:</span>
                                    <span className="text-blackRose-fg">{agent.flagged_sessions}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Enforced:</span>
                                    <span className="text-status-danger">{agent.active_enforcements}</span>
                                </div>
                                {agent.last_activity && (
                                    <div className="text-xs text-blackRose-slate pt-1">
                                        Last: {new Date(agent.last_activity).toLocaleTimeString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-2">
                    {[
                        { key: 'all', label: 'All Sessions' },
                        { key: 'active', label: 'Active' },
                        { key: 'blackout', label: 'Blackout' },
                        { key: 'revoked', label: 'Revoked' },
                        { key: 'honeypot', label: 'Honeypot' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setSelectedStatus(tab.key)}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${selectedStatus === tab.key
                                    ? 'bg-studios-cipherCore-cyberBlue text-white'
                                    : 'bg-blackRose-midnightNavy text-blackRose-slate hover:text-blackRose-fg'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    {[
                        { key: 'all', label: 'All Risk' },
                        { key: 'critical', label: 'Critical' },
                        { key: 'high', label: 'High' },
                        { key: 'medium', label: 'Medium' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setSelectedRiskLevel(tab.key)}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${selectedRiskLevel === tab.key
                                    ? 'bg-status-danger text-white'
                                    : 'bg-blackRose-midnightNavy text-blackRose-slate hover:text-blackRose-fg'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Flagged Sessions List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8 text-blackRose-slate">
                        Loading LeakGuard sessions...
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-blackRose-slate">
                        No sessions found for current filters.
                    </div>
                ) : (
                    sessions.map((session) => (
                        <Card key={session.id} className="p-4 border-blackRose-midnightNavy bg-blackRose-deepCharcoal">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className={`text-xs ${getRiskLevelColor(session.risk_level)}`}>
                                            {session.risk_level.toUpperCase()}
                                        </Badge>
                                        <Badge className={`text-xs border ${getEnforcementColor(session.enforcement_status)}`}>
                                            {getEnforcementIcon(session.enforcement_status)}
                                            <span className="ml-1">{session.enforcement_status.toUpperCase()}</span>
                                        </Badge>
                                        <span className="text-xs text-blackRose-slate">
                                            Agent: {session.agent_id}
                                        </span>
                                    </div>

                                    <div className="text-sm text-blackRose-fg">
                                        <span className="font-medium text-status-warning">
                                            {formatReason(session.flagged_reason)}
                                        </span>
                                    </div>

                                    {session.content_preview && (
                                        <div className="text-sm text-blackRose-slate bg-blackRose-trueBlack p-3 rounded border border-blackRose-midnightNavy">
                                            {session.content_preview}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-blackRose-slate">
                                        {session.user_id && <span>User: {session.user_id.substring(0, 8)}...</span>}
                                        <span>Started: {new Date(session.session_start).toLocaleString()}</span>
                                        <span>Flagged: {new Date(session.flagged_at).toLocaleString()}</span>
                                    </div>

                                    {session.enforced_by && (
                                        <div className="text-xs text-blackRose-slate">
                                            Enforced by {session.enforced_by} on {new Date(session.enforced_at!).toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                {/* Enforcement Action Buttons */}
                                <div className="flex flex-col gap-2">
                                    {session.enforcement_status === 'active' && (
                                        <>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-blackRose-midnightNavy text-blackRose-fg hover:bg-blackRose-trueBlack"
                                                            onClick={() => enforceAction(session.id, 'blackout', 'Visual content blocked')}
                                                        >
                                                            <EyeOff className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Blackout - Hide content</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-status-danger text-status-danger hover:bg-status-danger hover:text-white"
                                                            onClick={() => enforceAction(session.id, 'revoke', 'Session access revoked')}
                                                        >
                                                            <Ban className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Revoke - End session</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-studios-cipherCore-cyberBlue text-studios-cipherCore-cyberBlue hover:bg-studios-cipherCore-cyberBlue hover:text-white"
                                                            onClick={() => enforceAction(session.id, 'honeypot', 'Monitored interaction mode')}
                                                        >
                                                            <Target className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Honeypot - Monitor interactions</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </>
                                    )}

                                    {session.enforcement_status !== 'active' && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-status-success text-status-success hover:bg-status-success hover:text-white"
                                                        onClick={() => enforceAction(session.id, 'restore', 'Enforcement lifted')}
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Restore - Remove enforcement</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
