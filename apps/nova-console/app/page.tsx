'use client'
import { useState } from 'react'

const AGENTS = ['glitch', 'echo']

export default function Home() {
  const [agent, setAgent] = useState('glitch')
  const [command, setCommand] = useState('')
  const [args, setArgs] = useState('{}')
  const [log, setLog] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)

  async function runAgent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const res = await fetch(`http://localhost:8750/agents/${agent}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command,
        args: JSON.parse(args || '{}'),
        log,
      }),
    })
    setResult(await res.json())
  }

  return (
    <div className="p-8">
      <form onSubmit={runAgent} className="flex flex-col gap-2 max-w-md">
        <label className="flex flex-col">
          Agent
          <select value={agent} onChange={e => setAgent(e.target.value)} className="border p-1">
            {AGENTS.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          Command
          <input value={command} onChange={e => setCommand(e.target.value)} className="border p-1" />
        </label>
        <label className="flex flex-col">
          Args JSON
          <input value={args} onChange={e => setArgs(e.target.value)} className="border p-1 font-mono" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={log} onChange={e => setLog(e.target.checked)} />
          Log
        </label>
        <button type="submit" className="border px-2 py-1">Run</button>
      </form>
      {result && (
        <pre className="mt-4 bg-gray-100 p-2 text-sm overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
