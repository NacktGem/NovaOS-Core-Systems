'use client'
import { useEffect, useState } from 'react'
const WS = process.env.ECHO_WS!
export default function WsTest(){
  const [log,setLog]=useState<string[]>([])
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    const ws=new WebSocket(`${WS}?room=${params.get('room')}&role=${params.get('role')}`)
    ws.onmessage=e=>setLog(l=>[...l,e.data])
    return ()=>ws.close()
  },[])
  return <pre>{log.join('\n')}</pre>
}
