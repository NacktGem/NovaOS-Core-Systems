export default function SovereignBadge({ tier }: { tier: 'gold' | 'onyx' }) {
 codex/implement-payments-ui-for-crypto/manual
  const color = tier === 'gold' ? 'bg-gold' : 'bg-onyx'

  const color = tier === 'gold' ? 'bg-yellow-500' : 'bg-gray-800'
 main
  const text = tier === 'gold' ? 'Sovereign' : 'Sovereign+';
  return (
    <span className={`inline-block px-3 py-1 rounded ${color} text-black font-bold`}>{text}</span>
  )
}
