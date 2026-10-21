'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Home, Printer } from 'lucide-react';
import { softOf } from '@/lib/sectors-shared';
import { iconFor } from './collection-play';
import { useSectors } from './sectors-context';
import { toStoreProduct } from '@/lib/store-product';
import { KidsProductCard } from './kids-product-card';
import { accentFor } from './palette';
import { ThemedProductCard } from '@/components/themes/themed-product-card';
import { themeFor } from '@/components/themes/sector-themes';
import { NavidadSides, NavidadSnow } from '@/components/themes/navidad-decor';
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
  const { getCollection, getSector, collectionForProduct } = useSectors();
  const collection = getCollection(slug)!;
  const { products, loaded } = useStoreProducts();
  const [group, setGroup] = useState<string>('todo');
  const [sort, setSort] = useState<Sort>('destacados');

  // Veio do menu "Categorías" (?cat=Nome): ja abre filtrado nela.
  useEffect(() => {
    const cat = new URLSearchParams(window.location.search).get('cat');
    if (cat) setGroup(cat);
  }, []);

  const items = useMemo(
    () => products.filter((p) => collectionForProduct(p)?.slug === slug).map(toStoreProduct),
    [products, slug, collectionForProduct],
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
    // Categoria que nao existe mais nesta colecao (link antigo) = mostra tudo.
    const known = groups.some(([name]) => name === group);
    const list = group === 'todo' || !known ? items : items.filter((p) => (p.categoryLabel || collection.shortName) === group);
    if (sort === 'precio-asc') return [...list].sort((a, b) => a.price - b.price);
    if (sort === 'precio-desc') return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [items, groups, group, sort, collection.shortName]);

  // Outras colecoes do MESMO setor pra continuar navegando.
  const sector = getSector(collection.sectorId);
  const sectorTheme = themeFor(sector?.style);
  const others = (sector?.collections ?? []).filter((c) => c.slug !== slug && c.enabled);
  const soft = softOf(collection);
  const chip = (active: boolean) =>
    `min-h-10 shrink-0 cursor-pointer whitespace-nowrap rounded-full px-4 text-sm font-bold transition-colors duration-200 sm:min-h-11 sm:px-5 sm:text-base ${
      active ? 'bg-[var(--k-ink)] text-white' : 'bg-[#F2F4FA] text-[var(--k-ink)] hover:bg-[#E6E9F3]'
    }`;

  const navidad = sectorTheme?.key === 'navidad';
  return (
    <div className={navidad ? 'kids-navidad relative min-h-[560px] overflow-hidden' : ''} style={navidad ? { background: sectorTheme!.bgAlt } : undefined}>
    {navidad && <><NavidadSnow /><NavidadSides /></>}
    <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      {/* Topo: atalhos pras outras colecoes do mundo (desliza no celular). */}
      {(others.length > 0 || sector) && (
        <nav aria-label="Otras colecciones" className="swipe-row -mx-1 mb-4 px-1 py-1">
          <Link
            href={sector ? `/sector/${sector.slug}` : '/#colecciones'}
            className="inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#F2F4FA] px-4 text-sm font-bold text-[var(--k-ink)] transition-colors hover:bg-[#E6E9F3]"
          >
            <Home className="h-4 w-4" aria-hidden="true" /> {sector ? `Todo ${sector.name.toLowerCase()}` : 'Colecciones'}
          </Link>
          {others.map((c) => {
            const Icon = iconFor(c.interactive);
            return (
              <Link
                key={c.slug}
                href={`/coleccion/${c.slug}`}
                className="inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-bold text-[var(--k-ink)] transition-opacity hover:opacity-80"
                style={{ background: softOf(c) }}
              >
                <Icon className="h-4 w-4" aria-hidden="true" /> {c.name}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Um seletor de categoria (sem chips nem "ordenar por"). */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-base font-semibold text-[var(--k-muted)]">
          {loaded ? `${visible.length} ${visible.length === 1 ? 'producto' : 'productos'}` : 'Cargando…'}
        </p>
        {groups.length > 1 && (
          <label className="flex items-center gap-2 text-base font-semibold text-[var(--k-muted)]">
            <span className="hidden sm:inline">Categoría</span>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              aria-label="Categoría"
              className="min-h-11 max-w-[60vw] cursor-pointer rounded-full border border-[var(--k-line)] bg-white px-4 text-sm font-bold text-[var(--k-ink)] outline-none focus:border-[var(--k-ink)] sm:text-base"
            >
              <option value="todo">Todas ({items.length})</option>
              {groups.map(([name, count]) => <option key={name} value={name}>{name} ({count})</option>)}
            </select>
          </label>
        )}
      </div>

      {visible.length > 0 ? (
        <div className="swipe-products">
          {visible.map((p) => (
            sectorTheme ? <ThemedProductCard key={p.id} product={p} theme={sectorTheme} /> : <KidsProductCard
              key={p.id}
              product={p}
              accent={accentFor(collection)}
              tag={groups.length > 1 && group === 'todo' ? p.categoryLabel : undefined}
            />
          ))}
        </div>
      ) : loaded ? (
        <div className="rounded-[32px] px-6 py-14 text-center" style={{ background: soft }}>
          <Printer className="mx-auto h-12 w-12 text-[var(--k-ink)]" strokeWidth={1.75} aria-hidden="true" />
          <p className="mt-4 font-kids text-3xl font-bold text-[var(--k-ink)]">La impresora está trabajando</p>
          <p className="mt-1 text-lg text-[var(--k-muted)]">Muy pronto habrá nuevas creaciones aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-[28px]" style={{ background: soft }} />
          ))}
        </div>
      )}

    </div>
    </div>
  );
}
