"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface UnlockGateProps {
    onUnlock?: () => void;
    showAsModal?: boolean;
}

export default function UnlockGate({ onUnlock, showAsModal = false }: UnlockGateProps) {
    const [showModal, setShowModal] = useState(!showAsModal)
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        // Hotkey: press `U` to open the unlock modal
        function onKey(e: KeyboardEvent) {
            if (e.key.toLowerCase() === 'u' && showAsModal) setShowModal(true)
        }
        if (showAsModal) {
            window.addEventListener('keydown', onKey)
            return () => window.removeEventListener('keydown', onKey)
        }
    }, [showAsModal])

    async function tryUnlock() {
        if (!password) {
            setError('Enter password')
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
                // success
                if (onUnlock) {
                    onUnlock()
                } else {
                    router.push('/login')
                }
            } else {
                setError('Invalid password')
                setShowModal(showAsModal) // Keep modal open if it's modal mode
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

    if (showAsModal && !showModal) {
        return (
            <button
                aria-label="Unlock"
                className="mt-6 bg-rose-700 px-4 py-2 rounded hover:bg-rose-600 transition-colors"
                onClick={() => setShowModal(true)}
            >
                Unlock
            </button>
        )
    }

    const modalContent = (
        <div className="bg-rose-900 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" role="dialog" aria-modal="true" aria-labelledby="unlock-title">
            <h2 id="unlock-title" className="text-2xl mb-4 text-rose-100 font-semibold">
                {showAsModal ? 'Enter Password' : 'Access Required'}
            </h2>
            <label className="sr-only" htmlFor="unlock-input">Unlock password</label>
            <input
                id="unlock-input"
                aria-label="Unlock password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && password && tryUnlock()}
                type="password"
                placeholder="Password"
                className="w-full p-3 mb-4 text-gray-900 rounded border-none focus:ring-2 focus:ring-rose-500 focus:outline-none"
                disabled={loading}
                autoFocus
            />
            {error && (
                <p className="text-sm text-rose-300 mb-4 bg-rose-800/50 p-2 rounded">
                    {error}
                </p>
            )}
            <div className="flex gap-2">
                <button
                    className="flex-1 bg-rose-600 hover:bg-rose-700 p-3 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    onClick={tryUnlock}
                    disabled={loading || password.length === 0}
                >
                    {loading ? 'Unlocking…' : 'Unlock'}
                </button>
                {showAsModal && (
                    <button
                        className="flex-1 border border-rose-300 text-rose-300 hover:bg-rose-800/50 p-3 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        onClick={cancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    )

    if (showAsModal) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" role="presentation">
                {modalContent}
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-rose-900 to-black text-rose-200">
            <div className="text-center max-w-lg">
                <div className="mb-8">
                    <h1 className="text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-rose-300 to-rose-500 mb-4">
                        🌹
                    </h1>
                    <p className="text-xl text-rose-200 mb-2">Black Rose Collective</p>
                    <p className="text-lg text-rose-300 opacity-80">
                        This content is protected. Enter your access code to continue.
                    </p>
                </div>
                {modalContent}
            </div>
        </div>
    )
}
