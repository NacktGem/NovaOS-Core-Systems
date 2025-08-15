'use client'

import { useEffect, useState } from 'react'
import { getPalettes } from '@nova/sdk'
import PurchasePaletteCard from '../../../components/PurchasePaletteCard'

type Palette = {
  key: string
  name: string
  owned: boolean
  colors: string[]
}

export default function AppearancePage() {
  const [palettes, setPalettes] = useState<Palette[]>([])

  useEffect(() => {
    getPalettes().then(setPalettes)
  }, [])

  function markOwned(key: string) {
    setPalettes(palettes.map(p => (p.key === key ? { ...p, owned: true } : p)))
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Appearance</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {palettes.map(p => (
          <PurchasePaletteCard key={p.key} palette={p} onOwned={markOwned} />
        ))}
      </div>
    </div>
  )
}
