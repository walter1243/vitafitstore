import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { order_id } = await req.json();
    const orderId = Number(order_id);

    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: 'order_id inválido' }, { status: 400 });
    }

    // Fetch order + product + supplier in one query
    const [order] = await sql`
      SELECT
        o.id,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.address_line,
        o.postal_code,
        o.city,
        o.country,
        o.product_id,
        o.total_amount,
        o.status,
        p.name          AS product_name,
        p.supplier_id,
        p.video         AS supplier_sku,
        s.base_url      AS supplier_base_url,
        s.api_key       AS supplier_api_key,
        s.name          AS supplier_name,
        s.active        AS supplier_active
      FROM orders o
      LEFT JOIN products p ON p.id = o.product_id
      LEFT JOIN suppliers s ON s.id = p.supplier_id
      WHERE o.id = ${orderId}
    `;

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    if (!order.supplier_id || !order.supplier_base_url) {
      return NextResponse.json({
        ok: false,
        manual: true,
        message: 'Produto sem fornecedor configurado. Fulfillment manual necessário.',
        order_id: orderId,
      });
    }

    if (!order.supplier_active) {
      return NextResponse.json({
        ok: false,
        manual: true,
        message: `Fornecedor "${order.supplier_name}" está inativo.`,
        order_id: orderId,
      });
    }

    const shippingAddress = {
      name: order.customer_name,
      email: order.customer_email,
      phone: order.customer_phone,
      address: order.address_line,
      postal_code: order.postal_code,
      city: order.city,
      country: order.country,
    };

    const supplierPayload = {
      sku: order.supplier_sku,
      quantity: 1,
      shipping: shippingAddress,
      reference: `VITAFIT-${orderId}`,
      notify_url: `${req.nextUrl.origin}/api/webhook/tracking`,
    };

    const supplierRes = await fetch(`${order.supplier_base_url}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${order.supplier_api_key ?? ''}`,
        'X-API-Key': order.supplier_api_key ?? '',
      },
      body: JSON.stringify(supplierPayload),
      signal: AbortSignal.timeout(15000),
    });

    let supplierData: any = {};
    try {
      supplierData = await supplierRes.json();
    } catch {}

    if (!supplierRes.ok) {
      console.error('[auto-fulfill] supplier error', supplierRes.status, supplierData);
      return NextResponse.json({
        ok: false,
        manual: true,
        message: `Fornecedor retornou erro ${supplierRes.status}: ${supplierData?.message ?? supplierData?.error ?? 'sem detalhes'}`,
        order_id: orderId,
      }, { status: 502 });
    }

    const supplierOrderId = String(supplierData.order_id ?? supplierData.id ?? '');

    // Update our order record with supplier info
    await sql`
      UPDATE orders
      SET
        tracking_code = ${supplierOrderId},
        status        = 'shipped'
      WHERE id = ${orderId}
    `;

    return NextResponse.json({
      ok: true,
      order_id: orderId,
      supplier_name: order.supplier_name,
      supplier_order_id: supplierOrderId,
      message: `Pedido enviado ao fornecedor ${order.supplier_name}`,
    });
  } catch (err: any) {
    console.error('[POST /api/orders/auto-fulfill]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro no fulfillment automático' }, { status: 500 });
  }
}
