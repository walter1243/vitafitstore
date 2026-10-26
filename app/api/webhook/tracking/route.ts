/**
 * POST /api/webhook/tracking
 * Chamado pelo fornecedor quando o código de rastreio é gerado.
 * Atualiza o pedido no banco e notifica o cliente via WhatsApp.
 */
import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendTrackingWhatsApp } from '@/lib/whatsapp'

// So o fornecedor chama: precisa mandar o segredo TRACKING_WEBHOOK_SECRET
// (Vercel → Environment Variables) no header x-webhook-token ou em ?token=.
function validToken(req: NextRequest) {
  const secret = process.env.TRACKING_WEBHOOK_SECRET || ''
  const sent = req.headers.get('x-webhook-token') || req.nextUrl.searchParams.get('token') || ''
  if (!secret || !sent) return false
  const a = Buffer.from(sent)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  try {
    if (!validToken(req)) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    // Aceita tanto snake_case (fornecedor) quanto camelCase
    const body = await req.json()
    const supplierOrderId: string =
      body.fornecedor_pedido_id ?? body.supplierOrderId ?? body.order_id
    const trackingCode: string =
      body.codigo_rastreio ?? body.trackingCode ?? body.tracking_code
    const carrier: string =
      body.transportadora ?? body.carrier ?? 'Correios'

    if (!supplierOrderId || !trackingCode) {
      return NextResponse.json(
        { error: 'supplierOrderId e trackingCode são obrigatórios' },
        { status: 400 }
      )
    }

    // Busca o supplier_order pelo ID do fornecedor
    const [supplierOrder] = await sql`
      SELECT so.id, so.order_id
      FROM supplier_orders so
      WHERE so.supplier_order_id = ${supplierOrderId}
      LIMIT 1
    `

    if (!supplierOrder) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Atualiza supplier_orders
    await sql`
      UPDATE supplier_orders
      SET tracking_code = ${trackingCode},
          carrier       = ${carrier},
          status        = 'shipped',
          updated_at    = NOW()
      WHERE id = ${supplierOrder.id}
    `

    // Atualiza orders principal
    await sql`
      UPDATE orders
      SET tracking_code = ${trackingCode},
          status        = 'shipped'
      WHERE id = ${supplierOrder.order_id}
    `

    // Busca dados do cliente para notificação
    const [order] = await sql`
      SELECT customer_name, customer_phone, customer_email
      FROM orders
      WHERE id = ${supplierOrder.order_id}
    `

    const [storeSettings] = await sql`
      SELECT whatsapp_tracking_template
      FROM store_settings
      WHERE id = 1
    `

    // Notifica cliente via WhatsApp
    if (order?.customer_phone) {
      await sendTrackingWhatsApp({
        phone: order.customer_phone,
        name: order.customer_name ?? 'Cliente',
        orderId: Number(supplierOrder.order_id),
        trackingCode,
        carrier,
        trackingUrl: `https://www.linkcorreios.com.br/?id=${trackingCode}`,
        customTemplate: storeSettings?.whatsapp_tracking_template ?? undefined,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Webhook/Tracking]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

