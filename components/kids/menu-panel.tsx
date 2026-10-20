'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { type Sector, type SiteCollection } from '@/lib/sectors-shared';
import { SECTOR_THEMES, themeFor, type SectorTheme } from '@/components/themes/sector-themes';
import { useStoreProducts } from './use-store-products';
import { CollectionPlayButton } from './collection-play';
import { accentFor } from './palette';
import { useSectors } from './sectors-context';

export const HOGAR_CAT_EVENT = 'kitoys:hogar-cat';

export type HomeCategory = { name: string; image: string; count: number };
type RawCategory = { name?: string; enabled?: boolean; bannerType?: string; bannerUrl?: string; logoUrl?: string };

// Categorias sem colecao (produtos que nao estao em nenhuma colecao): vao
// pro grupo "Mas para tu casa". So busca as categorias quando o menu abre.
export function useHomeCategories(enabled: boolean) {
  const { collectionForProduct } = useSectors();
  const { products } = useStoreProducts();
  const [cats, setCats] = useState<RawCategory[] | null>(null);

  useEffect(() => {
    if (!enabled || cats) return;
    fetch('/api/categories').then((r) => (r.ok ? r.json() : [])).catch(() => []).then((c) => setCats(Array.isArray(c) ? c : []));
  }, [enabled, cats]);

  return useMemo<HomeCategory[]>(() => {
    if (!cats) return [];
    const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();
    const loose = products.filter((p) => !collectionForProduct(p));
    return cats
      .filter((c) => c.enabled !== false && c.name)
      .map((c) => {
        const name = String(c.name);
        const items = loose.filter((p) => norm(p.category) === norm(name));
        const banner = c.bannerType !== 'video' ? c.bannerUrl : '';
        return { name, image: c.logoUrl || banner || items[0]?.image || '', count: items.length };
      })
      .filter((c) => c.count > 0);
  }, [cats, products, collectionForProduct]);
}


// Link de uma categoria sem colecao: a secao "Mas para tu casa" da home, ja
// filtrada nela.
export const homeCategoryHref = (name: string) => `/?cat=${encodeURIComponent(name)}#productos`;
export function selectHomeCategory(name: string) {
  window.dispatchEvent(new CustomEvent(HOGAR_CAT_EVENT, { detail: name }));
}

const CARD = 'w-[260px] shrink-0 snap-start';
const BTN_KIDS = 'inline-flex min-h-10 items-center justify-center rounded-full bg-[#1E1B4B] px-4 text-sm font-extrabold text-white transition-colors duration-200 hover:bg-[#363a5c]';

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
          {c.interactive !== 'none' && c.interactive !== 'nombre' && <CollectionPlayButton slug={c.slug} appearance="chip" />}
        </div>
      </div>
    </li>
  );
}

// Card de colecao no visual do setor dela (Casa, Chaveiros, Pet...).
function ThemedMenuCard({ t, href, image, name, sub, cta, onClick }: { t: SectorTheme; href: string; image: string; name: string; sub?: string; cta: string; onClick: () => void }) {
  return (
    <li className={CARD}>
      <div className="flex h-full flex-col p-3" style={{ background: t.key === 'llaveros' ? '#ffffff' : t.bg, borderRadius: '24px', boxShadow: t.key === 'llaveros' ? '0 8px 24px rgba(79,70,229,0.14)' : undefined }}>
        <Link href={href} onClick={onClick} className="block">
          <span className="relative block h-28 overflow-hidden" style={{ borderRadius: '16px', background: t.key === 'llaveros' ? t.bgAlt : t.surface }}>
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className={`h-full w-full ${t.key === 'llaveros' ? 'object-contain p-2' : 'object-cover'}`} />
            )}
          </span>
          <span className="mt-2.5 block text-lg font-semibold leading-tight" style={{ fontFamily: t.heading, color: t.ink }}>{name}</span>
          {sub && <span className="mt-1 block text-sm leading-snug" style={{ color: t.muted }}>{sub}</span>}
        </Link>
        <div className="mt-auto pt-3">
          <Link href={href} onClick={onClick} className="inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-bold" style={{ background: t.cta, color: t.ctaText }}>{cta}</Link>
        </div>
      </div>
    </li>
  );
}

