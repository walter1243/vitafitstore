/**
 * POST /api/webhook/tracking
 * Chamado pelo fornecedor quando o código de rastreio é gerado.
 * Atualiza o pedido no banco e notifica o cliente via WhatsApp.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendTrackingWhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  try {
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

    // Notifica cliente via WhatsApp
    if (order?.customer_phone) {
      await sendTrackingWhatsApp({
        phone: order.customer_phone,
        name: order.customer_name ?? 'Cliente',
        trackingCode,
        carrier,
      })
    }

    // Notifica por e-mail se SendGrid configurado
    const sendgridKey =
      process.env.SENDGRID_KEY ??
      (
        await sql`SELECT sendgrid_key, notify_email FROM automation_settings WHERE id = 1`
      )[0]?.sendgrid_key

    if (sendgridKey && order?.customer_email) {
      await sendTrackingEmail({
        apiKey: sendgridKey,
        toEmail: order.customer_email,
        toName: order.customer_name ?? 'Cliente',
        trackingCode,
        carrier,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Webhook/Tracking]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** Envia e-mail de rastreio via SendGrid */
async function sendTrackingEmail(opts: {
  apiKey: string
  toEmail: string
  toName: string
  trackingCode: string
  carrier: string
}) {
  const { apiKey, toEmail, toName, trackingCode, carrier } = opts
  const trackingUrl = `https://www.linkcorreios.com.br/?id=${trackingCode}`

  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: toEmail, name: toName }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL ?? 'noreply@vitafitstore.com.br', name: 'VitaFit Store' },
      subject: `📦 Seu pedido foi despachado! Rastreio: ${trackingCode}`,
      content: [
        {
          type: 'text/html',
          value: `
            <h2>Olá, ${toName}!</h2>
            <p>Seu pedido foi <strong>despachado</strong> com sucesso!</p>
            <p><strong>Transportadora:</strong> ${carrier}<br/>
               <strong>Código de Rastreio:</strong> ${trackingCode}</p>
            <p><a href="${trackingUrl}" style="background:#22c55e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
              Rastrear Pedido
            </a></p>
            <p style="color:#888;font-size:12px;">VitaFit Store</p>
          `,
        },
      ],
    }),
  })
}
