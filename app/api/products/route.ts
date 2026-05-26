import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, name, description, price, category, image, video, stock,
             created_at AS "createdAt"
      FROM products
      ORDER BY created_at DESC
    `;
    return NextResponse.json(
      rows.map((p: any) => ({ ...p, price: p.price != null ? Number(p.price) : 0 }))
    );
  } catch (err: any) {
    console.error('[GET /api/products]', err);
    return NextResponse.json({ error: err?.message ?? 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, price, category, image, video, stock } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'O campo "nome" é obrigatório.' }, { status: 400 });
    }
    if (price == null || isNaN(Number(price))) {
      return NextResponse.json({ error: 'O campo "preço" é obrigatório e deve ser um número.' }, { status: 400 });
    }

    const [product] = await sql`
      INSERT INTO products (name, description, price, category, image, video, stock)
      VALUES (
        ${String(name).trim()},
        ${description ? String(description) : null},
        ${Number(price)},
        ${category ? String(category).trim() : null},
        ${image ? String(image) : null},
        ${video  ? String(video).trim()  : null},
        ${Number(stock ?? 0)}
      )
      RETURNING id, name, description, price, category, image, video, stock
    `;

    return NextResponse.json(
      { ...product, price: Number(product.price) },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[POST /api/products]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao salvar produto.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = parseInt(req.nextUrl.searchParams.get('id') ?? '');
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }
    await sql`DELETE FROM products WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE /api/products]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao deletar produto.' }, { status: 500 });
  }
}
