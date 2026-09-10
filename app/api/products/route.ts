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

function parseJsonArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseColorOptions(value: unknown): { label: string; image: string; hex: string }[] {
  return parseJsonArray(value)
    .map((c: any) => ({
      label: String(c?.label ?? '').trim(),
      image: String(c?.image ?? '').trim(),
      hex: String(c?.hex ?? '').trim(),
    }))
    .filter(c => c.label && (c.image || c.hex))
    .slice(0, 5);
}

function parseSizes(value: unknown): string[] {
  return parseJsonArray(value).map((s: any) => String(s).trim()).filter(Boolean).slice(0, 20);
}

const VALID_PRODUCT_TYPES = ['estandar', 'ropa', 'calzado'];

async function ensureVariantColumns() {
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'estandar'`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS color_options TEXT`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT`;
}

function normalizeProduct(row: any) {
  return {
    ...row,
    price: row.price != null ? Number(row.price) : 0,
    stock: row.stock != null ? Number(row.stock) : 0,
    costPrice: row.cost_price != null ? Number(row.cost_price) : null,
    additionalImages: parseAdditionalImages(row.additional_images ?? row.additionalImages),
    mainImage: row.image ?? row.mainImage ?? '',
    videoUrl: row.video ?? row.videoUrl ?? '',
    sourceStoreUrl: row.source_store_url ?? null,
    sourceProductUrl: row.source_product_url ?? null,
    productType: row.product_type ?? 'estandar',
    colorOptions: parseColorOptions(row.color_options),
    sizes: parseSizes(row.sizes),
  };
}

export async function GET() {
  try {
    await ensureVariantColumns();
    const rows = await sql`
      SELECT id, name, description, price, category, image, additional_images, video, stock, position,
             source_store_url, source_product_url, cost_price,
             product_type, color_options, sizes,
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

    await ensureVariantColumns();
    const body = await req.json();
    const {
      name, description, price, category, image, mainImage,
      video, videoUrl, stock, additionalImages,
      sourceStoreUrl, sourceProductUrl, costPrice,
      productType, colorOptions, sizes,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'O campo "nome" é obrigatório.' }, { status: 400 });
    }
    if (price == null || isNaN(Number(price))) {
      return NextResponse.json({ error: 'O campo "preço" é obrigatório e deve ser um número.' }, { status: 400 });
    }

    const nextMainImage = String(mainImage ?? image ?? '').trim();
    const nextVideoUrl = String(videoUrl ?? video ?? '').trim();
    const nextAdditionalImages = parseAdditionalImages(additionalImages);
    const nextCostPrice = costPrice != null && !isNaN(Number(costPrice)) ? Number(costPrice) : null;
    const nextProductType = VALID_PRODUCT_TYPES.includes(productType) ? productType : 'estandar';
    const nextColorOptions = parseColorOptions(colorOptions);
    const nextSizes = parseSizes(sizes);

    const [product] = await sql`
      INSERT INTO products (name, description, price, category, image, additional_images, video, stock, position, source_store_url, source_product_url, cost_price, product_type, color_options, sizes)
      VALUES (
        ${String(name).trim()},
        ${description ? String(description) : null},
        ${Number(price)},
        ${category ? String(category).trim() : null},
        ${nextMainImage || null},
        ${JSON.stringify(nextAdditionalImages)},
        ${nextVideoUrl || null},
        ${Number(stock ?? 0)},
        COALESCE((SELECT MAX(position) + 1 FROM products), 1),
        ${sourceStoreUrl ? String(sourceStoreUrl).trim() : null},
        ${sourceProductUrl ? String(sourceProductUrl).trim() : null},
        ${nextCostPrice},
        ${nextProductType},
        ${JSON.stringify(nextColorOptions)},
        ${JSON.stringify(nextSizes)}
      )
      RETURNING id, name, description, price, category, image, additional_images, video, stock, position, source_store_url, source_product_url, cost_price, product_type, color_options, sizes
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

    await ensureVariantColumns();
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
    const sourceStoreUrl = body.sourceStoreUrl ? String(body.sourceStoreUrl).trim() : null;
    const sourceProductUrl = body.sourceProductUrl ? String(body.sourceProductUrl).trim() : null;
    const costPrice = body.costPrice != null && !isNaN(Number(body.costPrice)) ? Number(body.costPrice) : null;
    const productType = VALID_PRODUCT_TYPES.includes(body.productType) ? body.productType : 'estandar';
    const colorOptions = parseColorOptions(body.colorOptions);
    const sizes = parseSizes(body.sizes);

    if (!name) {
      return NextResponse.json({ error: 'O campo "nome" é obrigatório.' }, { status: 400 });
    }
    if (Number.isNaN(price)) {
      return NextResponse.json({ error: 'O campo "preço" é obrigatório e deve ser um número.' }, { status: 400 });
    }

    const [product] = await sql`
      UPDATE products
      SET
        name              = ${name},
        description       = ${description || null},
        price             = ${price},
        category          = ${category || null},
        image             = ${mainImage || null},
        additional_images = ${JSON.stringify(additionalImages)},
        video             = ${videoUrl || null},
        stock             = ${stock},
        source_store_url  = COALESCE(${sourceStoreUrl}, source_store_url),
        source_product_url = COALESCE(${sourceProductUrl}, source_product_url),
        cost_price        = COALESCE(${costPrice}, cost_price),
        product_type      = ${productType},
        color_options     = ${JSON.stringify(colorOptions)},
        sizes             = ${JSON.stringify(sizes)}
      WHERE id = ${id}
      RETURNING id, name, description, price, category, image, additional_images, video, stock, position, source_store_url, source_product_url, cost_price, product_type, color_options, sizes
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
