import { NextRequest, NextResponse } from 'next/server';

import { CoreApiError, coreApiJson } from '@/lib/core-api';

type Message = {
  id: string;
  user_id: string | null;
  body: string;
};

type MessageList = Message[];

type MessageCreateResponse = { id: string };

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const query = req.nextUrl.searchParams.toString();
  const path = `/rooms/${roomId}/messages${query ? `?${query}` : ''}`;
  try {
    const messages = await coreApiJson<MessageList>(path);
    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    if (error instanceof CoreApiError) {
      return NextResponse.json(
        { error: 'messages_fetch_failed', detail: error.payload },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'messages_fetch_failed', detail: 'unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const body = await req.json();
  try {
    const response = await coreApiJson<MessageCreateResponse>(`/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof CoreApiError) {
      return NextResponse.json(
        { error: 'message_create_failed', detail: error.payload },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'message_create_failed', detail: 'unknown error' },
      { status: 500 }
    );
  }
}
