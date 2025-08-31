"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Shell() {
  const [showModal, setShowModal] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Hotkey: press `U` to open the unlock modal
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'u') setShowModal(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function tryUnlock() {
    if (!password) {
      setError('Enter pass')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.ok && j && j.ok) {
        // success -> navigate to login
        router.push('/login')
      } else {
        // hide modal silently and surface a small error
        setError('Unable to unlock')
        setShowModal(false)
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  function cancel() {
    setShowModal(false)
    setPassword('')
    setError(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-rose-200">
      <div className="text-center max-w-lg">
        <h1 className="text-6xl font-black tracking-tight text-rose-300">404</h1>
        <p className="mt-4 text-lg text-rose-200">Black Rose says: the page you seek is hidden. If you were meant to find it, unlock the gate.</p>
        <button aria-label="Unlock" className="mt-6 bg-rose-700 px-4 py-2 rounded" onClick={() => setShowModal(true)}>Unlock</button>

        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center" role="presentation">
            <div className="bg-rose-900 p-6 rounded shadow max-w-sm w-full" role="dialog" aria-modal="true" aria-labelledby="unlock-title">
              <h2 id="unlock-title" className="text-2xl mb-2">Enter pass</h2>
              <label className="sr-only" htmlFor="unlock-input">Unlock password</label>
              <input
                id="unlock-input"
                aria-label="Unlock password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="w-full p-2 mb-3 text-black"
                disabled={loading}
              />
              {error && <p className="text-sm text-rose-300 mb-2">{error}</p>}
              <div className="flex gap-2">
                <button
                  className="flex-1 bg-rose-600 p-2 rounded disabled:opacity-50"
                  onClick={tryUnlock}
                  disabled={loading || password.length === 0}
                >
                  {loading ? 'Unlocking…' : 'Submit'}
                </button>
                <button className="flex-1 border p-2 rounded" onClick={cancel} disabled={loading}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
