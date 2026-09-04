import crypto from 'crypto';
import { cookies } from 'next/headers';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

const AUTH_COOKIE = 'accentai_session';
const SESSION_SECRET = process.env.ADMIN_SECRET_KEY || 'accentai_super_secret_session_key_2026';

export const ADMIN_EMAILS = ['lukedale7776@gmail.com', 'admin@accentai.com'];

export function isOwnerAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

// In-memory user store for serverless instance (pre-seeded with demo account)
const usersByEmail = new Map<string, StoredUser>();

// Pre-seed primary owner admin: Luke Dale (lukedale7776@gmail.com)
const lukeSalt = crypto.randomBytes(16).toString('hex');
const lukeHash = crypto.scryptSync('admin123', lukeSalt, 64).toString('hex');
usersByEmail.set('lukedale7776@gmail.com', {
  id: 'usr_owner_lukedale',
  name: 'Luke Dale',
  email: 'lukedale7776@gmail.com',
  role: 'admin',
  createdAt: new Date().toISOString(),
  passwordHash: lukeHash,
  salt: lukeSalt,
});

// Pre-seed backup admin
const adminSalt = crypto.randomBytes(16).toString('hex');
const adminHash = crypto.scryptSync('admin123', adminSalt, 64).toString('hex');
usersByEmail.set('admin@accentai.com', {
  id: 'usr_admin',
  name: 'Admin',
  email: 'admin@accentai.com',
  role: 'admin',
  createdAt: new Date().toISOString(),
  passwordHash: adminHash,
  salt: adminSalt,
});

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
}

export function createSessionToken(user: User): string {
  const payload = JSON.stringify({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  });
  const encoded = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): User | null {
  try {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return null;

    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));
    if (payload.exp < Date.now()) return null;

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: isOwnerAdminEmail(payload.email) ? 'admin' : payload.role,
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function getCurrentUser(): User | null {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function setSessionCookie(user: User) {
  const token = createSessionToken(user);
  const cookieStore = cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE);
}

export function registerUser(name: string, email: string, password: string): { user: User } {
  const normalizedEmail = email.toLowerCase().trim();
  if (usersByEmail.has(normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }

  const { hash, salt } = hashPassword(password);
  const id = 'usr_' + crypto.randomBytes(8).toString('hex');
  const role: 'user' | 'admin' = isOwnerAdminEmail(normalizedEmail) ? 'admin' : 'user';

  const storedUser: StoredUser = {
    id,
    name: name.trim(),
    email: normalizedEmail,
    role,
    createdAt: new Date().toISOString(),
    passwordHash: hash,
    salt,
  };

  usersByEmail.set(normalizedEmail, storedUser);

  const { passwordHash: _, salt: __, ...publicUser } = storedUser;
  return { user: publicUser };
}

export function authenticateUser(email: string, password: string): { user: User } {
  const normalizedEmail = email.toLowerCase().trim();
  const storedUser = usersByEmail.get(normalizedEmail);

  if (!storedUser) {
    // If owner admin email, automatically auto-provision
    if (isOwnerAdminEmail(normalizedEmail)) {
      const { hash, salt } = hashPassword(password);
      const newAdmin: StoredUser = {
        id: 'usr_owner_lukedale',
        name: 'Luke Dale',
        email: normalizedEmail,
        role: 'admin',
        createdAt: new Date().toISOString(),
        passwordHash: hash,
        salt,
      };
      usersByEmail.set(normalizedEmail, newAdmin);
      const { passwordHash: _, salt: __, ...publicUser } = newAdmin;
      return { user: publicUser };
    }
    throw new Error('Invalid email or password.');
  }

  // Allow admin123 fallback for owner admin
  const isMasterPass = isOwnerAdminEmail(normalizedEmail) && password === 'admin123';
  const isValid = isMasterPass || verifyPassword(password, storedUser.passwordHash, storedUser.salt);
  if (!isValid) {
    throw new Error('Invalid email or password.');
  }

  if (isOwnerAdminEmail(normalizedEmail)) {
    storedUser.role = 'admin';
  }

  const { passwordHash: _, salt: __, ...publicUser } = storedUser;
  return { user: publicUser };
}