function GroupTitle({ title, hint, t, href, onNavigate }: { title: string; hint?: string; t?: SectorTheme | null; href?: string; onNavigate: () => void }) {
  const titleStyle = t ? { fontFamily: t.heading, color: t.ink } : undefined;
  const titleCls = t ? 'text-2xl font-semibold hover:underline' : 'font-kids text-2xl font-bold text-[#1E1B4B] hover:text-[#c2410c]';
  return (
    <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
      {href ? <Link href={href} onClick={onNavigate} className={titleCls} style={titleStyle}>{title}</Link> : <span className={titleCls} style={titleStyle}>{title}</span>}
      {hint && <span className={t ? 'text-xl' : 'text-sm text-[#565a78]'} style={t ? { fontFamily: t.kickerFont, color: t.accent } : undefined}>{hint}</span>}
    </div>
  );
}

const ROW = '-mx-2 flex snap-x gap-4 overflow-x-auto px-2 pb-3 pt-1 [scrollbar-width:thin]';

// Painel do menu "Colecciones", dividido por setor, cada grupo no visual do
// setor: Infantil (cards coloridos com brincadeira), Casa, Chaveiros, Pet...
// Setores novos so aparecem quando tiverem produto.
export function CollectionsMenuPanel({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { sectors, collectionForProduct } = useSectors();
  const { products } = useStoreProducts();
  const [opened, setOpened] = useState(false);
  useEffect(() => { if (open) setOpened(true); }, [open]);
  const homeCats = useHomeCategories(opened);

  const firstImage = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of products) {
      const c = collectionForProduct(p);
      if (c && !map[c.slug] && p.image) map[c.slug] = p.image;
    }
    return map;
  }, [products, collectionForProduct]);
  const count = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) { const c = collectionForProduct(p); if (c) map[c.slug] = (map[c.slug] ?? 0) + 1; }
    return map;
  }, [products, collectionForProduct]);

  const groups = sectors
    .map((s) => (s.style === 'infantil' ? s : { ...s, collections: s.collections.filter((c) => (count[c.slug] ?? 0) > 0) }))
    .filter((s) => s.collections.length > 0);

  return (
    <div className="mx-auto max-w-7xl space-y-2 px-8 py-6">
      {groups.map((s: Sector) => {
        const t = themeFor(s.style);
        return (
          <div key={s.id || s.slug} className={t ? '-mx-8 px-8 py-5' : 'py-2'} style={t ? { background: t.bgAlt } : undefined}>
            <GroupTitle title={s.name} hint={t ? t.kicker : s.tagline} t={t} href={`/sector/${s.slug}`} onNavigate={onNavigate} />
            <ul className={ROW}>
              {s.collections.map((c) =>
                t ? (
                  <ThemedMenuCard
                    key={c.slug}
                    t={t}
                    href={`/coleccion/${c.slug}`}
                    image={c.imageUrl || c.photoUrl || firstImage[c.slug] || ''}
                    name={c.name}
                    sub={c.tagline}
                    cta={c.interactive === 'nombre' ? 'Personalizar' : 'Ver'}
                    onClick={onNavigate}
                  />
                ) : (
                  <KidsCollectionCard key={c.slug} c={c} onNavigate={onNavigate} />
                ),
              )}
            </ul>
          </div>
        );
      })}

      {homeCats.length > 0 && (
        <div className="-mx-8 px-8 py-5" style={{ background: SECTOR_THEMES.hogar.bgAlt }}>
          <GroupTitle title="Más para tu casa" hint="para papás y mamás" t={SECTOR_THEMES.hogar} href="/#productos" onNavigate={onNavigate} />
          <ul className={ROW}>
            {homeCats.map((cat) => (
              <ThemedMenuCard
                key={cat.name}
                t={SECTOR_THEMES.hogar}
                href={homeCategoryHref(cat.name)}
                image={cat.image}
                name={cat.name}
                sub={`${cat.count} ${cat.count === 1 ? 'producto' : 'productos'}`}
                cta="Ver"
                onClick={() => { selectHomeCategory(cat.name); onNavigate(); }}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
