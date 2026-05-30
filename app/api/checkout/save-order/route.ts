import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sql } from '@/lib/db';
import { processOrder } from '@/lib/order-orchestrator';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY não está configurada.');
  return new Stripe(key);
}

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId } = await req.json();

    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      return NextResponse.json({ error: 'paymentIntentId inválido.' }, { status: 400 });
    }

    const stripe = getStripe();
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (pi.status !== 'succeeded') {
      return NextResponse.json({ error: `Pago no completado: ${pi.status}` }, { status: 402 });
    }

    // Check if order already saved (idempotent)
    const existing = await sql`SELECT id FROM orders WHERE stripe_payment_id = ${pi.id} LIMIT 1`;
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ success: true });
    }

    const meta = pi.metadata ?? {};
    const amount = pi.amount / 100;
    const items: Array<{ productId: number; quantity: number }> = JSON.parse(meta.items ?? '[]');

    try {
      await sql`
        INSERT INTO orders (
          customer_name, customer_email, customer_phone,
          address_line, postal_code, city, country,
          product_id, total_amount, status, stripe_payment_id
        ) VALUES (
          ${meta.customerName  || 'Anônimo'},
          ${meta.customerEmail || null},
          ${meta.customerPhone || null},
          ${meta.addressLine   || null},
          ${meta.postalCode    || null},
          ${meta.city          || null},
          ${meta.country       || null},
          ${items[0]?.productId ?? null},
          ${amount},
          'pending',
          ${pi.id}
        )
      `;
    } catch (dbErr) {
      console.error('[save-order] DB insert error:', dbErr);
    }

    try {
      const [newOrder] = await sql`SELECT id FROM orders WHERE stripe_payment_id = ${pi.id} LIMIT 1`;
      if ((newOrder as any)?.id) {
        processOrder((newOrder as any).id).catch((e: unknown) =>
          console.error('[save-order] Orchestrator error:', e)
        );
      }
    } catch (_) {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[save-order]', err);
    return NextResponse.json({ error: err?.message ?? 'Error interno.' }, { status: 500 });
  }
}
