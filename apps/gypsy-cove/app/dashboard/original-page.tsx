'use client'
import React, { useState } from 'react';

const agents = ['nova', 'echo', 'glitch', 'lyra', 'velora', 'audita', 'riven'] as const

export default function Dashboard() {
  const [agent, setAgent] = useState<typeof agents[number]>('nova')
  const [payload, setPayload] = useState('{"command":"","args":{}}')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)

  const run = async () => {
    try {
      const response = await fetch(`/api/agents/${agent}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      })
      const data = await response.json()
      setResult(data)
      setJobId(data.jobId || null)
    } catch (err) {
      setResult({ error: String(err) })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Agent Dashboard</h1>
        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              value={agent}
              onChange={e => setAgent(e.target.value as typeof agents[number])}
              className="border px-3 py-1"
              title="Select Agent"
            >
              {agents.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <button onClick={run} className="border px-3 py-1">Run</button>
          </div>
          <textarea
            value={payload}
            onChange={e => setPayload(e.target.value)}
            rows={6}
            className="w-full border p-2 font-mono"
            placeholder="Enter JSON payload"
            title="Agent Payload"
          ></textarea>
          {result && (
            <div className="space-y-2">
              <pre className="bg-gray-100 p-2 text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
              {jobId && <a href={`/logs/${agent}/${jobId}.json`} className="underline text-sm" target="_blank" rel="noreferrer">view log</a>}
            </div>
          )}
        </div>
      </div>
      <div className="w-96 border-l border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">GypsyCove Chat</h3>
          <div className="text-center text-gray-500 py-8">
            <p>Chat widget coming soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}
