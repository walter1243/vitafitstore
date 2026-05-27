import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const ADMIN_COOKIE_NAME = 'admin_session';

export type AdminSession = {
  userId: number;
  username: string;
  displayName: string;
  photoUrl: string;
  role: string;
  exp: number;
};

function getDefaultSessionMaxAgeSec() {
  const fromEnv = Number(process.env.ADMIN_SESSION_MAX_AGE_SEC ?? 0);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return Math.floor(fromEnv);
  return 60 * 60 * 24 * 30;
}

function getSecret() {
  return process.env.ADMIN_AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'change-me-admin-auth-secret';
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(payloadB64: string) {
  return createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
}

export function createSessionToken(session: Omit<AdminSession, 'exp'>, maxAgeSec = getDefaultSessionMaxAgeSec()) {
  const payload: AdminSession = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + maxAgeSec,
  };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function parseSessionToken(token?: string | null): AdminSession | null {
  if (!token) return null;
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;

  const expected = signPayload(payloadB64);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as AdminSession;
    if (!payload?.userId || !payload?.username || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = String(storedHash || '').split(':');
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64).toString('hex');
  const hashBuf = Buffer.from(hash, 'hex');
  const derivedBuf = Buffer.from(derived, 'hex');
  if (hashBuf.length !== derivedBuf.length) return false;
  return timingSafeEqual(hashBuf, derivedBuf);
}

export async function ensureAdminUsersTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      photo_url TEXT,
      role TEXT NOT NULL DEFAULT 'admin',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS photo_url TEXT`;
  await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'`;
  await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE`;
  await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`;

  const [{ total }] = await sql`SELECT COUNT(*)::INTEGER AS total FROM admin_users`;
  if (Number(total || 0) === 0) {
    const seedUsername = String(process.env.ADMIN_DEFAULT_USERNAME || 'admin').trim().toLowerCase();
    const seedDisplayName = String(process.env.ADMIN_DEFAULT_DISPLAY_NAME || seedUsername || 'Administrador').trim();
    const seedPassword = String(process.env.ADMIN_DEFAULT_PASSWORD || '').trim();

    if (!seedPassword) {
      console.warn('[admin-auth] ADMIN_DEFAULT_PASSWORD não definido. Seed inicial de admin ignorado.');
      return;
    }

    const defaultHash = hashPassword(seedPassword);
    await sql`
      INSERT INTO admin_users (username, password_hash, display_name, role, active)
      VALUES (${seedUsername}, ${defaultHash}, ${seedDisplayName}, 'admin', TRUE)
      ON CONFLICT (username) DO NOTHING
    `;
  }
}

export function getAdminSessionFromCookieStore(cookieStore: { get: (name: string) => { value: string } | undefined }) {
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return parseSessionToken(token);
}

export function getAdminSessionFromRequest(req: NextRequest) {
  return parseSessionToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export async function requireAdmin(req: NextRequest) {
  await ensureAdminUsersTable();
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Sessão inválida. Faça login.' }, { status: 401 }),
    };
  }
  return { ok: true as const, session };
}

export function buildAuthCookie(token: string, maxAgeSec = getDefaultSessionMaxAgeSec()) {
  return {
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSec,
  };
}

export function buildClearAuthCookie() {
  return {
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}
