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
  video?: string;
  stock?: number;
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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as DbProduct[];
        if (!Array.isArray(data) || data.length === 0) return;
        setDbProducts(data);
      } catch {
        // fallback handled below
      }
    })();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();

    if (dbProducts.length) {
      for (const p of dbProducts) {
        const key = normalizeCategory(p.category);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(toStoreProduct(p));
      }
      return Array.from(map.entries());
    }

    const fallback = [...healthProducts, ...fitnessProducts];
    for (const p of fallback) {
      const key = normalizeCategory(p.category);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries());
  }, [dbProducts]);

  const titleFor = (category: string) => {
    if (category === 'geral') return 'Produtos';
    if (category === 'salud') return 'Suplementos & Cápsulas';
    if (category === 'fitness') return 'Moda Fit';
    return category
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  return (
    <>
      {grouped.map(([category, items]) => (
        <section key={category} id={category === 'salud' ? 'salud' : category === 'fitness' ? 'fitness' : `cat-${category}`}>
          <ProductCarousel
            products={items}
            title={titleFor(category)}
            subtitle="Nutrición premium para tu rendimiento"
            categoryLabel={titleFor(category)}
            onViewDetails={setSelected}
          />
        </section>
      ))}
      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </>
  );
}
