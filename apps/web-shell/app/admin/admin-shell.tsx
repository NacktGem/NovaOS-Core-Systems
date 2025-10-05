'use client';

import { useState } from 'react';

type AdminShellProps = {
    initialFlags: Record<string, {
        value: boolean;
        updated_at: string | null;
        updated_by: string | null;
    }>;
};

export default function AdminShell({ initialFlags }: AdminShellProps) {
    const [flags] = useState(initialFlags);

    return (
        <div className="p-6 bg-[#050109] text-[#F5E5ED] min-h-screen">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-[#A33A5B] mb-8">NovaOS Admin Console</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-[#1A0D15] border border-[#2A1721] rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-[#F5E5ED]">System Flags</h2>
                        <div className="space-y-3">
                            {Object.entries(flags).map(([key, flag]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <span className="text-sm text-[#D4B5C4]">{key}</span>
                                    <div className={`px-2 py-1 rounded text-xs ${flag.value
                                            ? 'bg-green-900 text-green-300'
                                            : 'bg-red-900 text-red-300'
                                        }`}>
                                        {flag.value ? 'Enabled' : 'Disabled'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#1A0D15] border border-[#2A1721] rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-[#F5E5ED]">System Status</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#D4B5C4]">Core API</span>
                                <div className="px-2 py-1 rounded text-xs bg-green-900 text-green-300">Online</div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#D4B5C4]">Redis</span>
                                <div className="px-2 py-1 rounded text-xs bg-green-900 text-green-300">Connected</div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#D4B5C4]">Database</span>
                                <div className="px-2 py-1 rounded text-xs bg-green-900 text-green-300">Connected</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1A0D15] border border-[#2A1721] rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-[#F5E5ED]">Quick Actions</h2>
                        <div className="space-y-3">
                            <button className="w-full bg-[#A33A5B] hover:bg-[#8B2E4D] text-white py-2 px-4 rounded text-sm transition-colors">
                                Refresh System
                            </button>
                            <button className="w-full bg-[#2A1721] hover:bg-[#3A2331] text-[#F5E5ED] py-2 px-4 rounded text-sm transition-colors">
                                View Logs
                            </button>
                            <button className="w-full bg-[#2A1721] hover:bg-[#3A2331] text-[#F5E5ED] py-2 px-4 rounded text-sm transition-colors">
                                Manage Users
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
