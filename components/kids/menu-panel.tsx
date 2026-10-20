'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { type Sector, type SiteCollection } from '@/lib/sectors-shared';
import { CollectionPlayButton } from './collection-play';
import { accentFor } from './palette';
import { useSectors } from './sectors-context';

export const HOGAR_CAT_EVENT = 'kitoys:hogar-cat';

export type HomeCategory = { name: string; image: string; count: number };
type RawCategory = { name?: string; enabled?: boolean; bannerType?: string; bannerUrl?: string; logoUrl?: string };
type RawProduct = { category?: string; image?: string };

// Categorias de CASA: as do Admin → Produtos que nao pertencem a nenhuma
// colecao (ex: Jarrones, Decoración). Aparecem no grupo "Hogar" do menu.
// So busca quando o menu abre pela primeira vez.
export function useHomeCategories(enabled: boolean) {
  const { collectionForCategory } = useSectors();
  const [raw, setRaw] = useState<{ cats: RawCategory[]; products: RawProduct[] } | null>(null);

  useEffect(() => {
    if (!enabled || raw) return;
    Promise.all([
      fetch('/api/categories').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/api/products').then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([cats, products]) => setRaw({ cats: Array.isArray(cats) ? cats : [], products: Array.isArray(products) ? products : [] }));
  }, [enabled, raw]);

  return useMemo<HomeCategory[]>(() => {
    if (!raw) return [];
    const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();
    return raw.cats
      .filter((c) => c.enabled !== false && c.name && !collectionForCategory(String(c.name)))
      .map((c) => {
        const name = String(c.name);
        const items = raw.products.filter((p) => norm(p.category) === norm(name));
        const banner = c.bannerType !== 'video' ? c.bannerUrl : '';
        return { name, image: c.logoUrl || banner || items[0]?.image || '', count: items.length };
      })
      .filter((c) => c.count > 0);
  }, [raw, collectionForCategory]);
}

// Link de uma categoria de casa: a secao "Tambien para tu hogar" da home,
// ja filtrada nela.
export const homeCategoryHref = (name: string) => `/?cat=${encodeURIComponent(name)}#productos`;
export function selectHomeCategory(name: string) {
  window.dispatchEvent(new CustomEvent(HOGAR_CAT_EVENT, { detail: name }));
}

const CARD = 'w-[260px] shrink-0 snap-start';
const BTN_KIDS = 'inline-flex min-h-10 items-center justify-center rounded-full bg-[#1E1B4B] px-4 text-sm font-extrabold text-white transition-colors duration-200 hover:bg-[#363a5c]';
const BTN_HOGAR = 'inline-flex min-h-10 items-center justify-center rounded-full bg-[#2b2620] px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#4a4238]';

function KidsCollectionCard({ c, onNavigate }: { c: SiteCollection; onNavigate: () => void }) {
  const accent = accentFor(c);
  const image = c.imageUrl || c.photoUrl;
  return (
    <li className={CARD}>
      <div className="flex h-full flex-col rounded-[24px] border-[3px] border-[#1E1B4B] p-3" style={{ background: accent.block, boxShadow: '4px 4px 0 #1E1B4B' }}>
        <Link href={`/coleccion/${c.slug}`} onClick={onNavigate} className="block">
          <span className="relative block h-28 overflow-hidden rounded-[16px] bg-white/70">
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className={`h-full w-full ${c.imageUrl ? 'object-contain p-2' : 'object-cover'}`} />
            )}
          </span>
          <span className="mt-2.5 block font-kids text-xl font-bold leading-tight text-[#1E1B4B]">{c.name}</span>
          {c.tagline && <span className="mt-1 block text-sm leading-snug text-[#1E1B4B]/80">{c.tagline}</span>}
        </Link>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          <Link href={`/coleccion/${c.slug}`} onClick={onNavigate} className={BTN_KIDS}>Ver {c.shortName.toLowerCase()}</Link>
          {c.interactive !== 'none' && <CollectionPlayButton slug={c.slug} appearance="chip" />}
        </div>
      </div>
    </li>
  );
}

