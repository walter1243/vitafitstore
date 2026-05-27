import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword, requireAdmin } from '@/lib/admin-auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const userId = Number(id);
    if (!userId) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    const body = await req.json();
    const displayName = body?.displayName != null ? String(body.displayName).trim() : null;
    const username = body?.username != null ? String(body.username).trim().toLowerCase() : null;
    const photoUrl = body?.photoUrl != null ? String(body.photoUrl).trim() : null;
    const password = body?.password != null ? String(body.password) : null;
    const role = body?.role != null ? String(body.role).trim() : null;
    const active = body?.active;

    if (username) {
      const [dup] = await sql`
        SELECT id FROM admin_users WHERE LOWER(username) = LOWER(${username}) AND id <> ${userId} LIMIT 1
      `;
      if (dup) {
        return NextResponse.json({ error: 'Nome de usuário já em uso.' }, { status: 409 });
      }
    }

    await sql`
      UPDATE admin_users
      SET
        username = COALESCE(${username}, username),
        display_name = COALESCE(${displayName}, display_name),
        photo_url = COALESCE(${photoUrl}, photo_url),
        role = COALESCE(${role}, role),
        active = COALESCE(${active ?? null}, active),
        password_hash = COALESCE(${password ? hashPassword(password) : null}, password_hash),
        updated_at = NOW()
      WHERE id = ${userId}
    `;

    const [updated] = await sql`
      SELECT id, username, display_name AS "displayName", COALESCE(photo_url, '') AS "photoUrl", role, active
      FROM admin_users
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (!updated) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error('[PATCH /api/admin/users/:id]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao atualizar usuário.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const userId = Number(id);
    if (!userId) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    if (auth.session.userId === userId) {
      return NextResponse.json({ error: 'Não é possível excluir seu próprio usuário logado.' }, { status: 400 });
    }

    await sql`DELETE FROM admin_users WHERE id = ${userId}`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE /api/admin/users/:id]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao excluir usuário.' }, { status: 500 });
  }
}
