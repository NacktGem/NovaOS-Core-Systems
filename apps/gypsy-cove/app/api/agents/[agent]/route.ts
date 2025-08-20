import { NextRequest } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: { agent: string } }) {
  const token = process.env.NOVA_AGENT_TOKEN
  const base = process.env.CORE_API_BASE || process.env.NEXT_PUBLIC_CORE_API_URL
  if (!token || !base) {
    return new Response(JSON.stringify({ success:false, output:null, error:'missing server env' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
  const body = await req.text()
  const upstream = await fetch(`${base}/agents/${params.agent}`, {
    method: 'POST',
    headers: { 'content-type':'application/json', 'X-NOVA-TOKEN': token },
    body,
  })
  const text = await upstream.text()
  return new Response(text, { status: upstream.status, headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' } })
}

