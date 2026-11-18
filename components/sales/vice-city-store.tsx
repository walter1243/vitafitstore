'use client';

// VICE CITY STORE — página de vendas da loja própria (multi-loja), refeita com a
// skill ui-ux-pro-max: estilo imersivo escuro, neon roxo/rosa + ciano, fontes
// Russo One (títulos) + Chakra Petch (texto), mobile-first (tráfego do Instagram).
//   1. Capa com a foto real de fundo (Admin → Editar loja → Foto de fundo; vazio =
//      arte do tema) e o produto da capa com os LEDs passando em volta.
//   2. Selos europeus (envío +25€, Bizum/Apple/Google Pay, 14 días, IVA).
//   3. Tabela de produtos: busca, categorias, ordenar, Tabela | Grade.
//   4. Como comprar em 3 passos.
// Carrinho, personalização e checkout Stripe são os mesmos da Kitoys.

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, Check, CreditCard, Eye, LayoutGrid, PenLine, RotateCcw, Rows3, Search,
  ShieldCheck, ShoppingCart, SlidersHorizontal, Sparkles, Truck, X,
} from 'lucide-react';
import { type Product } from '@/lib/products';
import { useCart } from '@/lib/cart-context';
import { cardPrice, packOf } from '@/lib/personalize';
import { FREE_SHIPPING_FROM } from '@/lib/checkout-pricing';
import { storeArt, storeHeaderOffset, type SalesPageConfig } from '@/lib/sales-pages-shared';
import { StoreFooter, StoreHeader } from '@/components/sales/store-chrome';
import { storeFontClass } from '@/components/sales/store-fonts';

type Props = { config: SalesPageConfig; products: Product[]; cover: Product | null; preview?: boolean };

const NO_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23160a1f'/%3E%3C/svg%3E";

const BG = '#0d0418';
const imgOf = (p: Product) => p.mainImage || p.image || NO_IMG;
const hrefOf = (p: Product) => `/producto/${p.id}-${p.slug}`;
const needsChoiceOf = (p: Product) => Boolean(p.personalize?.enabled || p.colorOptions?.length || p.sizes?.length);
const sortPrice = (p: Product) => packOf(p.personalize)?.price ?? p.price;
const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

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

// Botão "adicionar" com confirmação visual de 1,6 s.
function useAdd(product: Product | null) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const add = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!product) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };
  return { added, add };
}

// ─── Card da grade (também usado em "Más de la colección") ───────────────────
export function ProductCard({ product }: { product: Product }) {
  const { added, add } = useAdd(product);
  const cp = cardPrice(product.price, product.personalize, product.sizes);
  const personal = Boolean(product.personalize?.enabled);
  const choice = needsChoiceOf(product);

  return (
    <Link
      href={hrefOf(product)}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur-sm transition-colors duration-200 hover:border-[var(--vc-secondary)]/60 hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vc-secondary)] sm:p-2.5"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#1a0f24]">
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

