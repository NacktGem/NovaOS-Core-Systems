import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const parts = url.pathname.split('/');
  const idx = parts.lastIndexOf('agents');
  const agent = idx >= 0 && parts[idx + 1] ? parts[idx + 1] : '';
  try {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({ ok: true, agent, received: body }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
