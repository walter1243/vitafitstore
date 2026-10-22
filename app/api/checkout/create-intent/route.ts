import { NextRequest, NextResponse } from 'next/server';
import { chargeShipping } from '@/lib/shipping-quote';
import { cleanCustomText, itemShipping, lineTotalFor, minQtyFor, packOf, parsePersonalize, sizedPrice, stepFor, unitPriceFor } from '@/lib/personalize';
import { cleanItems, packItems } from '@/lib/order-items';
import Stripe from 'stripe';
import { sql } from '@/lib/db';
import { resolveShipping } from '@/lib/checkout-pricing';

// Colunas JSON (sizes, color_options) podem vir como texto ou ja como array.
function jsonList(v: unknown): any[] {
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(String(v ?? '[]')); return Array.isArray(p) ? p : []; } catch { return []; }
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY não está configurada.');
  return new Stripe(key);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { country, postalCode, customerName, customerEmail, customerPhone, addressLine, city } = body;
    // Itens limpos UMA vez: o que e cobrado e exatamente o que fica no pedido.
    const items = cleanItems(body?.items);
    const method = body?.shippingMethod === 'home' ? 'home' : 'pickup';
    const point = body?.pickupPoint && typeof body.pickupPoint === 'object' ? body.pickupPoint : null;

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

    // Cor, tamanho e nome tem que bater com o cadastro do produto.
    const rowById = new Map<number, any>((productRows as any[]).map((r) => [Number(r.id), r]));
    for (const it of items) {
      const r = rowById.get(it.productId);
      const nm = String(r?.name ?? 'Producto');
      const sizes = jsonList(r?.sizes).map((s: any) => String(s).trim()).filter(Boolean);
      const needsSize = r?.product_type && r.product_type !== 'estandar' && sizes.length > 0;
      if (needsSize && (!it.size || !sizes.includes(it.size))) {
        return NextResponse.json({ error: `Elige ${r.product_type === 'tamanho' ? 'el tamaño' : 'la talla'} de «${nm}».` }, { status: 400 });
      }
      if (!needsSize) it.size = undefined;
      const colors = jsonList(r?.color_options).map((c: any) => String(c?.label ?? '').trim()).filter(Boolean);
      if (colors.length && (!it.color || !colors.includes(it.color))) {
        return NextResponse.json({ error: `Elige el color de «${nm}».` }, { status: 400 });
      }
      const pers = parsePersonalize(r?.personalize);
      if (pers.enabled && !it.text) {
        return NextResponse.json({ error: `Escribe el nombre para «${nm}».` }, { status: 400 });
      }
      if (it.text) it.text = cleanCustomText(it.text, pers.maxLength);
    }

    // Promocao por quantidade (ex: 5 chaveiros) e pedido minimo, conferidos aqui.
    const persById = new Map<number, unknown>((productRows as any[]).map((r) => [Number(r.id), r.personalize]));
    const qtyById = new Map<number, number>();
    for (const it of items as any[]) qtyById.set(Number(it.productId), (qtyById.get(Number(it.productId)) ?? 0) + Number(it.quantity));
    for (const [id, q] of qtyById) {
      const step = stepFor(persById.get(id));
      if (step > 1 && q % step !== 0) {
        return NextResponse.json({ error: `Este producto se vende en packs de ${step} unidades.` }, { status: 400 });
      }
      if (q < minQtyFor(persById.get(id))) {
        return NextResponse.json({ error: `Este producto tiene un pedido mínimo de ${minQtyFor(persById.get(id))} unidades.` }, { status: 400 });
      }
    }
    // Valor de cada linha (fica gravado no pedido) e o subtotal = soma delas.
    for (const item of items) {
      const id = item.productId;
      const base = sizedPrice(priceById.get(id) ?? 0, persById.get(id), item.size);
      const line = packOf(persById.get(id)) ? lineTotalFor(base, persById.get(id), item.quantity) : unitPriceFor(base, persById.get(id), qtyById.get(id) ?? 0) * item.quantity;
      item.total = Math.round(line * 100) / 100;
    }
    const subtotal = Math.round(items.reduce((sum, item) => sum + (item.total ?? 0), 0) * 100) / 100;

    const shippingById = new Map<number, number | null>((productRows as any[]).map((r) => [Number(r.id), r.shipping_cost != null ? Number(r.shipping_cost) : null]));
    const ship = await chargeShipping(items, String(postalCode ?? ''), String(country ?? 'ES'), method, () =>
      resolveShipping(subtotal, String(country ?? 'ES'), items.map((item: any) => itemShipping(shippingById.get(Number(item.productId)), persById.get(Number(item.productId)), qtyById.get(Number(item.productId)) ?? 0))));
    const shipping = ship.shipping;
    if (ship.chosen?.type === 'pickup' && !point?.id) {
      return NextResponse.json({ error: 'Elige el punto de recogida.' }, { status: 400 });
    }
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
        ...packItems(items),
        subtotal:      subtotal.toFixed(2),
        shipping:      shipping.toFixed(2),
        shipMethod:    ship.chosen?.type ?? '',
        shipService:   ship.chosen ? `${ship.chosen.carrier} · ${ship.chosen.service}`.slice(0, 200) : '',
        shipServiceId: ship.chosen?.serviceId ?? '',
        pickupPoint:   point ? `${String(point.id).slice(0, 30)} · ${String(point.name ?? '').slice(0, 120)} · ${String(point.address ?? '').slice(0, 150)} · ${String(point.zip ?? '').slice(0, 10)} ${String(point.city ?? '').slice(0, 60)}` : '',
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
