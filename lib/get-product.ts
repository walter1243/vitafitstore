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
    const rows = await sql`
      SELECT id, name, description, price, category, image, additional_images, video, stock
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
    };

    return toStoreProduct(dbProduct);
  } catch (err) {
    console.error('[getProductById]', err);
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
