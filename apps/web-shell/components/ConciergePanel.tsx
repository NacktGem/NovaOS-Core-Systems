import { useState } from 'react'
import { conciergeAsk } from '@nova/sdk'

export default function ConciergePanel({ hasAccess }: { hasAccess: boolean }) {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    try {
      const res = await conciergeAsk(prompt)
      setResponse(res.reply)
      setPrompt('')
    } finally {
      setLoading(false)
    }
  }

  if (!hasAccess) return <div className="p-4 border rounded">Upgrade to Sovereign to access Nova Concierge.</div>

  return (
    <div className="p-4 border rounded flex flex-col gap-2">
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        className="p-2 rounded bg-neutral-800"
        placeholder="Ask Nova..."
      />
 codex/implement-payments-ui-for-crypto/manual
      <button
        onClick={submit}
        disabled={loading || !prompt}
        className="px-3 py-1 bg-brand text-white rounded disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Send'}
      </button>
      {response && <div className="mt-2 text-sm text-success-light">{response}</div>}

      <button onClick={submit} disabled={loading || !prompt} className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50">
        {loading ? 'Sending…' : 'Send'}
      </button>
      {response && <div className="mt-2 text-sm text-green-300">{response}</div>}
 main
    </div>
  )
}
