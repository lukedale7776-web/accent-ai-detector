import { NextRequest, NextResponse } from 'next/server';
import { recordVisit } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const visitorId = body?.visitorId as string | undefined;
    const stats = recordVisit(visitorId);
    return NextResponse.json({ success: true, ...stats });
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
