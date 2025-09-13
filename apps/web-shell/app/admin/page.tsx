"use client"
import { useState } from 'react'

export default function Admin() {
    const [maintenance, setMaintenance] = useState(false)
    return (
        <div className="p-6 bg-black text-rose-200 min-h-screen">
            <h1 className="text-2xl">Admin Panel</h1>
            <div className="mt-4">
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} />
                    <span>Enable maintenance mode</span>
                </label>
            </div>
            <p className="mt-3 text-sm text-rose-300">Founder overrides are respected. Limited toggles only.</p>
        </div>
    )
}
