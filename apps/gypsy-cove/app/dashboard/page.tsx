'use client'
import { useState } from 'react'
import { ChatWidget } from '../../../shared/components/chat'

const agents = ['nova', 'echo', 'glitch', 'lyra', 'velora', 'audita', 'riven'] as const

export default function Dashboard() {
  const [agent, setAgent] = useState<typeof agents[number]>('nova')
  const [payload, setPayload] = useState('{"command":"","args":{}}')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)

  const chatRooms = [
    { id: "family_room", name: "Family Room", description: "Family chat and coordination", private: false },
    { id: "tutor_room", name: "Tutor Room", description: "Educational discussions and learning support", private: false },
  ];

  async function run() {
    try {
      const res = await fetch(`/api/agents/${agent}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })
      const json = await res.json()
      setResult(json)
      setJobId(json.job_id ?? null)
    } catch (err) {
      setResult({ success: false, output: null, error: String(err) })
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-4 space-y-4">
        <div className="flex gap-2">
          <select value={agent} onChange={e => setAgent(e.target.value as typeof agents[number])} className="border px-2 py-1">
            {agents.map(a => (<option key={a} value={a}>{a}</option>))}
          </select>
          <button onClick={run} className="border px-3 py-1">Run</button>
        </div>
        <textarea value={payload} onChange={e => setPayload(e.target.value)} rows={6} className="w-full border p-2 font-mono"></textarea>
        {result && (
          <div className="space-y-2">
            <pre className="bg-gray-100 p-2 text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            {jobId && <a href={`/logs/${agent}/${jobId}.json`} className="underline text-sm" target="_blank" rel="noreferrer">view log</a>}
          </div>
        )}
      </div>
      <div className="w-96 border-l border-gray-200">
        <ChatWidget
          variant="novaOS"
          rooms={chatRooms}
          initialRoomId="family_room"
          initialMessages={[]}
          title="GypsyCove Chat"
        />
      </div>
    </div>
  )
}
