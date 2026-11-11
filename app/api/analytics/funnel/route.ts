import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { ensureSiteEvents } from '@/lib/site-events';

export const dynamic = 'force-dynamic';

// Funil de compra do Dashboard: quantas PESSOAS (visitante = hash diário, sem cookies)
// chegaram a cada passo no período. ?days=1|7|30|90  ?device=all|mobile|desktop
//   1 visitou a loja · 2 abriu um produto · 3 pôs no carrinho · 4 abriu o checkout
//   5 começou a pagar · 6 compra confirmada
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    await ensureSiteEvents();
    const days = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get('days')) || 30));
    const dev = req.nextUrl.searchParams.get('device');
    const device = dev === 'mobile' || dev === 'desktop' || dev === 'tablet' ? dev : null;
    const [{ start }] = await sql`SELECT (date_trunc('day', NOW() AT TIME ZONE 'Europe/Madrid') AT TIME ZONE 'Europe/Madrid') AS start`;
    const since = days === 1 ? new Date(start).toISOString() : new Date(Date.now() - days * 86400000).toISOString();

    // uma "pessoa" por visitante por dia (o hash muda todo dia)
    const [f] = await sql`
      WITH ev AS (
        SELECT visitor || TO_CHAR(created_at, 'YYYY-MM-DD') AS who, type, path
        FROM site_events
        WHERE created_at >= ${since} AND (${device}::text IS NULL OR device = ${device})
      )
      SELECT
        COUNT(DISTINCT who)::int                                                         AS visited,
        COUNT(DISTINCT who) FILTER (WHERE type = 'page_view' AND path LIKE '/producto/%')::int AS product,
        COUNT(DISTINCT who) FILTER (WHERE type = 'add_to_cart')::int                    AS cart,
        COUNT(DISTINCT who) FILTER (WHERE type = 'page_view' AND path LIKE '/checkout%')::int  AS checkout,
        COUNT(DISTINCT who) FILTER (WHERE type = 'payment_start')::int                  AS payment,
        COUNT(DISTINCT who) FILTER (WHERE type = 'purchase')::int                       AS purchase
      FROM ev
    `;

    const sources = await sql`
      WITH ev AS (
        SELECT visitor || TO_CHAR(created_at, 'YYYY-MM-DD') AS who, type, path, COALESCE(source, 'sem dado') AS source
        FROM site_events
        WHERE created_at >= ${since} AND (${device}::text IS NULL OR device = ${device})
      )
      SELECT source,
             COUNT(DISTINCT who)::int AS visited,
             COUNT(DISTINCT who) FILTER (WHERE type = 'page_view' AND path LIKE '/producto/%')::int AS product,
             COUNT(DISTINCT who) FILTER (WHERE type = 'add_to_cart')::int AS cart,
             COUNT(DISTINCT who) FILTER (WHERE type = 'purchase')::int AS purchase
      FROM ev GROUP BY source ORDER BY visited DESC LIMIT 8
    `;

    const devices = await sql`
      SELECT COALESCE(device, 'sem dado') AS device,
             COUNT(DISTINCT visitor || TO_CHAR(created_at, 'YYYY-MM-DD'))::int AS visited,
             COUNT(DISTINCT visitor || TO_CHAR(created_at, 'YYYY-MM-DD')) FILTER (WHERE type = 'purchase')::int AS purchase
      FROM site_events WHERE created_at >= ${since}
      GROUP BY 1 ORDER BY visited DESC
    `;

    const methods = await sql`
      SELECT COALESCE(NULLIF(meta, ''), 'sem dado') AS method, COUNT(*)::int AS n
      FROM site_events
      WHERE type = 'payment_start' AND created_at >= ${since} AND (${device}::text IS NULL OR device = ${device})
      GROUP BY 1 ORDER BY n DESC
    `;

    // produtos: quem abriu x quem pôs no carrinho (onde o interesse não vira carrinho)
    const products = await sql`
      SELECT e.product_id AS id, COALESCE(MAX(p.name), 'Produto #' || e.product_id) AS name,
             COUNT(DISTINCT e.visitor || TO_CHAR(e.created_at, 'YYYY-MM-DD')) FILTER (WHERE e.type = 'page_view')::int AS opened,
             COUNT(DISTINCT e.visitor || TO_CHAR(e.created_at, 'YYYY-MM-DD')) FILTER (WHERE e.type = 'add_to_cart')::int AS carted
      FROM site_events e LEFT JOIN products p ON p.id = e.product_id
      WHERE e.product_id IS NOT NULL AND e.created_at >= ${since} AND (${device}::text IS NULL OR e.device = ${device})
      GROUP BY e.product_id ORDER BY opened DESC LIMIT 8
    `;

    return NextResponse.json({ days, device: device ?? 'all', funnel: f, sources, devices, methods, products }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    console.error('[GET /api/analytics/funnel]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao montar o funil.' }, { status: 500 });
  }
}
