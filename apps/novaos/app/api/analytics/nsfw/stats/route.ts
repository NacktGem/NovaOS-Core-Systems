import { NextResponse } from 'next/server';
import { coreApiJson } from '@/lib/core-api';

export async function GET() {
  try {
    const stats = await coreApiJson('/analytics/nsfw/stats');
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch NSFW stats:', error);
    return NextResponse.json({ error: 'Failed to fetch NSFW statistics' }, { status: 500 });
  }
}
