import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword, requireAdmin, verifyPassword } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const currentPassword = String(body?.currentPassword ?? '');
    const newPassword = String(body?.newPassword ?? '');

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Senha atual e nova senha são obrigatórias.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Nova senha deve ter pelo menos 8 caracteres.' }, { status: 400 });
    }

    const [user] = await sql`
      SELECT id, password_hash
      FROM admin_users
      WHERE id = ${auth.session.userId}
      LIMIT 1
    `;

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    if (!verifyPassword(currentPassword, String(user.password_hash || ''))) {
      return NextResponse.json({ error: 'Senha atual inválida.' }, { status: 401 });
    }

    const passwordHash = hashPassword(newPassword);
    await sql`
      UPDATE admin_users
      SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE id = ${auth.session.userId}
    `;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[POST /api/admin/auth/change-password]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao atualizar senha.' }, { status: 500 });
  }
}
