'use client';
import { useEffect, useMemo, useState } from 'react';
import { ProductCarousel } from './product-carousel';
import { ProductModal } from './product-modal';
import { healthProducts, fitnessProducts, type Product } from '@/lib/products';

type DbProduct = {
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

type CategoryMeta = {
  id: number;
  name: string;
  slug: string;
  position?: number;
  enabled?: boolean;
  bannerType?: 'image' | 'video';
  bannerUrl?: string;
  logoUrl?: string;
};

function normalizeCategory(raw?: string) {
  if (!raw) return 'geral';
  return raw.trim().toLowerCase();
}

function toStoreProduct(p: DbProduct): Product {
  const category = normalizeCategory(p.category);
  return {
    id: Number(p.id),
    name: p.name,
    slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: p.description || 'Produto premium VitaFit.',
    shortDescription: (p.description || 'Produto premium VitaFit.').replace(/<[^>]+>/g, ' ').slice(0, 80),
    price: Number(p.price || 0),
    image: p.image || '/images/collagen.jpg',
    mainImage: p.image || '/images/collagen.jpg',
    additionalImages: Array.isArray(p.additionalImages) ? p.additionalImages : [],
    videoUrl: p.video || '',
    category: category === 'fitness' ? 'fitness' : 'salud',
    rating: 4.8,
    reviews: 120,
    stock: Number(p.stock || 0),
    benefits: ['Qualidade premium', 'Entrega rápida', 'Produto verificado', 'Suporte especializado'],
    ingredients: p.description || 'Detalhes não informados.',
    usage: 'Siga as instruções da embalagem.',
    emoji: '✨',
    gradient: category === 'fitness' ? 'from-blue-400 to-indigo-600' : 'from-emerald-400 to-green-600',
  };
}

export default function ProductCarousels() {
  const [selected, setSelected] = useState<Product | null>(null);
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);
  const [categoryMetaByKey, setCategoryMetaByKey] = useState<Record<string, CategoryMeta>>({});
  const [orderedCategories, setOrderedCategories] = useState<CategoryMeta[]>([]);

  function titleFor(category: string) {
    if (category === 'geral') return 'Produtos';
    if (category === 'salud') return 'Suplementos & Cápsulas';
    if (category === 'fitness') return 'Moda Fit';
    return category
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as DbProduct[];
        if (!Array.isArray(data)) return;
        setDbProducts(data);
      } catch {
        // fallback handled below
      }
    };

    void loadProducts();

    // Keep storefront list fresh after admin edits/deletes without manual reload.
    const intervalId = window.setInterval(() => {
      void loadProducts();
    }, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadProducts();
      }
    };

    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/categories', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as CategoryMeta[];
        if (!Array.isArray(data)) return;
        const map: Record<string, CategoryMeta> = {};
        for (const c of data) {
          const key = normalizeCategory(c.name);
          map[key] = c;
          map[normalizeCategory(c.slug)] = c;
        }
        setCategoryMetaByKey(map);
        setOrderedCategories(data);
      } catch {
        // ignore category metadata errors
      }
    };

    void loadCategories();

    const intervalId = window.setInterval(() => {
      void loadCategories();
    }, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadCategories();
      }
    };

    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();

    if (dbProducts.length) {
      for (const p of dbProducts) {
        const key = normalizeCategory(p.category);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(toStoreProduct(p));
      }
    } else {
      const fallback = [...healthProducts, ...fitnessProducts];
      for (const p of fallback) {
        const key = normalizeCategory(p.category);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(p);
      }
    }

    const result: Array<{ key: string; title: string; items: Product[]; meta?: CategoryMeta }> = [];
    const used = new Set<string>();

    for (const cat of orderedCategories) {
      if (cat.enabled === false) continue;
      const key = normalizeCategory(cat.name);
      const items = map.get(key) ?? [];
      if (!items.length) continue;
      result.push({ key, title: cat.name, items, meta: cat });
      used.add(key);
    }

    for (const [key, items] of map.entries()) {
      if (!items.length || used.has(key)) continue;
      const meta = categoryMetaByKey[key];
      result.push({ key, title: meta?.name ?? titleFor(key), items, meta });
    }

    return result;
  }, [dbProducts, orderedCategories, categoryMetaByKey]);

  return (
    <>
      {grouped.map(({ key, title, items, meta }) => (
        <section key={key} id={key === 'salud' ? 'salud' : key === 'fitness' ? 'fitness' : `cat-${key}`}>
          <ProductCarousel
            products={items}
            title={title}
            subtitle="Nutrición premium para tu rendimiento"
            categoryLabel={title}
            categoryMedia={meta}
            onViewDetails={setSelected}
          />
        </section>
      ))}
      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </>
  );
}
