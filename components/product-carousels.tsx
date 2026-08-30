'use client';
import { useEffect, useMemo, useState } from 'react';
import { ProductCarousel } from './product-carousel';
import { type Product } from '@/lib/products';
import { type DbProduct, normalizeCategory, slugifyCategory, toStoreProduct } from '@/lib/store-product';

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

export default function ProductCarousels() {
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);
  const [categoryMetaByKey, setCategoryMetaByKey] = useState<Record<string, CategoryMeta>>({});
  const [orderedCategories, setOrderedCategories] = useState<CategoryMeta[]>([]);

  function titleFor(category: string) {
    if (category === 'geral') return 'Productos';
    if (category === 'salud') return 'Suplementos y cápsulas';
    if (category === 'fitness') return 'Moda fit';
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

    for (const p of dbProducts) {
      const key = normalizeCategory(p.category);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(toStoreProduct(p));
    }

    const result: Array<{ key: string; title: string; items: Product[]; meta?: CategoryMeta; anchorId: string }> = [];
    const used = new Set<string>();

    for (const cat of orderedCategories) {
      if (cat.enabled === false) continue;
      const key = normalizeCategory(cat.name);
      const items = map.get(key) ?? [];
      if (!items.length) continue;
      const slug = slugifyCategory(cat.slug || cat.name);
      const anchorId = slug === 'salud' ? 'salud' : slug === 'fitness' ? 'fitness' : `cat-${slug}`;
      result.push({ key, title: cat.name, items, meta: cat, anchorId });
      used.add(key);
    }

    for (const [key, items] of map.entries()) {
      if (!items.length || used.has(key)) continue;
      const meta = categoryMetaByKey[key];
      const slug = slugifyCategory(meta?.slug || key);
      const anchorId = slug === 'salud' ? 'salud' : slug === 'fitness' ? 'fitness' : `cat-${slug}`;
      result.push({ key, title: meta?.name ?? titleFor(key), items, meta, anchorId });
    }

    return result;
  }, [dbProducts, orderedCategories, categoryMetaByKey]);

  return (
    <>
      {grouped.map(({ key, title, items, meta, anchorId }) => (
        <section key={key} id={anchorId} className="scroll-mt-24 sm:scroll-mt-28">
          <ProductCarousel
            products={items}
            title={title}
            subtitle="Nutrición premium para tu rendimiento"
            categoryLabel={title}
            categoryMedia={meta}
          />
        </section>
      ))}
    </>
  );
}
