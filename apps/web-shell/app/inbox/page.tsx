'use client'
import { useEffect, useState } from 'react'
const WS = process.env.ECHO_WS!
export default function Inbox(){
  const [log,setLog]=useState<string[]>([])
  useEffect(()=>{
    const ws=new WebSocket(`${WS}?room=rose-garden&role=VERIFIED_USER`)
    ws.onmessage=e=>setLog(l=>[...l,e.data])
    return ()=>ws.close()
  },[])
  return <pre>{log.join('\n')}</pre>
}
