import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const { user } = authenticateUser(email, password);
    setSessionCookie(user);

    return NextResponse.json({
      success: true,
      user,
      message: 'Logged in successfully.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid login credentials.';
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
