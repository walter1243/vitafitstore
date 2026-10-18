'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Home, Printer } from 'lucide-react';
import { COLLECTIONS, collectionForCategory } from '@/lib/collections';
import { toStoreProduct } from '@/lib/store-product';
import { KidsProductCard } from './kids-product-card';
import { useStoreProducts } from './use-store-products';

type Sort = 'destacados' | 'precio-asc' | 'precio-desc';

const SORTS: { key: Sort; label: string }[] = [
  { key: 'destacados', label: 'Destacados' },
  { key: 'precio-asc', label: 'Menor precio' },
  { key: 'precio-desc', label: 'Mayor precio' },
];

// Catalogo de UMA colecao: chips pras categorias reais dentro dela
// (ex: "Puzzles", "Juegos de mesa" — vem do admin), ordenacao e grade de
// cards. Abaixo, um card grande levando pra(s) outra(s) colecao(oes).
export function CollectionCatalog({ slug }: { slug: string }) {
  const collection = COLLECTIONS.find((c) => c.slug === slug)!;
  const { products, loaded } = useStoreProducts();
  const [group, setGroup] = useState<string>('todo');
  const [sort, setSort] = useState<Sort>('destacados');

  const items = useMemo(
    () => products.filter((p) => collectionForCategory(p.category)?.slug === slug).map(toStoreProduct),
    [products, slug],
  );

  const groups = useMemo(() => {
    const names = new Map<string, number>();
    for (const p of items) {
      const label = p.categoryLabel || collection.shortName;
      names.set(label, (names.get(label) ?? 0) + 1);
    }
    return [...names.entries()];
  }, [items, collection.shortName]);

  const visible = useMemo(() => {
    const list = group === 'todo' ? items : items.filter((p) => (p.categoryLabel || collection.shortName) === group);
    if (sort === 'precio-asc') return [...list].sort((a, b) => a.price - b.price);
    if (sort === 'precio-desc') return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [items, group, sort, collection.shortName]);

  const others = COLLECTIONS.filter((c) => c.slug !== slug);
  const chip = (active: boolean) =>
    `min-h-11 rounded-full border-[3px] px-4 text-sm font-extrabold transition-colors duration-200 ${active ? 'text-white' : 'bg-white text-[#1e2a4a] hover:bg-slate-50'}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {groups.length > 1 ? (
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tipos dentro de la colección">
            <button
              type="button"
              onClick={() => setGroup('todo')}
              className={chip(group === 'todo')}
              style={group === 'todo' ? { background: collection.color.deep, borderColor: collection.color.deep } : { borderColor: collection.color.soft }}
            >
              Todo ({items.length})
            </button>
            {groups.map(([name, count]) => (
              <button
                key={name}
                type="button"
                onClick={() => setGroup(name)}
                className={chip(group === name)}
                style={group === name ? { background: collection.color.deep, borderColor: collection.color.deep } : { borderColor: collection.color.soft }}
              >
                {name} ({count})
              </button>
            ))}
          </div>
        ) : (
          <p className="font-kids text-xl font-semibold text-[#1e2a4a]">
            {loaded ? `${items.length} ${items.length === 1 ? 'creación' : 'creaciones'}` : 'Cargando creaciones…'}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSort(s.key)}
              className={`min-h-11 rounded-full px-4 text-sm font-extrabold transition-colors duration-200 ${sort === s.key ? 'bg-[#1e2a4a] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <KidsProductCard
              key={p.id}
              product={p}
              color={collection.color}
              tag={groups.length > 1 && group === 'todo' ? p.categoryLabel : undefined}
            />
          ))}
        </div>
      ) : loaded ? (
        <div className="rounded-[30px] border-[3px] border-dashed p-10 text-center" style={{ borderColor: collection.color.soft }}>
          <Printer className="mx-auto h-12 w-12" style={{ color: collection.color.deep }} aria-hidden="true" />
          <p className="mt-3 font-kids text-2xl font-semibold text-[#1e2a4a]">¡La impresora está trabajando!</p>
          <p className="mt-1 text-base text-slate-600">Muy pronto habrá nuevas creaciones en esta colección.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-[28px]" style={{ background: collection.color.soft }} />
          ))}
        </div>
      )}

      <div className="mt-16 grid gap-5 md:grid-cols-2">
        {others.map((c) => {
          const Icon = c.icon;
          return (
          <Link
            key={c.slug}
            href={`/coleccion/${c.slug}`}
            className="kids-pop group flex items-center gap-5 rounded-[30px] p-6 text-white"
            style={{ background: c.color.deep }}
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
              <Icon className="h-8 w-8" aria-hidden="true" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-extrabold uppercase tracking-widest text-white">Descubre también</span>
              <span className="font-kids block text-2xl font-bold">{c.name}</span>
            </span>
            <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          );
        })}
        <Link
          href="/#colecciones"
          className="kids-pop flex items-center gap-5 rounded-[30px] border-[3px] border-slate-200 bg-white p-6 text-[#1e2a4a]"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
            <Home className="h-8 w-8" aria-hidden="true" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-extrabold uppercase tracking-widest text-slate-600">Volver</span>
            <span className="font-kids block text-2xl font-bold">Todas las colecciones</span>
          </span>
          <ArrowRight className="h-6 w-6" />
        </Link>
      </div>
    </div>
  );
}
