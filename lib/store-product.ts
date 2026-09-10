import { type Product, type ProductType, type ColorOption } from '@/lib/products';

// Neutral inline placeholder for a product with no image set — the old
// fallback pointed at a leftover supplement product photo, which is wrong
// for every real product in this store's catalog.
export const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23F1F5F9'/%3E%3Cpath d='M60 130V80l40-25 40 25v50z' fill='none' stroke='%23CBD5E1' stroke-width='6' stroke-linejoin='round'/%3E%3Cpath d='M60 80l40 25 40-25' fill='none' stroke='%23CBD5E1' stroke-width='6' stroke-linejoin='round'/%3E%3Cpath d='M100 105v50' stroke='%23CBD5E1' stroke-width='6'/%3E%3C/svg%3E";

export type DbProduct = {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image?: string;
  additionalImages?: string[];
  video?: string;
  stock?: number;
  productType?: ProductType;
  colorOptions?: ColorOption[];
  sizes?: string[];
  isCategoryCover?: boolean;
};

export function normalizeCategory(raw?: string) {
  if (!raw) return 'geral';
  return raw.trim().toLowerCase();
}

export function slugifyCategory(raw?: string) {
  if (!raw) return 'geral';
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Single source of truth for turning a raw DB row into the storefront's
// Product shape — used by both the category carousels and the dedicated
// product page, so category label / pricing / images never drift apart.
export function toStoreProduct(p: DbProduct): Product {
  const category = normalizeCategory(p.category);
  return {
    id: Number(p.id),
    name: p.name,
    slug: slugifyCategory(p.name),
    description: p.description || 'Producto premium.',
    shortDescription: (p.description || 'Producto premium.').replace(/<[^>]+>/g, ' ').slice(0, 80),
    price: Number(p.price || 0),
    image: p.image || NO_IMAGE_PLACEHOLDER,
    mainImage: p.image || NO_IMAGE_PLACEHOLDER,
    additionalImages: Array.isArray(p.additionalImages) ? p.additionalImages : [],
    videoUrl: p.video || '',
    category: category === 'fitness' ? 'fitness' : 'salud',
    categoryLabel: p.category?.trim() || undefined,
    // No real review system exists yet — 0 hides the rating/review UI
    // instead of showing the same fabricated number on every product.
    rating: 0,
    reviews: 0,
    stock: Number(p.stock || 0),
    benefits: ['Calidad certificada', 'Envío con seguimiento', 'Pago 100% seguro', 'Devolución 14 días'],
    ingredients: p.description || 'Detalles no informados.',
    usage: 'Sigue las instrucciones del envase.',
    productType: p.productType && p.productType !== 'estandar' ? p.productType : undefined,
    colorOptions: Array.isArray(p.colorOptions) ? p.colorOptions.filter(c => c?.label && (c?.image || c?.hex)) : [],
    sizes: Array.isArray(p.sizes) ? p.sizes.filter(Boolean) : [],
    emoji: '✨',
    gradient: category === 'fitness' ? 'from-blue-400 to-indigo-600' : 'from-emerald-400 to-green-600',
  };
}
