import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const products = await sql`
      SELECT id, name, description, price, category, image, stock,
             created_at AS "createdAt"
      FROM products
      ORDER BY created_at DESC
    `;
    return NextResponse.json(products);
  } catch (err) {
    console.error('[GET /api/products]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, price, category, image, stock } = body;

    if (!name || price == null) {
      return NextResponse.json({ error: 'name and price are required' }, { status: 400 });
    }

    const [product] = await sql`
      INSERT INTO products (name, description, price, category, image, stock)
      VALUES (
        ${String(name)},
        ${description ? String(description) : null},
        ${Number(price)},
        ${category ? String(category) : null},
        ${image ? String(image) : null},
        ${Number(stock ?? 0)}
      )
      RETURNING id, name, description, price, category, image, stock
    `;

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error('[POST /api/products]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = parseInt(req.nextUrl.searchParams.get('id') ?? '');
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    await sql`DELETE FROM products WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/products]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
