import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function sendWhatsApp(wapiUrl: string, wapiToken: string, phone: string, message: string) {
  if (!wapiUrl || !phone) return;
  try {
    await fetch(`${wapiUrl}/send-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Client-Token': wapiToken },
      body: JSON.stringify({ phone, message }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {}
}

async function sendEmail(sendgridKey: string, to: string, subject: string, body: string) {
  if (!sendgridKey || !to) return;
  try {
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sendgridKey}` },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: 'noreply@vitafitstore.es', name: 'VitaFit Store' },
        subject,
        content: [{ type: 'text/plain', value: body }],
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const { order_id } = await req.json();
    const orderId = Number(order_id);
    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: 'order_id inválido' }, { status: 400 });
    }

    // Load order + product + supplier + automation settings
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
        o.total_amount,
        p.id             AS product_id,
        p.name           AS product_name,
        p.source_store_url,
        p.source_product_url,
        p.supplier_id,
        s.name           AS supplier_name,
        s.base_url       AS supplier_base_url,
        s.api_key        AS supplier_api_key,
        s.shopify_domain,
        s.shopify_access_token,
        s.order_method,
        s.contact_email,
        s.contact_whatsapp,
        s.active         AS supplier_active
      FROM orders o
      LEFT JOIN products p  ON p.id = o.product_id
      LEFT JOIN suppliers s ON s.id = p.supplier_id
      WHERE o.id = ${orderId}
    `;

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    const results: string[] = [];

    // ── Shopify API forwarding ─────────────────────────────────────────────────
    if (order.supplier_active && order.order_method === 'shopify_api' && order.shopify_domain && order.shopify_access_token) {
      try {
        const shopifyRes = await fetch(
          `https://${order.shopify_domain}/admin/api/2024-01/orders.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': order.shopify_access_token,
            },
            body: JSON.stringify({
              order: {
                line_items: [{ title: order.product_name, quantity: 1, price: order.total_amount }],
                shipping_address: {
                  name: order.customer_name,
                  address1: order.address_line,
                  zip: order.postal_code,
                  city: order.city,
                  country: order.country,
                  phone: order.customer_phone,
                },
                note: `Pedido VitaFit #${orderId}. Fonte: ${order.source_product_url ?? order.source_store_url ?? 'n/a'}`,
              },
            }),
            signal: AbortSignal.timeout(15000),
          }
        );
        const shopifyData = await shopifyRes.json().catch(() => ({}));
        if (shopifyRes.ok) {
          await sql`UPDATE orders SET tracking_code = ${String(shopifyData?.order?.id ?? '')}, status = 'shipped' WHERE id = ${orderId}`;
          results.push(`Shopify: pedido #${shopifyData?.order?.id} criado`);
        } else {
          results.push(`Shopify: erro ${shopifyRes.status}`);
        }
      } catch (e: any) {
        results.push(`Shopify: ${e?.message}`);
      }
    }

    // ── Load automation settings for email/WhatsApp ────────────────────────────
    const [automationSettings] = await sql`
      SELECT whatsapp_url, whatsapp_token, sendgrid_key, notify_email, notify_whatsapp,
             notify_whatsapp_enabled, notify_email_enabled
      FROM automation_settings
      LIMIT 1
    `.catch(() => [null]);

    const addressStr = [order.address_line, order.postal_code, order.city, order.country].filter(Boolean).join(', ');
    const messageBody =
      `🛒 Novo pedido automático VitaFit #${orderId}\n` +
      `Produto: ${order.product_name}\n` +
      `Cliente: ${order.customer_name}\n` +
      `Endereço: ${addressStr}\n` +
      `Total: €${Number(order.total_amount ?? 0).toFixed(2)}\n` +
      (order.source_product_url ? `Produto origem: ${order.source_product_url}\n` : '') +
      `\nProcesse este pedido e informe o código de rastreio.`;

    // ── Email via SendGrid ─────────────────────────────────────────────────────
    const emailTarget = order.contact_email ?? automationSettings?.notify_email;
    if (emailTarget && (automationSettings?.notify_email_enabled || order.order_method === 'email')) {
      await sendEmail(
        automationSettings?.sendgrid_key ?? '',
        emailTarget,
        `[VitaFit] Novo pedido #${orderId} — ${order.product_name}`,
        messageBody
      );
      results.push(`E-mail enviado para ${emailTarget}`);
    }

    // ── WhatsApp via Z-API / Evolution ────────────────────────────────────────
    const waTarget = order.contact_whatsapp ?? automationSettings?.notify_whatsapp;
    if (waTarget && automationSettings?.whatsapp_url && (automationSettings?.notify_whatsapp_enabled || order.order_method === 'whatsapp')) {
      await sendWhatsApp(
        automationSettings.whatsapp_url,
        automationSettings.whatsapp_token ?? '',
        waTarget,
        messageBody
      );
      results.push(`WhatsApp enviado para ${waTarget}`);
    }

    return NextResponse.json({
      ok: true,
      order_id: orderId,
      actions: results,
      message: results.length > 0 ? results.join(' | ') : 'Nenhuma ação de forwarding configurada',
    });
  } catch (err: any) {
    console.error('[POST /api/orders/forward-to-supplier]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro no forwarding' }, { status: 500 });
  }
}
