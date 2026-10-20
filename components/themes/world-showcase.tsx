'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Gift, Heart, Leaf, Lock, PawPrint, PenLine, Printer, ShieldCheck, Smile, Sparkles, Star, Sun, Truck, type LucideIcon,
} from 'lucide-react';
import { type Sector, type SiteCollection } from '@/lib/sectors-shared';
import { type Product } from '@/lib/products';
import { toStoreProduct } from '@/lib/store-product';
import { KidsProductCard } from '@/components/kids/kids-product-card';
import { accentFor } from '@/components/kids/palette';
import { useSectors } from '@/components/kids/sectors-context';
import { useStoreProducts } from '@/components/kids/use-store-products';
import { ThemedProductCard } from './themed-product-card';
import { parseWorldContent, type Media, type TileIcon } from '@/lib/world-content';
import { themeFor, type SectorTheme } from './sector-themes';

// Vitrine de cada mundo — ui-ux-pro-max "Bento Grid Showcase": fotos/videos
// de uso em destaque + blocos curtos de beneficio, "como funciona" e a faixa
// de confianca. Tudo editavel em Admin → Mundos (lib/world-content.ts).
// Sem avaliacoes inventadas: so o que a loja realmente oferece.

export const TILE_ICON: Record<TileIcon, LucideIcon> = {
  sparkles: Sparkles, heart: Heart, gift: Gift, sun: Sun, leaf: Leaf, paw: PawPrint, pen: PenLine,
  star: Star, shield: ShieldCheck, truck: Truck, printer: Printer, smile: Smile,
};

// O Infantil nao tem tema "coringa"; pra vitrine usa as cores da casa.
const KIDS_THEME: SectorTheme = {
  key: 'llaveros',
  bg: '#FFE7A8', bgAlt: '#FFF8EF', surface: '#FFD84D',
  ink: '#1E1B4B', muted: '#3F3D6B', accent: '#C2410C',
  cta: '#1E1B4B', ctaHover: '#363a5c', ctaText: '#ffffff',
  heading: "'Baloo 2', 'Nunito', system-ui, sans-serif",
  kickerFont: "'Baloo 2', 'Nunito', system-ui, sans-serif",
  kicker: '', radius: '28px',
};

const TRUST = [
  { Icon: Printer, title: 'Impreso en Elche', text: 'Diseñado e impreso en nuestro taller.' },
  { Icon: Truck, title: 'Envío con seguimiento', text: 'Gratis a partir de 50 €.' },
  { Icon: ShieldCheck, title: 'Garantía de 3 años', text: 'Ante cualquier defecto de fabricación.' },
  { Icon: Lock, title: 'Pago seguro', text: 'Tarjeta, Apple Pay y Google Pay.' },
];

export function MediaFill({ media, alt, sizes, className = '', priority }: { media: Media; alt: string; sizes: string; className?: string; priority?: boolean }) {
  if (!media.url) return null;
  if (media.kind === 'video') {
    return <video className={`absolute inset-0 h-full w-full object-cover ${className}`} src={media.url} autoPlay muted loop playsInline aria-label={alt} />;
  }
  return <Image src={media.url} alt={alt} fill priority={priority} sizes={sizes} className={`object-cover ${className}`} />;
}

