import { NextRequest, NextResponse } from 'next/server';
import { coreApiJson } from '@/lib/core-api';

export async function POST(request: NextRequest) {
  try {
    const contentIds = await request.json();
    const result = await coreApiJson('/analytics/nsfw/verify-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contentIds),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to verify consent:', error);
    return NextResponse.json({ error: 'Failed to verify consent' }, { status: 500 });
  }
}
