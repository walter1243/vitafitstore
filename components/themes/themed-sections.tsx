'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { type Product } from '@/lib/products';
import { type Sector, type SiteCollection } from '@/lib/sectors-shared';
import { CollectionPlayButton } from '@/components/kids/collection-play';
import { HOGAR_CAT_EVENT } from '@/components/kids/menu-panel';
import { ACCENTS } from '@/components/kids/palette';
import { ProductCarousel } from '@/components/kids/product-carousel';
import { NamePersonalizer, NamePreview } from '@/components/personalize/name-personalizer';
import { DEFAULT_PERSONALIZE } from '@/lib/personalize';
import { SECTOR_THEMES, type SectorTheme } from './sector-themes';

// Faixas dos setores com visual proprio (Casa, Chaveiros, Pet). Cada visual
// tem cores/fontes (sector-themes.ts) e um layout de colecao diferente:
//  - hogar:    texto + foto/video lado a lado, produtos em carrossel
//  - llaveros: o personalizador de nome e a estrela da faixa
//  - mascotas: mural de fotos dos pets + personalizador com o nome do pet

function Media({ image, video, alt, priority, sizes, className = '' }: { image?: string; video?: string; alt: string; priority?: boolean; sizes: string; className?: string }) {
  if (video) {
    return (
      <video className={`h-full w-full object-cover ${className}`} src={video} poster={image || undefined} autoPlay muted loop playsInline aria-label={alt} />
    );
  }
  if (!image) return null;
  return <Image src={image} alt={alt} fill priority={priority} sizes={sizes} className={`object-cover ${className}`} />;
}

const THEME_COVER: Record<SectorTheme['key'], string> = {
  hogar: '/images/sectors/hogar.jpg',
  llaveros: '/images/sectors/llaveros.jpg',
  mascotas: '/images/sectors/mascotas.png',
};

const pill = (t: SectorTheme, solid: boolean) => ({
  className: 'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full px-7 text-[15px] font-bold transition-colors duration-200',
  style: solid ? { background: t.cta, color: t.ctaText } : { border: `2px solid ${t.ink}`, color: t.ink },
});

export function ThemedSectorBand({ sector, theme, first, asTitle }: { sector: Sector; theme: SectorTheme; first?: boolean; asTitle?: boolean }) {
  const Heading = asTitle ? 'h1' : 'h2';
  const media = sector.videoUrl || sector.imageUrl;
  const p = pill(theme, false);
  return (
    <section
      id={`setor-${sector.slug}`}
      className={`scroll-mt-24 px-4 sm:px-6 lg:px-8 ${first ? 'pb-16 pt-36 sm:pt-40' : 'py-20 sm:py-24'}`}
      style={{ background: theme.bg, color: theme.ink }}
    >
      <div className={`mx-auto max-w-6xl ${media ? 'grid items-center gap-10 lg:grid-cols-2' : 'text-center'}`}>
        <div>
          <p className="text-2xl sm:text-3xl" style={{ fontFamily: theme.kickerFont, color: theme.accent }}>{theme.kicker}</p>
          <Heading className="mt-1 text-4xl font-semibold sm:text-6xl" style={{ fontFamily: theme.heading }}>{sector.name}</Heading>
          {sector.tagline && <p className={`mt-4 text-lg leading-relaxed sm:text-xl ${media ? '' : 'mx-auto max-w-xl'}`} style={{ color: theme.muted }}>{sector.tagline}</p>}
          {sector.description && <p className={`mt-3 text-base leading-relaxed ${media ? '' : 'mx-auto max-w-xl'}`} style={{ color: theme.muted }}>{sector.description}</p>}
          {!asTitle && (
            <div className={`mt-8 flex ${media ? '' : 'justify-center'}`}>
              <Link href={`/sector/${sector.slug}`} className={p.className} style={p.style}>Ver {sector.name.toLowerCase()}</Link>
            </div>
          )}
        </div>
        {media && (
          <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ borderRadius: theme.radius, background: theme.surface }}>
            <Media image={sector.imageUrl} video={sector.videoUrl} alt={sector.name} sizes="(min-width: 1024px) 50vw, 92vw" />
          </div>
        )}
      </div>
    </section>
  );
}

