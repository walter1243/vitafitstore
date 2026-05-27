import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const VALID_STATUSES = ['pending', 'shipped', 'delivered'];

export async function GET() {
  try {
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
        o.status,
        COALESCE(o.tracking_code, '')                 AS tracking,
        COALESCE(o.total_amount, 0)::FLOAT            AS total,
        TO_CHAR(o.created_at, 'YYYY-MM-DD')           AS date
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('[GET /api/orders]', err);
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
