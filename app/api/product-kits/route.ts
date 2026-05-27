import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS product_kits (
      id              SERIAL PRIMARY KEY,
      base_product_id INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
      created_at      TIMESTAMP DEFAULT NOW(),
      updated_at      TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS product_kit_items (
      id                 SERIAL PRIMARY KEY,
      kit_id             INTEGER NOT NULL REFERENCES product_kits(id) ON DELETE CASCADE,
      related_product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity           INTEGER NOT NULL DEFAULT 1,
      created_at         TIMESTAMP DEFAULT NOW(),
      UNIQUE (kit_id, related_product_id)
    )
  `;
}

async function getKitByBaseProduct(baseProductId: number) {
  const [kit] = await sql`
    SELECT
      pk.id,
      pk.base_product_id,
      bp.name AS base_product_name,
      COALESCE(bp.price, 0)::FLOAT AS base_product_price
    FROM product_kits pk
    JOIN products bp ON bp.id = pk.base_product_id
    WHERE pk.base_product_id = ${baseProductId}
    LIMIT 1
  `;

  if (!kit) return null;

  const items = await sql`
    SELECT
      pki.related_product_id,
      pki.quantity,
      rp.name,
      COALESCE(rp.price, 0)::FLOAT AS price,
      COALESCE(rp.image, '') AS image,
      COALESCE(rp.category, '') AS category,
      COALESCE(rp.description, '') AS description,
      COALESCE(rp.stock, 0)::INTEGER AS stock
    FROM product_kit_items pki
    JOIN products rp ON rp.id = pki.related_product_id
    WHERE pki.kit_id = ${kit.id}
    ORDER BY pki.id ASC
  `;

  const relatedTotal = items.reduce((sum: number, item: any) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const finalTotal = Number(kit.base_product_price || 0) + relatedTotal;

  return {
    id: Number(kit.id),
    baseProductId: Number(kit.base_product_id),
    baseProductName: kit.base_product_name,
    baseProductPrice: Number(kit.base_product_price || 0),
    items: items.map((item: any) => ({
      productId: Number(item.related_product_id),
      quantity: Number(item.quantity || 1),
      name: item.name,
      price: Number(item.price || 0),
      image: item.image,
      category: item.category,
      description: item.description,
      stock: Number(item.stock || 0),
    })),
    finalPrice: Number(finalTotal.toFixed(2)),
  };
}

export async function GET(req: NextRequest) {
  try {
    await ensureTables();

    const baseProductId = Number(req.nextUrl.searchParams.get('baseProductId') || 0);
    if (baseProductId > 0) {
      const kit = await getKitByBaseProduct(baseProductId);
      return NextResponse.json({ kit });
    }

    const rows = await sql`
      SELECT base_product_id
      FROM product_kits
      ORDER BY id DESC
    `;

    const kits = [] as any[];
    for (const row of rows) {
      const kit = await getKitByBaseProduct(Number(row.base_product_id));
      if (kit) kits.push(kit);
    }

    return NextResponse.json({ kits });
  } catch (err: any) {
    console.error('[GET /api/product-kits]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao carregar kits.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTables();

    const body = await req.json();
    const baseProductId = Number(body?.baseProductId || 0);
    const rawItems = Array.isArray(body?.items) ? body.items : [];

    if (!baseProductId) {
      return NextResponse.json({ error: 'baseProductId é obrigatório.' }, { status: 400 });
    }

    const normalizedItems = rawItems
      .map((item: any) => ({
        productId: Number(item?.productId || 0),
        quantity: Math.max(1, Number(item?.quantity || 1)),
      }))
      .filter((item: { productId: number }) => item.productId > 0 && item.productId !== baseProductId);

    const merged = new Map<number, number>();
    for (const item of normalizedItems) {
      merged.set(item.productId, (merged.get(item.productId) || 0) + item.quantity);
    }

    const finalItems = Array.from(merged.entries()).map(([productId, quantity]) => ({ productId, quantity }));

    const [kit] = await sql`
      INSERT INTO product_kits (base_product_id, updated_at)
      VALUES (${baseProductId}, NOW())
      ON CONFLICT (base_product_id)
      DO UPDATE SET updated_at = NOW()
      RETURNING id
    `;

    await sql`DELETE FROM product_kit_items WHERE kit_id = ${kit.id}`;

    for (const item of finalItems) {
      await sql`
        INSERT INTO product_kit_items (kit_id, related_product_id, quantity)
        VALUES (${kit.id}, ${item.productId}, ${item.quantity})
      `;
    }

    const responseKit = await getKitByBaseProduct(baseProductId);
    return NextResponse.json({ success: true, kit: responseKit });
  } catch (err: any) {
    console.error('[POST /api/product-kits]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao salvar kit.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureTables();
    const baseProductId = Number(req.nextUrl.searchParams.get('baseProductId') || 0);

    if (!baseProductId) {
      return NextResponse.json({ error: 'baseProductId é obrigatório.' }, { status: 400 });
    }

    await sql`DELETE FROM product_kits WHERE base_product_id = ${baseProductId}`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE /api/product-kits]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao remover kit.' }, { status: 500 });
  }
}
