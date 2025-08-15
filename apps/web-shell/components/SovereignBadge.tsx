export default function SovereignBadge({ tier }: { tier: 'gold' | 'onyx' }) {
  const color = tier === 'gold' ? 'bg-gold' : 'bg-onyx'
  const text = tier === 'gold' ? 'Sovereign' : 'Sovereign+';
  return (
    <span className={`inline-block px-3 py-1 rounded ${color} text-black font-bold`}>{text}</span>
  )
}
