'use client';

// VICE CITY STORE — página de vendas da loja própria (multi-loja).
// Visual próximo do jogo: arte grande, tipografia condensada em caixa alta,
// botões sólidos com texto, sem enfeites de ícone. Fluxo simples:
//   capa (foto real + produto da capa com os LEDs) → produtos descendo, um
//   atrás do outro (1 por linha no celular, 3 no computador) → rodapé.
// Carrinho, personalização e checkout Stripe são os mesmos da Kitoys.

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, PenLine, ShoppingCart, SlidersHorizontal, Truck } from 'lucide-react';
import { type Product } from '@/lib/products';
import { useCart } from '@/lib/cart-context';
import { cardPrice } from '@/lib/personalize';
import { FREE_SHIPPING_FROM } from '@/lib/checkout-pricing';
import { clampHeroLogo, storeArt, storeHeaderOffset, type SalesPageConfig } from '@/lib/sales-pages-shared';
import { STORE_SEARCH_EVENT, StoreFooter, StoreHeader } from '@/components/sales/store-chrome';
import { flyToCart } from '@/lib/fly-to-cart';
import { storeFontClass } from '@/components/sales/store-fonts';

type Props = { config: SalesPageConfig; products: Product[]; cover: Product | null; preview?: boolean };

const NO_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%231a1024'/%3E%3C/svg%3E";

const BG = '#0b0614';
const imgOf = (p: Product) => p.mainImage || p.image || NO_IMG;
const hrefOf = (p: Product) => `/producto/${p.id}-${p.slug}`;
const needsChoiceOf = (p: Product) => Boolean(p.personalize?.enabled || p.colorOptions?.length || p.sizes?.length);

// Botão principal: branco sólido com texto (como os menus do jogo); passa a rosa no hover.
const BTN = 'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-md px-5 text-sm font-bold uppercase tracking-[0.12em] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

function useCountdown(iso: string | null) {
  const [left, setLeft] = useState<number>(() => (iso ? Date.parse(iso) - Date.now() : 0));
  useEffect(() => {
    if (!iso) return;
    const t = setInterval(() => setLeft(Date.parse(iso) - Date.now()), 1000);
    return () => clearInterval(t);
  }, [iso]);
  if (!iso || left <= 0) return null;
  const s = Math.floor(left / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

// Adiciona sem abrir a gaveta: a foto (setImg) voa até o carrinho do topo.
function useAdd(product: Product | null) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const imgEl = useRef<Element | null>(null);
  const setImg = (el: Element | null) => { imgEl.current = el; };
  const add = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!product) return;
    addItem(product, undefined, 1, { openCart: false });
    void flyToCart(imgEl.current ?? (e?.currentTarget as Element | undefined) ?? null, imgOf(product));
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };
  return { added, add, setImg };
}

function BuyButton({ product, added, onAdd, wide = false }: { product: Product; added: boolean; onAdd: (e: React.MouseEvent) => void; wide?: boolean }) {
  const personal = Boolean(product.personalize?.enabled);
  const cls = `${BTN} ${wide ? 'w-full' : ''}`;
  if (needsChoiceOf(product)) {
    return (
      <Link href={hrefOf(product)} className={`${cls} bg-white text-[#0b0614] hover:bg-[var(--vc-primary)]`}>
        {personal ? 'Personalizar' : 'Elegir'}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onAdd} aria-label={`Añadir ${product.name} al carrito`}
      className={`${cls} ${added ? 'bg-[var(--vc-primary)] text-[#0b0614]' : 'bg-white text-[#0b0614] hover:bg-[var(--vc-primary)]'}`}>
      {added ? 'Añadido' : 'Añadir'}
    </button>
  );
}

