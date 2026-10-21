'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { type Product } from '@/lib/products';
import { ProductCarousel } from './product-carousel';
import { ThemedCollection } from '@/components/themes/themed-sections';
import { themeFor } from '@/components/themes/sector-themes';
import { toStoreProduct } from '@/lib/store-product';
import { useStoreProducts } from './use-store-products';
import { accentFor } from './palette';
import { useSectors } from './sectors-context';

gsap.registerPlugin(ScrollTrigger);

// A partir de quantos produtos aparece o atalho "Ver los N".
const SHELF_COUNT = 4;

// Clareia uma cor (#RRGGBB) misturando com branco — fim do degrade claro.
function lighten(hex: string, amount = 0.6) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

// Destaque estilo Apple de UMA colecao (.claude/skills/apple-style-showcase):
// secao de tela cheia, titulo enorme, uma linha e duas pilulas do mesmo
// tamanho — ver a colecao (cheia) e a brincadeira dela (contornada), ou o
// setor quando a colecao nao tem brincadeira. Tema, cor, imagem e foto vem
// do Admin → Setores e coleções.
export function CollectionSpotlight({ slug, count, products, hideProducts, primaryHref, primaryLabel, headingLevel = 'h2', priority, first }: {
  slug: string;
  count?: number;
  // Produtos da colecao (Admin → Produtos, pela categoria): cartao embaixo
  // da brincadeira, pra ir direto da brincadeira pra compra.
  products?: Product[];
  // Pagina da colecao: os produtos ja aparecem embaixo (catalogo).
  hideProducts?: boolean;
  primaryHref?: string;
  primaryLabel?: string;
  headingLevel?: 'h1' | 'h2';
  priority?: boolean;
  // Primeira secao da pagina: espaco extra pro cabecalho fixo.
  first?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const { getCollection, getSector, collectionForProduct } = useSectors();
  const { products: allProducts } = useStoreProducts();
  const collection = getCollection(slug);
  const [ratio, setRatio] = useState('4 / 3');

  // Uma unica animacao: o conteudo aparece subindo, uma vez, ao rolar.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const content = el.querySelectorAll('[data-reveal]');
      gsap.set(content, { opacity: 0, y: 40 });
      ScrollTrigger.create({
        trigger: el,
        start: 'top 75%',
        once: true,
        onEnter: () => gsap.to(content, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }),
      });
    });
    return () => mm.revert();
  }, []);

  if (!collection) return null;
  // Setor com visual Casa / Hogar: layout editorial em vez do destaque infantil.
  // Sem lista vinda da home (pagina do setor/colecao): pega os produtos dela.
  const list = products ?? allProducts.filter((p) => collectionForProduct(p)?.slug === slug).map(toStoreProduct);
  // Setor com visual proprio (Casa, Chaveiros, Pet): layout do tema.
  const theme = themeFor(getSector(collection.sectorId)?.style);
  if (theme) {
    return <ThemedCollection collection={collection} theme={theme} products={list} showCarousel={!hideProducts} primaryHref={primaryHref} primaryLabel={primaryLabel} headingLevel={headingLevel} priority={priority} first={first} />;
  }
  const Heading = headingLevel;
  const accent = accentFor(collection);
  // Infantil com cara de loja: cabecalho compacto e os produtos logo embaixo.
  // As brincadeiras (montar, pintar, acender) ficam na pagina de cada produto.
  return (
    <section ref={ref} className={`px-4 sm:px-6 lg:px-8 ${first ? 'pb-10 pt-32 sm:pt-36' : 'py-12 sm:py-16'}`} style={{ background: accent.tint }}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-6" style={{ borderBottom: '2px solid #1E1B4B1a' }}>
          <div>
            <Heading className="text-3xl font-bold text-[#1E1B4B] sm:text-4xl">{collection.name}</Heading>
            {collection.tagline && <p className="mt-1 text-base text-[#3F3D6B]">{collection.tagline}</p>}
          </div>
          {!first && list.length > 0 && (
            <Link href={primaryHref ?? `/coleccion/${collection.slug}`} className="inline-flex min-h-11 items-center rounded-full bg-[#1E1B4B] px-5 text-sm font-extrabold text-white transition-colors hover:bg-[#363a5c]">
              Ver los {list.length}
            </Link>
          )}
        </div>
        {!hideProducts && (
          list.length > 0 ? (
            <div className="mt-8"><ProductCarousel products={list} accent={accent} /></div>
          ) : (
            <p className="mt-8 rounded-2xl bg-white/70 px-5 py-6 text-center text-base text-[#3F3D6B]">Muy pronto habrá productos en esta colección.</p>
          )
        )}
      </div>
    </section>
  );
}
