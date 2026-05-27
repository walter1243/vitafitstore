import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "@/lib/db";
import { processOrder } from "@/lib/order-orchestrator";
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
      return { productId, quantity };
    })
    .filter((item) => Number.isFinite(item.productId) && item.productId > 0 && Number.isFinite(item.quantity) && item.quantity > 0)
    .map((item) => ({
      productId: Math.trunc(item.productId),
      quantity: Math.trunc(item.quantity),
    }));
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY não está configurada.');
  return new Stripe(key);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      addressLine,
      postalCode,
      city,
      country,
      items,
      paymentMethodId,
    } = body;

    const normalizedItems = parseItems(items);
    if (normalizedItems.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio.' }, { status: 400 });
    }

    if (!paymentMethodId || typeof paymentMethodId !== 'string') {
      return NextResponse.json({ error: 'Método de pago inválido.' }, { status: 400 });
    }

    const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
    const productRows = await sql`
      SELECT id, price
      FROM products
      WHERE id = ANY(${productIds})
    `;

    const priceById = new Map<number, number>();
    for (const row of productRows as any[]) {
      priceById.set(Number(row.id), Number(row.price));
    }

    const missing = productIds.filter((id) => !priceById.has(id));
    if (missing.length > 0) {
      return NextResponse.json({ error: 'Há produtos inválidos no carrinho.' }, { status: 400 });
    }

    const subtotal = normalizedItems.reduce((sum, item) => {
      const unitPrice = priceById.get(item.productId) ?? 0;
      return sum + unitPrice * item.quantity;
    }, 0);

    const shipping = resolveShipping(subtotal, String(country ?? 'ES'));
    const amountNum = Number((subtotal + shipping).toFixed(2));

    if (!amountNum || amountNum <= 0) {
      return NextResponse.json({ error: 'Importe inválido.' }, { status: 400 });
    }

    const stripe = getStripe();

    // Create and immediately confirm PaymentIntent
    const pi = await stripe.paymentIntents.create({
      amount: Math.round(amountNum * 100),
      currency: 'eur',
      payment_method: paymentMethodId,
      payment_method_types: ['card'],
      confirm: true,
      metadata: {
        customerName: customerName ?? 'Anônimo',
        customerEmail: customerEmail ?? '',
        customerPhone: customerPhone ?? '',
        productId: normalizedItems[0]?.productId ? String(normalizedItems[0].productId) : '',
        subtotal: subtotal.toFixed(2),
        shipping: shipping.toFixed(2),
      },
    });

    if (pi.status === 'succeeded') {
      // Save confirmed order
      try {
        await sql`
          INSERT INTO orders (
            customer_name,
            customer_email,
            customer_phone,
            address_line,
            postal_code,
            city,
            country,
            product_id,
            total_amount,
            status,
            stripe_payment_id
          )
          VALUES (
            ${customerName ? String(customerName) : 'Anônimo'},
            ${customerEmail ? String(customerEmail) : null},
            ${customerPhone ? String(customerPhone) : null},
            ${addressLine ? String(addressLine) : null},
            ${postalCode ? String(postalCode) : null},
            ${city ? String(city) : null},
            ${country ? String(country) : null},
            ${normalizedItems[0]?.productId ? Number(normalizedItems[0].productId) : null},
            ${amountNum},
            'pending',
            ${pi.id}
          )
        `;
      } catch (dbErr) {
        console.error('[checkout] DB insert error (non-fatal):', dbErr);
      }

      // Dispara orquestrador de dropshipping de forma assíncrona (não bloqueia resposta)
      try {
        const [newOrder] = await sql`
          SELECT id FROM orders WHERE stripe_payment_id = ${pi.id} LIMIT 1
        `;
        if (newOrder?.id) {
          // Fire-and-forget: não aguarda para não atrasar o cliente
          processOrder(newOrder.id).catch((e: unknown) =>
            console.error('[checkout] Orchestrator error:', e)
          );
        }
      } catch (_) {
        // Orquestrador é não-crítico
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
