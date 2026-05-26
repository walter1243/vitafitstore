import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "@/lib/db";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY não está configurada. Adicione em Vercel → Settings → Environment Variables.');
  return new Stripe(key);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, customerName, productId } = body;

    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      return NextResponse.json({ error: 'amount deve ser um número positivo.' }, { status: 400 });
    }

    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountNum * 100), // centavos
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        customerName: customerName ?? 'Anônimo',
        productId: productId ? String(productId) : '',
      },
    });

    // Salva pedido como pending no banco
    await sql`
      INSERT INTO orders (customer_name, product_id, total_amount, status, stripe_payment_id)
      VALUES (
        ${customerName ? String(customerName) : 'Anônimo'},
        ${productId ? Number(productId) : null},
        ${amountNum},
        'pending',
        ${paymentIntent.id}
      )
    `;

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error('[POST /api/checkout]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro interno.' }, { status: 500 });
  }
}
