import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { sendEmail, trackingEmail } from "@/lib/email";

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
    const id = Number(body?.id);
    if (!id) return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 });

    if (body.action === 'seen') {
      await sql`UPDATE orders SET admin_seen = TRUE WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'sendTracking') {
      const trackingUrl = String(body.trackingUrl ?? '').trim();
      let parsed: URL;
      try { parsed = new URL(trackingUrl); } catch {
        return NextResponse.json({ error: 'Cole um link válido (começando com https://).' }, { status: 400 });
      }
      if (!/^https?:$/.test(parsed.protocol)) {
        return NextResponse.json({ error: 'O link precisa começar com http:// ou https://.' }, { status: 400 });
      }
      const [order] = await sql`
        SELECT o.id, o.customer_name, o.customer_email, p.name AS product
        FROM orders o LEFT JOIN products p ON o.product_id = p.id
        WHERE o.id = ${id}
      `;
      if (!order) return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
      const email = String(order.customer_email ?? '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Este pedido não tem um e-mail de cliente válido.' }, { status: 400 });
      }

      const mail = trackingEmail({ name: order.customer_name ?? '', orderId: order.id, productName: order.product ?? undefined, trackingUrl: parsed.toString() });
      try {
        await sendEmail({ to: email, ...mail });
      } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'Falha ao enviar o e-mail.' }, { status: 502 });
      }

      const [updated] = await sql`
        UPDATE orders SET
          tracking_url = ${parsed.toString()},
          tracking_code = COALESCE(NULLIF(tracking_code, ''), ${parsed.toString()}),
          tracking_email_sent_at = NOW(),
          admin_seen = TRUE,
          status = CASE WHEN status = 'delivered' THEN status ELSE 'shipped' END
        WHERE id = ${id}
        RETURNING id, status
      `;
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

    const [order] = await sql`
      UPDATE orders
      SET
        tracking_code = ${tracking !== undefined ? String(tracking) : null},
        status        = ${status ?? 'pending'}
      WHERE id = ${Number(id)}
      RETURNING id, customer_name AS customer, status,
                COALESCE(tracking_code, '') AS tracking
    `;

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (err: any) {
    console.error('[PATCH /api/orders]', err);
    return NextResponse.json({ error: err?.message ?? 'Database error' }, { status: 500 });
  }
}
