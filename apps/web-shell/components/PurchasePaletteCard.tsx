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
        <span className="text-green-400 text-sm">Owned</span>
      ) : (
        <button
          onClick={handleBuy}
          disabled={loading}
          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Buying…' : 'Buy $3'}
        </button>
      )}
    </div>
  )
}
