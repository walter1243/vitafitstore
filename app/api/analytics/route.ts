import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { ensureSiteEvents } from '@/lib/site-events';

export const dynamic = 'force-dynamic';

// Estatisticas pro Dashboard do admin. ?days=7|30|90 (padrao 30).
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;
    await ensureSiteEvents();
    const days = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get('days')) || 30));
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);

    const [totals] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE type = 'page_view')::INT                              AS views,
        COUNT(DISTINCT visitor || TO_CHAR(created_at, 'YYYY-MM-DD'))::INT             AS visitors,
        COUNT(*) FILTER (WHERE type = 'page_view' AND product_id IS NOT NULL)::INT  AS "productViews",
        COUNT(*) FILTER (WHERE type = 'product_click')::INT                           AS "productClicks",
        COUNT(*) FILTER (WHERE type = 'add_to_cart')::INT                             AS "addToCart"
      FROM site_events WHERE created_at >= ${since}
    `;
    const [today] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE type = 'page_view')::INT AS views,
        COUNT(DISTINCT visitor)::INT                    AS visitors
      FROM site_events WHERE created_at >= ${dayStart.toISOString()}
    `;
    const [orders] = await sql`
      SELECT COUNT(*)::INT AS count, COALESCE(SUM(total_amount), 0)::FLOAT AS revenue
      FROM orders WHERE created_at >= ${since}
    `;
    const daily = await sql`
      SELECT TO_CHAR(d, 'YYYY-MM-DD') AS day,
             COALESCE(e.views, 0)::INT AS views,
             COALESCE(e.visitors, 0)::INT AS visitors
      FROM generate_series(CURRENT_DATE - 13, CURRENT_DATE, INTERVAL '1 day') d
      LEFT JOIN (
        SELECT created_at::DATE AS day,
               COUNT(*) FILTER (WHERE type = 'page_view') AS views,
               COUNT(DISTINCT visitor) AS visitors
        FROM site_events WHERE created_at >= CURRENT_DATE - 13
        GROUP BY 1
      ) e ON e.day = d::DATE
      ORDER BY d
    `;
    const products = await sql`
      SELECT e.product_id AS id,
             COALESCE(MAX(p.name), 'Produto #' || e.product_id) AS name,
             COUNT(*) FILTER (WHERE e.type = 'page_view')::INT     AS views,
             COUNT(*) FILTER (WHERE e.type = 'product_click')::INT AS clicks,
             COUNT(*) FILTER (WHERE e.type = 'add_to_cart')::INT   AS carts
      FROM site_events e
      LEFT JOIN products p ON p.id = e.product_id
      WHERE e.created_at >= ${since} AND e.product_id IS NOT NULL
      GROUP BY e.product_id
      ORDER BY views + clicks DESC
      LIMIT 10
    `;
    const pages = await sql`
      SELECT path, COUNT(*)::INT AS views
      FROM site_events
      WHERE created_at >= ${since} AND type = 'page_view'
      GROUP BY path ORDER BY views DESC LIMIT 8
    `;

    return NextResponse.json({ days, totals, today, orders, daily, products, pages }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    console.error('[GET /api/analytics]', err);
    return NextResponse.json({ error: err?.message ?? 'Database error' }, { status: 500 });
  }
}
