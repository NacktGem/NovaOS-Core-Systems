import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ valid: false, message: 'Token is required' }, { status: 400 });
    }

    // Forward to core-api
    const response = await fetch(`${process.env.CORE_API_URL}/auth/verify-reset-token/${token}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_TOKEN}`,
      },
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json({ valid: false, message: 'Internal server error' }, { status: 500 });
  }
}
