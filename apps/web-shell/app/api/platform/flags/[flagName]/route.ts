import { NextRequest, NextResponse } from 'next/server';

import { CoreApiError, coreApiJson } from '@/lib/core-api';

type FlagRecord = {
  name: string;
  value: boolean;
  updated_at: string | null;
  updated_by: string | null;
};

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ flagName: string }> }) {
  const { flagName } = await params;
  const payload = await req.json();
  try {
    const data = await coreApiJson<FlagRecord>(`/platform/flags/${flagName}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof CoreApiError) {
      return NextResponse.json(
        { error: 'flag_update_failed', detail: error.payload },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'flag_update_failed', detail: 'unknown error' },
      { status: 500 }
    );
  }
}
