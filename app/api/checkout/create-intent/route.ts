import { NextRequest, NextResponse } from 'next/server';
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
    const productRows = await sql`SELECT id, price FROM products WHERE id = ANY(${productIds})`;
    const priceById = new Map<number, number>(
      (productRows as any[]).map((r) => [Number(r.id), Number(r.price)])
    );

    const missing = productIds.filter((id) => !priceById.has(id));
    if (missing.length > 0) {
      return NextResponse.json({ error: 'Há produtos inválidos no carrinho.' }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + (priceById.get(Number(item.productId)) ?? 0) * Number(item.quantity);
    }, 0);

    const shipping = resolveShipping(subtotal, String(country ?? 'ES'));
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
        items:         JSON.stringify(items),
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
