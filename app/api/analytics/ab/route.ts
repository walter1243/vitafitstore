import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { ensureSiteEvents } from '@/lib/site-events';

export const dynamic = 'force-dynamic';

// Resultado do teste A/B (grade x carrossel): visitantes de cada versão e quantos
// clicaram num produto, puseram no carrinho e compraram (visitante = hash diário).
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const days = Math.max(1, Math.min(180, Number(req.nextUrl.searchParams.get('days')) || 30));
  try {
    await ensureSiteEvents();
    const rows = await sql`
      SELECT variant,
             COUNT(DISTINCT visitor)::int AS visitors,
             COUNT(DISTINCT visitor) FILTER (WHERE type = 'product_click')::int AS clicked,
             COUNT(DISTINCT visitor) FILTER (WHERE type = 'add_to_cart')::int AS carted,
             COUNT(DISTINCT visitor) FILTER (WHERE type = 'purchase')::int AS bought,
             COUNT(*) FILTER (WHERE type = 'purchase')::int AS purchases
      FROM site_events
      WHERE variant IN ('grid', 'carousel') AND created_at > NOW() - (${days} || ' days')::interval
      GROUP BY variant
    `;
    const out: Record<string, unknown> = { days, grid: null, carousel: null };
    for (const r of rows as any[]) out[r.variant] = r;
    return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    console.error('[GET /api/analytics/ab]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro' }, { status: 500 });
  }
}