// ─── Produto (também usado em "Más de la colección") ─────────────────────────
export function ProductCard({ product }: { product: Product }) {
  const { added, add, setImg } = useAdd(product);
  const cp = cardPrice(product.price, product.personalize, product.sizes);
  const personal = Boolean(product.personalize?.enabled);
  const choice = needsChoiceOf(product);

  return (
    <Link
      id={`p-${product.id}`}
      href={hrefOf(product)}
      className="group relative flex h-full scroll-mt-40 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] p-2 backdrop-blur-sm transition-colors duration-200 hover:border-[var(--vc-secondary)]/60 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vc-secondary)] sm:p-2.5"
    >
      <div ref={setImg} className="relative aspect-square overflow-hidden rounded-xl bg-[#1a0f24]">
        <Image src={imgOf(product)} alt={product.name} fill sizes="(min-width:1024px) 260px, (min-width:640px) 33vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
        {cp.off > 0 ? (
          <span className="absolute left-2 top-2 rounded-md bg-[var(--vc-primary)] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">-{cp.off}%</span>
        ) : personal ? (
          <span className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--vc-secondary)] ring-1 ring-[var(--vc-secondary)]/40 backdrop-blur">Con tu nombre</span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-3">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-white">{product.name}</h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            {cp.was && <p className="text-[11px] leading-tight text-white/50"><s>{cp.was}</s> · {cp.sub}</p>}
            <p className="whitespace-nowrap text-lg font-bold leading-none text-white">{cp.main}</p>
          </div>
          {choice ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--vc-secondary)] text-black" title={personal ? 'Personalizar' : 'Elegir opciones'} aria-label={personal ? 'Personalizar' : 'Elegir opciones'}>
              {personal ? <PenLine className="h-[18px] w-[18px]" aria-hidden /> : <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden />}
            </span>
          ) : (
            <button type="button" onClick={add} aria-label={`Añadir ${product.name} al carrito`}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-black transition-colors duration-200"
              style={{ background: added ? '#34d399' : 'var(--vc-secondary)' }}>
              {added ? <Check className="h-5 w-5" aria-hidden /> : <ShoppingCart className="h-[18px] w-[18px]" aria-hidden />}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Produtos: descem um atrás do outro; só as abas de categoria em cima ─────
function Catalog({ products, config, sectionRef }: { products: Product[]; config: SalesPageConfig; sectionRef: React.RefObject<HTMLElement | null> }) {
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  // busca do topo (STORE_SEARCH_EVENT) e ?q= quando veio da busca de outra página
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('q');
    if (fromUrl) { setQ(fromUrl); window.dispatchEvent(new CustomEvent(STORE_SEARCH_EVENT, { detail: fromUrl })); }
    const on = (e: Event) => setQ(String((e as CustomEvent).detail ?? ''));
    window.addEventListener(STORE_SEARCH_EVENT, on);
    return () => window.removeEventListener(STORE_SEARCH_EVENT, on);
  }, []);
  const fold = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Abas: as coleções da loja (ordem do painel) que têm produto; depois outras categorias antigas.
  const cats = useMemo(() => {
    const used = new Set(products.map((p) => p.categoryLabel).filter(Boolean) as string[]);
    const ordered = (config.collections ?? []).filter((c) => used.has(c));
    return [...ordered, ...[...used].filter((c) => !ordered.includes(c))];
  }, [products, config.collections]);
  const list = useMemo(() => {
    const term = fold(q.trim());
    return products.filter((p) => (!cat || p.categoryLabel === cat) && (!term || fold(`${p.name} ${p.categoryLabel ?? ''}`).includes(term)));
  }, [products, cat, q]);
  const clearSearch = () => { setQ(''); window.dispatchEvent(new CustomEvent(STORE_SEARCH_EVENT, { detail: '' })); };

  const tab = (label: string, value: string) => {
    const on = cat === value;
    return (
      <button key={label} type="button" onClick={() => setCat(value)} aria-pressed={on}
        className={`shrink-0 cursor-pointer border-b-2 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition-colors duration-200 ${on ? 'border-[var(--vc-primary)] text-white' : 'border-transparent text-white/50 hover:text-white'}`}>
        {label}
      </button>
    );
  };

  return (
    <section ref={sectionRef} id="productos" className="relative scroll-mt-24 pt-8 sm:pt-12" aria-labelledby="vc-productos">
      <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-5">
        <h2 id="vc-productos" className="font-store-display text-5xl uppercase leading-none text-white sm:text-7xl">Productos</h2>
        {products.length > 0 && <p className="pb-1 text-sm text-white/50">{list.length} {list.length === 1 ? 'producto' : 'productos'}</p>}
      </div>

      {products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-store-display text-3xl uppercase text-white">Muy pronto</p>
          <p className="mx-auto mt-3 max-w-sm text-base text-white/55">Estamos preparando las primeras piezas. Vuelve en unos días.</p>
        </div>
      ) : (
        <>
          {cats.length > 1 && (
            <div style={{ ['--st-m' as string]: `${storeHeaderOffset(config, true)}px`, ['--st-d' as string]: `${storeHeaderOffset(config)}px` }} className="sticky top-[var(--st-m)] z-20 -mx-4 bg-[#0b0614]/85 px-4 backdrop-blur-xl md:top-[var(--st-d)]">
              <div className="flex gap-7 overflow-x-auto border-b border-white/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Categorías">
                {tab('Todo', '')}
                {cats.map((c) => tab(c, c))}
              </div>
            </div>
          )}

          {q.trim() && (
            <p className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/70">
              Resultados para «{q.trim()}»
              <button type="button" onClick={clearSearch} className="cursor-pointer rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/10">Ver todo</button>
            </p>
          )}
          {list.length === 0 ? (
            <p className="py-14 text-center text-white/60">No encontramos productos con «{q.trim() || cat}».</p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {list.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          <p className="mt-14 border-t border-white/10 pt-6 text-center text-sm text-white/50">
            Precios con IVA incluido. Envío gratis en España desde {FREE_SHIPPING_FROM} €.
          </p>
        </>
      )}
    </section>
  );
}

// ─── Produto da capa: moldura com LEDs que correm em volta ────────────────────
function CoverCard({ cover, config }: { cover: Product; config: SalesPageConfig }) {
  const { added, add, setImg } = useAdd(cover);
  const P = config.neonPrimary;
  const S = config.neonSecondary;
  const cp = cardPrice(cover.price, cover.personalize, cover.sizes);

  return (
    <div className="relative mx-auto w-full max-w-[340px] lg:mx-0 lg:ml-auto">
      <div aria-hidden className="vc-pulse absolute -inset-6 rounded-[40px] opacity-60 blur-2xl" style={{ background: `radial-gradient(closest-side, ${P}88, transparent)` }} />
      <div aria-hidden className="absolute -inset-[3px] overflow-hidden rounded-[22px]">
        <div className="vc-spin absolute -inset-[60%]" style={{ background: `conic-gradient(from 0deg, transparent 0 20%, ${S} 30%, transparent 40% 60%, ${P} 70%, transparent 80%)` }} />
      </div>
      {/* fileira de LEDs correndo em volta (letreiro de lâmpadas) */}
      <svg aria-hidden className="pointer-events-none absolute -inset-[9px] z-20 h-[calc(100%+18px)] w-[calc(100%+18px)] overflow-visible">
        <rect x="0.5%" y="0.5%" width="99%" height="99%" rx="26" pathLength={100} fill="none" stroke={S} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="0.01 2.49" className="vc-chase" style={{ filter: `drop-shadow(0 0 4px ${S})` }} />
        <rect x="0.5%" y="0.5%" width="99%" height="99%" rx="26" pathLength={100} fill="none" stroke={P} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="0.01 2.49" strokeDashoffset={-1.25} className="vc-chase" style={{ filter: `drop-shadow(0 0 4px ${P})` }} />
      </svg>

      <div className="relative z-10 overflow-hidden rounded-[20px] border border-white/15 bg-[#0b0614]/85 p-3 backdrop-blur-xl">
        <Link href={hrefOf(cover)} className="block overflow-hidden rounded-[14px]">
          <div ref={setImg} className="relative aspect-square bg-[#1a1024]">
            <Image src={imgOf(cover)} alt={cover.name} fill priority sizes="(min-width:1024px) 340px, 86vw" className="object-cover" />
            <div aria-hidden className="vc-pulse pointer-events-none absolute inset-0" style={{ boxShadow: `inset 0 0 70px ${P}55` }} />
          </div>
        </Link>
        <div className="px-1.5 pb-1 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: S }}>{config.coverTagline}</p>
          <h2 className="mt-1 line-clamp-2 text-lg font-semibold leading-snug text-white">{cover.name}</h2>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="font-store-display text-3xl leading-none text-white">{cp.main}</p>
            <BuyButton product={cover} added={added} onAdd={add} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-store-display min-w-[3.2rem] text-center text-4xl tabular-nums text-white">{String(value).padStart(2, '0')}</span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">{label}</span>
    </div>
  );
}

export function ViceCityStore({ config, products, cover }: Props) {
  const cd = useCountdown(config.countdownTo);
  const catalogRef = useRef<HTMLElement>(null);
  const art = storeArt(config);
  const P = config.neonPrimary;
  const S = config.neonSecondary;
  const vars = { '--vc-primary': P, '--vc-secondary': S } as React.CSSProperties;
  const toCatalog = () => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Botão da capa: vai direto ao produto-gancho (o da capa) na lista; sem ele, ao começo dos produtos.
  const toHook = () => {
    const el = cover ? document.getElementById(`p-${cover.id}`) : null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else toCatalog();
  };

  return (
    <div style={vars} data-kt-store={config.slug} className={`${storeFontClass} relative min-h-screen overflow-x-clip bg-[#0b0614] text-white`}>
      <style>{`
        @keyframes vc-spin { to { transform: rotate(360deg); } }
        @keyframes vc-chase { to { stroke-dashoffset: -2.5; } }
        @keyframes vc-pulse { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
        .vc-spin { animation: vc-spin 5s linear infinite; }
        .vc-chase { animation: vc-chase .9s linear infinite; }
        .vc-pulse { animation: vc-pulse 2.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .vc-spin, .vc-chase, .vc-pulse { animation: none !important; } }
      `}</style>

      <StoreHeader store={config} overlay onCatalog={toCatalog} />

      {/* ── CAPA ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate">
        {/* a capa: tela cheia; no celular os bonecos ficam no centro, no PC à esquerda */}
        <div className="absolute inset-x-0 top-0 -z-10 h-[76svh] lg:inset-0 lg:h-auto">
          <Image
            src={art.hero}
            alt=""
            fill
            priority
            sizes="100vw"
            placeholder={art.blur ? 'blur' : 'empty'}
            blurDataURL={art.blur || undefined}
            className="object-cover object-[44%_50%] lg:object-[38%_55%]"
          />
        </div>
        <div aria-hidden className="absolute inset-0 -z-10 mix-blend-soft-light" style={{ background: `linear-gradient(155deg, ${P}66 0%, transparent 45%, ${S}4d 100%)` }} />
        <div aria-hidden className="absolute inset-0 -z-10 lg:hidden" style={{ background: `linear-gradient(180deg, ${BG}99 0%, transparent 16%, transparent 36%, ${BG}d9 64%, ${BG} 88%)` }} />
        <div aria-hidden className="absolute inset-0 -z-10 hidden lg:block" style={{ background: `linear-gradient(270deg, ${BG} 0%, ${BG}e0 22%, ${BG}80 40%, transparent 60%), linear-gradient(180deg, ${BG}80 0%, transparent 16%, transparent 76%, ${BG} 100%)` }} />

        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-[44svh] sm:pt-[46svh] lg:min-h-[76svh] lg:grid-cols-[1fr_minmax(0,480px)] lg:items-center lg:gap-6 lg:pb-12 lg:pt-28">
          {/* PC: texto à direita, sobre o pôr do sol — os bonecos ficam livres à esquerda */}
          <div className="text-center lg:col-start-2 lg:text-left">
            {config.logoImage && clampHeroLogo(config.heroLogoSize) > 0 ? (
              // Logo grande no lugar do título (Editar loja → Logo na capa)
              <h1 className="mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={config.logoImage} alt={config.heading} style={{ width: `${clampHeroLogo(config.heroLogoSize)}%`, filter: `drop-shadow(0 6px 30px ${P}55)` }} className="mx-auto h-auto max-w-full lg:mx-0" />
              </h1>
            ) : (
              <h1 className="font-store-display mt-5 text-[46px] uppercase leading-[0.9] sm:text-7xl lg:text-[88px]">
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(95deg, #fff 0%, ${S} 45%, ${P} 100%)`, filter: `drop-shadow(0 0 22px ${P}99)` }}>
                  {config.heading}
                </span>
              </h1>
            )}
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg lg:mx-0">{config.subtitle}</p>

            {cd && (
              <div className="mt-8 inline-flex items-start gap-4" aria-label={`${config.countdownLabel}: ${cd.d} días, ${cd.h} horas, ${cd.m} minutos`}>
                <span className="pt-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{config.countdownLabel}</span>
                <div className="flex items-start gap-1" aria-hidden>
                  <TimeBox value={cd.d} label="días" /><span className="font-store-display text-4xl text-white/40">:</span>
                  <TimeBox value={cd.h} label="hrs" /><span className="font-store-display text-4xl text-white/40">:</span>
                  <TimeBox value={cd.m} label="min" /><span className="font-store-display text-4xl text-white/40">:</span>
                  <TimeBox value={cd.s} label="seg" />
                </div>
              </div>
            )}

            <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <button type="button" onClick={toHook}
                className="group inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-7 py-3 text-base font-bold uppercase tracking-wide text-black transition-opacity hover:opacity-95 sm:w-auto"
                style={{ background: `linear-gradient(90deg, ${S}, ${P})`, boxShadow: `0 10px 34px ${P}66` }}>
                {config.ctaLabel || 'Comprar ahora'}
              </button>
              <p className="flex items-center gap-1.5 text-sm text-white/70"><Truck size={16} aria-hidden /> Envío gratis desde {FREE_SHIPPING_FROM} €</p>
            </div>
          </div>

        </div>
      </section>


      <div className="relative">
        {/* fundo dos produtos: a mesma arte da capa, parada atrás enquanto a página rola
            (sticky funciona no iPhone; background-attachment: fixed não) */}
        <div aria-hidden className="pointer-events-none sticky top-0 -mb-[100svh] h-[100svh] overflow-hidden">
          <Image src={art.hero} alt="" fill sizes="100vw" className="scale-105 object-cover object-[44%_55%] opacity-45 blur-[2px]" />
          <div className="absolute inset-0 mix-blend-soft-light" style={{ background: `linear-gradient(155deg, ${P}66 0%, transparent 50%, ${S}4d 100%)` }} />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${BG} 0%, ${BG}cc 22%, ${BG}b3 60%, ${BG}e0 100%)` }} />
        </div>
        <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24">
          <Catalog products={products} config={config} sectionRef={catalogRef} />
        </main>
      </div>

      <StoreFooter store={config} />
    </div>
  );
}
