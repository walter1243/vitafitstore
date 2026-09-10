import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Admin-only: every review regardless of status, for the moderation queue.
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const rows = await sql`
      SELECT
        r.id, r.product_id AS "productId", r.customer_name AS "customerName",
        r.rating, r.comment, r.photo_url AS "photoUrl", r.status,
        TO_CHAR(r.created_at, 'YYYY-MM-DD HH24:MI') AS date,
        COALESCE(p.name, 'Produto removido') AS "productName"
      FROM product_reviews r
      LEFT JOIN products p ON p.id = r.product_id
      ORDER BY (r.status = 'pending') DESC, r.created_at DESC
    `;
    return NextResponse.json(rows, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } });
  } catch (err: any) {
    console.error('[GET /api/reviews/moderate]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao listar avaliações.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id, status } = await req.json();
    const reviewId = Number(id);
    if (!reviewId || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
    }
    await sql`UPDATE product_reviews SET status = ${status} WHERE id = ${reviewId}`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[PATCH /api/reviews/moderate]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao atualizar avaliação.' }, { status: 500 });
  }
}