// Enfeites de cada mundo (escondidos do leitor de tela).
function Decor({ t, kids }: { t: SectorTheme; kids: boolean }) {
  if (!kids && t.key === 'mascotas') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {[[6, 12, -20], [88, 8, 25], [92, 62, -10], [3, 70, 15], [50, 94, 30]].map(([x, y, r], i) => (
          <PawPrint key={i} className="absolute h-14 w-14" style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${r}deg)`, color: t.accent, opacity: 0.12 }} />
        ))}
      </div>
    );
  }
  if (kids || t.key === 'llaveros') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span className="absolute -left-16 top-10 h-48 w-48 rounded-full border-[14px]" style={{ borderColor: `${t.accent}1f` }} />
        <span className="absolute -right-10 bottom-16 h-64 w-64 rounded-full border-[18px]" style={{ borderColor: `${t.cta}1f` }} />
        <span className="absolute right-[18%] top-6 h-20 w-20 rounded-full border-[8px]" style={{ borderColor: `${t.accent}26` }} />
      </div>
    );
  }
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <span className="absolute -left-24 top-20 h-72 w-72 rounded-[45%_55%_60%_40%/55%_45%_55%_45%]" style={{ background: t.surface }} />
      <span className="absolute -right-20 bottom-10 h-80 w-80 rounded-[60%_40%_45%_55%/45%_55%_45%_55%]" style={{ background: t.bg }} />
    </div>
  );
}

type WorldSector = Pick<Sector, 'style' | 'content'> & { collections?: SiteCollection[] };

export function WorldShowcase({ sector, products }: { sector?: WorldSector | null; products?: Product[] }) {
  // Produtos do mundo (todas as colecoes dele), pra vender no meio da vitrine.
  const { products: all } = useStoreProducts();
  const { collectionForProduct } = useSectors();
  const list = useMemo(() => {
    if (products) return products;
    const slugs = new Set((sector?.collections ?? []).map((c) => c.slug));
    return all.filter((p) => slugs.has(collectionForProduct(p)?.slug ?? '')).map(toStoreProduct);
  }, [products, all, sector, collectionForProduct]);

  if (!sector) return null;
  const kids = sector.style === 'infantil';
  const t = themeFor(sector.style) ?? KIDS_THEME;
  const s = parseWorldContent(sector.content, sector.style).showcase;
  if (!s.enabled) return null;
  const card = kids || t.key === 'llaveros' ? '#ffffff' : t.bg;
  const [first, ...rest] = s.shots;

  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24 lg:px-8" style={{ background: t.bgAlt, color: t.ink }}>
      <Decor t={t} kids={kids} />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          {s.kicker && <p className="text-2xl sm:text-3xl" style={{ fontFamily: t.kickerFont, color: t.accent }}>{s.kicker}</p>}
          {s.title && <h2 className="mt-1 text-4xl font-semibold sm:text-5xl" style={{ fontFamily: t.heading }}>{s.title}</h2>}
          {s.intro && <p className="mt-4 text-lg leading-relaxed" style={{ color: t.muted }}>{s.intro}</p>}
        </div>

        {/* Bento: foto/video grande + as outras + blocos de beneficio */}
        {(first || s.tiles.length > 0) && (
          <div className={`grid gap-4 ${first ? 'md:grid-cols-6' : ''}`}>
            {first && (
              <figure className="relative aspect-[4/5] overflow-hidden md:col-span-3 md:aspect-auto" style={{ borderRadius: t.radius, background: t.surface, minHeight: 420 }}>
                <MediaFill media={first} alt={first.alt || first.caption || 'Foto de uso'} sizes="(min-width: 768px) 50vw, 92vw" />
                {first.caption && <figcaption className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/90 px-4 py-2.5 text-sm font-semibold backdrop-blur" style={{ color: t.ink }}>{first.caption}</figcaption>}
              </figure>
            )}
            <div className={`grid gap-4 ${first ? 'md:col-span-3' : ''}`}>
              {rest.map((shot) => (
                <figure key={shot.url} className="relative aspect-[4/3] overflow-hidden" style={{ borderRadius: t.radius, background: t.surface }}>
                  <MediaFill media={shot} alt={shot.alt || shot.caption || 'Foto de uso'} sizes="(min-width: 768px) 50vw, 92vw" />
                  {shot.caption && <figcaption className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/90 px-4 py-2.5 text-sm font-semibold backdrop-blur" style={{ color: t.ink }}>{shot.caption}</figcaption>}
                </figure>
              ))}
              {s.tiles.length > 0 && (
                <div className={`grid gap-4 ${s.tiles.length === 3 ? 'sm:grid-cols-3' : s.tiles.length === 2 ? 'sm:grid-cols-2' : ''}`}>
                  {s.tiles.map(({ icon, title, text }) => {
                    const Icon = TILE_ICON[icon] ?? Sparkles;
                    return (
                      <div key={title} className="flex flex-col p-5" style={{ borderRadius: t.radius, background: card, boxShadow: card === '#ffffff' ? '0 10px 28px rgba(30,27,75,0.08)' : undefined }}>
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: t.cta, color: t.ctaText }}>
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <p className="mt-4 text-lg font-semibold leading-snug" style={{ fontFamily: t.heading }}>{title}</p>
                        {text && <p className="mt-1 text-sm leading-relaxed" style={{ color: t.muted }}>{text}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <ShopBlock t={t} kids={kids} products={list} collections={sector.collections ?? []} />

        {s.steps.length > 0 && (
          <div className="mt-16">
            <h3 className="mb-8 text-center text-3xl font-semibold" style={{ fontFamily: t.heading }}>Así de fácil</h3>
            <ol className={`grid gap-4 ${s.steps.length === 3 ? 'md:grid-cols-3' : s.steps.length === 2 ? 'md:grid-cols-2' : ''}`}>
              {s.steps.map((step, i) => (
                <li key={step.title} className="relative p-6" style={{ borderRadius: t.radius, background: card }}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold" style={{ background: t.accent, color: '#fff', fontFamily: t.heading }}>{i + 1}</span>
                  <p className="mt-4 text-xl font-semibold" style={{ fontFamily: t.heading }}>{step.title}</p>
                  {step.text && <p className="mt-1 text-base leading-relaxed" style={{ color: t.muted }}>{step.text}</p>}
                </li>
              ))}
            </ol>
          </div>
        )}

        {s.trust && (
          <ul className="mt-16 grid gap-3 rounded-[28px] p-5 sm:grid-cols-2 lg:grid-cols-4" style={{ background: t.ink, color: '#ffffff' }}>
            {TRUST.map(({ Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3 p-2">
                <Icon className="mt-0.5 h-6 w-6 shrink-0" style={{ color: t.key === 'mascotas' && !kids ? '#FDE68A' : kids || t.key === 'llaveros' ? '#FDBA74' : '#e8d3b0' }} aria-hidden="true" />
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-white/75">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// "Comprelo ya": os produtos do mundo no meio da vitrine (cards no visual do
// mundo, com Anadir/Personalizar). Sem produto ainda: aviso honesto + WhatsApp.
function ShopBlock({ t, kids, products, collections }: { t: SectorTheme; kids: boolean; products: Product[]; collections: SiteCollection[] }) {
  const [wa, setWa] = useState('34678684704');
  useEffect(() => {
    fetch('/api/store-settings').then((r) => (r.ok ? r.json() : null)).then((d) => {
      const digits = String(d?.whatsapp ?? '').replace(/\D/g, '');
      if (digits) setWa(digits);
    }).catch(() => {});
  }, []);
  const shown = products.slice(0, 8);
  const more = collections[0] ? `/coleccion/${collections[0].slug}` : '';

  return (
    <div className="mt-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-2xl" style={{ fontFamily: t.kickerFont, color: t.accent }}>{products.length ? 'listo para pedir' : 'muy pronto'}</p>
          <h3 className="text-3xl font-semibold sm:text-4xl" style={{ fontFamily: t.heading }}>Cómpralo ya</h3>
        </div>
        {products.length > shown.length && more && (
          <Link href={more} className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold" style={{ background: t.cta, color: t.ctaText }}>
            Ver los {products.length}
          </Link>
        )}
      </div>

      {shown.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
          {shown.map((p) =>
            kids ? <KidsProductCard key={p.id} product={p} accent={accentFor(collections[0])} /> : <ThemedProductCard key={p.id} product={p} theme={t} />,
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left" style={{ borderRadius: t.radius, background: kids || t.key === 'llaveros' ? '#ffffff' : t.bg }}>
          <div className="flex-1">
            <p className="text-xl font-semibold" style={{ fontFamily: t.heading }}>Estamos preparando los primeros modelos</p>
            <p className="mt-1 text-base" style={{ color: t.muted }}>¿Quieres uno ya? Escríbenos y te lo hacemos a medida.</p>
          </div>
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent('¡Hola! Me interesa un producto personalizado de Kitoys 3D.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 shrink-0 items-center rounded-full px-6 text-sm font-bold"
            style={{ background: t.cta, color: t.ctaText }}
          >
            Pedir por WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
