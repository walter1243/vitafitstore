'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { type Product } from '@/lib/products';
import { CollectionPlayButton } from './collection-play';
import { ProductCarousel } from './product-carousel';
import { accentFor, dots } from './palette';
import { PILL } from './pill';
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
export function CollectionSpotlight({ slug, count, products, primaryHref, primaryLabel, headingLevel = 'h2', priority, first }: {
  slug: string;
  count?: number;
  // Produtos da colecao (Admin → Produtos, pela categoria): cartao embaixo
  // da brincadeira, pra ir direto da brincadeira pra compra.
  products?: Product[];
  primaryHref?: string;
  primaryLabel?: string;
  headingLevel?: 'h1' | 'h2';
  priority?: boolean;
  // Primeira secao da pagina: espaco extra pro cabecalho fixo.
  first?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const { getCollection, getSector } = useSectors();
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
  const Heading = headingLevel;
  const dark = collection.theme === 'dark';
  const photo = dark ? collection.photoUrl : '';
  const art = !photo ? collection.imageUrl : '';
  const sector = getSector(collection.sectorId);
  // Claro: da cor da colecao (Admin) ate o tom do acento — sem terminar em branco.
  const background = dark ? collection.bgColor : `linear-gradient(180deg, ${collection.bgColor} 0%, ${lighten(collection.bgColor, 0.15)} 45%, ${accentFor(collection).tint} 100%)`;

  return (
    <section
      ref={ref}
      className={`relative flex min-h-[88vh] w-full flex-col items-center justify-center overflow-hidden px-4 pb-16 text-center sm:pb-20 ${first ? 'pt-36 sm:pt-40' : 'pt-20 sm:pt-24'}`}
      style={{ background }}
    >
      {photo && (
        <>
          <Image src={photo} alt="" fill priority={priority} sizes="100vw" className="object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,8,15,0.88) 0%, rgba(7,8,15,0.55) 38%, rgba(7,8,15,0.15) 70%, rgba(7,8,15,0.55) 100%)' }} />
        </>
      )}

      <div data-reveal className="relative z-10 flex flex-col items-center">
        <Heading className={`text-5xl font-bold sm:text-6xl md:text-7xl ${dark ? 'text-white' : 'text-[#23263f]'}`}>
          {collection.name}
        </Heading>
        {(collection.tagline || count) ? (
          <p className={`mt-3 text-lg sm:text-xl ${dark ? 'text-white/85' : 'text-[#565a78]'}`}>
            {collection.tagline}
            {count ? `${collection.tagline ? ' · ' : ''}${count} ${count === 1 ? 'producto' : 'productos'}` : ''}
          </p>
        ) : null}
        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href={primaryHref ?? `/coleccion/${collection.slug}`}
            className={`${PILL} ${dark ? 'bg-white text-[#23263f] hover:bg-white/90' : 'bg-[#23263f] text-white hover:bg-[#363a5c]'}`}
          >
            {primaryLabel ?? `Ver ${collection.shortName.toLowerCase()}`}
          </Link>
          {collection.interactive !== 'none' ? (
            <CollectionPlayButton slug={collection.slug} appearance={dark ? 'pill-dark' : 'pill'} />
          ) : sector ? (
            <Link
              href={`/sector/${sector.slug}`}
              className={`${PILL} border-2 ${dark ? 'border-white text-white hover:bg-white/10' : 'border-[#23263f] text-[#23263f] hover:bg-[#23263f]/5'}`}
            >
              Ver todo {sector.name.toLowerCase()}
            </Link>
          ) : null}
        </div>
      </div>

      {art && (
        <div data-reveal className="relative z-10 mt-10 w-full max-w-3xl sm:mt-12">
          <div className="relative mx-auto w-full max-w-[560px]" style={{ aspectRatio: ratio }}>
            <Image
              src={art}
              alt={collection.name}
              fill
              priority={priority}
              sizes="(min-width: 768px) 560px, 92vw"
              className="object-contain"
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) setRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
              }}
            />
            {collection.interactive === 'colorear' && <span className="paint-reveal" aria-hidden="true" />}
          </div>
        </div>
      )}

      {products && products.length > 0 && (() => {
        const accent = accentFor(collection);
        const few = products.length < SHELF_COUNT;
        return (
          <div
            data-reveal
            className="relative z-10 mt-12 w-full max-w-6xl overflow-hidden rounded-[36px] border-[3px] border-[#1E1B4B] p-5 text-left sm:mt-14 sm:p-8"
            style={{ background: accent.block, boxShadow: `8px 8px 0 #1E1B4B` }}
          >
            {/* confete de fundo */}
            <div className="pointer-events-none absolute inset-0 opacity-60" style={dots(accent.dot)} aria-hidden="true" />
            <div className="relative">
              <div className={`mb-7 flex gap-3 ${few ? 'flex-col items-center text-center' : 'flex-wrap items-end justify-between'}`}>
                <div className={few ? 'flex flex-col items-center' : ''}>
                  <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#1E1B4B] bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#1E1B4B]">
                    <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" /> {collection.shortName}
                  </span>
                  <h3 className="mt-3 text-3xl font-bold text-[#1E1B4B] sm:text-4xl">¡Llévatelo a casa!</h3>
                  <p className="mt-1 text-sm font-semibold text-[#1E1B4B]/80 sm:text-base">
                    {products.length} {products.length === 1 ? 'producto' : 'productos'} · impresos en 3D en nuestro taller
                  </p>
                </div>
                {products.length > SHELF_COUNT && (
                  <Link
                    href={`/coleccion/${collection.slug}`}
                    className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-[3px] border-[#1E1B4B] bg-white px-5 text-sm font-extrabold text-[#1E1B4B] transition-colors duration-200 hover:bg-[#1E1B4B] hover:text-white"
                  >
                    Ver los {products.length}
                  </Link>
                )}
              </div>
              <ProductCarousel products={products} accent={accent} />
            </div>
          </div>
        );
      })()}
    </section>
  );
}
