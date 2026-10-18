'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getCollection } from '@/lib/collections';
import { CollectionPlayButton, PILL } from './collection-play';

gsap.registerPlugin(ScrollTrigger);

// Cenario de cada colecao no destaque. Claro/escuro alternam com corte seco
// (padrao .claude/skills/apple-style-showcase): rompecabezas claro,
// lampadas escuro (a luminaria brilha no escuro), pintar claro.
const SCENES: Record<string, { dark: boolean; background: string; photo?: string; art?: string; artRatio?: string }> = {
  rompecabezas: { dark: false, background: 'linear-gradient(180deg, #EAF2FF 0%, #F7FAFF 100%)', art: '/images/rompecabezas-completo.png', artRatio: '473 / 303' },
  lamparas: { dark: true, background: '#07080f', photo: '/images/lampara-cohete-habitacion.jpg' },
  'para-pintar': { dark: false, background: 'linear-gradient(180deg, #FFF1DF 0%, #FFF9F1 100%)', art: '/images/juguetes-para-pintar.png', artRatio: '1 / 1' },
};

// Destaque estilo Apple de UMA colecao: secao de tela cheia, titulo enorme,
// uma linha de texto e exatamente duas pilulas do mesmo tamanho — ver a
// colecao (cheia) e a brincadeira dela (contornada). Sem setas, sem cards.
export function CollectionSpotlight({ slug, count, primaryHref, primaryLabel, headingLevel = 'h2', priority, first }: {
  slug: string;
  count?: number;
  primaryHref?: string;
  primaryLabel?: string;
  headingLevel?: 'h1' | 'h2';
  priority?: boolean;
  // Primeira secao da pagina: espaco extra pro cabecalho fixo.
  first?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const collection = getCollection(slug);
  const scene = SCENES[slug];

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

  if (!collection || !scene) return null;
  const Heading = headingLevel;
  const dark = scene.dark;

  return (
    <section
      ref={ref}
      className={`relative flex min-h-[88vh] w-full flex-col items-center justify-center overflow-hidden px-4 pb-16 text-center sm:pb-20 ${first ? 'pt-36 sm:pt-40' : 'pt-20 sm:pt-24'}`}
      style={{ background: scene.background }}
    >
      {scene.photo && (
        <>
          <Image src={scene.photo} alt="" fill priority={priority} sizes="100vw" className="object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,8,15,0.88) 0%, rgba(7,8,15,0.55) 38%, rgba(7,8,15,0.15) 70%, rgba(7,8,15,0.55) 100%)' }} />
        </>
      )}

      <div data-reveal className="relative z-10 flex flex-col items-center">
        <Heading className={`text-5xl font-bold sm:text-6xl md:text-7xl ${dark ? 'text-white' : 'text-[#23263f]'}`}>
          {collection.name}
        </Heading>
        <p className={`mt-3 text-lg sm:text-xl ${dark ? 'text-white/85' : 'text-[#565a78]'}`}>
          {collection.tagline}
          {count ? ` · ${count} ${count === 1 ? 'producto' : 'productos'}` : ''}
        </p>
        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href={primaryHref ?? `/coleccion/${collection.slug}`}
            className={`${PILL} ${dark ? 'bg-white text-[#23263f] hover:bg-white/90' : 'bg-[#23263f] text-white hover:bg-[#363a5c]'}`}
          >
            {primaryLabel ?? `Ver ${collection.shortName.toLowerCase()}`}
          </Link>
          <CollectionPlayButton slug={collection.slug} appearance={dark ? 'pill-dark' : 'pill'} />
        </div>
      </div>

      {scene.art && (
        <div data-reveal className="relative z-10 mt-10 w-full max-w-3xl sm:mt-12">
          <div className="relative mx-auto w-full max-w-[560px]" style={{ aspectRatio: scene.artRatio }}>
            <Image src={scene.art} alt={collection.name} fill priority={priority} sizes="(min-width: 768px) 560px, 92vw" className="object-contain" />
            {collection.interactive === 'colorear' && <span className="paint-reveal" aria-hidden="true" />}
          </div>
        </div>
      )}
    </section>
  );
}
