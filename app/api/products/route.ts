import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, name, description, price, category, image, video, stock, position,
             created_at AS "createdAt"
      FROM products
      ORDER BY COALESCE(position, 999999), created_at DESC
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
      INSERT INTO products (name, description, price, category, image, video, stock, position)
      VALUES (
        ${String(name).trim()},
        ${description ? String(description) : null},
        ${Number(price)},
        ${category ? String(category).trim() : null},
        ${image ? String(image) : null},
        ${video  ? String(video).trim()  : null},
        ${Number(stock ?? 0)},
        COALESCE((SELECT MAX(position) + 1 FROM products), 1)
      )
      RETURNING id, name, description, price, category, image, video, stock, position
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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, direction } = body;

    const productId = Number(id);
    if (!productId || !['up', 'down'].includes(String(direction))) {
      return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
    }

    const [current] = await sql`
      SELECT id, COALESCE(position, 999999) AS position
      FROM products
      WHERE id = ${productId}
    `;

    if (!current) {
      return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
    }

    const [target] = direction === 'up'
      ? await sql`
          SELECT id, COALESCE(position, 999999) AS position
          FROM products
          WHERE COALESCE(position, 999999) < ${current.position}
          ORDER BY COALESCE(position, 999999) DESC
          LIMIT 1
        `
      : await sql`
          SELECT id, COALESCE(position, 999999) AS position
          FROM products
          WHERE COALESCE(position, 999999) > ${current.position}
          ORDER BY COALESCE(position, 999999) ASC
          LIMIT 1
        `;

    if (!target) {
      return NextResponse.json({ success: true });
    }

    await sql`UPDATE products SET position = ${target.position} WHERE id = ${current.id}`;
    await sql`UPDATE products SET position = ${current.position} WHERE id = ${target.id}`;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[PATCH /api/products]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao reordenar produtos.' }, { status: 500 });
  }
}
