/**
 * LLM Chat Completions Endpoint for NovaOS GodMode
 * Provides OpenAI-compatible chat completions API
 */

import { NextRequest, NextResponse } from 'next/server';

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8760';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${CORE_API_URL}/api/llm/chat/completions`, {
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
        { error: errorData.error || 'Chat completion failed' },
        { status: response.status }
      );
    }

    // Handle streaming responses
    if (body.stream && response.headers.get('content-type')?.includes('text/event-stream')) {
      const stream = new ReadableStream({
        start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          function pump(): Promise<void> {
            return reader!
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
                console.error('Chat stream error:', error);
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
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Chat completion error:', error);
    return NextResponse.json({ error: 'Failed to process chat completion' }, { status: 500 });
  }
}
