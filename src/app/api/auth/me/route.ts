import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getQuotaStatus } from '@/lib/quota';

export async function GET() {
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const quota = getQuotaStatus(isAdmin);

  return NextResponse.json({
    user,
    quota,
    isAuthenticated: Boolean(user),
  });
}
