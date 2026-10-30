import { NextRequest, NextResponse } from 'next/server';
import { unpackItems } from '@/lib/order-items';
import Stripe from 'stripe';
import { sql } from '@/lib/db';
import { processOrder } from '@/lib/order-orchestrator';
import { pickupEmail, sendEmail } from '@/lib/email';

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
    const items = unpackItems(meta);

    try {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS selected_color TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS selected_size TEXT`;
      // Todos os itens do pedido (antes so o 1o era salvo) + o nome personalizado.
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS items_json TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS custom_text TEXT`;
      // Envio Packlink escolhido pelo cliente.
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_service TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_point TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC`;
      // Regiao aproximada do comprador (mapa de compras do Dashboard).
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS geo_city TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS geo_lat DOUBLE PRECISION`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS geo_lng DOUBLE PRECISION`;
      const ids = [...new Set(items.map((i) => i.productId))];
      const names = ids.length ? await sql`SELECT id, name FROM products WHERE id = ANY(${ids})` : [];
      const nameById = new Map((names as any[]).map((r) => [Number(r.id), String(r.name)]));
      const itemsJson = JSON.stringify(items.map((i) => ({ ...i, name: nameById.get(i.productId) ?? `Produto #${i.productId}` })));
      await sql`
        INSERT INTO orders (
          customer_name, customer_email, customer_phone,
          address_line, postal_code, city, country,
          product_id, total_amount, status, stripe_payment_id,
          selected_color, selected_size, items_json, custom_text,
          shipping_method, shipping_service, pickup_point, shipping_cost,
          geo_city, geo_lat, geo_lng
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
          ${pi.id},
          ${items[0]?.color || null},
          ${items[0]?.size || null},
          ${itemsJson},
          ${items.map((i) => [i.text, i.note].filter(Boolean).join(' — ')).filter(Boolean).join(' | ') || null},
          ${meta.shipMethod || null},
          ${[meta.shipService, meta.shipServiceId && `(id ${meta.shipServiceId})`].filter(Boolean).join(' ') || null},
          ${meta.pickupPoint || null},
          ${meta.shipping ? Number(meta.shipping) : null},
          ${meta.geoCity || null},
          ${meta.geoLat ? Number(meta.geoLat) : null},
          ${meta.geoLng ? Number(meta.geoLng) : null}
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
      // Recoger en punto: e-mail pro cliente com o ponto e o link do Google Maps.
      // So aqui (pedido acabou de ser gravado), entao sai uma vez por pedido.
      if ((newOrder as any)?.id && meta.shipMethod === 'pickup' && meta.pickupPoint && meta.customerEmail) {
        const mail = pickupEmail({ name: meta.customerName || '', orderId: Number((newOrder as any).id), pickupPoint: meta.pickupPoint });
        await sendEmail({ to: meta.customerEmail, ...mail }).catch((e: unknown) => console.error('[save-order] pickup email:', e));
      }
    } catch (_) {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[save-order]', err);
    return NextResponse.json({ error: err?.message ?? 'Error interno.' }, { status: 500 });
  }
}
