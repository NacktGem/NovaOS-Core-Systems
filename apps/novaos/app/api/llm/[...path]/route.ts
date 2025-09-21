/**
 * LLM API Route for NovaOS GodMode Dashboard
 * Proxies LLM requests to the Core API LLM service
 */

import { NextRequest, NextResponse } from 'next/server';

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8760';

export async function GET(request: NextRequest) {
  const { pathname, searchParams } = new URL(request.url);
  const llmPath = pathname.replace('/api/llm', '');

  try {
    const response = await fetch(`${CORE_API_URL}/api/llm${llmPath}?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('Authorization') || '',
        'X-Agent-Token': process.env.AGENT_SHARED_TOKEN || '',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'LLM service unavailable' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('LLM API proxy error:', error);
    return NextResponse.json({ error: 'Failed to connect to LLM service' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const llmPath = pathname.replace('/api/llm', '');

  try {
    const body = await request.json();

    const response = await fetch(`${CORE_API_URL}/api/llm${llmPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('Authorization') || '',
        'X-Agent-Token': process.env.AGENT_SHARED_TOKEN || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'LLM service error' },
        { status: response.status }
      );
    }

    // Handle streaming responses
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      const stream = new ReadableStream({
        start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          function pump(): Promise<void> {
            return reader
              .read()
              .then(({ done, value }) => {
                if (done) {
                  controller.close();
                  return;
                }
                controller.enqueue(value);
                return pump();
              })
              .catch((error) => {
                console.error('Stream error:', error);
                controller.close();
              });
          }

          return pump();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('LLM API proxy error:', error);
    return NextResponse.json({ error: 'Failed to process LLM request' }, { status: 500 });
  }
}
