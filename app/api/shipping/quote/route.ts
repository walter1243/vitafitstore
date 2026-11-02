import { NextRequest, NextResponse } from 'next/server';
import { quoteShipping } from '@/lib/shipping-quote';
import { COUNTRY_COOKIE, viewerCountry } from '@/lib/country-price';

export const dynamic = 'force-dynamic';

// POST { items: [{productId, quantity}], zip, country? } → opcoes de frete
// (a domicilio / recoger en punto) calculadas pela Packlink.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    // Pais: o enviado ou o de quem ve (cookie do checkout / localizacao).
    const country = /^[A-Za-z]{2}$/.test(String(body?.country ?? '')) ? String(body.country).toUpperCase() : viewerCountry(req.cookies.get(COUNTRY_COOKIE)?.value, req.headers.get('x-vercel-ip-country'));
    const zip = country === 'ES' ? String(body?.zip ?? '').replace(/\D/g, '').slice(0, 5) : String(body?.zip ?? '').slice(0, 10);
    if (country === 'ES' && zip.length !== 5) return NextResponse.json({ error: 'Código postal no válido.' }, { status: 400 });
    const items = Array.isArray(body?.items) ? body.items.slice(0, 50).map((i: any) => ({ productId: Number(i?.productId), quantity: Math.max(1, Math.min(99, Number(i?.quantity) || 1)), size: typeof i?.size === 'string' ? i.size.slice(0, 40) : undefined })) : [];
    const q = await quoteShipping(items, zip, country);
    if (q.unsupported) return NextResponse.json(q, { status: 400 });
    return NextResponse.json(q);
  } catch (err: any) {
    console.error('[POST /api/shipping/quote]', err);
    return NextResponse.json({ error: 'No se pudo calcular el envío.' }, { status: 500 });
  }
}
