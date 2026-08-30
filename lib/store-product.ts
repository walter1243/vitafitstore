import { type Product } from '@/lib/products';

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
    image: p.image || '/images/collagen.jpg',
    mainImage: p.image || '/images/collagen.jpg',
    additionalImages: Array.isArray(p.additionalImages) ? p.additionalImages : [],
    videoUrl: p.video || '',
    category: category === 'fitness' ? 'fitness' : 'salud',
    categoryLabel: p.category?.trim() || undefined,
    // No real review system exists yet — 0 hides the rating/review UI
    // instead of showing the same fabricated number on every product.
    rating: 0,
    reviews: 0,
    stock: Number(p.stock || 0),
    benefits: ['Calidad premium', 'Entrega rápida', 'Producto verificado', 'Soporte especializado'],
    ingredients: p.description || 'Detalles no informados.',
    usage: 'Sigue las instrucciones del envase.',
    emoji: '✨',
    gradient: category === 'fitness' ? 'from-blue-400 to-indigo-600' : 'from-emerald-400 to-green-600',
  };
}
