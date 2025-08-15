'use client'

import { useState } from 'react'
import { subscribe } from '@nova/sdk'

export default function SovereignUpgradePage() {
  const [tier, setTier] = useState<'standard' | 'premium'>('standard')
  const [amount, setAmount] = useState(100)
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    try {
      await subscribe(`sovereign_${tier}`)
    } finally {
      setLoading(false)
    }
  }

  const fee = Math.round(amount * 0.08)

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Sovereign Upgrade</h1>
      <div className="flex gap-4">
        <button
          className={`px-4 py-2 rounded ${tier === 'standard' ? 'bg-brand' : 'bg-neutral-700'}`}
          onClick={() => setTier('standard')}
        >
          Standard $39/mo
        </button>
        <button
          className={`px-4 py-2 rounded ${tier === 'premium' ? 'bg-brand' : 'bg-neutral-700'}`}
          onClick={() => setTier('premium')}
        >
          Premium $49/mo
        </button>
      </div>
      <ul className="list-disc list-inside">
        <li>Concierge access</li>
        <li>Analytics Pro</li>
        <li>8% platform fee</li>
      </ul>
      <div>
        <label className="block mb-1">Creator revenue split calculator</label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          className="p-2 rounded bg-neutral-800 mr-2"
        />
        <span className="text-sm">Platform cut: ${fee}</span>
      </div>
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="px-4 py-2 bg-success rounded w-max disabled:opacity-50"
      >
        {loading ? 'Subscribing…' : 'Subscribe'}
      </button>
    </div>
  )
}
