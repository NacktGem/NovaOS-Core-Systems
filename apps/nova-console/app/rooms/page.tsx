'use client'
import { useEcho } from '@nova/clients/ws/useEcho'

const WS = process.env.NEXT_PUBLIC_ECHO_WS_URL!

function getRole(): string | null {
  const cookie = typeof document !== 'undefined' ? document.cookie : ''
  const token = cookie.split('; ').find(c => c.startsWith('access_token='))?.split('=')[1]
  if (!token) return null
  try { return JSON.parse(atob(token.split('.')[1])).role || null } catch { return null }
}

export default function Rooms(){
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const room = params.get('room') || 'rose-garden'
  const { messages } = useEcho(room, WS)
  const role = getRole()
  return (
    <div>
      {room === 'founder-room' && role === 'godmode' && <span>No Transcript (GodMode)</span>}
      <pre>{messages.map(m=>JSON.stringify(m)).join('\n')}</pre>
    </div>
  )
}
