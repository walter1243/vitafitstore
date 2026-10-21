'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { type Product } from '@/lib/products';
import { type Sector, type SiteCollection } from '@/lib/sectors-shared';
import { HOGAR_CAT_EVENT } from '@/components/kids/menu-panel';
import { ACCENTS } from '@/components/kids/palette';
import { ProductCarousel } from '@/components/kids/product-carousel';
import { NamePersonalizer } from '@/components/personalize/name-personalizer';
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

// Colecao dos mundos Casa / Chaveiros / Pet — cara de LOJA: cabecalho
// compacto (nome, frase, botao) e os produtos logo embaixo. Sem foto grande
// de ambiente. Nos personalizaveis, o personalizador de nome fica no topo
// (e o que vende).
export function ThemedCollection({ collection, theme, products = [], showCarousel = true, primaryHref, primaryLabel, headingLevel = 'h2', first }: {
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
  const href = primaryHref ?? `/coleccion/${collection.slug}`;
  const label = primaryLabel ?? `Ver ${products.length ? `los ${products.length}` : 'colección'}`;

  return (
    <section className={`px-4 sm:px-6 lg:px-8 ${first ? 'pb-10 pt-32 sm:pt-36' : 'py-12 sm:py-16'}`} style={{ background: theme.bgAlt }}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-6" style={{ borderBottom: `1px solid ${theme.ink}1a` }}>
          <div>
            {collection.shortName.trim().toLowerCase() !== collection.name.trim().toLowerCase() && (
              <p className="text-xl" style={{ fontFamily: theme.kickerFont, color: theme.accent }}>{collection.shortName}</p>
            )}
            <Heading className="text-3xl font-semibold sm:text-4xl" style={{ fontFamily: theme.heading, color: theme.ink }}>{collection.name}</Heading>
            {collection.tagline && <p className="mt-1 text-base" style={{ color: theme.muted }}>{collection.tagline}</p>}
          </div>
          {!first && products.length > 0 && (
            <Link href={href} className={solid.className} style={solid.style}>{label}</Link>
          )}
        </div>


        {showCarousel && (
          products.length > 0 ? (
            <div className="mt-8">
              <ProductCarousel products={products} accent={ACCENTS.mint} theme={theme} />
            </div>
          ) : (
            <p className="mt-8 rounded-2xl px-5 py-6 text-center text-base" style={{ background: theme.bg, color: theme.muted }}>
              Muy pronto habrá productos en esta colección.
            </p>
          )
        )}
      </div>
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
    className: 'min-h-10 cursor-pointer whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors duration-200',
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
          <div className="swipe-row mb-8 py-1 sm:justify-center" role="tablist" aria-label="Categorías">
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
