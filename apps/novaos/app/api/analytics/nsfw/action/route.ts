import { NextRequest, NextResponse } from 'next/server';
import { coreApiJson } from '@/lib/core-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await coreApiJson('/analytics/nsfw/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to take NSFW action:', error);
    return NextResponse.json({ error: 'Failed to take action' }, { status: 500 });
  }
}
