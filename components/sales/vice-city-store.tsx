'use client';

// VICE CITY STORE — página de venda temática (neon anos 80) montada sobre os
// produtos reais da Kitoys. Mesmo carrinho, mesma personalização e mesmo
// checkout Stripe da loja (Bizum, Apple/Google Pay, IVA, envío +25€): aqui é
// só a vitrine com a cara da campanha. Enxuta e moderna, mobile-first.

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Eye, PenLine, ShieldCheck, ShoppingCart, SlidersHorizontal, Sparkles, Truck } from 'lucide-react';
import { type Product } from '@/lib/products';
import { useCart } from '@/lib/cart-context';
import { cardPrice } from '@/lib/personalize';
import type { SalesPageConfig } from '@/lib/sales-pages-shared';
import { StoreFooter, StoreHeader } from '@/components/sales/store-chrome';

type Props = { config: SalesPageConfig; products: Product[]; cover: Product | null; preview?: boolean };

const NO_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23160a1f'/%3E%3C/svg%3E";

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

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="min-w-[2.6rem] rounded-xl border border-white/15 bg-black/40 px-2.5 py-1.5 text-center font-mono text-xl font-bold tabular-nums text-white sm:text-2xl">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/50">{label}</span>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const cp = cardPrice(product.price, product.personalize, product.sizes);
  const img = product.mainImage || product.image || NO_IMG;
  const personal = Boolean(product.personalize?.enabled);
  const needsChoice = Boolean(personal || product.colorOptions?.length || product.sizes?.length);
  const href = `/producto/${product.id}-${product.slug}`;

  function add(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 backdrop-blur-sm transition-all duration-200 hover:border-[var(--vc-primary)]/60 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vc-secondary)]"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#1a0f24]">
        <Image src={img} alt={product.name} fill sizes="(min-width:1024px) 240px, (min-width:640px) 33vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
        {cp.off > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-[var(--vc-primary)] px-2 py-0.5 text-[10px] font-black tracking-wide text-white shadow-[0_0_12px_var(--vc-primary)]">-{cp.off}%</span>
        )}
        {cp.off === 0 && personal && (
          <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--vc-secondary)] ring-1 ring-[var(--vc-secondary)]/40">Personalizable</span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">{product.name}</h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            {cp.was && <p className="text-[11px] leading-tight text-white/45"><s>{cp.was}</s> · {cp.sub}</p>}
            <p className="whitespace-nowrap text-lg font-black leading-none text-white">{cp.main}</p>
          </div>
          {needsChoice ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--vc-secondary)] text-black shadow-[0_0_14px_var(--vc-secondary)]" title={personal ? 'Personalizar' : 'Elegir opciones'} aria-label={personal ? 'Personalizar' : 'Elegir opciones'}>
              {personal ? <PenLine className="h-[18px] w-[18px]" aria-hidden /> : <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden />}
            </span>
          ) : (
            <button type="button" onClick={add} aria-label={`Añadir ${product.name} al carrito`}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-black transition-all"
              style={{ background: added ? '#34d399' : 'var(--vc-secondary)', boxShadow: `0 0 14px ${added ? '#34d399' : 'var(--vc-secondary)'}` }}>
              {added ? <Check className="h-5 w-5" aria-hidden /> : <ShoppingCart className="h-[18px] w-[18px]" aria-hidden />}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ViceCityStore({ config, products, cover, preview }: Props) {
  const { addItem } = useCart();
  const cd = useCountdown(config.countdownTo);
  const gridRef = useRef<HTMLDivElement>(null);
  const coverCp = cover ? cardPrice(cover.price, cover.personalize, cover.sizes) : null;
  const coverNeedsChoice = Boolean(cover?.personalize?.enabled || cover?.colorOptions?.length || cover?.sizes?.length);
  const coverHref = cover ? `/producto/${cover.id}-${cover.slug}` : '#productos';
  const [coverAdded, setCoverAdded] = useState(false);

  const styleVars = useMemo(
    () => ({ '--vc-primary': config.neonPrimary, '--vc-secondary': config.neonSecondary } as React.CSSProperties),
    [config.neonPrimary, config.neonSecondary],
  );

  function scrollToProducts() {
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function addCover(e: React.MouseEvent) {
    e.preventDefault();
    if (!cover) return;
    if (coverNeedsChoice) { window.location.href = coverHref; return; }
    addItem(cover);
    setCoverAdded(true);
    setTimeout(() => setCoverAdded(false), 1600);
  }

  const coverImg = cover?.mainImage || cover?.image || config.heroImage || NO_IMG;

  return (
    <div style={styleVars} data-kt-store={config.slug} className="relative min-h-screen overflow-x-clip bg-[#140720] text-white">
      <style>{`
        @keyframes vc-grid { from { background-position: 0 0; } to { background-position: 0 44px; } }
        @keyframes vc-spin { to { transform: rotate(360deg); } }
        @keyframes vc-pulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
        @keyframes vc-flicker { 0%,19%,21%,23%,80%,100% { opacity:1; } 20%,22% { opacity:.6; } }
        @media (prefers-reduced-motion: reduce) {
          .vc-sweep, .vc-sun-grid, .vc-flick { animation: none !important; }
        }
      `}</style>

      {/* Fundo: céu de pôr do sol + sol + grade que corre */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0" style={{ background: `radial-gradient(120% 80% at 50% -10%, ${config.neonPrimary}22 0%, transparent 55%), linear-gradient(180deg, #2a0b3f 0%, #190a2b 40%, #0c0416 100%)` }} />
        <div className="absolute left-1/2 top-[7%] h-56 w-56 -translate-x-1/2 rounded-full sm:h-72 sm:w-72" style={{ background: `linear-gradient(180deg, ${config.neonSecondary}, ${config.neonPrimary})`, filter: 'blur(2px)', opacity: 0.9, maskImage: 'linear-gradient(180deg,#000 55%,transparent 72%)', WebkitMaskImage: 'linear-gradient(180deg,#000 55%,transparent 72%)' }} />
        <div className="vc-sun-grid absolute inset-x-[-20%] bottom-0 h-[42vh]" style={{ transform: 'perspective(400px) rotateX(72deg)', transformOrigin: 'bottom', backgroundImage: `linear-gradient(${config.neonSecondary}55 1px, transparent 1px), linear-gradient(90deg, ${config.neonSecondary}55 1px, transparent 1px)`, backgroundSize: '44px 44px', animation: 'vc-grid 1.6s linear infinite', maskImage: 'linear-gradient(180deg, transparent, #000 60%)', WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 60%)' }} />
      </div>

      <StoreHeader store={config} />
      {preview && (
        <p className="relative z-30 flex items-center justify-center gap-2 bg-amber-400 px-4 py-2 text-center text-xs font-bold text-black">
          <Eye size={14} aria-hidden /> Vista previa: esta tienda está en borrador y solo tú (con el panel abierto) la ves. Publícala en Admin → Lojas.
        </p>
      )}

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24">
        {/* HERO */}
        <section className="grid items-center gap-8 pt-10 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em]" style={{ borderColor: `${config.neonSecondary}66`, color: config.neonSecondary }}>
              {config.badge || config.eyebrow}
            </span>
            <h1 className="mt-4 text-4xl font-black uppercase italic leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl"
              style={{ textShadow: `0 0 18px ${config.neonPrimary}, 0 0 42px ${config.neonPrimary}66`, WebkitTextStroke: `1px ${config.neonSecondary}33` }}>
              {config.heading}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/70 lg:mx-0 sm:text-lg">{config.subtitle}</p>

            {cd && (
              <div className="mt-6 inline-flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-5 py-3 lg:items-start">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">{config.countdownLabel}</span>
                <div className="flex items-center gap-2">
                  <TimeBox value={cd.d} label="días" /><span className="pb-4 text-white/40">:</span>
                  <TimeBox value={cd.h} label="hrs" /><span className="pb-4 text-white/40">:</span>
                  <TimeBox value={cd.m} label="min" /><span className="pb-4 text-white/40">:</span>
                  <TimeBox value={cd.s} label="seg" />
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <button type="button" onClick={scrollToProducts}
                className="group inline-flex h-12 cursor-pointer items-center gap-2 rounded-full px-6 text-sm font-black uppercase tracking-wide text-black transition-transform hover:scale-[1.02]"
                style={{ background: `linear-gradient(90deg, ${config.neonSecondary}, ${config.neonPrimary})`, boxShadow: `0 0 24px ${config.neonPrimary}88` }}>
                {config.ctaLabel} <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
              </button>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/55"><Truck size={14} aria-hidden /> Envío gratis +25€</span>
            </div>
          </div>

          {/* Capa: a peça que brilha e passa os LEDs */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="vc-sweep absolute -inset-[2px] rounded-[26px]" style={{ background: `conic-gradient(from 0deg, transparent, ${config.neonSecondary}, transparent 25%, ${config.neonPrimary}, transparent 55%, ${config.neonSecondary}, transparent 85%)`, animation: 'vc-spin 4s linear infinite', filter: 'blur(6px)' }} aria-hidden />
            <div className="vc-sweep absolute -inset-[1px] rounded-[25px]" style={{ background: `conic-gradient(from 180deg, transparent, ${config.neonPrimary}, transparent 30%, ${config.neonSecondary}, transparent 60%)`, animation: 'vc-spin 4s linear infinite reverse' }} aria-hidden />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#120a1c]/90 p-4 backdrop-blur">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#1a0f24]">
                <Image src={coverImg} alt={cover?.name || config.heading} fill priority sizes="(min-width:1024px) 420px, 90vw" className="object-cover" />
                <div className="pointer-events-none absolute inset-0" style={{ boxShadow: `inset 0 0 60px ${config.neonPrimary}55`, animation: 'vc-pulse 2.6s ease-in-out infinite' }} aria-hidden />
              </div>
              <div className="px-1 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: config.neonSecondary }}>{config.coverTagline}</p>
                <h2 className="mt-1 text-xl font-black leading-tight text-white">{cover?.name || config.featureTitle}</h2>
                {cover && coverCp && (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      {coverCp.was && <p className="text-[11px] text-white/45"><s>{coverCp.was}</s> · {coverCp.sub}</p>}
                      <p className="text-2xl font-black text-white">{coverCp.main}</p>
                    </div>
                    <button type="button" onClick={addCover}
                      className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-black text-black transition-transform hover:scale-[1.02]"
                      style={{ background: `linear-gradient(90deg, ${config.neonSecondary}, ${config.neonPrimary})`, boxShadow: `0 0 18px ${config.neonPrimary}88` }}>
                      {coverAdded ? <><Check size={17} aria-hidden /> ¡Listo!</> : coverNeedsChoice ? <><PenLine size={16} aria-hidden /> Elegir</> : <><ShoppingCart size={16} aria-hidden /> Añadir</>}
                    </button>
                  </div>
                )}
                {!cover && <p className="mt-2 text-sm text-white/60">{config.featureText}</p>}
              </div>
            </div>
          </div>
        </section>

        {/* Selo de confiança (padrão europeu) */}
        <section className="mt-10 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-3">
          {[
            { icon: <Truck size={18} aria-hidden />, t: 'Envío con seguimiento', s: 'Gratis desde 25€ en España' },
            { icon: <ShieldCheck size={18} aria-hidden />, t: 'Pago 100% seguro', s: 'Bizum · Apple/Google Pay · tarjeta' },
            { icon: <Sparkles size={18} aria-hidden />, t: 'Impreso en 3D en España', s: 'IVA incluido · devolución 14 días' },
          ].map((f) => (
            <div key={f.t} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${config.neonSecondary}1a`, color: config.neonSecondary }}>{f.icon}</span>
              <div><p className="text-sm font-semibold text-white">{f.t}</p><p className="text-xs text-white/50">{f.s}</p></div>
            </div>
          ))}
        </section>

        {/* GRADE DE PRODUTOS */}
        <section ref={gridRef} id="productos" className="scroll-mt-20 pt-12">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: config.neonPrimary }}>{config.eyebrow}</p>
              <h2 className="text-2xl font-black uppercase italic text-white sm:text-3xl">La colección</h2>
            </div>
          </div>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center text-sm text-white/50">
              Aún no hay productos en esta campaña.
            </div>
          )}
        </section>

      </main>
      <StoreFooter store={config} />
    </div>
  );
}
