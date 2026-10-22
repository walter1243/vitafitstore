import { NextRequest, NextResponse } from 'next/server';
import { quoteShipping } from '@/lib/shipping-quote';

export const dynamic = 'force-dynamic';

// POST { items: [{productId, quantity}], zip, country? } → opcoes de frete
// (a domicilio / recoger en punto) calculadas pela Packlink.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const zip = String(body?.zip ?? '').replace(/\D/g, '').slice(0, 5);
    if (zip.length !== 5) return NextResponse.json({ error: 'Código postal no válido.' }, { status: 400 });
    const items = Array.isArray(body?.items) ? body.items.slice(0, 50).map((i: any) => ({ productId: Number(i?.productId), quantity: Math.max(1, Math.min(99, Number(i?.quantity) || 1)) })) : [];
    const q = await quoteShipping(items, zip, 'ES');
    return NextResponse.json(q);
  } catch (err: any) {
    console.error('[POST /api/shipping/quote]', err);
    return NextResponse.json({ error: 'No se pudo calcular el envío.' }, { status: 500 });
  }
}
