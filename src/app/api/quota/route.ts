import { NextRequest, NextResponse } from 'next/server';
import { getQuotaStatus, checkAdminAccess } from '@/lib/quota';

export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  const isAdmin = checkAdminAccess(adminKey);
  const status = getQuotaStatus(isAdmin);

  return NextResponse.json(status);
}
