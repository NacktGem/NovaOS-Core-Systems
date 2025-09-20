import { NextResponse } from 'next/server';
import { coreApiJson } from '@/lib/core-api';

export async function GET() {
  try {
    const status = await coreApiJson('/agents/leakguard/status');
    return NextResponse.json(status);
  } catch (error) {
    console.error('Failed to fetch LeakGuard status:', error);
    return NextResponse.json({ error: 'Failed to fetch agent status' }, { status: 500 });
  }
}
