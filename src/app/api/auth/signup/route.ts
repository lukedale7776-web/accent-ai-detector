import { NextRequest, NextResponse } from 'next/server';
import { registerUser, setSessionCookie } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please provide a valid name (at least 2 characters).' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // Register user
    const { user } = registerUser(name, email, password);

    // Set signed session cookie
    setSessionCookie(user);

    // Trigger welcome email
    const emailResult = await sendWelcomeEmail({
      toEmail: user.email,
      userName: user.name,
    });

    return NextResponse.json({
      success: true,
      user,
      welcomeEmail: {
        sent: emailResult.success,
        deliveryMethod: emailResult.deliveredVia,
        messageId: emailResult.messageId,
      },
      message: `Account created successfully! Welcome email dispatched to ${user.email}.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'An error occurred during registration.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
