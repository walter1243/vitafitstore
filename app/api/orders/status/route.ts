import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Estado do pedido pro cliente (/pedido): precisa do numero do pedido e do
// e-mail usado na compra. Nao devolve endereco nem telefone.
export async function GET(req: NextRequest) {
  const n = Number(req.nextUrl.searchParams.get('n'));
  const e = String(req.nextUrl.searchParams.get('e') ?? '').trim().toLowerCase();
  if (!Number.isInteger(n) || n <= 0 || !e) {
    return NextResponse.json({ error: 'Escribe el número de pedido y tu e-mail.' }, { status: 400 });
  }
  try {
    const [o] = await sql`
      SELECT o.id, o.status, o.items_json, o.shipping_method, o.pickup_point, o.tracking_url,
             COALESCE(o.total_amount, 0)::FLOAT AS total, TO_CHAR(o.created_at, 'DD/MM/YYYY') AS date,
             p.name AS product
      FROM orders o LEFT JOIN products p ON o.product_id = p.id
      WHERE o.id = ${n} AND LOWER(TRIM(COALESCE(o.customer_email, ''))) = ${e}
    `;
    if (!o) return NextResponse.json({ error: 'No encontramos ese pedido. Revisa el número y el e-mail de la compra.' }, { status: 404 });

    let items: { name: string; quantity: number }[] = [];
    try {
      items = (JSON.parse(String(o.items_json ?? '[]')) as any[]).map((it) => ({ name: String(it?.name ?? ''), quantity: Number(it?.quantity ?? 1) })).filter((it) => it.name);
    } catch { items = []; }
    if (!items.length && o.product) items = [{ name: String(o.product), quantity: 1 }];

    // "codigo · nome · endereco · cp cidade" → sem o codigo interno do ponto.
    const [, pointName = '', address = '', zipCity = ''] = String(o.pickup_point ?? '').split(' · ').map((s: string) => s.trim());
    return NextResponse.json({
      id: Number(o.id),
      status: ['pending', 'shipped', 'delivered'].includes(o.status) ? o.status : 'pending',
      date: o.date,
      total: Number(o.total),
      method: o.shipping_method === 'pickup' ? 'pickup' : 'home',
      point: o.shipping_method === 'pickup' && pointName ? { name: pointName, address, zipCity } : null,
      trackingUrl: o.tracking_url || null,
      items,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    console.error('[GET /api/orders/status]', err);
    return NextResponse.json({ error: 'Error al consultar el pedido.' }, { status: 500 });
  }
}
