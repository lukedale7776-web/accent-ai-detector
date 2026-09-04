import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess, getQuotaStatus } from '@/lib/quota';
import { getAnalytics } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  const adminKey =
    request.headers.get('x-admin-key') ||
    request.nextUrl.searchParams.get('adminKey') ||
    request.nextUrl.searchParams.get('key');

  const isAdmin = checkAdminAccess(adminKey);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin key required to view system analytics.' },
      { status: 401 }
    );
  }

  const analytics = getAnalytics();
  const quota = getQuotaStatus(true);

  return NextResponse.json({
    success: true,
    data: analytics,
    quota,
    serverTime: new Date().toISOString(),
  });
}
