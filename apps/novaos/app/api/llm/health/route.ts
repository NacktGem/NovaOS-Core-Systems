/**
 * LLM Health Check Endpoint for NovaOS
 */

import { NextResponse } from 'next/server';

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8760';

export async function GET() {
  try {
    const response = await fetch(`${CORE_API_URL}/api/llm/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Token': process.env.AGENT_SHARED_TOKEN || '',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'LLM service unavailable',
          providers: [],
        },
        { status: 503 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('LLM health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to connect to LLM service',
        providers: [],
      },
      { status: 500 }
    );
  }
}
