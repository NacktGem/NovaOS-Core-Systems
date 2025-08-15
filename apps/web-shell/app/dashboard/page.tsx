'use client'

import { useEffect, useState } from 'react'
import { getSovereignStatus } from '@nova/sdk'
import SovereignBadge from '../../components/SovereignBadge'
import ConciergePanel from '../../components/ConciergePanel'

export default function DashboardPage() {
  const [sovereign, setSovereign] = useState<{ active: boolean; tier: 'gold' | 'onyx' | null }>({ active: false, tier: null })
  const [tab, setTab] = useState<'overview' | 'analytics'>('overview')

  useEffect(() => {
    getSovereignStatus().then(res => setSovereign({ active: res.active, tier: res.tier }))
  }, [])

  const mockData = [5, 8, 3, 9, 6]

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Creator Dashboard</h1>
        {sovereign.active && sovereign.tier && <SovereignBadge tier={sovereign.tier} />}
      </div>
      <div className="flex gap-4">
        <button onClick={() => setTab('overview')} className={`px-3 py-1 rounded ${tab === 'overview' ? 'bg-blue-600' : 'bg-neutral-700'}`}>Overview</button>
        <button onClick={() => setTab('analytics')} className={`px-3 py-1 rounded ${tab === 'analytics' ? 'bg-blue-600' : 'bg-neutral-700'}`}>Analytics Pro</button>
      </div>
      {tab === 'analytics' ? (
        <div className="flex gap-2">
          {mockData.map((v, i) => (
            <div key={i} className="w-8 bg-blue-500" style={{ height: v * 10 }} />
          ))}
        </div>
      ) : (
        <div>Your overview content goes here.</div>
      )}
      <div className="mt-6">
        <h2 className="text-xl mb-2">Nova Concierge</h2>
        <ConciergePanel hasAccess={sovereign.active} />
      </div>
    </div>
  )
}
