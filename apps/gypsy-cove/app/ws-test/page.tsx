'use client'
import { useEcho } from '@nova/clients/ws/useEcho'

const WS = process.env.NEXT_PUBLIC_ECHO_WS_URL!

export default function WsTest(){
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const room = params.get('room') || 'family-home'
  const { messages } = useEcho(room, WS)
  return <pre>{messages.map(m=>JSON.stringify(m)).join('\n')}</pre>
}
