import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { sql } from '@/lib/db';
import { ensureCoupons } from '@/lib/coupons';
import { ensureSiteEvents } from '@/lib/site-events';

export const dynamic = 'force-dynamic';

// Resultado do pop-up de cupom no painel: vezes que apareceu, copiou,
// clicou em "Compra ahora", fechou, e pedidos pagos com cupom.
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    await Promise.all([ensureCoupons(), ensureSiteEvents()]);
    const days = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get('days')) || 30));
    const events = (await sql`
      SELECT type, COUNT(*)::int AS total, COUNT(DISTINCT visitor)::int AS people
      FROM site_events
      WHERE type IN ('coupon_view', 'coupon_copy', 'coupon_buy', 'coupon_close')
        AND created_at > NOW() - make_interval(days => ${days})
      GROUP BY type
    `) as any[];
    const [orders] = (await sql`
      SELECT COUNT(*)::int AS orders,
             COALESCE(SUM(discount_amount), 0)::float AS discount,
             COALESCE(SUM(total_amount), 0)::float AS revenue
      FROM orders
      WHERE coupon_code IS NOT NULL
        AND created_at > NOW() - make_interval(days => ${days})
    `) as any[];
    const by = (t: string) => events.find((e) => e.type === t) ?? { total: 0, people: 0 };
    return NextResponse.json({
      days,
      view: by('coupon_view'),
      copy: by('coupon_copy'),
      buy: by('coupon_buy'),
      close: by('coupon_close'),
      orders: orders?.orders ?? 0,
      discount: orders?.discount ?? 0,
      revenue: orders?.revenue ?? 0,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    console.error('[GET /api/coupon-popup/stats]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro.' }, { status: 500 });
  }
}
