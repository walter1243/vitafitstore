import { NextRequest, NextResponse } from 'next/server';
import { itemShipping, minQtyFor, unitPriceFor } from '@/lib/personalize';
import { cleanItems, packItems } from '@/lib/order-items';
import Stripe from 'stripe';
import { sql } from '@/lib/db';
import { resolveShipping } from '@/lib/checkout-pricing';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY não está configurada.');
  return new Stripe(key);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, country, postalCode, customerName, customerEmail, customerPhone, addressLine, city } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio.' }, { status: 400 });
    }

    const productIds = [...new Set(items.map((i: any) => Number(i.productId)))];
    const productRows = await sql`SELECT * FROM products WHERE id = ANY(${productIds})`;
    const priceById = new Map<number, number>(
      (productRows as any[]).map((r) => [Number(r.id), Number(r.price)])
    );

    const missing = productIds.filter((id) => !priceById.has(id));
    if (missing.length > 0) {
      return NextResponse.json({ error: 'Há produtos inválidos no carrinho.' }, { status: 400 });
    }

    // Promocao por quantidade (ex: 5 chaveiros) e pedido minimo, conferidos aqui.
    const persById = new Map<number, unknown>((productRows as any[]).map((r) => [Number(r.id), r.personalize]));
    const qtyById = new Map<number, number>();
    for (const it of items as any[]) qtyById.set(Number(it.productId), (qtyById.get(Number(it.productId)) ?? 0) + Number(it.quantity));
    for (const [id, q] of qtyById) {
      if (q < minQtyFor(persById.get(id))) {
        return NextResponse.json({ error: `Este producto tiene un pedido mínimo de ${minQtyFor(persById.get(id))} unidades.` }, { status: 400 });
      }
    }
    const subtotal = items.reduce((sum: number, item: any) => {
      const id = Number(item.productId);
      return sum + unitPriceFor(priceById.get(id) ?? 0, persById.get(id), qtyById.get(id) ?? 0) * Number(item.quantity);
    }, 0);

    const shippingById = new Map<number, number | null>((productRows as any[]).map((r) => [Number(r.id), r.shipping_cost != null ? Number(r.shipping_cost) : null]));
    const shipping = resolveShipping(subtotal, String(country ?? 'ES'), items.map((item: any) => itemShipping(shippingById.get(Number(item.productId)), persById.get(Number(item.productId)), qtyById.get(Number(item.productId)) ?? 0)));
    const amount = Math.round((subtotal + shipping) * 100);

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Importe inválido.' }, { status: 400 });
    }

    const stripe = getStripe();
    const pi = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        customerName:  customerName  ?? '',
        customerEmail: customerEmail ?? '',
        customerPhone: customerPhone ?? '',
        addressLine:   addressLine   ?? '',
        postalCode:    postalCode    ?? '',
        city:          city          ?? '',
        country:       country       ?? 'ES',
        ...packItems(cleanItems(items)),
        subtotal:      subtotal.toFixed(2),
        shipping:      shipping.toFixed(2),
      },
    });

    return NextResponse.json({
      clientSecret: pi.client_secret,
      amount,
      subtotal,
      shipping,
    });
  } catch (err: any) {
    console.error('[create-intent]', err);
    return NextResponse.json({ error: err?.message ?? 'Error interno.' }, { status: 500 });
  }
}
