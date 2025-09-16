"use client"
import { useEffect, useMemo, useState } from 'react'

export default function ConsentUpload() {
    const [govId, setGovId] = useState('gov_id.jpg')
    const [releasePdf, setReleasePdf] = useState('release.pdf')
    const [selfie, setSelfie] = useState('selfie.jpg')
    const [timestamp, setTimestamp] = useState('')
    const [busy, setBusy] = useState(false)
    const [result, setResult] = useState<unknown>(null)

    useEffect(() => {
        setTimestamp(new Date().toISOString())
    }, [])

    const payload = useMemo(() => ({
        command: 'validate_consent',
        args: {
            files: [govId, releasePdf, selfie],
            timestamp,
        },
        log: true,
    }), [govId, releasePdf, selfie, timestamp])

    async function submit() {
        setBusy(true)
        setResult(null)
        try {
            const r = await fetch('/api/agents/audita', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const j = await r.json().catch(() => ({}))
            setResult(j)
        } catch (e) {
            setResult({ error: (e as Error).message })
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="p-6 bg-black text-rose-200 min-h-screen space-y-6">
            <header>
                <h1 className="text-3xl font-bold">Consent Upload</h1>
                <p className="text-rose-300 text-sm">Mock upload — files are not sent; Audita validates filenames + timestamp.</p>
            </header>

            <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 border border-rose-600/30 rounded p-4">
                    <div>
                        <label className="block text-sm mb-1">Government ID image</label>
                        <input value={govId} onChange={e => setGovId(e.target.value)} className="w-full border px-2 py-1 bg-black" placeholder="gov_id.jpg" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Model release PDF</label>
                        <input value={releasePdf} onChange={e => setReleasePdf(e.target.value)} className="w-full border px-2 py-1 bg-black" placeholder="release.pdf" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Selfie with date visible</label>
                        <input value={selfie} onChange={e => setSelfie(e.target.value)} className="w-full border px-2 py-1 bg-black" placeholder="selfie.jpg" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Timestamp (ISO)</label>
                        <input value={timestamp} onChange={e => setTimestamp(e.target.value)} className="w-full border px-2 py-1 bg-black" placeholder="2025-09-14T22:00:00Z" />
                    </div>
                    <div>
                        <button onClick={submit} disabled={busy} className="bg-rose-700 px-4 py-2 rounded disabled:opacity-50">{busy ? 'Submitting…' : 'Submit'}</button>
                    </div>
                </div>

                <div className="space-y-3 border border-rose-600/30 rounded p-4">
                    <h2 className="font-semibold">Result</h2>
                    <pre className="whitespace-pre-wrap text-xs text-green-400">{result ? JSON.stringify(result, null, 2) : 'Submit to see result'}</pre>
                    {(() => {
                        if (typeof result === 'object' && result !== null && 'logs_path' in result) {
                            const lp = (result as Record<string, unknown>).logs_path
                            if (typeof lp === 'string' && lp.length > 0) {
                                return <a href={lp} target="_blank" rel="noreferrer" className="underline">Open logs</a>
                            }
                        }
                        return null
                    })()}
                </div>
            </section>
        </div>
    )
}
