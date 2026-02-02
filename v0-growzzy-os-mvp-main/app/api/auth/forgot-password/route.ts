import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordEmail } from '@/lib/auth-simple';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await resetPasswordEmail(email);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('[v0] Forgot password error:', error);
    // Don't reveal if email exists for security
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  }
}
