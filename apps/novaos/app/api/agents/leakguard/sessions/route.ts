import { NextRequest, NextResponse } from 'next/server';
import { coreApiJson } from '@/lib/core-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const riskLevel = searchParams.get('risk_level');
    const limit = searchParams.get('limit') || '25';

    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (riskLevel) params.append('risk_level', riskLevel);
    params.append('limit', limit);

    const sessions = await coreApiJson(`/agents/leakguard/sessions?${params}`);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to fetch LeakGuard sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch LeakGuard sessions' }, { status: 500 });
  }
}