export function ThemedCollection({ collection, theme, products = [], showCarousel = true, primaryHref, primaryLabel, headingLevel = 'h2', priority, first }: {
  collection: SiteCollection;
  theme: SectorTheme;
  products?: Product[];
  showCarousel?: boolean;
  primaryHref?: string;
  primaryLabel?: string;
  headingLevel?: 'h1' | 'h2';
  priority?: boolean;
  first?: boolean;
}) {
  const Heading = headingLevel;
  const solid = pill(theme, true);
  const custom = products.find((p) => p.personalize?.enabled);
  const href = primaryHref ?? `/coleccion/${collection.slug}`;
  const label = primaryLabel ?? 'Ver colección';
  // Sem foto propria da colecao: a capa do mundo (public/images/sectors), depois a foto do produto.
  const image = collection.photoUrl || collection.imageUrl || THEME_COVER[theme.key] || products[0]?.mainImage || products[0]?.image || '';
  const top = first ? 'pt-36 sm:pt-40' : 'pt-20 sm:pt-24';

  const titleBlock = (center: boolean) => (
    <div className={center ? 'text-center' : ''}>
      <p className="text-2xl" style={{ fontFamily: theme.kickerFont, color: theme.accent }}>{collection.shortName}</p>
      <Heading className="mt-1 text-4xl font-semibold sm:text-5xl" style={{ fontFamily: theme.heading, color: theme.ink }}>{collection.name}</Heading>
      {collection.tagline && <p className={`mt-4 text-lg leading-relaxed ${center ? 'mx-auto max-w-xl' : ''}`} style={{ color: theme.muted }}>{collection.tagline}</p>}
    </div>
  );

  const carousel = showCarousel && products.length > 0 && (
    <div className="mx-auto mt-14 max-w-6xl">
      <div className="mb-6 flex items-end justify-between gap-4 pb-4" style={{ borderBottom: `1px solid ${theme.ink}22` }}>
        <h3 className="text-2xl font-semibold" style={{ fontFamily: theme.heading, color: theme.ink }}>
          {theme.key === 'llaveros' ? 'Todos los modelos' : theme.key === 'mascotas' ? 'Para tu peludo' : 'Elige el tuyo'}
        </h3>
        <Link href={`/coleccion/${collection.slug}`} className="text-sm font-bold underline underline-offset-4" style={{ color: theme.ink, textDecorationColor: `${theme.ink}55` }}>
          {products.length} {products.length === 1 ? 'producto' : 'productos'}
        </Link>
      </div>
      <ProductCarousel products={products} accent={ACCENTS.mint} theme={theme} />
    </div>
  );

  // ── Chaveiros: o personalizador e a estrela ────────────────────────────
  if (theme.key === 'llaveros') {
    return (
      <section className={`px-4 pb-20 sm:px-6 lg:px-8 ${top}`} style={{ background: `linear-gradient(180deg, ${theme.bgAlt} 0%, #ffffff 100%)` }}>
        <div className="mx-auto max-w-6xl">
          {titleBlock(true)}
          <div className="mx-auto mt-10 max-w-5xl bg-white p-5 sm:p-8" style={{ borderRadius: '36px', boxShadow: '0 24px 60px rgba(79,70,229,0.16)' }}>
            {custom ? (
              <>
                <p className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: theme.accent }}>
                  <PenLine className="h-4 w-4" aria-hidden="true" /> Escribe el nombre y míralo en el llavero
                </p>
                <NamePersonalizer product={custom} look="llaveros" />
              </>
            ) : image || collection.videoUrl ? (
              <div className="relative aspect-[16/9] overflow-hidden rounded-[28px]" style={{ background: theme.bgAlt }}>
                <Media image={image} video={collection.videoUrl} alt={collection.name} priority={priority} sizes="(min-width: 1024px) 64rem, 92vw" />
              </div>
            ) : (
              // Ainda sem produto: o modelo de exemplo, pra faixa nao ficar vazia.
              <div className="mx-auto max-w-sm text-center">
                <NamePreview cfg={{ ...DEFAULT_PERSONALIZE, enabled: true }} text="" placeholder="Lucía" swingKey={0} stage={`linear-gradient(160deg, ${theme.bgAlt}, #FFE7D6)`} />
                <p className="mt-4 text-base font-semibold" style={{ color: theme.muted }}>Muy pronto: elige tu llavero y escribe el nombre.</p>
              </div>
            )}
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Link href={href} className={solid.className} style={solid.style}>{label}</Link>
          </div>
          {carousel}
        </div>
      </section>
    );
  }

  // ── Mascotas: mural de fotos ───────────────────────────────────────────
  if (theme.key === 'mascotas') {
    const photos = [image, ...products.map((p) => p.mainImage ?? p.image)].filter(Boolean).slice(0, 5) as string[];
    // Ainda sem fotos nem produto: placa de exemplo com o nome, centralizada.
    if (photos.length === 0 && !collection.videoUrl) {
      return (
        <section className={`px-4 pb-20 sm:px-6 lg:px-8 ${top}`} style={{ background: theme.bgAlt }}>
          <div className="mx-auto max-w-6xl">
            {titleBlock(true)}
            <div className="mx-auto mt-10 max-w-sm text-center">
              <NamePreview cfg={{ ...DEFAULT_PERSONALIZE, enabled: true, shape: 'chapa', color: '#78350F' }} text="" placeholder="Toby" swingKey={0} stage={theme.surface} />
              <p className="mt-4 text-base font-semibold" style={{ color: theme.muted }}>Muy pronto: la placa de tu mascota con su nombre.</p>
            </div>
            <div className="mt-8 flex justify-center">
              <Link href={href} className={solid.className} style={solid.style}>{label}</Link>
            </div>
          </div>
        </section>
      );
    }
    return (
      <section className={`px-4 pb-20 sm:px-6 lg:px-8 ${top}`} style={{ background: theme.bgAlt }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-4 sm:grid-rows-2" style={{ minHeight: 420 }}>
            <div className="relative overflow-hidden sm:col-span-2 sm:row-span-2" style={{ borderRadius: theme.radius, background: theme.surface, minHeight: 300 }}>
              <Media image={photos[0]} video={collection.videoUrl} alt={collection.name} priority={priority} sizes="(min-width: 640px) 50vw, 92vw" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2a1002]/85 to-transparent p-6 pt-20 text-white">
                <p className="text-2xl text-[#FDE68A]" style={{ fontFamily: theme.kickerFont }}>{collection.shortName}</p>
                <Heading className="text-3xl font-semibold sm:text-4xl" style={{ fontFamily: theme.heading }}>{collection.name}</Heading>
                {collection.tagline && <p className="mt-1 text-base text-white/90">{collection.tagline}</p>}
              </div>
            </div>
            {photos.slice(1, 5).map((src) => (
              <div key={src} className="relative hidden overflow-hidden sm:block" style={{ borderRadius: theme.radius, background: theme.surface }}>
                <Image src={src} alt="" fill sizes="25vw" className="object-cover transition-transform duration-700 hover:scale-105 motion-reduce:transition-none" />
              </div>
            ))}
          </div>

          {custom && (
            <div className="mx-auto mt-10 max-w-5xl p-5 sm:p-8" style={{ borderRadius: '36px', background: theme.bg }}>
              <p className="mb-5 text-2xl" style={{ fontFamily: theme.kickerFont, color: theme.accent }}>escribe el nombre de tu mascota</p>
              <NamePersonalizer product={custom} look="mascotas" />
            </div>
          )}
          <div className="mt-8 flex justify-center">
            <Link href={href} className={solid.className} style={solid.style}>{label}</Link>
          </div>
          {carousel}
        </div>
      </section>
    );
  }

  // ── Casa: texto + foto/video lado a lado ───────────────────────────────
  const line = pill(theme, false);
  return (
    <section className={`px-4 pb-20 sm:px-6 lg:px-8 ${top}`} style={{ background: theme.bgAlt }}>
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 text-center lg:order-1 lg:text-left">
          {titleBlock(false)}
          {collection.description && <p className="mt-3 text-base leading-relaxed" style={{ color: theme.muted }}>{collection.description}</p>}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
            <Link href={href} className={solid.className} style={solid.style}>{label}</Link>
            {collection.interactive !== 'none' && collection.interactive !== 'nombre' && <CollectionPlayButton slug={collection.slug} appearance="pill" />}
            {custom && <Link href={`/producto/${custom.id}-${custom.slug}`} className={line.className} style={line.style}>Personalizar</Link>}
          </div>
        </div>
        {(image || collection.videoUrl) && (
          <div className="relative order-1 aspect-[4/5] w-full overflow-hidden lg:order-2" style={{ borderRadius: '32px', background: theme.surface }}>
            <Media image={image} video={collection.videoUrl} alt={collection.name} priority={priority} sizes="(min-width: 1024px) 50vw, 92vw" />
          </div>
        )}
      </div>
      {carousel}
    </section>
  );
}

