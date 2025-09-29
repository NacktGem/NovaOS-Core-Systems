"use client";

import React, { useState } from "react";
// import { Frame, Card, Toggle } from '../../shared/ui';

export default function GypsyCoveStudio() {
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [notifications, setNotifications] = useState(true);

    return (
        <div className="min-h-screen bg-gradient-to-br from-novaOS-blueLight via-studios-lightboxStudio-pearl to-studios-expression-ivory p-8">
            <div className="max-w-8xl mx-auto space-y-6">

                {/* Header */}
                <Frame variant="novaOS" size="lg" className="text-center">
                    <h1 className="text-4xl font-bold text-novaOS-blueDark mb-2">
                        GypsyCove Studio
                    </h1>
                    <p className="text-studios-inkSteel-steel">
                        Creative Management & Analytics Dashboard
                    </p>
                </Frame>

                {/* Studio Palette Preview */}
                <Frame variant="ghost" size="lg">
                    <h3 className="text-xl font-semibold mb-4 text-studios-inkSteel-graphite">
                        Master Palette System
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

                        {/* Scarlet Studio */}
                        <div className="p-4 rounded-xl bg-studios-scarletStudio-blush border border-studios-scarletStudio-wine/20">
                            <h4 className="font-semibold text-studios-scarletStudio-wine mb-3">Scarlet Studio</h4>
                            <div className="flex space-x-2">
                                <div className="w-6 h-6 rounded bg-studios-scarletStudio-crimson"></div>
                                <div className="w-6 h-6 rounded bg-studios-scarletStudio-wine"></div>
                                <div className="w-6 h-6 rounded bg-studios-scarletStudio-signal"></div>
                            </div>
                        </div>

                        {/* Expression Studio */}
                        <div className="p-4 rounded-xl bg-studios-expression-ivory border border-studios-expression-violet/20">
                            <h4 className="font-semibold text-studios-expression-violet mb-3">Expression</h4>
                            <div className="flex space-x-2">
                                <div className="w-6 h-6 rounded bg-studios-expression-orchid"></div>
                                <div className="w-6 h-6 rounded bg-studios-expression-violet"></div>
                                <div className="w-6 h-6 rounded bg-phantom-accent"></div>
                            </div>
                        </div>

                    </div>
                </Frame>

                {/* Controls */}
                <Card variant="novaOS" header="Studio Controls">
                    <div className="flex space-x-8">
                        <Toggle
                            checked={autoRefresh}
                            onCheckedChange={setAutoRefresh}
                            variant="status"
                            label="Auto Refresh"
                        />
                        <Toggle
                            checked={notifications}
                            onCheckedChange={setNotifications}
                            variant="novaOS"
                            label="Notifications"
                        />
                    </div>
                </Card>

            </div>
        </div>
    );
}
