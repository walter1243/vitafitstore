import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensureReviewsTable } from '@/lib/reviews-schema';

export const dynamic = 'force-dynamic';

// POST { id, action: 'helpful' | 'unhelpful' | 'report' } — botao "Útil" e
// "Reportar opinión" da pagina do produto (o navegador evita voto repetido).
export async function POST(req: NextRequest) {
  try {
    await ensureReviewsTable();
    const b = await req.json().catch(() => ({}));
    const id = Number(b?.id);
    if (!id) return NextResponse.json({ error: 'id inválido.' }, { status: 400 });
    if (b?.action === 'helpful') {
      const [r] = await sql`UPDATE product_reviews SET helpful = helpful + 1 WHERE id = ${id} AND status = 'approved' RETURNING helpful`;
      return NextResponse.json({ helpful: r?.helpful ?? 0 });
    }
    if (b?.action === 'unhelpful') {
      const [r] = await sql`UPDATE product_reviews SET helpful = GREATEST(helpful - 1, 0) WHERE id = ${id} AND status = 'approved' RETURNING helpful`;
      return NextResponse.json({ helpful: r?.helpful ?? 0 });
    }
    if (b?.action === 'report') {
      await sql`UPDATE product_reviews SET reports = reports + 1 WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Erro.' }, { status: 500 });
  }
}
