import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { readyEmail, sendEmail, senderDomainStatus, trackingEmail } from "@/lib/email";
import { trackingLink } from "@/lib/tracking-link";

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['pending', 'shipped', 'delivered'];

// Colunas do aviso de rastreio: admin_seen = o alerta do painel ja foi aberto;
// tracking_url/tracking_email_sent_at = link enviado ao cliente por e-mail.
async function ensureOrderColumns() {
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS selected_color TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS selected_size TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_seen BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_email_sent_at TIMESTAMP`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS items_json TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS custom_text TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_service TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_point TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC`;
}

// Dados pessoais dos clientes: so o admin pode listar.
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;
    await ensureOrderColumns();
    const rows = await sql`
      SELECT
        o.id,
        o.customer_name                               AS customer,
        COALESCE(o.customer_email, '')               AS "customerEmail",
        COALESCE(o.customer_phone, '')               AS "customerPhone",
        COALESCE(o.address_line, '')                 AS "addressLine",
        COALESCE(o.postal_code, '')                  AS "postalCode",
        COALESCE(o.city, '')                         AS city,
        COALESCE(o.country, '')                      AS country,
        COALESCE(p.name, 'Produto removido')          AS product,
        COALESCE(p.source_store_url, '')              AS "sourceStoreUrl",
        COALESCE(p.source_product_url, '')             AS "sourceProductUrl",
        COALESCE(o.selected_color, '')                AS "selectedColor",
        COALESCE(o.selected_size, '')                 AS "selectedSize",
        COALESCE(o.custom_text, '')                   AS "customText",
        COALESCE(o.shipping_method, '')               AS "shippingMethod",
        COALESCE(o.shipping_service, '')              AS "shippingService",
        COALESCE(o.pickup_point, '')                  AS "pickupPoint",
        o.shipping_cost                               AS "shippingCost",
        o.items_json                                  AS "itemsJson",
        o.status,
        COALESCE(o.tracking_code, '')                 AS tracking,
        COALESCE(o.tracking_url, '')                  AS "trackingUrl",
        o.tracking_email_sent_at                      AS "trackingSentAt",
        COALESCE(o.admin_seen, FALSE)                 AS seen,
        COALESCE(o.total_amount, 0)::FLOAT            AS total,
        TO_CHAR(o.created_at, 'YYYY-MM-DD')           AS date,
        TO_CHAR(o.created_at, 'DD/MM HH24:MI')        AS "dateTime"
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC
    `;
    return NextResponse.json(rows, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    console.error('[GET /api/orders]', err);
    return NextResponse.json({ error: err?.message ?? 'Database error' }, { status: 500 });
  }
}

// Acoes do Rastreio: { action: 'seen', id } marca o alerta como visto;
// { action: 'sendTracking', id, trackingUrl } manda o e-mail ao cliente.
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;
    await ensureOrderColumns();
    const body = await req.json().catch(() => ({}));

    // Teste: manda o e-mail de rastreio de exemplo e informa o status do dominio.
    if (body?.action === 'testEmail') {
      const to = String(body.to ?? '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return NextResponse.json({ error: 'E-mail de teste inválido.' }, { status: 400 });
      const domain = await senderDomainStatus();
      const mail = trackingEmail({ name: 'Cliente de Prueba', orderId: 1234, productName: 'Lámpara Cohete', trackingUrl: 'https://www.correos.es/es/es/herramientas/localizador/envios' });
      try {
        const sent = await sendEmail({ to, ...mail, subject: `[PRUEBA] ${mail.subject}` });
        return NextResponse.json({ ok: true, id: sent.id, to, domain });
      } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'Falha ao enviar.', domain }, { status: 502 });
      }
    }

    const id = Number(body?.id);
    if (!id) return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 });

    if (body.action === 'seen') {
      await sql`UPDATE orders SET admin_seen = TRUE WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'sendTracking') {
      // Aceita link com ou sem https:// e tambem so o codigo dos Correos.
      const link = trackingLink(String(body.trackingUrl ?? ''));
      if (!link) return NextResponse.json({ error: 'Cole o link ou o código de rastreio.' }, { status: 400 });
      const [order] = await sql`
        SELECT o.id, o.customer_name, o.customer_email, p.name AS product
        FROM orders o LEFT JOIN products p ON o.product_id = p.id
        WHERE o.id = ${id}
      `;
      if (!order) return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
      const email = String(order.customer_email ?? '').trim();

      // O link fica salvo (e aparece pro cliente em /pedido) mesmo se o
      // e-mail falhar; o erro do e-mail volta pro admin.
      const [updated] = await sql`
        UPDATE orders SET
          tracking_url = ${link},
          tracking_code = COALESCE(NULLIF(tracking_code, ''), ${link}),
          tracking_email_sent_at = NOW(),
          admin_seen = TRUE,
          status = CASE WHEN status = 'delivered' THEN status ELSE 'shipped' END
        WHERE id = ${id}
        RETURNING id, status
      `;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ ok: true, order: updated, emailError: 'Link salvo, mas o pedido não tem e-mail válido do cliente.' });
      }
      const mail = trackingEmail({ name: order.customer_name ?? '', orderId: order.id, productName: order.product ?? undefined, trackingUrl: link, email });
      try {
        await sendEmail({ to: email, ...mail });
      } catch (e: any) {
        return NextResponse.json({ ok: true, order: updated, emailError: `Link salvo, mas o e-mail não saiu: ${e?.message ?? 'erro'}` });
      }
      return NextResponse.json({ ok: true, sentTo: email, order: updated });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (err: any) {
    console.error('[POST /api/orders]', err);
    return NextResponse.json({ error: err?.message ?? 'Database error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const { id, tracking, status } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Status inválido. Use: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }

    await ensureOrderColumns();
    const [before] = await sql`SELECT status FROM orders WHERE id = ${Number(id)}`;
    // So o que veio muda: trocar o status nao apaga o codigo de rastreio.
    const keepTracking = tracking === undefined;
    const [order] = await sql`
      UPDATE orders
      SET
        tracking_code = CASE WHEN ${keepTracking} THEN tracking_code ELSE ${keepTracking ? '' : String(tracking)} END,
        status        = COALESCE(${status ?? null}::text, status)
      WHERE id = ${Number(id)}
      RETURNING id, customer_name AS customer, customer_email, status, shipping_method, pickup_point,
                COALESCE(tracking_code, '') AS tracking
    `;

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    // Virou "entregue" agora: aviso ao cliente (no ponto ou em casa).
    let emailed = false;
    let emailError = '';
    const email = String(order.customer_email ?? '').trim();
    if (status === 'delivered' && before?.status !== 'delivered' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const mail = readyEmail({
        name: order.customer ?? '',
        orderId: Number(order.id),
        pickupPoint: order.shipping_method === 'pickup' ? String(order.pickup_point ?? '') : '',
        email,
      });
      try { await sendEmail({ to: email, ...mail }); emailed = true; }
      catch (e: any) { emailError = e?.message ?? 'Falha ao enviar o e-mail.'; }
    }
    return NextResponse.json({ id: order.id, customer: order.customer, status: order.status, tracking: order.tracking, emailed, emailError });
  } catch (err: any) {
    console.error('[PATCH /api/orders]', err);
    return NextResponse.json({ error: err?.message ?? 'Database error' }, { status: 500 });
  }
}