function HogarCard({ href, image, name, sub, onClick }: { href: string; image: string; name: string; sub?: string; onClick: () => void }) {
  return (
    <li className={CARD}>
      <div className="flex h-full flex-col rounded-[24px] bg-[#f3ece2] p-3">
        <Link href={href} onClick={onClick} className="block">
          <span className="relative block h-28 overflow-hidden rounded-[16px] bg-[#ece3d6]">
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-full w-full object-cover" />
            )}
          </span>
          <span className="mt-2.5 block text-lg font-semibold leading-tight text-[#2b2620]" style={{ fontFamily: 'Quicksand, Nunito, sans-serif' }}>{name}</span>
          {sub && <span className="mt-1 block text-sm leading-snug text-[#5f574e]">{sub}</span>}
        </Link>
        <div className="mt-auto pt-3">
          <Link href={href} onClick={onClick} className={BTN_HOGAR}>Ver</Link>
        </div>
      </div>
    </li>
  );
}

function GroupTitle({ title, hint, hogar, href, onNavigate }: { title: string; hint?: string; hogar?: boolean; href?: string; onNavigate: () => void }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <div className="flex items-baseline gap-3">
        {href ? (
          <Link href={href} onClick={onNavigate} className={hogar ? 'text-2xl font-semibold text-[#2b2620] hover:underline' : 'font-kids text-2xl font-bold text-[#1E1B4B] hover:text-[#c2410c]'} style={hogar ? { fontFamily: 'Quicksand, Nunito, sans-serif' } : undefined}>
            {title}
          </Link>
        ) : (
          <span className={hogar ? 'text-2xl font-semibold text-[#2b2620]' : 'font-kids text-2xl font-bold text-[#1E1B4B]'} style={hogar ? { fontFamily: 'Quicksand, Nunito, sans-serif' } : undefined}>{title}</span>
        )}
        {hint && <span className={hogar ? 'font-script text-xl text-[#8a6a3a]' : 'text-sm text-[#565a78]'}>{hint}</span>}
      </div>
    </div>
  );
}

const ROW = '-mx-2 flex snap-x gap-4 overflow-x-auto px-2 pb-3 pt-1 [scrollbar-width:thin]';

// Painel do menu "Colecciones", dividido por setor: Infantil (colecoes com
// brincadeira) e Hogar (setores de casa + categorias de casa do admin).
export function CollectionsMenuPanel({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { sectors } = useSectors();
  const [opened, setOpened] = useState(false);
  useEffect(() => { if (open) setOpened(true); }, [open]);
  const homeCats = useHomeCategories(opened);
  const kidsSectors = sectors.filter((s) => s.style !== 'hogar' && s.collections.length > 0);
  const homeSectors = sectors.filter((s) => s.style === 'hogar' && s.collections.length > 0);
  const homeCollections = homeSectors.flatMap((s) => s.collections);

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-8 py-7">
      {kidsSectors.map((s: Sector) => (
        <div key={s.id || s.slug}>
          <GroupTitle title={s.name} hint={s.tagline} href={`/sector/${s.slug}`} onNavigate={onNavigate} />
          <ul className={ROW}>
            {s.collections.map((c) => <KidsCollectionCard key={c.slug} c={c} onNavigate={onNavigate} />)}
          </ul>
        </div>
      ))}

      {(homeCollections.length > 0 || homeCats.length > 0) && (
        <div className="-mx-8 bg-[#fbf8f3] px-8 py-6">
          <GroupTitle
            title={homeSectors[0]?.name ?? 'Hogar'}
            hint="para tu casa"
            hogar
            href={homeSectors[0] ? `/sector/${homeSectors[0].slug}` : '/#productos'}
            onNavigate={onNavigate}
          />
          <ul className={ROW}>
            {homeCollections.map((c) => (
              <HogarCard key={c.slug} href={`/coleccion/${c.slug}`} image={c.photoUrl || c.imageUrl} name={c.name} sub={c.tagline} onClick={onNavigate} />
            ))}
            {homeCats.map((cat) => (
              <HogarCard
                key={cat.name}
                href={homeCategoryHref(cat.name)}
                image={cat.image}
                name={cat.name}
                sub={`${cat.count} ${cat.count === 1 ? 'producto' : 'productos'}`}
                onClick={() => { selectHomeCategory(cat.name); onNavigate(); }}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
