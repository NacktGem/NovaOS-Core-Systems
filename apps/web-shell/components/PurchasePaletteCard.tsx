import { buyPalette } from '@nova/sdk'
import { useState } from 'react'

type Palette = {
  key: string
  name: string
  owned: boolean
  colors: string[]
}

export default function PurchasePaletteCard({ palette, onOwned }: { palette: Palette; onOwned: (key: string) => void }) {
  const [loading, setLoading] = useState(false)

  async function handleBuy() {
    setLoading(true)
    try {
      await buyPalette(palette.key)
      onOwned(palette.key)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded p-4 flex flex-col items-start gap-2">
      <div className="flex gap-1">
        {palette.colors.map(c => (
          <div key={c} className="w-6 h-6 rounded" style={{ background: c }} />
        ))}
      </div>
      <div className="font-semibold">{palette.name}</div>
      {palette.owned ? (
 codex/implement-payments-ui-for-crypto/manual
        <span className="text-success text-sm">Owned</span>

        <span className="text-green-400 text-sm">Owned</span>
 main
      ) : (
        <button
          onClick={handleBuy}
          disabled={loading}
codex/implement-payments-ui-for-crypto/manual
          className="mt-2 px-3 py-1 bg-brand text-white rounded disabled:opacity-50"

          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
 main
        >
          {loading ? 'Buying…' : 'Buy $3'}
        </button>
      )}
    </div>
  )
}
