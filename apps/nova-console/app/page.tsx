'use client'
import { useState, useEffect } from 'react'

const agents = ['nova','echo','glitch','lyra','velora','audita','riven'] as const

export default function Console(){
  const [agent, setAgent] = useState<typeof agents[number]>('nova')
  const [payloads, setPayloads] = useState<Record<string,string>>({})
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [logLink, setLogLink] = useState<string | null>(null)

  useEffect(()=>{
    const store: Record<string,string> = {}
    for(const a of agents){
      const val = localStorage.getItem(`payload:${a}`)
      store[a] = val ?? '{"command":"","args":{}}'
    }
    setPayloads(store)
  },[])

  const payload = payloads[agent] || '{"command":"","args":{}}'

  function setPayload(value: string){
    setPayloads(prev=>{const next={...prev,[agent]:value}; localStorage.setItem(`payload:${agent}`,value); return next})
  }

  async function run(){
    try{
      const res = await fetch(`${process.env.NEXT_PUBLIC_CORE_API_URL}/agents/${agent}`,{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'X-NOVA-TOKEN': process.env.NOVA_AGENT_TOKEN as string,
        },
        body: payload,
      })
      const json = await res.json()
      setResult(json)
      if(json.success){
        setLogLink(`/logs/${agent}`)
      }
    }catch(err){
      setResult({success:false, output:null, error:String(err)})
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2 items-center">
        <select value={agent} onChange={e=>setAgent(e.target.value as typeof agents[number])} className="border px-2 py-1">
          {agents.map(a=>(<option key={a}>{a}</option>))}
        </select>
        <button onClick={run} className="border px-3 py-1">Run</button>
        {logLink && <a href={logLink} className="underline text-sm" target="_blank" rel="noreferrer">logs</a>}
      </div>
      <textarea value={payload} onChange={e=>setPayload(e.target.value)} rows={6} className="w-full border p-2 font-mono"></textarea>
      {result && (
        <pre className="bg-gray-100 p-2 text-sm overflow-auto">{JSON.stringify(result,null,2)}</pre>
      )}
    </div>
  )
}
