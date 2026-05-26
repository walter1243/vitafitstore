import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "@/lib/db";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY não está configurada.');
  return new Stripe(key);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, customerName, productId, cardNumber, expMonth, expYear, cvv } = body;

    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      return NextResponse.json({ error: 'Importe inválido.' }, { status: 400 });
    }

    const stripe = getStripe();

    // Create PaymentMethod server-side with raw card data
    const pm = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: String(cardNumber ?? '').replace(/\s/g, ''),
        exp_month: parseInt(String(expMonth ?? '1'), 10),
        exp_year: parseInt(String(expYear ?? '25').length === 2
          ? `20${expYear}` : String(expYear ?? '2025'), 10),
        cvc: String(cvv ?? ''),
      },
    });

    // Create and immediately confirm PaymentIntent
    const pi = await stripe.paymentIntents.create({
      amount: Math.round(amountNum * 100),
      currency: 'eur',
      payment_method: pm.id,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        customerName: customerName ?? 'Anônimo',
        productId: productId ? String(productId) : '',
      },
    });

    if (pi.status === 'succeeded') {
      // Save confirmed order
      try {
        await sql`
          INSERT INTO orders (customer_name, product_id, total_amount, status, stripe_payment_id)
          VALUES (
            ${customerName ? String(customerName) : 'Anônimo'},
            ${productId ? Number(productId) : null},
            ${amountNum},
            'paid',
            ${pi.id}
          )
        `;
      } catch (dbErr) {
        console.error('[checkout] DB insert error (non-fatal):', dbErr);
      }

      return NextResponse.json({ success: true });
    }

    // Should rarely happen with allow_redirects: never
    return NextResponse.json(
      { error: `Estado de pago inesperado: ${pi.status}` },
      { status: 402 }
    );
  } catch (err: any) {
    console.error('[POST /api/checkout]', err);
    const msg = err?.raw?.message ?? err?.message ?? 'Error interno.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
