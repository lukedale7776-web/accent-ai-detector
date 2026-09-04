import { cookies } from 'next/headers';
import { QuotaStatus } from './types';
import { getCurrentUser, isOwnerAdminEmail } from './auth';

const MAX_DAILY_TRIES = 5;
const COOKIE_NAME = 'accentai_quota';
const ADMIN_PASSCODE = process.env.ADMIN_SECRET_KEY || 'admin123';

interface StoredQuota {
  date: string; // YYYY-MM-DD
  count: number;
}

function getTodayUTCString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getMidnightUTC(): string {
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  return tomorrow.toISOString();
}

export function checkAdminAccess(providedKey?: string | null): boolean {
  // Check if active user session belongs to owner admin (lukedale7776@gmail.com)
  try {
    const user = getCurrentUser();
    if (user && isOwnerAdminEmail(user.email)) return true;
  } catch {
    // ignore
  }

  if (!providedKey) return false;
  return providedKey.trim() === ADMIN_PASSCODE.trim();
}

export function getQuotaStatus(isAdmin: boolean): QuotaStatus {
  if (isAdmin) {
    return {
      triesRemaining: 999999,
      maxDailyTries: MAX_DAILY_TRIES,
      isAdmin: true,
      resetAt: getMidnightUTC(),
    };
  }

  const cookieStore = cookies();
  const rawCookie = cookieStore.get(COOKIE_NAME)?.value;
  const today = getTodayUTCString();

  let quotaData: StoredQuota = { date: today, count: 0 };

  if (rawCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(rawCookie));
      if (parsed.date === today) {
        quotaData = parsed;
      }
    } catch {
      // invalid cookie, reset
    }
  }

  const remaining = Math.max(0, MAX_DAILY_TRIES - quotaData.count);

  return {
    triesRemaining: remaining,
    maxDailyTries: MAX_DAILY_TRIES,
    isAdmin: false,
    resetAt: getMidnightUTC(),
  };
}

export function consumeQuota(isAdmin: boolean): { allowed: boolean; remaining: number } {
  if (isAdmin) {
    return { allowed: true, remaining: 999999 };
  }

  const cookieStore = cookies();
  const rawCookie = cookieStore.get(COOKIE_NAME)?.value;
  const today = getTodayUTCString();

  let quotaData: StoredQuota = { date: today, count: 0 };

  if (rawCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(rawCookie));
      if (parsed.date === today) {
        quotaData = parsed;
      }
    } catch {
      // reset
    }
  }

  if (quotaData.count >= MAX_DAILY_TRIES) {
    return { allowed: false, remaining: 0 };
  }

  quotaData.count += 1;
  const remaining = MAX_DAILY_TRIES - quotaData.count;

  // Set cookie for 48 hours
  cookieStore.set(COOKIE_NAME, encodeURIComponent(JSON.stringify(quotaData)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 48,
    path: '/',
  });

  return { allowed: true, remaining };
}