// ─── Linha da tabela ──────────────────────────────────────────────────────────
function ProductRow({ product }: { product: Product }) {
  const { added, add } = useAdd(product);
  const cp = cardPrice(product.price, product.personalize, product.sizes);
  const personal = Boolean(product.personalize?.enabled);
  const choice = needsChoiceOf(product);
  const colors = product.colorOptions?.length ?? 0;
  const sizes = product.sizes?.length ?? 0;
  const chips = [
    personal && 'Con tu nombre',
    colors > 1 && `${colors} colores`,
    sizes > 1 && `${sizes} tallas`,
    cp.sub,
  ].filter(Boolean) as string[];

  const price = (
    <>
      {cp.was && <span className="block text-[11px] leading-tight text-white/45"><s>{cp.was}</s></span>}
      <span className="block whitespace-nowrap text-base font-bold text-white sm:text-lg">{cp.main}</span>
      {cp.off > 0 && <span className="mt-0.5 inline-block rounded bg-[var(--vc-primary)] px-1.5 text-[10px] font-bold text-white">-{cp.off}%</span>}
    </>
  );

  return (
    <tr className="group border-t border-white/[0.07] transition-colors duration-200 hover:bg-white/[0.035]">
      <td className="py-3 pl-3 pr-2 sm:pl-4">
        <Link href={hrefOf(product)} className="flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--vc-secondary)] sm:gap-4">
          <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#1a0f24] transition-colors group-hover:border-[var(--vc-secondary)]/60 sm:h-[72px] sm:w-[72px]">
            <Image src={imgOf(product)} alt="" fill sizes="72px" className="object-cover" />
          </span>
          <span className="min-w-0">
            <span className="line-clamp-2 text-[15px] font-semibold leading-snug text-white transition-colors group-hover:text-[var(--vc-secondary)]">{product.name}</span>
            {product.categoryLabel && <span className="mt-0.5 block text-xs text-white/50">{product.categoryLabel}</span>}
            {/* celular: preço embaixo do nome (a coluna de preço some) */}
            <span className="mt-1 block sm:hidden">{price}</span>
          </span>
        </Link>
      </td>
      <td className="hidden px-3 py-3 md:table-cell">
        {chips.length ? (
          <span className="flex flex-wrap gap-1.5">
            {chips.map((c) => <span key={c} className="rounded-full border border-white/12 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-white/70">{c}</span>)}
          </span>
        ) : <span className="text-xs text-white/35">—</span>}
      </td>
      <td className="hidden whitespace-nowrap px-3 py-3 text-right sm:table-cell">{price}</td>
      <td className="py-3 pl-2 pr-3 text-right sm:pr-4">
        {choice ? (
          <Link href={hrefOf(product)} aria-label={`${personal ? 'Personalizar' : 'Elegir opciones de'} ${product.name}`}
            className="inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl bg-[var(--vc-secondary)] px-3 text-sm font-bold text-black transition-opacity hover:opacity-90">
            {personal ? <PenLine size={16} aria-hidden /> : <SlidersHorizontal size={16} aria-hidden />}
            <span className="hidden sm:inline">{personal ? 'Personalizar' : 'Elegir'}</span>
          </Link>
        ) : (
          <button type="button" onClick={add} aria-label={`Añadir ${product.name} al carrito`}
            className="inline-flex h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold text-black transition-colors duration-200"
            style={{ background: added ? '#34d399' : 'var(--vc-secondary)' }}>
            {added ? <Check size={17} aria-hidden /> : <ShoppingCart size={16} aria-hidden />}
            <span className="hidden sm:inline">{added ? '¡Listo!' : 'Añadir'}</span>
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Tabela de produtos (busca, categoria, ordem, Tabela | Grade) ─────────────
type Sort = 'featured' | 'price-asc' | 'price-desc' | 'name';
type View = 'table' | 'grid';
const VIEW_KEY = 'kt_store_view';

function Catalog({ products, config, sectionRef }: { products: Product[]; config: SalesPageConfig; sectionRef: React.RefObject<HTMLElement | null> }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState<Sort>('featured');
  const [view, setView] = useState<View>('table');
  useEffect(() => { try { const v = localStorage.getItem(VIEW_KEY); if (v === 'grid' || v === 'table') setView(v); } catch {} }, []);
  const pickView = (v: View) => { setView(v); try { localStorage.setItem(VIEW_KEY, v); } catch {} };

  const cats = useMemo(() => [...new Set(products.map((p) => p.categoryLabel).filter(Boolean))] as string[], [products]);
  const list = useMemo(() => {
    const term = fold(q.trim());
    const out = products.filter((p) => (!cat || p.categoryLabel === cat) && (!term || fold(`${p.name} ${p.categoryLabel ?? ''}`).includes(term)));
    if (sort === 'price-asc') out.sort((a, b) => sortPrice(a) - sortPrice(b));
    else if (sort === 'price-desc') out.sort((a, b) => sortPrice(b) - sortPrice(a));
    else if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return out;
  }, [products, q, cat, sort]);
  const filtered = Boolean(q.trim() || cat);
  const clear = () => { setQ(''); setCat(''); };

  const chip = (label: string, value: string) => {
    const on = cat === value;
    return (
      <button key={label} type="button" onClick={() => setCat(value)} aria-pressed={on}
        className="min-h-10 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-semibold transition-colors duration-200"
        style={{ borderColor: on ? config.neonSecondary : 'rgba(255,255,255,.14)', background: on ? `${config.neonSecondary}26` : 'rgba(255,255,255,.04)', color: on ? '#fff' : 'rgba(255,255,255,.75)' }}>
        {label}
      </button>
    );
  };

  return (
    <section ref={sectionRef} id="productos" className="relative scroll-mt-20 pt-16" aria-labelledby="vc-catalog-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: config.neonPrimary }}>{config.eyebrow}</p>
          <h2 id="vc-catalog-title" className="font-store-display mt-1 text-3xl text-white sm:text-4xl">La colección</h2>
        </div>
        <p className="text-sm text-white/55" aria-live="polite">{list.length} {list.length === 1 ? 'producto' : 'productos'}</p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
          <Sparkles className="mx-auto mb-3" size={28} style={{ color: config.neonSecondary }} aria-hidden />
          <p className="font-store-display text-xl text-white">El drop llega muy pronto</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/55">Estamos preparando las piezas. Vuelve en unos días o síguenos en Instagram para enterarte primero.</p>
        </div>
      ) : (
        <>
          {/* Barra de filtros: fica presa embaixo do cabeçalho no celular */}
          <div style={{ top: storeHeaderOffset(config) }} className="sticky z-20 -mx-4 mb-5 space-y-3 border-y border-white/10 bg-[#0d0418]/85 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:rounded-2xl sm:border">
            <div className="flex items-center gap-2">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Buscar en la colección</span>
                <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45" aria-hidden />
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar llavero, pieza…" enterKeyHint="search"
                  className="h-11 w-full rounded-xl border border-white/12 bg-white/[0.05] pl-10 pr-9 text-base text-white outline-none transition-colors placeholder:text-white/40 focus:border-[var(--vc-secondary)]" />
                {q && (
                  <button type="button" onClick={() => setQ('')} aria-label="Borrar búsqueda" className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-white/55 hover:text-white"><X size={16} aria-hidden /></button>
                )}
              </label>
              <label className="shrink-0">
                <span className="sr-only">Ordenar</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}
                  className="h-11 cursor-pointer rounded-xl border border-white/12 bg-[#1a0f24] px-3 text-sm font-semibold text-white outline-none [color-scheme:dark] focus:border-[var(--vc-secondary)]">
                  <option value="featured">Destacados</option>
                  <option value="price-asc">Precio: menor</option>
                  <option value="price-desc">Precio: mayor</option>
                  <option value="name">Nombre A–Z</option>
                </select>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {chip('Todo', '')}
                {cats.map((c) => chip(c, c))}
              </div>
              <div className="flex shrink-0 rounded-xl border border-white/12 bg-white/[0.04] p-1" role="group" aria-label="Vista">
                {([['table', 'Tabla', Rows3], ['grid', 'Cuadrícula', LayoutGrid]] as const).map(([v, label, Icon]) => (
                  <button key={v} type="button" onClick={() => pickView(v)} aria-pressed={view === v} aria-label={label} title={label}
                    className="flex h-9 w-10 cursor-pointer items-center justify-center rounded-lg transition-colors duration-200"
                    style={{ background: view === v ? config.neonSecondary : 'transparent', color: view === v ? '#000' : 'rgba(255,255,255,.7)' }}>
                    <Icon size={17} aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {list.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
              <p className="text-white/70">Nada con «{q || cat}».</p>
              {filtered && <button type="button" onClick={clear} className="mt-3 inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white hover:bg-white/5"><RotateCcw size={15} aria-hidden /> Ver todo</button>}
            </div>
          ) : view === 'table' ? (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur-sm">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">Productos de {config.title} con precio</caption>
                <thead className="hidden sm:table-header-group">
                  <tr className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                    <th scope="col" className="py-3 pl-4 pr-2 font-bold">Producto</th>
                    <th scope="col" className="hidden px-3 py-3 font-bold md:table-cell">Opciones</th>
                    <th scope="col" className="px-3 py-3 text-right font-bold">Precio</th>
                    <th scope="col" className="py-3 pl-2 pr-4 text-right font-bold"><span className="sr-only">Comprar</span></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => <ProductRow key={p.id} product={p} />)}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {list.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-white/50">
            <Truck size={14} aria-hidden /> Precios con IVA incluido · envío gratis en España desde {FREE_SHIPPING_FROM} €
          </p>
        </>
      )}
    </section>
  );
}

// ─── Produto da capa: moldura com LEDs que correm em volta ────────────────────
function CoverCard({ cover, config }: { cover: Product | null; config: SalesPageConfig }) {
  const { added, add } = useAdd(cover);
  const P = config.neonPrimary;
  const S = config.neonSecondary;
  const cp = cover ? cardPrice(cover.price, cover.personalize, cover.sizes) : null;
  const choice = cover ? needsChoiceOf(cover) : false;
  const img = cover ? imgOf(cover) : null;

  return (
    <div className="relative mx-auto w-full max-w-[340px] lg:mx-0 lg:ml-auto">
      {/* halo */}
      <div aria-hidden className="vc-pulse absolute -inset-6 rounded-[40px] opacity-70 blur-2xl" style={{ background: `radial-gradient(closest-side, ${P}88, transparent)` }} />
      {/* luz girando em volta */}
      <div aria-hidden className="absolute -inset-[3px] overflow-hidden rounded-[30px]">
        <div className="vc-spin absolute -inset-[60%]" style={{ background: `conic-gradient(from 0deg, transparent 0 20%, ${S} 30%, transparent 40% 60%, ${P} 70%, transparent 80%)` }} />
      </div>
      {/* fileira de LEDs correndo (efeito letreiro de lâmpadas) */}
      <svg aria-hidden className="pointer-events-none absolute -inset-[9px] z-20 h-[calc(100%+18px)] w-[calc(100%+18px)] overflow-visible">
        <rect x="0.5%" y="0.5%" width="99%" height="99%" rx="34" pathLength={100} fill="none" stroke={S} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="0.01 2.49" className="vc-chase" style={{ filter: `drop-shadow(0 0 4px ${S})` }} />
        <rect x="0.5%" y="0.5%" width="99%" height="99%" rx="34" pathLength={100} fill="none" stroke={P} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="0.01 2.49" strokeDashoffset={-1.25} className="vc-chase" style={{ filter: `drop-shadow(0 0 4px ${P})` }} />
      </svg>

      <div className="relative z-10 overflow-hidden rounded-[28px] border border-white/15 bg-[#0d0418]/80 p-3 backdrop-blur-xl">
        <div className="relative aspect-square overflow-hidden rounded-[20px] bg-[#1a0f24]">
          {img ? (
            <Image src={img} alt={cover?.name ?? ''} fill priority sizes="(min-width:1024px) 340px, 86vw" className="object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-white/60">
              <Sparkles size={30} style={{ color: S }} aria-hidden />
              <span className="font-store-display text-lg text-white">{config.featureTitle}</span>
            </div>
          )}
          <div aria-hidden className="vc-pulse pointer-events-none absolute inset-0" style={{ boxShadow: `inset 0 0 70px ${P}66` }} />
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur" style={{ color: S }}>Destacado</span>
        </div>
        <div className="px-1.5 pb-1 pt-3.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: S }}>{config.coverTagline}</p>
          <h2 className="mt-1 line-clamp-2 text-lg font-bold leading-snug text-white">{cover?.name || config.featureTitle}</h2>
          {cover && cp ? (
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                {cp.was && <p className="text-[11px] text-white/45"><s>{cp.was}</s> · {cp.sub}</p>}
                <p className="text-2xl font-bold text-white">{cp.main}</p>
              </div>
              {choice ? (
                <Link href={hrefOf(cover)} className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-black transition-opacity hover:opacity-90" style={{ background: `linear-gradient(90deg, ${S}, ${P})` }}>
                  <PenLine size={16} aria-hidden /> {cover.personalize?.enabled ? 'Personalizar' : 'Elegir'}
                </Link>
              ) : (
                <button type="button" onClick={add} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-bold text-black transition-opacity hover:opacity-90" style={{ background: added ? '#34d399' : `linear-gradient(90deg, ${S}, ${P})` }}>
                  {added ? <><Check size={17} aria-hidden /> ¡Listo!</> : <><ShoppingCart size={16} aria-hidden /> Añadir</>}
                </button>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-white/65">{config.featureText}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="min-w-[3rem] rounded-xl border border-white/15 bg-black/45 px-2 py-1.5 text-center text-2xl font-bold tabular-nums text-white backdrop-blur">{String(value).padStart(2, '0')}</span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/55">{label}</span>
    </div>
  );
}

export function ViceCityStore({ config, products, cover, preview }: Props) {
  const cd = useCountdown(config.countdownTo);
  const catalogRef = useRef<HTMLElement>(null);
  const art = storeArt(config);
  const P = config.neonPrimary;
  const S = config.neonSecondary;
  const vars = { '--vc-primary': P, '--vc-secondary': S } as React.CSSProperties;
  const toCatalog = () => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div style={vars} data-kt-store={config.slug} className={`${storeFontClass} relative min-h-screen overflow-x-clip bg-[#0d0418] text-white`}>
      <style>{`
        @keyframes vc-spin { to { transform: rotate(360deg); } }
        @keyframes vc-chase { to { stroke-dashoffset: -2.5; } }
        @keyframes vc-pulse { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
        .vc-spin { animation: vc-spin 5s linear infinite; }
        .vc-chase { animation: vc-chase .9s linear infinite; }
        .vc-pulse { animation: vc-pulse 2.8s ease-in-out infinite; }
        @media (min-width: 1024px) {
          .vc-photo { -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 32%); mask-image: linear-gradient(90deg, transparent 0%, #000 32%); }
        }
        @media (prefers-reduced-motion: reduce) { .vc-spin, .vc-chase, .vc-pulse { animation: none !important; } }
      `}</style>

      <StoreHeader store={config} overlay onCatalog={toCatalog} />

      {/* ── CAPA ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate">
        {/* fundo desfocado da mesma arte (computador) */}
        <div aria-hidden className="absolute inset-0 -z-10 hidden overflow-hidden lg:block">
          <div className="absolute -inset-20 bg-cover bg-center opacity-70 blur-[60px]" style={{ backgroundImage: `url(${art.ambient})` }} />
        </div>
        {/* a foto real: tela cheia no celular, painel à direita no computador */}
        <div className="vc-photo absolute inset-x-0 top-0 -z-10 h-[94svh] lg:inset-y-0 lg:left-auto lg:h-auto lg:w-[58%]">
          <Image
            src={art.hero}
            alt=""
            fill
            priority
            sizes="(min-width:1024px) 58vw, 100vw"
            placeholder={art.blur ? 'blur' : 'empty'}
            blurDataURL={art.blur || undefined}
            className="object-cover object-[50%_28%]"
          />
        </div>
        {/* estilo: lavagem de cor, scanlines, vinheta e degradês de leitura */}
        <div aria-hidden className="absolute inset-0 -z-10 mix-blend-soft-light" style={{ background: `linear-gradient(155deg, ${P}80 0%, transparent 45%, ${S}66 100%)` }} />
        <div aria-hidden className="absolute inset-0 -z-10 opacity-[0.16]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,.7) 0 1px, transparent 1px 3px)' }} />
        <div aria-hidden className="absolute inset-0 -z-10 lg:hidden" style={{ background: `linear-gradient(180deg, ${BG}99 0%, transparent 16%, transparent 34%, ${BG}d9 62%, ${BG} 86%)` }} />
        <div aria-hidden className="absolute inset-0 -z-10 hidden lg:block" style={{ background: `linear-gradient(90deg, ${BG} 0%, ${BG}eb 30%, ${BG}66 52%, transparent 72%), linear-gradient(180deg, ${BG}80 0%, transparent 14%, transparent 78%, ${BG} 100%)` }} />

        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-[48svh] sm:pt-[52svh] lg:min-h-[100svh] lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-6 lg:pb-20 lg:pt-28">
          <div className="text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] backdrop-blur-md" style={{ color: S }}>
              <span className="vc-pulse inline-flex h-2 w-2 rounded-full" style={{ background: S, boxShadow: `0 0 10px ${S}` }} aria-hidden />
              {config.badge || config.eyebrow}
            </p>
            <h1 className="font-store-display mt-5 text-[46px] uppercase leading-[0.9] sm:text-7xl lg:text-[92px]">
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(95deg, #fff 0%, ${S} 45%, ${P} 100%)`, filter: `drop-shadow(0 0 22px ${P}99)` }}>
                {config.heading}
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg lg:mx-0">{config.subtitle}</p>

            {cd && (
              <div className="mt-6 inline-flex flex-col items-center gap-2 rounded-2xl border border-white/12 bg-black/35 px-5 py-3 backdrop-blur-md lg:items-start" aria-label={`${config.countdownLabel}: ${cd.d} días, ${cd.h} horas, ${cd.m} minutos`}>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">{config.countdownLabel}</span>
                <div className="flex items-start gap-1.5" aria-hidden>
                  <TimeBox value={cd.d} label="días" /><span className="pt-2 text-white/40">:</span>
                  <TimeBox value={cd.h} label="hrs" /><span className="pt-2 text-white/40">:</span>
                  <TimeBox value={cd.m} label="min" /><span className="pt-2 text-white/40">:</span>
                  <TimeBox value={cd.s} label="seg" />
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <button type="button" onClick={toCatalog}
                className="group inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-7 py-3 text-base font-bold uppercase tracking-wide text-black transition-opacity hover:opacity-95 sm:w-auto"
                style={{ background: `linear-gradient(90deg, ${S}, ${P})`, boxShadow: `0 10px 34px ${P}66` }}>
                {config.ctaLabel} <ArrowRight size={19} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              </button>
              <p className="flex items-center gap-1.5 text-sm text-white/70"><Truck size={16} aria-hidden /> Envío gratis desde {FREE_SHIPPING_FROM} €</p>
            </div>
          </div>

          {/* Sem produto ainda: nada de cartão vazio — a foto real ocupa o lado direito. */}
          {cover && <CoverCard cover={cover} config={config} />}
        </div>
      </section>

      <div className="relative">
        {/* fundo da vitrine: a mesma arte da capa, parada atrás enquanto a página rola
            (sticky funciona no iPhone; background-attachment: fixed não) */}
        <div aria-hidden className="pointer-events-none sticky top-0 -mb-[100svh] h-[100svh] overflow-hidden">
          <Image src={art.hero} alt="" fill sizes="100vw" className="scale-105 object-cover object-[50%_30%] opacity-45 blur-[3px]" />
          <div className="absolute inset-0 mix-blend-soft-light" style={{ background: `linear-gradient(155deg, ${P}80 0%, transparent 50%, ${S}66 100%)` }} />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${BG} 0%, ${BG}c7 22%, ${BG}a6 60%, ${BG}d9 100%)` }} />
          <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,.7) 0 1px, transparent 1px 3px)' }} />
        </div>
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24">
        {/* ── Selos (padrão europeu) ──────────────────────────────────────── */}
        <section aria-label="Compra segura" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { icon: Truck, t: 'Envío con seguimiento', s: `Gratis desde ${FREE_SHIPPING_FROM} € en España` },
            { icon: CreditCard, t: 'Pago en segundos', s: 'Bizum · Apple Pay · Google Pay' },
            { icon: RotateCcw, t: 'Devolución 14 días', s: 'Compra protegida en la UE' },
            { icon: ShieldCheck, t: 'Hecho en España', s: 'Impreso en 3D · IVA incluido' },
          ].map(({ icon: Icon, t, s }) => (
            <div key={t} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${S}1f`, color: S }}><Icon size={20} aria-hidden /></span>
              <div className="min-w-0"><p className="text-sm font-semibold leading-tight text-white">{t}</p><p className="mt-0.5 text-xs leading-snug text-white/55">{s}</p></div>
            </div>
          ))}
        </section>

        <Catalog products={products} config={config} sectionRef={catalogRef} />

        {/* ── Como comprar (fluxo do Instagram ao pagamento) ──────────────── */}
        <section className="mt-16" aria-labelledby="vc-how">
          <h2 id="vc-how" className="font-store-display text-center text-2xl text-white sm:text-3xl">Comprar es así de rápido</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { n: '01', t: 'Elige tu pieza', s: 'Toca el producto que te gusta: fotos reales y precio final con IVA.' },
              { n: '02', t: 'Ponle tu nombre', s: 'Si es personalizable, escribe el nombre y míralo en la foto al momento.' },
              { n: '03', t: 'Paga en segundos', s: 'Sin crear cuenta. Bizum, Apple Pay, Google Pay o tarjeta.' },
            ].map((step) => (
              <li key={step.n} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <span className="font-store-display text-4xl" style={{ color: P, textShadow: `0 0 18px ${P}88` }}>{step.n}</span>
                <p className="mt-2 text-base font-semibold text-white">{step.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/60">{step.s}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
      </div>

      <StoreFooter store={config} />

      {preview && (
        <p role="status" className="fixed inset-x-3 bottom-3 z-50 flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-black shadow-lg sm:inset-x-auto sm:left-4 sm:max-w-sm">
          <Eye size={15} className="shrink-0" aria-hidden /> Vista previa: tienda en borrador, solo tú la ves. Publícala en Admin → Editar loja.
        </p>
      )}
    </div>
  );
}
