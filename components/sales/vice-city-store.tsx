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
import { type Product } from '@/lib/products';
import { useCart } from '@/lib/cart-context';
import { cardPrice } from '@/lib/personalize';
import { FREE_SHIPPING_FROM } from '@/lib/checkout-pricing';
import { clampHeroLogo, storeArt, storeHeaderOffset, type SalesPageConfig } from '@/lib/sales-pages-shared';
import { StoreFooter, StoreHeader } from '@/components/sales/store-chrome';
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

  return (
    <article id={`p-${product.id}`} className="group flex scroll-mt-32 flex-col">
      <Link href={hrefOf(product)} className="block overflow-hidden rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        <div ref={setImg} className="relative aspect-[4/5] overflow-hidden bg-[#1a1024]">
          <Image src={imgOf(product)} alt={product.name} fill sizes="(min-width:1024px) 380px, (min-width:640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none" />
          {cp.off > 0 && <span className="font-store-display absolute left-0 top-4 bg-[var(--vc-primary)] px-3 py-1 text-base text-[#0b0614]">-{cp.off}%</span>}
        </div>
      </Link>
      <div className="mt-4 flex flex-1 flex-col">
        {product.categoryLabel && <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">{product.categoryLabel}</p>}
        <Link href={hrefOf(product)} className="mt-1">
          <h3 className="text-xl font-semibold leading-snug text-white transition-colors group-hover:text-[var(--vc-primary)]">{product.name}</h3>
        </Link>
        {(personal || cp.sub) && <p className="mt-1 text-sm text-white/55">{[personal && 'Con tu nombre', cp.sub].filter(Boolean).join(' · ')}</p>}
        <div className="mt-auto flex items-center justify-between gap-4 pt-4">
          <p className="font-store-display text-3xl leading-none text-white">
            {cp.main}
            {cp.was && <s className="font-store ml-2 align-middle text-sm text-white/40">{cp.was}</s>}
          </p>
          <BuyButton product={product} added={added} onAdd={add} />
        </div>
      </div>
    </article>
  );
}

// ─── Produtos: descem um atrás do outro; só as abas de categoria em cima ─────
function Catalog({ products, config, sectionRef }: { products: Product[]; config: SalesPageConfig; sectionRef: React.RefObject<HTMLElement | null> }) {
  const [cat, setCat] = useState('');
  const cats = useMemo(() => [...new Set(products.map((p) => p.categoryLabel).filter(Boolean))] as string[], [products]);
  const list = useMemo(() => (cat ? products.filter((p) => p.categoryLabel === cat) : products), [products, cat]);

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
    <section ref={sectionRef} id="productos" className="relative scroll-mt-24 pt-16 sm:pt-24" aria-labelledby="vc-productos">
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
            <div style={{ top: storeHeaderOffset(config) }} className="sticky z-20 -mx-4 bg-[#0b0614]/85 px-4 backdrop-blur-xl">
              <div className="flex gap-7 overflow-x-auto border-b border-white/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Categorías">
                {tab('Todo', '')}
                {cats.map((c) => tab(c, c))}
              </div>
            </div>
          )}

          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>

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
        <div className="absolute inset-x-0 top-0 -z-10 h-[94svh] lg:inset-0 lg:h-auto">
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

        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-[58svh] sm:pt-[60svh] lg:min-h-[100svh] lg:grid-cols-[1fr_minmax(0,480px)] lg:items-center lg:gap-6 lg:pb-20 lg:pt-32">
          {/* PC: texto à direita, sobre o pôr do sol — os bonecos ficam livres à esquerda */}
          <div className="text-center lg:col-start-2 lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">{config.badge || config.eyebrow}</p>
            {config.logoImage && clampHeroLogo(config.heroLogoSize) > 0 ? (
              // Logo grande no lugar do título (Editar loja → Logo na capa)
              <h1 className="mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={config.logoImage} alt={config.heading} style={{ width: `${clampHeroLogo(config.heroLogoSize)}%`, filter: `drop-shadow(0 6px 30px ${P}55)` }} className="mx-auto h-auto max-w-full lg:mx-0" />
              </h1>
            ) : (
              <h1 className="font-store-display mt-3 text-[64px] uppercase leading-[0.86] text-white sm:text-8xl lg:text-[124px]" style={{ textShadow: `0 4px 40px ${P}66` }}>
                {config.heading}
              </h1>
            )}
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-white/85 lg:mx-0">{config.subtitle}</p>

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
              <button type="button" onClick={toHook} className={`${BTN} h-14 w-full bg-white px-10 text-base text-[#0b0614] hover:bg-[var(--vc-primary)] sm:w-auto`}>
                {config.ctaLabel || 'Ver productos'}
              </button>
              <p className="text-sm text-white/70">Envío gratis desde {FREE_SHIPPING_FROM} €</p>
            </div>
          </div>

        </div>
      </section>

      {/* faixa de confiança, só texto */}
      <div className="border-y border-white/10 bg-black/30">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/60 sm:text-sm">
          Envío con seguimiento · Bizum, Apple Pay y Google Pay · Devolución en 14 días · IVA incluido
        </p>
      </div>

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
