'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { type SiteCollection } from '@/lib/sectors-shared';
import { CollectionPlayButton } from './collection-play';
import { accentFor } from './palette';
import { useSectors } from './sectors-context';

type MenuCategory = { name: string; href: string; image: string; count: number };
type RawCategory = { name?: string; enabled?: boolean; bannerType?: string; bannerUrl?: string; logoUrl?: string };
type RawProduct = { category?: string; image?: string };

// Categorias do Admin → Produtos pro menu: imagem (logo/banner da categoria
// ou a foto do 1o produto), quantos produtos e o link — a colecao dela ja
// filtrada nessa categoria, ou a vitrine de casa se nao tiver colecao.
// So busca quando o menu abre pela primeira vez.
export function useMenuCategories(enabled: boolean) {
  const { collectionForCategory } = useSectors();
  const [raw, setRaw] = useState<{ cats: RawCategory[]; products: RawProduct[] } | null>(null);

  useEffect(() => {
    if (!enabled || raw) return;
    Promise.all([
      fetch('/api/categories').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/api/products').then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([cats, products]) => setRaw({ cats: Array.isArray(cats) ? cats : [], products: Array.isArray(products) ? products : [] }));
  }, [enabled, raw]);

  return useMemo<MenuCategory[]>(() => {
    if (!raw) return [];
    const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();
    return raw.cats
      .filter((c) => c.enabled !== false && c.name)
      .map((c) => {
        const name = String(c.name);
        const items = raw.products.filter((p) => norm(p.category) === norm(name));
        const col = collectionForCategory(name);
        const banner = c.bannerType !== 'video' ? c.bannerUrl : '';
        return {
          name,
          href: col ? `/coleccion/${col.slug}?cat=${encodeURIComponent(name)}` : '/#productos',
          image: c.logoUrl || banner || items[0]?.image || '',
          count: items.length,
        };
      })
      .filter((c) => c.count > 0);
  }, [raw, collectionForCategory]);
}

function CollectionCard({ c, sectorName, hogar, onNavigate }: { c: SiteCollection; sectorName?: string; hogar: boolean; onNavigate: () => void }) {
  const accent = accentFor(c);
  const image = c.imageUrl || c.photoUrl;
  return (
    <li className="w-[240px] shrink-0 snap-start">
      <div
        className={`flex h-full flex-col rounded-[24px] p-3 ${hogar ? 'bg-[#f3ece2]' : 'border-[3px] border-[#1E1B4B]'}`}
        style={hogar ? undefined : { background: accent.block, boxShadow: '4px 4px 0 #1E1B4B' }}
      >
        <Link href={`/coleccion/${c.slug}`} onClick={onNavigate} className="block">
          <span className={`relative block h-28 overflow-hidden rounded-[16px] ${hogar ? 'bg-[#ece3d6]' : 'bg-white/70'}`}>
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className={`h-full w-full ${c.imageUrl ? 'object-contain p-2' : 'object-cover'}`} />
            )}
          </span>
          {sectorName && (
            <span className={`mt-2.5 block text-[11px] font-extrabold uppercase tracking-wide ${hogar ? 'text-[#8a6a3a]' : 'text-[#1E1B4B]/70'}`}>{sectorName}</span>
          )}
          <span className={`block text-xl font-bold leading-tight ${sectorName ? '' : 'mt-2.5'} ${hogar ? 'text-[#2b2620]' : 'font-kids text-[#1E1B4B]'}`}>{c.name}</span>
          {c.tagline && <span className={`mt-1 block text-sm leading-snug ${hogar ? 'text-[#5f574e]' : 'text-[#1E1B4B]/80'}`}>{c.tagline}</span>}
        </Link>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          <Link
            href={`/coleccion/${c.slug}`}
            onClick={onNavigate}
            className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-extrabold text-white transition-colors duration-200 ${hogar ? 'bg-[#2b2620] hover:bg-[#4a4238]' : 'bg-[#1E1B4B] hover:bg-[#363a5c]'}`}
          >
            Ver {c.shortName.toLowerCase()}
          </Link>
          {c.interactive !== 'none' && <CollectionPlayButton slug={c.slug} appearance="chip" />}
        </div>
      </div>
    </li>
  );
}

// Painel do menu "Colecciones": todas as colecoes lado a lado (rola pro lado
// quando nao cabem) e, embaixo, as categorias de produto.
export function CollectionsMenuPanel({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { sectors } = useSectors();
  const [opened, setOpened] = useState(false);
  useEffect(() => { if (open) setOpened(true); }, [open]);
  const categories = useMenuCategories(opened);
  const many = sectors.filter((s) => s.collections.length > 0).length > 1;
  const all = sectors.flatMap((s) => s.collections.map((c) => ({ c, sector: s })));

  return (
    <div className="mx-auto max-w-7xl px-8 py-7">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="font-kids text-2xl font-bold text-[#1E1B4B]">Colecciones</p>
        <span className="text-sm text-[#565a78]">{all.length} {all.length === 1 ? 'colección' : 'colecciones'}</span>
      </div>
      <ul className="-mx-2 flex snap-x gap-4 overflow-x-auto px-2 pb-3 pt-1 [scrollbar-width:thin]">
        {all.map(({ c, sector }) => (
          <CollectionCard key={c.slug} c={c} sectorName={many ? sector.name : undefined} hogar={sector.style === 'hogar'} onNavigate={onNavigate} />
        ))}
      </ul>

      {categories.length > 0 && <CategoryChips categories={categories} onNavigate={onNavigate} className="mt-5 border-t border-[#efe7da] pt-5" />}
    </div>
  );
}

export function CategoryChips({ categories, onNavigate, className = '' }: { categories: MenuCategory[]; onNavigate: () => void; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-3 font-kids text-xl font-bold text-[#1E1B4B]">Categorías</p>
      <ul className="flex flex-wrap gap-3">
        {categories.map((cat) => (
          <li key={cat.name}>
            <Link
              href={cat.href}
              onClick={onNavigate}
              className="flex min-h-12 items-center gap-2.5 rounded-full border-2 border-[#1E1B4B] bg-white py-1 pl-1 pr-4 text-sm font-bold text-[#1E1B4B] transition-colors duration-200 hover:bg-[#FFF4E0]"
            >
              <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#F2F4FA]">
                {cat.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cat.image} alt="" className="h-full w-full object-cover" />
                )}
              </span>
              {cat.name}
              <span className="rounded-full bg-[#F2F4FA] px-2 py-0.5 text-xs font-extrabold text-[#565a78]">{cat.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
