"use client";

import React, { useState } from "react";
import { Frame, Card, Toggle } from "../../shared/ui";

export default function NovaOSDashboard() {
    const [godModeEnabled, setGodModeEnabled] = useState(false);
    const [systemMonitoring, setSystemMonitoring] = useState(true);

    return (
        <div className="min-h-screen bg-gradient-to-br from-novaOS-blueLight to-novaOS-lavender p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <Frame variant="novaOS" size="lg" className="text-center">
                    <h1 className="text-3xl font-bold text-novaOS-blueDark mb-2">
                        NovaOS Command Center
                    </h1>
                    <p className="text-studios-inkSteel-steel">
                        Universal Operating System Management
                    </p>
                </Frame>

                {/* God Mode Control */}
                {godModeEnabled && (
                    <Frame variant="blackRose" size="md" glow className="animate-pulse">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-blackRose-roseMauve">
                                    🔥 God Mode Active
                                </h2>
                                <p className="text-blackRose-fg/70">
                                    Full system access enabled
                                </p>
                            </div>
                            <Toggle
                                checked={godModeEnabled}
                                onCheckedChange={setGodModeEnabled}
                                variant="blackRose"
                                size="lg"
                            />
                        </div>
                    </Frame>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* System Status */}
                    <Card
                        variant="novaOS"
                        header="System Status"
                        interactive
                    >
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-studios-inkSteel-steel">CPU Usage</span>
                                <span className="text-status-success-main font-mono">23%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-studios-inkSteel-steel">Memory</span>
                                <span className="text-status-warning-main font-mono">67%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-studios-inkSteel-steel">Network</span>
                                <span className="text-status-success-main font-mono">Active</span>
                            </div>
                        </div>
                    </Card>

                    {/* Controls */}
                    <Card
                        variant="novaOS"
                        header="System Controls"
                    >
                        <div className="space-y-4">
                            <Toggle
                                checked={systemMonitoring}
                                onCheckedChange={setSystemMonitoring}
                                variant="status"
                                label="System Monitoring"
                            />
                            <Toggle
                                checked={godModeEnabled}
                                onCheckedChange={setGodModeEnabled}
                                variant="blackRose"
                                label="God Mode"
                            />
                        </div>
                    </Card>

                    {/* Quick Actions */}
                    <Card
                        variant="novaOS"
                        header="Quick Actions"
                        footer="Last updated: 2 min ago"
                    >
                        <div className="space-y-2">
                            <button className="w-full p-2 rounded-lg bg-novaOS-coral hover:bg-novaOS-peach transition-colors text-white font-medium">
                                Deploy Services
                            </button>
                            <button className="w-full p-2 rounded-lg bg-studios-cipherCore-cyberBlue hover:bg-studios-cipherCore-emerald transition-colors text-white font-medium">
                                Run Diagnostics
                            </button>
                        </div>
                    </Card>

                </div>

            </div>
        </div>
    );
}
