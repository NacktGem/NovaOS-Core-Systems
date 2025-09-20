import { NextRequest, NextResponse } from 'next/server';
import { coreApiJson } from '@/lib/core-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') || '25';

    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit);

    const flaggedContent = await coreApiJson(`/analytics/nsfw/flagged?${params}`);
    return NextResponse.json(flaggedContent);
  } catch (error) {
    console.error('Failed to fetch NSFW flagged content:', error);
    return NextResponse.json({ error: 'Failed to fetch flagged content' }, { status: 500 });
  }
}
