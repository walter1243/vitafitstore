import { sql } from '@/lib/db';
import { toStoreProduct, type DbProduct } from '@/lib/store-product';
import type { Product } from '@/lib/products';

function parseAdditionalImages(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim()).filter(Boolean);
    } catch {
      return value.split(',').map((v) => v.trim()).filter(Boolean);
    }
  }
  return [];
}

export async function getProductById(id: number): Promise<Product | null> {
  try {
    // SELECT * de proposito: inclui shipping_cost (frete do produto) sem
    // quebrar se a coluna ainda nao existir. Sem o frete aqui, o carrinho
    // mostrava a tabela padrao enquanto o checkout cobrava o frete cadastrado.
    const rows = await sql`
      SELECT *
      FROM products
      WHERE id = ${id}
      LIMIT 1
    `;
    const row = rows?.[0];
    if (!row) return null;

    const dbProduct: DbProduct = {
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      price: row.price,
      category: row.category ?? '',
      image: row.image ?? '',
      additionalImages: parseAdditionalImages(row.additional_images),
      video: row.video ?? '',
      stock: row.stock,
      shippingCost: row.shipping_cost != null ? Number(row.shipping_cost) : null,
      demoType: ['rompecabezas', 'colorear', 'encender'].includes(row.demo_type) ? row.demo_type : 'none',
      demoImage: row.demo_image ?? '',
    };

    return toStoreProduct(dbProduct);
  } catch (err) {
    const fromPreview = await getProductFromPreview(id);
    if (fromPreview) return fromPreview;
    console.error('[getProductById]', err);
    return null;
  }
}

// Pre-visualizacao local sem banco (ver PREVIEW_API_FROM em next.config.mjs):
// busca o produto na API do site publicado. So roda em desenvolvimento.
async function getProductFromPreview(id: number): Promise<Product | null> {
  const from = process.env.NODE_ENV === 'development' ? process.env.PREVIEW_API_FROM : '';
  if (!from) return null;
  try {
    const res = await fetch(`${from.replace(/\/$/, '')}/api/products`, { cache: 'no-store' });
    if (!res.ok) return null;
    const rows = (await res.json()) as DbProduct[];
    const row = Array.isArray(rows) ? rows.find((r) => Number(r.id) === id) : undefined;
    return row ? toStoreProduct(row) : null;
  } catch {
    return null;
  }
}

export async function getAllProductIds(): Promise<{ id: number; name: string }[]> {
  try {
    const rows = await sql`SELECT id, name FROM products ORDER BY id`;
    return rows as { id: number; name: string }[];
  } catch (err) {
    console.error('[getAllProductIds]', err);
    return [];
  }
}
