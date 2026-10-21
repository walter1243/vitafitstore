import { NextRequest, NextResponse } from 'next/server';
import { itemShipping, unitPriceFor } from '@/lib/personalize';
import { sql } from '@/lib/db';
import { resolveShipping } from '@/lib/checkout-pricing';

type CheckoutItemInput = {
  productId: number;
  quantity: number;
};

function parseItems(rawItems: unknown): CheckoutItemInput[] {
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .map((item) => {
      const productId = Number((item as any)?.productId);
      const quantity = Number((item as any)?.quantity ?? 1);
      return {
        productId,
        quantity,
      };
    })
    .filter((item) => Number.isFinite(item.productId) && item.productId > 0 && Number.isFinite(item.quantity) && item.quantity > 0)
    .map((item) => ({
      productId: Math.trunc(item.productId),
      quantity: Math.trunc(item.quantity),
    }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = parseItems(body?.items);
    const country = String(body?.country ?? 'ES').toUpperCase();

    if (items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio.' }, { status: 400 });
    }

    const productIds = [...new Set(items.map((item) => item.productId))];

    const rows = await sql`
      SELECT *
      FROM products
      WHERE id = ANY(${productIds})
    `;

    const priceById = new Map<number, number>();
    for (const row of rows as any[]) {
      priceById.set(Number(row.id), Number(row.price));
    }

    const missing = productIds.filter((id) => !priceById.has(id));
    if (missing.length > 0) {
      return NextResponse.json({ error: 'Há produtos inválidos no carrinho.' }, { status: 400 });
    }

    const persById = new Map<number, unknown>((rows as any[]).map((r) => [Number(r.id), r.personalize]));
    const qtyById = new Map<number, number>();
    for (const it of items) qtyById.set(Number(it.productId), (qtyById.get(Number(it.productId)) ?? 0) + Number(it.quantity));
    const subtotal = items.reduce((sum, item) => {
      const unitPrice = unitPriceFor(priceById.get(item.productId) ?? 0, persById.get(Number(item.productId)), qtyById.get(Number(item.productId)) ?? 0);
      return sum + unitPrice * item.quantity;
    }, 0);

    const shippingById = new Map<number, number | null>((rows as any[]).map((r) => [Number(r.id), r.shipping_cost != null ? Number(r.shipping_cost) : null]));
    const shipping = resolveShipping(subtotal, country, items.map((item: any) => itemShipping(shippingById.get(Number(item.productId)), persById.get(Number(item.productId)), qtyById.get(Number(item.productId)) ?? 0)));
    const total = subtotal + shipping;

    return NextResponse.json({
      subtotal: Number(subtotal.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      total: Number(total.toFixed(2)),
      currency: 'EUR',
    });
  } catch (err: any) {
    console.error('[POST /api/checkout/quote]', err);
    return NextResponse.json(
      { error: err?.message ?? 'Não foi possível calcular o checkout.' },
      { status: 500 }
    );
  }
}
