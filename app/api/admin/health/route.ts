import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    const productColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products'
      ORDER BY ordinal_position
    `;

    const orderColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'orders'
      ORDER BY ordinal_position
    `;

    return NextResponse.json({
      ok: true,
      tables: tables.map((t: any) => t.table_name),
      productsColumns: productColumns.map((c: any) => c.column_name),
      ordersColumns: orderColumns.map((c: any) => c.column_name),
      supportsProductVideo: productColumns.some((c: any) => c.column_name === 'video'),
      supportsProductImage: productColumns.some((c: any) => c.column_name === 'image'),
      supportsOrderCustomerData:
        orderColumns.some((c: any) => c.column_name === 'customer_email') &&
        orderColumns.some((c: any) => c.column_name === 'address_line'),
    });
  } catch (err: any) {
    console.error('[GET /api/admin/health]', err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'Database error' }, { status: 500 });
  }
}
