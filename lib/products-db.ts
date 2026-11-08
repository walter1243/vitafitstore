// Produtos da loja lidos do banco (compartilhado entre /api/products e a home no servidor).
import { sql } from '@/lib/db';
import { parsePersonalize } from '@/lib/personalize';
import { withSurcharge } from '@/lib/country-price';

export function parseAdditionalImages(value: unknown): string[] {
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

export function parseJsonArray(value: unknown): any[] {
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

export function parseColorOptions(value: unknown): { label: string; image: string; hex: string }[] {
  return parseJsonArray(value)
    .map((c: any) => ({
      label: String(c?.label ?? '').trim(),
      image: String(c?.image ?? '').trim(),
      hex: String(c?.hex ?? '').trim(),
    }))
    .filter(c => c.label && (c.image || c.hex))
    .slice(0, 5);
}

export function parseSizes(value: unknown): string[] {
  return parseJsonArray(value).map((s: any) => String(s).trim()).filter(Boolean).slice(0, 20);
}

export const DEMO_TYPES = ['none', 'rompecabezas', 'colorear', 'encender', 'encender_simple'];


export function normalizeProduct(row: any) {
  return {
    ...row,
    price: row.price != null ? Number(row.price) : 0,
    stock: row.stock != null ? Number(row.stock) : 0,
    costPrice: row.cost_price != null ? Number(row.cost_price) : null,
    shippingCost: row.shipping_cost != null ? Number(row.shipping_cost) : null,
    demoType: DEMO_TYPES.includes(row.demo_type) ? row.demo_type : 'none',
    demoImage: row.demo_image ?? '',
    collectionSlug: row.collection_slug ?? '',
    personalize: parsePersonalize(row.personalize),
    parcel: (() => { try { return row.parcel ? JSON.parse(row.parcel) : null; } catch { return null; } })(),
    additionalImages: parseAdditionalImages(row.additional_images ?? row.additionalImages),
    mainImage: row.image ?? row.mainImage ?? '',
    videoUrl: row.video ?? row.videoUrl ?? '',
    sourceStoreUrl: row.source_store_url ?? null,
    sourceProductUrl: row.source_product_url ?? null,
    productType: row.product_type ?? 'estandar',
    colorOptions: parseColorOptions(row.color_options),
    sizes: parseSizes(row.sizes),
    isCategoryCover: Boolean(row.is_category_cover),
  };
}


// Campos internos que o público não pode ver (custo e fornecedor).
const PRIVATE_FIELDS = ['cost_price', 'costPrice', 'source_store_url', 'source_product_url', 'sourceStoreUrl', 'sourceProductUrl'];
export function publicProduct<T extends Record<string, unknown>>(p: T): T {
  const out: Record<string, unknown> = { ...p };
  for (const k of PRIVATE_FIELDS) delete out[k];
  return out as T;
}

// Lista para a vitrine (home no servidor): preço do país de quem vê, sem campos internos e,
// com light = true, sem a descrição longa (a home não usa; deixa o HTML leve).
export async function getStoreProductsServer(surcharge: number, light = true): Promise<any[]> {
  try {
    const rows = await sql`
      SELECT id, name, description, price, category, image, additional_images, video, stock, position,
             product_type, color_options, sizes, is_category_cover, shipping_cost, demo_type, demo_image, collection_slug, personalize, parcel,
             created_at AS "createdAt"
      FROM products
      ORDER BY COALESCE(position, 999999), created_at DESC
    `;
    return (rows as any[]).map((p) => {
      const n = publicProduct(normalizeProduct(withSurcharge(p, surcharge)));
      if (light) { n.description = ''; n.additionalImages = []; }
      return n;
    });
  } catch (err) {
    console.error('[getStoreProductsServer]', err);
    return [];
  }
}
