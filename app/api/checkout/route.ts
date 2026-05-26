import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, customerName, productId } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
    }

    // Create PaymentIntent — amount in cents
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        customerName: customerName ?? 'Anônimo',
        productId: productId ? String(productId) : '',
      },
    });

    // Save pending order to DB (status updated later via webhook or frontend callback)
    await sql`
      INSERT INTO orders (customer_name, product_id, total_amount, status, stripe_payment_id)
      VALUES (
        ${customerName ? String(customerName) : 'Anônimo'},
        ${productId ? Number(productId) : null},
        ${Number(amount)},
        'pending',
        ${paymentIntent.id}
      )
    `;

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('[POST /api/checkout]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
