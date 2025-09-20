import { NextRequest, NextResponse } from 'next/server';

interface VerificationData {
  email: string;
  type: 'signup' | 'password_reset' | 'email_change';
}

export async function POST(request: NextRequest) {
  try {
    const body: VerificationData = await request.json();
    const { email, type } = body;

    // Validation
    if (!email || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Generate verification code (in production, use crypto.randomBytes)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Mock email sending - replace with actual email service
    // For development, just log the code
    console.log(`Verification code for ${email}: ${verificationCode}`);

    // In production, you would:
    // 1. Generate secure verification token
    // 2. Store in database with expiration (15 minutes)
    // 3. Send email with verification link/code
    // 4. Handle rate limiting to prevent spam

    // In production, send the actual email:
    // const emailTemplate = getEmailTemplate(type, verificationCode);
    // await sendEmail(email, emailTemplate.subject, emailTemplate.html);

    // Mock successful email send
    return NextResponse.json({
      success: true,
      message: `Verification email sent to ${email}`,
      // In development, return the code for testing
      ...(process.env.NODE_ENV === 'development' && { verificationCode }),
    });
  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Email template function for future use
/*
function getEmailTemplate(type: string, code: string) {
    switch (type) {
        case "signup":
            return {
                subject: "Welcome to Black Rose Collective - Verify Your Email",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0b; color: #f5f5f5; padding: 20px; border-radius: 12px;">
                        <h1 style="color: #d6a5c9; text-align: center;">🌹 Welcome to Black Rose Collective</h1>
                        <p>Thank you for joining our exclusive creator platform!</p>
                        <p>Your verification code is:</p>
                        <div style="background-color: #1a1a1d; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                            <h2 style="color: #d6a5c9; font-size: 32px; margin: 0;">${code}</h2>
                        </div>
                        <p>Enter this code to complete your account setup and start exploring the House of Roses.</p>
                        <p><strong>This code expires in 15 minutes.</strong></p>
                        <hr style="border: 1px solid #3d2c2e; margin: 20px 0;">
                        <p style="font-size: 12px; color: #9ca3af;">
                            If you didn't create an account, please ignore this email.
                        </p>
                    </div>
                `
            };
        case "password_reset":
            return {
                subject: "Reset Your Black Rose Collective Password",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0b; color: #f5f5f5; padding: 20px; border-radius: 12px;">
                        <h1 style="color: #d6a5c9; text-align: center;">🌹 Password Reset</h1>
                        <p>We received a request to reset your password.</p>
                        <p>Your verification code is:</p>
                        <div style="background-color: #1a1a1d; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                            <h2 style="color: #d6a5c9; font-size: 32px; margin: 0;">${code}</h2>
                        </div>
                        <p>Enter this code to reset your password.</p>
                        <p><strong>This code expires in 15 minutes.</strong></p>
                        <hr style="border: 1px solid #3d2c2e; margin: 20px 0;">
                        <p style="font-size: 12px; color: #9ca3af;">
                            If you didn't request this, please secure your account immediately.
                        </p>
                    </div>
                `
            };
        default:
            return {
                subject: "Black Rose Collective Verification",
                html: `<p>Your verification code: ${code}</p>`
            };
    }
}
*/

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
