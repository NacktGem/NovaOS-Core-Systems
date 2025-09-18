'use client';

import { useEffect, useRef, useState } from 'react';

// Bland 404 page. Hidden trigger: double-click the final period.
// Mobile fallback: long-press (~650ms). On correct keyword, we only
// set a local "accepted" flag for now. (Preauth + login reveal is Step 2.)
export default function NotFound() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [accepted, setAccepted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState<number>(0);

    const pressTimer = useRef<number | null>(null);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = window.setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
        return () => window.clearTimeout(t);
    }, [cooldown]);

    const openPrompt = () => {
        if (cooldown > 0) return;
        setShowPrompt(true);
        setError(null);
        setKeyword('');
    };

    const onDoubleClickPeriod = () => openPrompt();

    const onPointerDown = () => {
        if (cooldown > 0) return;
        pressTimer.current = window.setTimeout(openPrompt, 650);
    };
    const onPointerUp = () => {
        if (pressTimer.current) {
            window.clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    const submitKeyword = (e: React.FormEvent) => {
        e.preventDefault();
        if (keyword === 'NovaOS') {
            setAccepted(true);
            setShowPrompt(false);
            setError(null);
            // Step 2 will add server-side preauth + reveal actual login.
        } else {
            setError('Incorrect keyword.');
            setCooldown(15); // short soft cool-down on miss
        }
    };

    return (
        <>
            <meta name="robots" content="noindex,nofollow" />
            <main
                style={{
                    minHeight: '100vh',
                    display: 'grid',
                    placeItems: 'center',
                    background: '#faf8f4',
                    color: '#222',
                    fontFamily:
                        '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol',
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '96px', margin: 0, letterSpacing: '-2px' }}>404</h1>
                    <p style={{ fontSize: '28px', marginTop: 8 }}>
                        Error Not Found
                        <span
                            aria-hidden="true"
                            onDoubleClick={onDoubleClickPeriod}
                            onPointerDown={onPointerDown}
                            onPointerUp={onPointerUp}
                            onPointerCancel={onPointerUp}
                            style={{ cursor: 'default', userSelect: 'none' }}
                        >
                            .
                        </span>
                    </p>

                    {accepted && (
                        <div
                            role="status"
                            aria-live="polite"
                            style={{ marginTop: 12, fontSize: 12, color: '#666' }}
                        >
                            Page not found.
                        </div>
                    )}

                    {cooldown > 0 && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                            Try again in {cooldown}s.
                        </div>
                    )}
                </div>

                {showPrompt && (
                    <div
                        role="dialog"
                        aria-modal="true"
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.25)',
                            display: 'grid',
                            placeItems: 'center',
                        }}
                        onClick={() => setShowPrompt(false)}
                    >
                        <form
                            onClick={(e) => e.stopPropagation()}
                            onSubmit={submitKeyword}
                            style={{
                                background: '#fff',
                                color: '#111',
                                width: 'min(92vw, 360px)',
                                border: '1px solid #ddd',
                                borderRadius: 6,
                                padding: 16,
                                boxShadow: '0 8px 28px rgba(0,0,0,0.2)',
                            }}
                        >
                            <div style={{ fontSize: 14, marginBottom: 8 }}>Enter keyword</div>
                            <input
                                autoFocus
                                type="password"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                aria-label="Keyword"
                                style={{
                                    width: '100%',
                                    border: '1px solid #ccc',
                                    borderRadius: 4,
                                    padding: '10px 12px',
                                    fontSize: 14,
                                }}
                            />
                            {error && (
                                <div style={{ color: '#b00020', marginTop: 8, fontSize: 12 }}>{error}</div>
                            )}
                            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowPrompt(false)}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #ccc',
                                        background: '#f7f7f7',
                                        borderRadius: 4,
                                        fontSize: 14,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #222',
                                        background: '#222',
                                        color: '#fff',
                                        borderRadius: 4,
                                        fontSize: 14,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </>
    );
}