// Produtos sem colecao nenhuma: vitrine pros pais no visual Casa, com abas
// por categoria (o menu abre ja filtrado).
export function ThemedExtras({ products }: { products: Product[] }) {
  const theme = SECTOR_THEMES.hogar;
  const cats = [...new Set(products.map((p) => p.categoryLabel).filter(Boolean))] as string[];
  const [cat, setCat] = useState('todo');
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('cat');
    if (fromUrl) setCat(fromUrl);
    const onPick = (e: Event) => setCat(String((e as CustomEvent).detail ?? 'todo'));
    window.addEventListener(HOGAR_CAT_EVENT, onPick);
    return () => window.removeEventListener(HOGAR_CAT_EVENT, onPick);
  }, []);
  const known = cats.includes(cat);
  const visible = cat === 'todo' || !known ? products : products.filter((p) => p.categoryLabel === cat);
  const tab = (active: boolean) => ({
    className: 'min-h-11 cursor-pointer rounded-full px-5 text-sm font-semibold transition-colors duration-200',
    style: active ? { background: theme.ink, color: '#fff' } : { border: `1px solid ${theme.ink}40`, color: theme.ink },
  });

  return (
    <section id="productos" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24 lg:px-8" style={{ background: theme.bg }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="text-3xl sm:text-4xl" style={{ fontFamily: theme.kickerFont, color: theme.accent }}>para papás y mamás</p>
          <h2 className="mt-1 text-4xl font-semibold sm:text-5xl" style={{ fontFamily: theme.heading, color: theme.ink }}>Más para tu casa</h2>
        </div>
        {cats.length > 1 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Categorías">
            <button type="button" role="tab" aria-selected={cat === 'todo' || !known} onClick={() => setCat('todo')} {...tab(cat === 'todo' || !known)}>Todo</button>
            {cats.map((c) => (
              <button key={c} type="button" role="tab" aria-selected={cat === c} onClick={() => setCat(c)} {...tab(cat === c)}>{c}</button>
            ))}
          </div>
        )}
        <ProductCarousel key={cat} products={visible} accent={ACCENTS.mint} theme={theme} />
      </div>
    </section>
  );
}
