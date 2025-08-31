"use client"
export default function GodMode() {
    return (
        <div className="p-6 bg-black text-rose-200 min-h-screen">
            <h1 className="text-3xl font-bold">GodMode Console</h1>
            <p className="mt-2 text-sm text-rose-300">Founder-only access. All toggles and overrides available.</p>
            <div className="mt-4">
                <button className="bg-rose-600 px-3 py-1 rounded">Emergency Stop</button>
                <button className="ml-2 border px-3 py-1 rounded">Agent Reset</button>
            </div>
        </div>
    )
}
