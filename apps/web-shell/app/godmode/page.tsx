"use client"
import { useEffect, useState } from 'react'

const agents = ['echo', 'glitch', 'lyra', 'velora', 'audita', 'riven'] as const

export default function GodMode() {
  const [agent, setAgent] = useState<typeof agents[number]>('echo')
  const [command, setCommand] = useState('send_message')
  const [args, setArgs] = useState('{"message":"hi"}')
  const [result, setResult] = useState<unknown>(null)
  const [health, setHealth] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [logAgent, setLogAgent] = useState<typeof agents[number]>('audita')
  const [logText, setLogText] = useState('')
  const [logAuto, setLogAuto] = useState(false)

  useEffect(() => {
    let stop = false
    async function tick() {
      try {
        const r = await fetch('/api/orchestrator/status', { cache: 'no-store' })
        const j = await r.json().catch(() => ({}))
        if (!stop) setHealth(j)
      } catch { }
      if (!stop) setTimeout(tick, 5000)
    }
    tick()
    return () => { stop = true }
  }, [])

  async function run() {
    setBusy(true)
    setResult(null)
    try {
      const body = { command, args: JSON.parse(args || '{}'), log: true }
      const r = await fetch(`/api/agents/${agent}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await r.json().catch(() => ({}))
      setResult(j)
    } catch (e) {
      setResult({ error: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  async function loadLogs() {
    try {
      const r = await fetch(`/api/logs?path=/logs/${logAgent}.log`, { cache: 'no-store' })
      if (r.ok) {
        const t = await r.text()
        const lines = t.split(/\r?\n/).filter(Boolean)
        setLogText(lines.slice(-100).join('\n'))
      } else {
        setLogText(`Error: ${r.status}`)
      }
    } catch (e) {
      setLogText((e as Error).message)
    }
  }

  useEffect(() => {
    let stop = false
    if (showLogs && logAuto) {
      loadLogs()
      const id = setInterval(() => { if (!stop) loadLogs() }, 4000)
      return () => { stop = true; clearInterval(id) }
    }
    return () => { stop = true }
  }, [showLogs, logAuto, logAgent])

  return (
    <div className="p-6 bg-black text-rose-200 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold">GodMode Console</h1>
        <p className="mt-2 text-sm text-rose-300">Founder-only access. All toggles and overrides available.</p>
      </div>

      <section className="border border-rose-600/40 rounded p-4">
        <h2 className="font-semibold mb-2">Orchestrator</h2>
        <pre className="text-xs text-rose-300 whitespace-pre-wrap">{JSON.stringify(health, null, 2)}</pre>
      </section>

      <section className="border border-rose-600/40 rounded p-4 space-y-2">
        <h2 className="font-semibold">Agent Runner</h2>
        <div className="flex gap-2">
          <select value={agent} onChange={e => setAgent(e.target.value as typeof agents[number])} className="border px-2 py-1 bg-black">
            {agents.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <input value={command} onChange={e => setCommand(e.target.value)} className="flex-1 border px-2 py-1 bg-black" placeholder="command" />
          <button onClick={run} disabled={busy} className="border px-3 py-1 rounded bg-rose-700 disabled:opacity-50">{busy ? 'Running…' : 'Run'}</button>
        </div>
        <textarea value={args} onChange={e => setArgs(e.target.value)} rows={6} className="w-full border p-2 font-mono bg-black"></textarea>
        <div className="bg-black text-green-400 p-3 rounded border border-rose-600/30">
          <pre className="whitespace-pre-wrap text-xs">{result ? JSON.stringify(result, null, 2) : 'Result will appear here'}</pre>
          {(() => {
            if (typeof result === 'object' && result !== null && 'logs_path' in result) {
              const lp = (result as Record<string, unknown>).logs_path
              if (typeof lp === 'string' && lp.length > 0) {
                return <a href={lp} target="_blank" rel="noreferrer" className="underline">open logs</a>
              }
            }
            return null
          })()}
        </div>
      </section>

      <section className="border border-rose-600/40 rounded p-4">
        <h2 className="font-semibold mb-2">Danger Zone</h2>
        <div className="flex gap-2">
          <button className="bg-rose-600 px-3 py-1 rounded">Emergency Stop</button>
          <button className="border px-3 py-1 rounded">Agent Reset</button>
        </div>
      </section>

      <section className="border border-rose-600/40 rounded p-4 space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Logs Viewer</h2>
          <button onClick={() => { setShowLogs(s => !s); if (!showLogs) loadLogs() }} className="border px-3 py-1 rounded">{showLogs ? 'Hide' : 'Show'}</button>
        </div>
        {showLogs && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <select value={logAgent} onChange={e => setLogAgent(e.target.value as typeof agents[number])} className="border px-2 py-1 bg-black">
                {agents.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={logAuto} onChange={e => setLogAuto(e.target.checked)} /> Auto-refresh
              </label>
              <button onClick={loadLogs} className="border px-3 py-1 rounded">Refresh</button>
            </div>
            <pre className="bg-black border border-rose-600/30 rounded p-3 text-xs text-rose-200 h-64 overflow-auto whitespace-pre-wrap">{logText || 'No logs yet.'}</pre>
          </div>
        )}
      </section>
    </div>
  )
}
