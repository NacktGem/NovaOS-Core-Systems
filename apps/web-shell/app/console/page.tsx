"use client"
import { useState } from 'react'

const agents = ['nova', 'echo', 'glitch', 'lyra', 'velora', 'audita', 'riven'] as const

export default function Console() {
    const [agent, setAgent] = useState<typeof agents[number]>('lyra')
    const [payload, setPayload] = useState('{"command":"","args":{}}')
    const [logs, setLogs] = useState<{ text: string; jobId?: string }[]>([])

    async function run() {
        try {
            const res = await fetch(`/api/agents/${agent}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
            })
            const json = await res.json()
            setLogs(prev => [...prev, { text: JSON.stringify(json), jobId: json.job_id }])
        } catch (err) {
            setLogs(prev => [...prev, { text: JSON.stringify({ success: false, output: null, error: String(err) }) }])
        }
    }

    return (
        <div className="p-4 space-y-2">
            <div className="flex gap-2">
                <select value={agent} onChange={e => setAgent(e.target.value as typeof agents[number])} className="border px-2 py-1">
                    {agents.map(a => (<option key={a}>{a}</option>))}
                </select>
                <button onClick={run} className="border px-3 py-1">Run</button>
            </div>
            <textarea value={payload} onChange={e => setPayload(e.target.value)} rows={4} className="w-full border p-2 font-mono"></textarea>
            <div className="bg-black text-green-500 p-2 h-64 overflow-auto font-mono whitespace-pre-wrap">
                {logs.map((l, i) => (
                    <div key={i}>
                        {l.text}
                        {l.jobId && (
                            <a
                                href={`/logs/${agent}/${l.jobId}.json`}
                                className="underline ml-2"
                                target="_blank"
                                rel="noreferrer"
                            >
                                view log
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
