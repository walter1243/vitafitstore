import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
};

function parseAdditionalImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item).trim()).filter(Boolean);
      }
    } catch {
      return value.split(',').map(item => item.trim()).filter(Boolean);
    }
  }

  return [];
}

function normalizeProduct(row: any) {
  return {
    ...row,
    price: row.price != null ? Number(row.price) : 0,
    stock: row.stock != null ? Number(row.stock) : 0,
    additionalImages: parseAdditionalImages(row.additional_images ?? row.additionalImages),
    mainImage: row.image ?? row.mainImage ?? '',
    videoUrl: row.video ?? row.videoUrl ?? '',
  };
}

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, name, description, price, category, image, additional_images, video, stock, position,
             created_at AS "createdAt"
      FROM products
      ORDER BY COALESCE(position, 999999), created_at DESC
    `;
    return NextResponse.json(rows.map((p: any) => normalizeProduct(p)), { headers: noStoreHeaders });
  } catch (err: any) {
    console.error('[GET /api/products]', err);
    return NextResponse.json({ error: err?.message ?? 'Database error' }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { name, description, price, category, image, mainImage, video, videoUrl, stock, additionalImages } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'O campo "nome" é obrigatório.' }, { status: 400 });
    }
    if (price == null || isNaN(Number(price))) {
      return NextResponse.json({ error: 'O campo "preço" é obrigatório e deve ser um número.' }, { status: 400 });
    }

    const nextMainImage = String(mainImage ?? image ?? '').trim();
    const nextVideoUrl = String(videoUrl ?? video ?? '').trim();
    const nextAdditionalImages = parseAdditionalImages(additionalImages);

    const [product] = await sql`
      INSERT INTO products (name, description, price, category, image, additional_images, video, stock, position)
      VALUES (
        ${String(name).trim()},
        ${description ? String(description) : null},
        ${Number(price)},
        ${category ? String(category).trim() : null},
        ${nextMainImage || null},
        ${JSON.stringify(nextAdditionalImages)},
        ${nextVideoUrl || null},
        ${Number(stock ?? 0)},
        COALESCE((SELECT MAX(position) + 1 FROM products), 1)
      )
      RETURNING id, name, description, price, category, image, additional_images, video, stock, position
    `;

    return NextResponse.json(normalizeProduct(product), { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/products]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao salvar produto.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();

    if (body?.direction) {
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
    }

    const id = Number(body.id);

    if (!id) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    const name = String(body.name ?? '').trim();
    const price = Number(body.price);
    const category = String(body.category ?? '').trim();
    const description = String(body.description ?? '').trim();
    const mainImage = String(body.mainImage ?? body.image ?? '').trim();
    const videoUrl = String(body.videoUrl ?? body.video ?? '').trim();
    const additionalImages = parseAdditionalImages(body.additionalImages);
    const stock = Number(body.stock ?? 0);

    if (!name) {
      return NextResponse.json({ error: 'O campo "nome" é obrigatório.' }, { status: 400 });
    }
    if (Number.isNaN(price)) {
      return NextResponse.json({ error: 'O campo "preço" é obrigatório e deve ser um número.' }, { status: 400 });
    }

    const [product] = await sql`
      UPDATE products
      SET
        name = ${name},
        description = ${description || null},
        price = ${price},
        category = ${category || null},
        image = ${mainImage || null},
        additional_images = ${JSON.stringify(additionalImages)},
        video = ${videoUrl || null},
        stock = ${stock}
      WHERE id = ${id}
      RETURNING id, name, description, price, category, image, additional_images, video, stock, position
    `;

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(normalizeProduct(product));
  } catch (err: any) {
    console.error('[PATCH /api/products]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao atualizar produto.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

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

