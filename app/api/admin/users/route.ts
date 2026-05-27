import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword, requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const users = await sql`
    SELECT id, username,
           display_name AS "displayName",
           COALESCE(photo_url, '') AS "photoUrl",
           role, active,
           TO_CHAR(created_at, 'YYYY-MM-DD') AS "createdAt"
    FROM admin_users
    ORDER BY id ASC
  `;

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const username = String(body?.username ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');
    const displayName = String(body?.displayName ?? username).trim() || username;
    const photoUrl = String(body?.photoUrl ?? '').trim();
    const role = String(body?.role ?? 'editor').trim() || 'editor';

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
    }

    const [exists] = await sql`SELECT id FROM admin_users WHERE LOWER(username) = LOWER(${username}) LIMIT 1`;
    if (exists) {
      return NextResponse.json({ error: 'Esse usuário já existe.' }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const [user] = await sql`
      INSERT INTO admin_users (username, password_hash, display_name, photo_url, role, active, updated_at)
      VALUES (${username}, ${passwordHash}, ${displayName}, ${photoUrl || null}, ${role}, TRUE, NOW())
      RETURNING id, username, display_name AS "displayName", COALESCE(photo_url, '') AS "photoUrl", role, active
    `;

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/admin/users]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao criar usuário.' }, { status: 500 });
  }
}
