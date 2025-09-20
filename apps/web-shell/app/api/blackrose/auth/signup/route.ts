import { NextRequest, NextResponse } from 'next/server';

interface SignupData {
  email: string;
  password: string;
  displayName: string;
  role: 'creator' | 'user';
  studios: string[];
  theme: 'light' | 'dark';
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupData = await request.json();
    const { email, password, displayName, role, studios, theme } = body;

    // Validation
    if (!email || !password || !displayName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists (mock check - replace with database query)
    // const existingUser = await checkUserExists(email);
    // if (existingUser) {
    //     return NextResponse.json(
    //         { error: "User with this email already exists" },
    //         { status: 409 }
    //     );
    // }

    // Create user account (mock implementation)
    const newUser = {
      id: `user_${Date.now()}`,
      email,
      displayName,
      role,
      studios: studios || [],
      theme: theme || 'dark',
      verified: false,
      createdAt: new Date().toISOString(),
      emailVerified: false,
    };

    // In production, you would:
    // 1. Hash the password with bcrypt
    // 2. Save to database
    // 3. Send verification email
    // 4. Create secure session

    // For now, return success response
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        studios: newUser.studios,
        theme: newUser.theme,
        verified: newUser.verified,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
