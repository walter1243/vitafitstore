import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import {
  buildAuthCookie,
  createSessionToken,
  ensureAdminUsersTable,
  verifyPassword,
} from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    await ensureAdminUsersTable();
    const body = await req.json();
    const username = String(body?.username ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');
    const rememberMe = Boolean(body?.rememberMe ?? true);

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
    }

    const [user] = await sql`
      SELECT id, username, password_hash, display_name, COALESCE(photo_url, '') AS photo_url, role, active
      FROM admin_users
      WHERE LOWER(username) = LOWER(${username})
      LIMIT 1
    `;

    if (!user || !user.active || !verifyPassword(password, String(user.password_hash || ''))) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }

    const maxAgeSec = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 12;

    const token = createSessionToken({
      userId: Number(user.id),
      username: String(user.username),
      displayName: String(user.display_name || user.username),
      photoUrl: String(user.photo_url || ''),
      role: String(user.role || 'admin'),
    }, maxAgeSec);

    const response = NextResponse.json({
      success: true,
      user: {
        id: Number(user.id),
        username: String(user.username),
        displayName: String(user.display_name || user.username),
        photoUrl: String(user.photo_url || ''),
        role: String(user.role || 'admin'),
      },
    });

    response.cookies.set(buildAuthCookie(token, maxAgeSec));
    return response;
  } catch (err: any) {
    console.error('[POST /api/admin/auth/login]', err);
    return NextResponse.json({ error: err?.message ?? 'Falha ao efetuar login.' }, { status: 500 });
  }
}
