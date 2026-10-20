'use client';
import { useMemo } from 'react';
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
  // Produtos do mundo (todas as colecoes dele), pra vender junto das fotos.
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
  const surface = kids || t.key === 'llaveros' ? '#ffffff' : t.bg;
  const collections = sector.collections ?? [];
  // Beneficios que sobram (mais blocos do que fotos) viram selos.
  const extraTiles = s.tiles.slice(s.shots.length);

  return (
    <div style={{ background: t.bgAlt, color: t.ink }}>
      {/* Abertura */}
      <section className="relative overflow-hidden px-4 pb-8 pt-24 sm:px-6 sm:pt-32 lg:px-8">
        <Decor t={t} kids={kids} />
        <div className="relative mx-auto max-w-3xl text-center">
          {s.kicker && <p className="text-2xl sm:text-3xl" style={{ fontFamily: t.kickerFont, color: t.accent }}>{s.kicker}</p>}
          {s.title && <h2 className="mt-2 text-4xl font-semibold leading-tight sm:text-6xl" style={{ fontFamily: t.heading }}>{s.title}</h2>}
          {s.intro && <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl" style={{ color: t.muted }}>{s.intro}</p>}
        </div>
      </section>

      {/* Uma foto/video por vez, alternando os lados, com o texto dela e o produto */}
      {s.shots.map((shot, i) => {
        const tile = s.tiles[i];
        const Icon = tile ? TILE_ICON[tile.icon] ?? Sparkles : Sparkles;
        const product = list[i];
        const flip = i % 2 === 1;
        return (
          <section key={shot.url + i} className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-12 lg:gap-16">
              <div className={`relative lg:col-span-7 ${flip ? 'lg:order-2' : ''}`}>
                {/* forma de fundo deslocada (profundidade) */}
                <span
                  className={`absolute -bottom-5 ${flip ? '-left-5' : '-right-5'} h-[85%] w-[85%]`}
                  style={{ borderRadius: t.radius, background: kids ? '#FFD84D' : t.surface, opacity: kids ? 1 : 0.9 }}
                  aria-hidden="true"
                />
                <figure className="relative aspect-[5/4] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.12)]" style={{ borderRadius: t.radius, background: t.surface }}>
                  <MediaFill media={shot} alt={shot.alt || shot.caption || 'Foto de uso'} sizes="(min-width: 1024px) 58vw, 92vw" priority={i === 0} />
                </figure>
                {/* produto de verdade "pendurado" na foto */}
                {product && <FloatingProduct product={product} t={t} side={flip ? 'right' : 'left'} />}
              </div>

              <div className={`lg:col-span-5 ${flip ? 'lg:order-1' : ''}`}>
                <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: t.accent }}>{String(i + 1).padStart(2, '0')}</p>
                {tile ? (
                  <>
                    <span className="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: t.cta, color: t.ctaText }}>
                      <Icon className="h-7 w-7" aria-hidden="true" />
                    </span>
                    <h3 className="mt-6 text-3xl font-semibold leading-tight sm:text-4xl" style={{ fontFamily: t.heading }}>{tile.title}</h3>
                    {tile.text && <p className="mt-4 text-lg leading-relaxed" style={{ color: t.muted }}>{tile.text}</p>}
                    {shot.caption && <p className="mt-5 text-xl" style={{ fontFamily: t.kickerFont, color: t.accent }}>{shot.caption}</p>}
                  </>
                ) : (
                  shot.caption && <h3 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl" style={{ fontFamily: t.heading }}>{shot.caption}</h3>
                )}
                {product && (
                  <Link
                    href={`/producto/${product.id}-${product.slug}`}
                    className="mt-8 inline-flex min-h-12 items-center rounded-full px-7 text-[15px] font-bold transition-opacity hover:opacity-90"
                    style={{ background: t.cta, color: t.ctaText }}
                  >
                    {product.personalize?.enabled ? 'Personalizar el mío' : 'Lo quiero'}
                  </Link>
                )}
              </div>
            </div>
          </section>
        );
      })}

      {extraTiles.length > 0 && (
        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <ul className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-3">
            {extraTiles.map(({ icon, title, text }) => {
              const Icon = TILE_ICON[icon] ?? Sparkles;
              return (
                <li key={title} className="p-7" style={{ borderRadius: t.radius, background: surface }}>
                  <Icon className="h-8 w-8" style={{ color: t.accent }} aria-hidden="true" />
                  <p className="mt-4 text-xl font-semibold" style={{ fontFamily: t.heading }}>{title}</p>
                  {text && <p className="mt-2 text-base leading-relaxed" style={{ color: t.muted }}>{text}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Comprar: so quando o mundo ja tem produto */}
      {list.length > 0 && <ShopBlock t={t} kids={kids} products={list} collections={collections} />}

      {s.steps.length > 0 && (
        <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h3 className="mb-14 text-center text-3xl font-semibold sm:text-4xl" style={{ fontFamily: t.heading }}>Así de fácil</h3>
            <ol className={`relative grid gap-10 ${s.steps.length === 3 ? 'md:grid-cols-3' : s.steps.length === 2 ? 'md:grid-cols-2' : ''}`}>
              {/* linha ligando os passos */}
              {s.steps.length > 1 && (
                <span className="absolute left-[16%] right-[16%] top-8 hidden border-t-2 border-dashed md:block" style={{ borderColor: `${t.accent}55` }} aria-hidden="true" />
              )}
              {s.steps.map((step, i) => (
                <li key={step.title} className="relative text-center">
                  <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold shadow-[0_10px_24px_rgba(0,0,0,0.12)]" style={{ background: t.accent, color: '#fff', fontFamily: t.heading }}>{i + 1}</span>
                  <p className="mt-6 text-2xl font-semibold" style={{ fontFamily: t.heading }}>{step.title}</p>
                  {step.text && <p className="mx-auto mt-2 max-w-xs text-base leading-relaxed" style={{ color: t.muted }}>{step.text}</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {s.trust && (
        <section className="px-4 pb-24 pt-4 sm:px-6 lg:px-8">
          <ul className="mx-auto grid max-w-6xl gap-6 rounded-[32px] p-8 sm:grid-cols-2 lg:grid-cols-4" style={{ background: t.ink, color: '#ffffff' }}>
            {TRUST.map(({ Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-7 w-7 shrink-0" style={{ color: t.key === 'mascotas' && !kids ? '#FDE68A' : kids || t.key === 'llaveros' ? '#FDBA74' : '#e8d3b0' }} aria-hidden="true" />
                <span>
                  <span className="block text-base font-semibold">{title}</span>
                  <span className="block text-sm text-white/75">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// Card pequeno de um produto real em cima da foto (liga a imagem a compra).
function FloatingProduct({ product, t, side }: { product: Product; t: SectorTheme; side: 'left' | 'right' }) {
  return (
    <Link
      href={`/producto/${product.id}-${product.slug}`}
      className={`absolute -bottom-8 ${side === 'left' ? 'left-4 sm:-left-6' : 'right-4 sm:-right-6'} flex w-[250px] items-center gap-3 bg-white p-3 shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition-transform duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0`}
      style={{ borderRadius: '20px' }}
    >
      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl" style={{ background: t.surface }}>
        <Image src={product.mainImage ?? product.image} alt="" fill sizes="64px" className="object-cover" />
      </span>
      <span className="min-w-0">
        <span className="line-clamp-2 block text-sm font-semibold leading-snug" style={{ color: t.ink, fontFamily: t.heading }}>{product.name}</span>
        <span className="mt-0.5 block text-base font-bold" style={{ color: t.accent }}>{product.price.toFixed(2)}€</span>
      </span>
    </Link>
  );
}

// "Compralo ya": os produtos do mundo numa faixa propria, com espaco.
function ShopBlock({ t, kids, products, collections }: { t: SectorTheme; kids: boolean; products: Product[]; collections: SiteCollection[] }) {
  const shown = products.slice(0, 8);
  const more = collections[0] ? `/coleccion/${collections[0].slug}` : '';
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8" style={{ background: kids ? '#FFE7A8' : t.bg }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-2xl" style={{ fontFamily: t.kickerFont, color: t.accent }}>listo para pedir</p>
            <h3 className="mt-1 text-4xl font-semibold sm:text-5xl" style={{ fontFamily: t.heading }}>Cómpralo ya</h3>
          </div>
          {products.length > shown.length && more && (
            <Link href={more} className="inline-flex min-h-12 items-center rounded-full px-6 text-sm font-bold" style={{ background: t.cta, color: t.ctaText }}>
              Ver los {products.length}
            </Link>
          )}
        </div>
        <div className={`grid gap-x-6 gap-y-10 ${shown.length === 1 ? 'mx-auto max-w-xs' : shown.length === 2 ? 'mx-auto max-w-2xl grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
          {shown.map((p) =>
            kids ? <KidsProductCard key={p.id} product={p} accent={accentFor(collections[0])} /> : <ThemedProductCard key={p.id} product={p} theme={t} />,
          )}
        </div>
      </div>
    </section>
  );
}
