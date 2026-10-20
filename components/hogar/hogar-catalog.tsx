'use client';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { BookOpen, Check, Plus, Printer, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { type Product } from '@/lib/products';
import { slugify } from '@/lib/sectors-shared';
import { toStoreProduct } from '@/lib/store-product';
import { HomeProductCard } from '@/components/kids/home-product-card';
import { HOGAR_CAT_EVENT } from '@/components/kids/menu-panel';
import { useSectors } from '@/components/kids/sectors-context';
import { useStoreProducts } from '@/components/kids/use-store-products';

// Catalogo Hogar como um LIVRO (ui-ux-pro-max: "Editorial Grid / Magazine",
// Playfair Display + Inter, paleta areia/creme). A capa traz o indice; cada
// categoria de casa e uma "pagina" numerada com layout proprio. Abrir uma
// colecao vira a pagina pra frente; voltar (botao ou "atras" do navegador)
// vira pra tras. O endereco acompanha (#cap-slug), entao links do menu e da
// home abrem direto na pagina certa.

type Chapter = { slug: string; name: string; products: Product[] };

const PAGE_BG = ['#fbf8f3', '#f1e9de', '#e9e2d6', '#f6f1ea'];
const LAYOUTS = ['spread', 'mosaic', 'gallery'] as const;
const COVER = '';

const fmt = (n: number) => String(n).padStart(2, '0');
const viewFromHash = () => (typeof window !== 'undefined' && window.location.hash.startsWith('#cap-') ? decodeURIComponent(window.location.hash.slice(5)) : COVER);

export function HogarCatalog() {
  const { products, loaded } = useStoreProducts();
  const { sectors, collectionForCategory } = useSectors();
  const bookRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<string>(COVER);
  const pending = useRef<'fwd' | 'back' | null>(null);
  const busy = useRef(false);

  const chapters = useMemo<Chapter[]>(() => {
    const hogarSectorIds = new Set(sectors.filter((s) => s.style === 'hogar').map((s) => s.id));
    const map = new Map<string, Chapter>();
    for (const raw of products) {
      const col = collectionForCategory(raw.category);
      if (col && !hogarSectorIds.has(col.sectorId)) continue; // infantil
      const name = col?.name || raw.category?.trim() || 'Hogar';
      const slug = slugify(name) || 'hogar';
      if (!map.has(slug)) map.set(slug, { slug, name, products: [] });
      map.get(slug)!.products.push(toStoreProduct(raw));
    }
    return [...map.values()];
  }, [products, sectors, collectionForCategory]);

  const order = useCallback((v: string) => (v === COVER ? -1 : chapters.findIndex((c) => c.slug === v)), [chapters]);
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Vira a pagina: a atual gira presa na lombada e sai; a nova entra.
  const turnTo = useCallback((target: string, push = true) => {
    if (busy.current || target === view) return;
    if (target !== COVER && order(target) < 0) target = COVER;
    const dir = order(target) > order(view) ? 'fwd' : 'back';
    if (push) history.pushState(null, '', target === COVER ? `${location.pathname}${location.search}` : `#cap-${encodeURIComponent(target)}`);
    const page = pageRef.current;
    if (!page || reduced()) { setView(target); bookRef.current?.scrollIntoView({ block: 'start' }); return; }
    busy.current = true;
    gsap.set(page, { transformOrigin: dir === 'fwd' ? 'left center' : 'right center' });
    gsap.to(shadeRef.current, { opacity: 0.12, duration: 0.5, ease: 'power2.in' });
    gsap.to(page, {
      rotateY: dir === 'fwd' ? -100 : 100,
      duration: 0.55,
      ease: 'power2.in',
      onComplete: () => {
        pending.current = dir;
        setView(target);
      },
    });
  }, [view, order]);

  // Depois de trocar o conteudo: a nova pagina "assenta" vindo do outro lado.
  useLayoutEffect(() => {
    const dir = pending.current;
    const page = pageRef.current;
    if (!dir || !page) return;
    pending.current = null;
    const top = (bookRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 100;
    window.scrollTo({ top: Math.max(0, top) });
    gsap.set(page, { transformOrigin: dir === 'fwd' ? 'right center' : 'left center', rotateY: dir === 'fwd' ? 70 : -70 });
    gsap.to(page, { rotateY: 0, duration: 0.6, ease: 'power3.out', onComplete: () => { gsap.set(page, { clearProps: 'transform' }); busy.current = false; } });
    gsap.to(shadeRef.current, { opacity: 0, duration: 0.6, ease: 'power2.out' });
  }, [view]);

  // Link com #cap-... (menu/home) e o botao "atras" do navegador.
  useEffect(() => {
    if (chapters.length === 0) return;
    const fromHash = viewFromHash();
    if (fromHash !== COVER && view === COVER) {
      const id = setTimeout(() => turnTo(fromHash, false), 350);
      return () => clearTimeout(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters.length]);
  useEffect(() => {
    const onNav = () => turnTo(viewFromHash(), false);
    // Menu "Hogar → categoria" clicado com o catalogo ja aberto.
    const onPick = (e: Event) => turnTo(slugify(String((e as CustomEvent).detail ?? '')) || COVER, false);
    window.addEventListener('popstate', onNav);
    window.addEventListener('hashchange', onNav);
    window.addEventListener(HOGAR_CAT_EVENT, onPick);
    return () => {
      window.removeEventListener('popstate', onNav);
      window.removeEventListener('hashchange', onNav);
      window.removeEventListener(HOGAR_CAT_EVENT, onPick);
    };
  }, [turnTo]);

  const current = chapters.find((c) => c.slug === view);
  const idx = current ? chapters.indexOf(current) : -1;
  const next = idx >= 0 ? chapters[idx + 1] : chapters[0];
  const prev = idx > 0 ? chapters[idx - 1] : null;
  const heroImages = chapters.flatMap((c) => c.products).map((p) => p.mainImage ?? p.image).filter(Boolean).slice(0, 3);

  return (
    <div className="text-[#2b2620]">
      {/* Livro: perspectiva 3D pra pagina girar presa na lombada */}
      <div ref={bookRef} className="relative" style={{ perspective: '2200px' }}>
        <div ref={shadeRef} className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[#2b2620] via-transparent to-[#2b2620] opacity-0" aria-hidden="true" />
        <div ref={pageRef} className="relative bg-[#fbf8f3] will-change-transform" style={{ backfaceVisibility: 'hidden' }}>
          {current ? (
            <ChapterPage
              chapter={current}
              index={idx}
              total={chapters.length}
              prev={prev}
              next={next ?? null}
              onTurn={turnTo}
            />
          ) : (
            <Cover chapters={chapters} images={heroImages} loaded={loaded} onOpen={turnTo} />
          )}
        </div>
      </div>

      {/* Fecho: o que vem com cada peca (sem promessas que a loja nao cumpre) */}
      <section className="bg-[#2b2620] px-4 py-16 text-[#f3ece2] sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-3">
          {[
            { Icon: Printer, title: 'Impreso en Elche', text: 'Cada pieza sale de nuestro taller, diseñada e impresa en 3D.' },
            { Icon: Truck, title: 'Envío a toda España', text: 'Con seguimiento. Gratis a partir de 50 €.' },
            { Icon: ShieldCheck, title: 'Garantía de 3 años', text: 'Cobertura legal ante cualquier defecto de fabricación.' },
          ].map(({ Icon, title, text }) => (
            <div key={title}>
              <Icon className="h-7 w-7 text-[#d9b98a]" aria-hidden="true" />
              <p className="font-display mt-4 text-2xl">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#f3ece2]/75">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Capa do catalogo: titulo, colagem de fotos e o indice (cada linha abre a
// pagina daquela colecao virando a folha).
function Cover({ chapters, images, loaded, onOpen }: { chapters: Chapter[]; images: string[]; loaded: boolean; onOpen: (slug: string) => void }) {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-36 sm:px-6 sm:pt-40 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#8a6a3a]">
            <span className="h-px w-10 bg-[#8a6a3a]" aria-hidden="true" /> Kitoys 3D · Catálogo Hogar
          </p>
          <h1 className="font-display mt-6 text-5xl leading-[1.02] text-[#2b2620] sm:text-7xl">
            Objetos que <em className="italic text-[#8a6a3a]">hacen</em> casa
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-[#5f574e]">
            Jarrones, decoración y pequeños detalles diseñados e impresos en 3D, capa a capa, en nuestro taller de Elche.
          </p>

          {chapters.length > 0 && (
            <>
              <p className="mt-10 text-xs font-semibold uppercase tracking-[0.25em] text-[#8a6a3a]">Índice</p>
              <ol className="mt-3 max-w-md divide-y divide-[#2b2620]/10 border-y border-[#2b2620]/10">
                {chapters.map((c, i) => (
                  <li key={c.slug}>
                    <button
                      type="button"
                      onClick={() => onOpen(c.slug)}
                      className="group flex w-full cursor-pointer items-center gap-5 py-4 text-left transition-colors hover:text-[#8a6a3a]"
                    >
                      <span className="font-display text-sm text-[#8a6a3a]">{fmt(i + 1)}</span>
                      <span className="flex-1 text-lg font-medium">{c.name}</span>
                      <span className="text-sm text-[#5f574e] transition-transform duration-300 group-hover:-translate-x-1">
                        {c.products.length} {c.products.length === 1 ? 'pieza' : 'piezas'}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </>
          )}
          {loaded && chapters.length === 0 && <p className="mt-10 text-lg text-[#5f574e]">Muy pronto habrá piezas para tu casa.</p>}
        </div>

        {/* Colagem assimetrica com as fotos dos produtos */}
        <div className="relative lg:col-span-6">
          <div className="grid grid-cols-6 grid-rows-6 gap-3 sm:gap-4" style={{ aspectRatio: '1 / 1' }}>
            <figure className="relative col-span-4 row-span-6 overflow-hidden rounded-[28px] bg-[#e2d6c4]">
              {images[0] && <Image src={images[0]} alt="" fill priority sizes="(min-width: 1024px) 34vw, 66vw" className="object-cover" />}
            </figure>
            <figure className="relative col-span-2 row-span-3 overflow-hidden rounded-[22px] bg-[#d9cbb5]">
              {images[1] && <Image src={images[1]} alt="" fill sizes="18vw" className="object-cover" />}
            </figure>
            <div className="col-span-2 row-span-3 flex flex-col justify-between rounded-[22px] bg-[#2b2620] p-4 text-[#f3ece2]">
              <Printer className="h-6 w-6" aria-hidden="true" />
              <p className="font-display text-lg leading-snug sm:text-xl">Hecho capa a capa.</p>
            </div>
          </div>
          {chapters[0] && (
            <button
              type="button"
              onClick={() => onOpen(chapters[0].slug)}
              className="absolute -bottom-6 left-6 inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full bg-[#2b2620] px-6 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#4a4238]"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" /> Abrir el catálogo
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// Uma "pagina" do catalogo. O layout muda conforme a posicao (spread,
// mosaico, galeria) — com 1 so produto vira sempre a pagina de destaque.
function ChapterPage({ chapter, index, total, prev, next, onTurn }: {
  chapter: Chapter;
  index: number;
  total: number;
  prev: Chapter | null;
  next: Chapter | null;
  onTurn: (slug: string) => void;
}) {
  const layout = chapter.products.length === 1 ? 'spread' : LAYOUTS[index % LAYOUTS.length];
  const bg = PAGE_BG[index % PAGE_BG.length];
  const flip = index % 2 === 1;
  const navBtn = 'inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors';

  return (
    <section className="px-4 pb-20 pt-36 sm:px-6 sm:pt-40 lg:px-8" style={{ background: bg }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <button type="button" onClick={() => onTurn(COVER)} className={`${navBtn} border border-[#2b2620]/25 text-[#2b2620] hover:border-[#2b2620]`}>
            Volver al índice
          </button>
        </div>

        {/* Cabecalho da pagina */}
        <header className="mb-12 grid items-end gap-6 border-b border-[#2b2620]/15 pb-8 lg:grid-cols-12">
          <p className="font-display text-7xl leading-none text-[#2b2620]/15 sm:text-9xl lg:col-span-3" aria-hidden="true">{fmt(index + 1)}</p>
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8a6a3a]">Página {fmt(index + 1)} de {fmt(total)}</p>
            <h2 className="font-display mt-2 text-4xl text-[#2b2620] sm:text-6xl">{chapter.name}</h2>
          </div>
          <p className="text-sm text-[#5f574e] lg:col-span-3 lg:text-right">
            {chapter.products.length} {chapter.products.length === 1 ? 'pieza' : 'piezas'} · impresas en 3D
          </p>
        </header>

        {layout === 'spread' && <Spread product={chapter.products[0]} rest={chapter.products.slice(1)} flip={flip} />}

        {layout === 'mosaic' && (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:row-span-2"><Featured product={chapter.products[0]} /></div>
            {chapter.products.slice(1).map((p) => <div key={p.id}><HomeProductCard product={p} /></div>)}
          </div>
        )}

        {layout === 'gallery' && (
          <>
            <blockquote className="font-display mx-auto mb-14 max-w-3xl text-center text-2xl italic leading-snug text-[#2b2620] sm:text-4xl">
              “Piezas pensadas para usarse cada día y durar años.”
            </blockquote>
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3">
              {chapter.products.map((p, i) => (
                <div key={p.id} className={i % 3 === 1 ? 'lg:translate-y-16' : ''}><HomeProductCard product={p} /></div>
              ))}
            </div>
          </>
        )}

        {/* Rodape da pagina: folhear */}
        <footer className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-[#2b2620]/15 pt-8 sm:flex-row">
          {prev ? (
            <button type="button" onClick={() => onTurn(prev.slug)} className={`${navBtn} text-[#5f574e] hover:text-[#2b2620]`}>
              Página anterior · {prev.name}
            </button>
          ) : (
            <button type="button" onClick={() => onTurn(COVER)} className={`${navBtn} text-[#5f574e] hover:text-[#2b2620]`}>Portada</button>
          )}
          <span className="font-display text-sm text-[#8a6a3a]">{fmt(index + 1)} / {fmt(total)}</span>
          {next ? (
            <button type="button" onClick={() => onTurn(next.slug)} className={`${navBtn} bg-[#2b2620] text-white hover:bg-[#4a4238]`}>
              Siguiente página · {next.name}
            </button>
          ) : (
            <button type="button" onClick={() => onTurn(COVER)} className={`${navBtn} bg-[#2b2620] text-white hover:bg-[#4a4238]`}>Volver al índice</button>
          )}
        </footer>
      </div>
    </section>
  );
}

// Pagina de destaque: foto grande de um lado, ficha do produto do outro.
function Spread({ product, rest, flip }: { product: Product; rest: Product[]; flip: boolean }) {
  return (
    <>
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <figure className={`relative aspect-[4/5] overflow-hidden rounded-[32px] bg-[#e2d6c4] lg:col-span-7 ${flip ? 'lg:order-2' : ''}`}>
          <Image src={product.mainImage ?? product.image} alt={product.name} fill sizes="(min-width: 1024px) 58vw, 92vw" className="object-cover" />
        </figure>
        <div className="lg:col-span-5"><ProductSheet product={product} /></div>
      </div>
      {rest.length > 0 && (
        <div className="mt-16 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
          {rest.map((p) => <div key={p.id}><HomeProductCard product={p} /></div>)}
        </div>
      )}
    </>
  );
}

function Featured({ product }: { product: Product }) {
  return (
    <div className="flex h-full flex-col">
      <Link href={`/producto/${product.id}-${product.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-[28px] bg-[#e2d6c4] lg:aspect-auto lg:flex-1">
        <Image src={product.mainImage ?? product.image} alt={product.name} fill sizes="(min-width: 1024px) 50vw, 92vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none" />
      </Link>
      <div className="pt-5"><ProductSheet product={product} compact /></div>
    </div>
  );
}

// Ficha do produto no estilo catalogo: nome em serifa, descricao, preco e
// os dois botoes.
function ProductSheet({ product, compact }: { product: Product; compact?: boolean }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const needsChoice = Boolean(product.colorOptions?.length || product.sizes?.length);
  const href = `/producto/${product.id}-${product.slug}`;
  return (
    <div>
      <h3 className={`font-display text-[#2b2620] ${compact ? 'text-2xl' : 'text-4xl sm:text-5xl'}`}>{product.name}</h3>
      {!compact && product.shortDescription && (
        <p className="mt-5 text-lg leading-relaxed text-[#5f574e]">{product.shortDescription.trim()}…</p>
      )}
      <p className={`font-display text-[#2b2620] ${compact ? 'mt-2 text-xl' : 'mt-6 text-3xl'}`}>{product.price.toFixed(2)} €</p>
      <div className={`flex flex-wrap gap-3 ${compact ? 'mt-4' : 'mt-8'}`}>
        {needsChoice ? (
          <Link href={href} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#2b2620] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#4a4238]">Elegir opciones</Link>
        ) : (
          <button
            type="button"
            onClick={() => { addItem(product); setAdded(true); setTimeout(() => setAdded(false), 1800); }}
            className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold text-white transition-colors ${added ? 'bg-[#3f6b4f]' : 'bg-[#2b2620] hover:bg-[#4a4238]'}`}
          >
            {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {added ? 'Añadido' : 'Añadir al carrito'}
          </button>
        )}
        <Link href={href} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#2b2620]/30 px-7 text-sm font-semibold text-[#2b2620] transition-colors hover:border-[#2b2620]">
          Ver detalles
        </Link>
      </div>
    </div>
  );
}
