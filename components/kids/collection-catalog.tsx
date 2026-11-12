'use client';
import { useEffect, useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { softOf } from '@/lib/sectors-shared';
import { useSectors } from './sectors-context';
import { toStoreProduct } from '@/lib/store-product';
import { accentFor } from './palette';
import { StoreProductCard } from '@/components/store-product-card';
import { themeFor } from '@/components/themes/sector-themes';
import { NavidadSnow } from '@/components/themes/navidad-decor';
import { useStoreProducts } from './use-store-products';
import { productListClass, useProductLayout } from '@/components/product-layout';

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
  const layout = useProductLayout();
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
  const soft = softOf(collection);

  const navidad = sectorTheme?.key === 'navidad';
  return (
    <div className={navidad ? 'kids-navidad relative min-h-[560px] overflow-hidden' : ''} style={navidad ? { background: sectorTheme!.bgAlt } : undefined}>
    {navidad && <NavidadSnow />}
    <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-5 sm:px-6 sm:pt-8">
      {/* Topo: atalhos pras outras colecoes do mundo (desliza no celular). */}

      {/* Um seletor de categoria (sem chips nem "ordenar por"). */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-[14px] font-medium text-[#6e6e73]">
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
        <div className={productListClass(layout)}>
          {visible.map((p) => <StoreProductCard key={p.id} product={p} />)}
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
