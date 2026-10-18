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

// Catalogo de UMA colecao: botoes pras categorias reais dentro dela
// (ex: "Puzzles", "Juegos de mesa" — vem do admin), ordenacao e grade de
// cards. Embaixo, atalhos pra outra colecao e pra home.
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
    `min-h-11 cursor-pointer rounded-full px-5 text-base font-bold transition-colors duration-200 ${
      active ? 'bg-[var(--k-ink)] text-white' : 'bg-[#F2F4FA] text-[var(--k-ink)] hover:bg-[#E6E9F3]'
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {groups.length > 1 ? (
          <div className="flex flex-wrap gap-2" aria-label="Tipos dentro de la colección">
            <button type="button" onClick={() => setGroup('todo')} className={chip(group === 'todo')}>
              Todo ({items.length})
            </button>
            {groups.map(([name, count]) => (
              <button key={name} type="button" onClick={() => setGroup(name)} className={chip(group === name)}>
                {name} ({count})
              </button>
            ))}
          </div>
        ) : (
          <p className="text-base font-semibold text-[var(--k-muted)]">
            {loaded ? `${items.length} ${items.length === 1 ? 'creación' : 'creaciones'}` : 'Cargando…'}
          </p>
        )}

        <label className="flex items-center gap-2 text-base font-semibold text-[var(--k-muted)]">
          Ordenar por
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="min-h-11 cursor-pointer rounded-full border border-[var(--k-line)] bg-white px-4 text-base font-bold text-[var(--k-ink)] outline-none focus:border-[var(--k-ink)]"
          >
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
          {visible.map((p) => (
            <KidsProductCard
              key={p.id}
              product={p}
              soft={collection.color.soft}
              tag={groups.length > 1 && group === 'todo' ? p.categoryLabel : undefined}
            />
          ))}
        </div>
      ) : loaded ? (
        <div className="rounded-[32px] px-6 py-14 text-center" style={{ background: collection.color.soft }}>
          <Printer className="mx-auto h-12 w-12" style={{ color: collection.color.main }} strokeWidth={1.75} aria-hidden="true" />
          <p className="mt-4 font-kids text-3xl font-bold text-[var(--k-ink)]">La impresora está trabajando</p>
          <p className="mt-1 text-lg text-[var(--k-muted)]">Muy pronto habrá nuevas creaciones aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-[28px]" style={{ background: collection.color.soft }} />
          ))}
        </div>
      )}

      <div className="mt-16 grid gap-4 md:grid-cols-2">
        {others.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.slug}
              href={`/coleccion/${c.slug}`}
              className="group flex cursor-pointer items-center gap-5 rounded-3xl p-5 transition-transform duration-200 hover:-translate-y-0.5"
              style={{ background: c.color.soft }}
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white">
                <Icon className="h-7 w-7" style={{ color: c.color.main }} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-[var(--k-muted)]">Descubre también</span>
                <span className="block font-kids text-2xl font-bold text-[var(--k-ink)]">{c.name}</span>
              </span>
              <ArrowRight className="h-5 w-5 text-[var(--k-ink)] transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          );
        })}
        <Link
          href="/#colecciones"
          className="group flex cursor-pointer items-center gap-5 rounded-3xl bg-[#F2F4FA] p-5 transition-transform duration-200 hover:-translate-y-0.5"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white">
            <Home className="h-7 w-7 text-[var(--k-ink)]" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-[var(--k-muted)]">Volver</span>
            <span className="block font-kids text-2xl font-bold text-[var(--k-ink)]">Todas las colecciones</span>
          </span>
          <ArrowRight className="h-5 w-5 text-[var(--k-ink)] transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
