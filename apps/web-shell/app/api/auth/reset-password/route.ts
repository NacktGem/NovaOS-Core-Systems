import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, new_password } = await request.json();

    if (!token || !new_password) {
      return NextResponse.json(
        { success: false, message: 'Token and new password are required' },
        { status: 400 }
      );
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Forward to core-api
    const response = await fetch(`${process.env.CORE_API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.INTERNAL_TOKEN}`,
      },
      body: JSON.stringify({ token, new_password }),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: data.message || 'Password has been reset successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to reset password' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
