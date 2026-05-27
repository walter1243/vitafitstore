import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminUsersTable, getAdminSessionFromRequest } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  await ensureAdminUsersTable();
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  return NextResponse.json({ user: session });
}
