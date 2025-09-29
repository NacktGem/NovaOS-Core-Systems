'use client'
import { useEcho } from '@nova/clients/ws/useEcho'

const WS = process.env.NEXT_PUBLIC_ECHO_WS_URL!

export default function FamilyChat(){
  const { messages } = useEcho('family-home', WS)
  return <pre>{messages.map(m=>JSON.stringify(m)).join('\n')}</pre>
}
