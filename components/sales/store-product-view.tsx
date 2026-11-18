'use client';

// Página de produto das lojas próprias (ex.: VICE CITY STORE) — visual neon,
// enxuta e mobile-first, pensada para quem chega do Instagram:
//   foto → escolhe cor/tamanho → escreve o nome (se personalizável) →
//   "Añadir" ou "Comprar ahora" (vai direto ao checkout express).
// Mesmo carrinho, mesma personalização (NamePersonalizer) e mesmo checkout
// Stripe da Kitoys (Bizum, Apple/Google Pay, IVA incluido, envío +25€).

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, ShieldCheck, ShoppingCart, Truck, Zap } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import type { Product } from '@/lib/products';
import { deliveryText } from '@/lib/delivery';
import { DEFAULT_ENTREGA, type EntregaContent } from '@/lib/site-content-defaults';
import { DEFAULT_NAME_COLORS, cleanCustomText, lineTotalFor, minQtyFor, nameRequiredFor, packOf, parsePersonalize, sizeRange, sizedPrice } from '@/lib/personalize';
import { NamePersonalizer, NamePreview } from '@/components/personalize/name-personalizer';
import { FREE_SHIPPING_FROM } from '@/lib/checkout-pricing';
import { storeArt, storePath, type SalesPageConfig } from '@/lib/sales-pages-shared';
import { ProductCard } from '@/components/sales/vice-city-store';

type Store = Pick<SalesPageConfig, 'slug' | 'title' | 'neonPrimary' | 'neonSecondary' | 'theme' | 'backgroundImage'>;

const eur = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;

export function StoreProductView({ product, store, entrega, related }: {
  product: Product;
  store: Store;
  entrega?: Partial<EntregaContent>;
  related: Product[];
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const P = store.neonPrimary;
  const S = store.neonSecondary;
  const art = storeArt(store);

  // Personalização com nome (chaveiro): mesmas regras da Kitoys.
  const pcfg = parsePersonalize(product.personalize);
  const personalized = Boolean(product.personalize?.enabled);
  const nameOptional = !nameRequiredFor(pcfg, 'llaveros');
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState((pcfg.colors[0] ?? DEFAULT_NAME_COLORS[0]).hex);

  // Galeria: foto base da personalização (se houver), fotos extras e fotos das cores.
  const pBase = personalized ? (pcfg.previewImage || '') : '';
  const images = useMemo(
    () => [...new Set([pBase || product.mainImage || product.image, ...(product.additionalImages ?? []), ...(product.colorOptions ?? []).map((c) => c.image)].filter(Boolean) as string[])],
    [pBase, product.mainImage, product.image, product.additionalImages, product.colorOptions],
  );
  const [active, setActive] = useState(0);
  const activeImage = images[active] ?? images[0];
  const touchX = useRef<number | null>(null);
  const go = (i: number) => setActive(((i % images.length) + images.length) % images.length);

  const [selectedColor, setSelectedColor] = useState(product.colorOptions?.[0]?.label ?? '');
  const colorImages = (product.colorOptions ?? []).map((c) => c.image).filter(Boolean) as string[];
  function pickColor(label: string, image?: string) {
    setSelectedColor(label);
    if (image) { const i = images.indexOf(image); if (i >= 0) setActive(i); }
  }

  const needsSize = Boolean(product.productType && product.productType !== 'estandar' && product.sizes?.length);
  const [selectedSize, setSelectedSize] = useState('');
  const sizeWord = product.productType === 'tamanho' ? 'tamaño' : 'talla';

  const [obs, setObs] = useState('');
  const obsMissing = pcfg.askNote && pcfg.noteRequired && !obs.trim();
  const obsNote = pcfg.askNote && obs.trim() ? `Obs: ${obs.trim().replace(/\s+/g, ' ')}` : undefined;

  const pack = packOf(product.personalize);
  const step = pack?.qty ?? 1;
  const [qty, setQty] = useState(Math.max(step, minQtyFor(product.personalize)));
  const minQty = Math.max(step, minQtyFor(product.personalize));

  const base = sizedPrice(product.price, product.personalize, selectedSize);
  const lineTotal = lineTotalFor(base, product.personalize, qty);
  const range = needsSize && !selectedSize ? sizeRange(product.price, product.personalize, product.sizes) : null;
  const priceLabel = range && range.min !== range.max ? `desde ${eur(range.min)}` : pack ? eur(pack.price) : eur(base);

  const blocked = needsSize && !selectedSize ? `Elige ${sizeWord === 'tamaño' ? 'un tamaño' : 'una talla'}` : obsMissing ? 'Escribe las observaciones' : '';
  const variant = { color: product.colorOptions?.length ? selectedColor : undefined, size: needsSize ? selectedSize : undefined, note: obsNote };

  const [added, setAdded] = useState(false);
  function add() {
    if (blocked) return;
    addItem(product, variant, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }
  function buyNow() {
    if (blocked) return;
    addItem(product, variant, qty);
    router.push('/checkout');
  }

  // Previsão de entrega calculada no navegador (data do cliente).
  const [eta, setEta] = useState('');
  useEffect(() => { if ({ ...DEFAULT_ENTREGA, ...entrega }.enabled) setEta(deliveryText(entrega, personalized)); }, [entrega, personalized]);

  const showNameOnPhoto = personalized && (active === 0 || colorImages.includes(activeImage));

  return (
    <div className="relative overflow-x-clip bg-[#140720] text-white" style={{ ['--vc-primary' as string]: P, ['--vc-secondary' as string]: S }}>
      {/* fundo: a arte da loja desfocada no topo, sumindo no escuro */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[75vh] overflow-hidden">
        <div className="absolute -inset-16 bg-cover bg-center opacity-60 blur-[56px]" style={{ backgroundImage: `url(${art.ambient})` }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 0%, #14072099 45%, #140720 100%), radial-gradient(80% 60% at 85% 0%, ${P}33, transparent 70%)` }} />
      </div>

      <div className={`relative z-10 mx-auto max-w-6xl px-4 pt-5 ${personalized ? 'pb-16' : 'pb-32 lg:pb-16'}`}>
        <Link href={storePath(store.slug)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 transition-colors hover:text-white">
          <ArrowLeft size={14} aria-hidden /> {store.title}
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          {/* Galeria */}
          <div className="min-w-0">
            <div className="relative">
              <div aria-hidden className="absolute -inset-[2px] rounded-[26px] opacity-80" style={{ background: `linear-gradient(135deg, ${S}, transparent 40%, transparent 60%, ${P})`, filter: 'blur(5px)' }} />
              <div
                className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-[#1a0f24]"
                onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
                onTouchEnd={(e) => {
                  if (touchX.current === null || images.length < 2) return;
                  const dx = e.changedTouches[0].clientX - touchX.current;
                  if (dx > 40) go(active - 1); else if (dx < -40) go(active + 1);
                  touchX.current = null;
                }}
              >
                {showNameOnPhoto ? (
                  // O nome do cliente aparece na própria foto do chaveiro.
                  <div className="absolute inset-0 bg-white">
                    <NamePreview cfg={{ ...pcfg, previewImage: activeImage, color: customColor || pcfg.color }} product={product} text={cleanCustomText(customName, pcfg.maxLength)} placeholder="Lucía" swingKey={0} stage="#ffffff" />
                  </div>
                ) : activeImage ? (
                  <Image key={activeImage} src={activeImage} alt={product.name} fill priority sizes="(min-width:1024px) 560px, 100vw" className="object-cover" />
                ) : null}
                {images.length > 1 && (
                  <>
                    <button type="button" onClick={() => go(active - 1)} aria-label="Foto anterior" className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70 sm:flex"><ChevronLeft size={20} aria-hidden /></button>
                    <button type="button" onClick={() => go(active + 1)} aria-label="Foto siguiente" className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70 sm:flex"><ChevronRight size={20} aria-hidden /></button>
                    <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:hidden">
                      {images.map((_, i) => <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === active ? 18 : 6, background: i === active ? S : 'rgba(255,255,255,.45)' }} />)}
                    </div>
                  </>
                )}
              </div>
            </div>
            {images.length > 1 && (
              <div className="mt-3 hidden gap-2 overflow-x-auto pb-1 sm:flex">
                {images.map((src, i) => (
                  <button key={src} type="button" onClick={() => go(i)} aria-label={`Ver foto ${i + 1}`}
                    className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 bg-[#1a0f24] transition-colors"
                    style={{ borderColor: i === active ? S : 'rgba(255,255,255,.1)' }}>
                    <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Compra */}
          <div className="min-w-0">
            {product.categoryLabel && <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: S }}>{product.categoryLabel}</p>}
            <h1 className="font-store-display mt-1 text-3xl leading-tight sm:text-4xl">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-3xl font-black" style={{ textShadow: `0 0 18px ${P}88` }}>{priceLabel}</p>
              {pack && <span className="rounded-md px-2 py-0.5 text-xs font-bold text-black" style={{ background: S }}>Pack {pack.qty} uds</span>}
              <span className="text-xs text-white/45">IVA incluido</span>
            </div>

            {eta && <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80"><Truck size={14} aria-hidden /> {eta}</p>}

            {/* Cores */}
            {!!product.colorOptions?.length && (
              <fieldset className="mt-6">
                <legend className="mb-2 text-sm font-semibold text-white/80">Color: <span className="text-white">{selectedColor}</span></legend>
                <div className="flex flex-wrap gap-2">
                  {product.colorOptions.map((c) => {
                    const on = c.label === selectedColor;
                    return (
                      <button key={c.label} type="button" onClick={() => pickColor(c.label, c.image)} aria-pressed={on}
                        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 bg-white/5 py-1 pl-1 pr-3 text-sm font-semibold transition-colors"
                        style={{ borderColor: on ? S : 'rgba(255,255,255,.12)' }}>
                        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/20" style={{ background: c.hex || '#333' }}>
                          {c.image && <Image src={c.image} alt="" fill sizes="32px" className="object-cover" />}
                        </span>
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {/* Tamanhos */}
            {needsSize && (
              <fieldset className="mt-6">
                <legend className="mb-2 text-sm font-semibold text-white/80">Elige {sizeWord === 'tamaño' ? 'el tamaño' : 'la talla'}</legend>
                <div className="flex flex-wrap gap-2">
                  {product.sizes!.map((size) => {
                    const on = size === selectedSize;
                    const sp = pcfg.sizePrices[size];
                    return (
                      <button key={size} type="button" onClick={() => setSelectedSize(size)} aria-pressed={on}
                        className="min-h-11 min-w-14 cursor-pointer rounded-xl border-2 px-3 py-1.5 text-sm font-bold transition-colors"
                        style={{ borderColor: on ? S : 'rgba(255,255,255,.12)', background: on ? `${S}22` : 'rgba(255,255,255,.04)' }}>
                        {size}
                        {sp > 0 && <span className="block text-[11px] font-semibold text-white/60">{eur(sp)}</span>}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {/* Observação do cliente */}
            {pcfg.askNote && (
              <div className="mt-6">
                <label htmlFor="obs-store" className="mb-2 block text-sm font-semibold text-white/80">Observaciones{pcfg.noteRequired ? ' *' : ' (opcional)'}</label>
                <textarea id="obs-store" value={obs} onChange={(e) => setObs(e.target.value.slice(0, 250))} rows={3}
                  placeholder={pcfg.notePlaceholder || 'Ej: color y nombre de cada uno'}
                  className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-base text-white outline-none placeholder:text-white/35 focus:border-[var(--vc-secondary)]" />
              </div>
            )}

            {/* Nome personalizado: mesmo personalizador da loja, num cartão claro */}
            {personalized ? (
              <div className="mt-6 rounded-2xl bg-white p-4 text-slate-900 shadow-[0_0_40px_rgba(0,0,0,.35)]">
                <p className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide" style={{ color: P }}>
                  <Zap size={15} aria-hidden /> {nameOptional ? 'Ponle un nombre (opcional)' : 'Escribe el nombre'}
                </p>
                <NamePersonalizer
                  product={product}
                  look="llaveros"
                  compact
                  showPreview={false}
                  name={customName}
                  onName={(v) => { setCustomName(v); if (!showNameOnPhoto) setActive(0); }}
                  color={customColor}
                  onColor={(hex) => setCustomColor(hex)}
                  variant={variant}
                  basePrice={base}
                  optional={nameOptional}
                  onBuyNow={() => router.push('/checkout')}
                  blocked={blocked || undefined}
                />
              </div>
            ) : (
              <div className="mt-6 hidden lg:block">
                <BuyBox qty={qty} setQty={setQty} step={step} minQty={minQty} total={lineTotal} blocked={blocked} added={added} onAdd={add} onBuy={buyNow} P={P} S={S} />
              </div>
            )}

            {/* Selos (padrão europeu) */}
            <ul className="mt-6 grid gap-2 text-sm text-white/75 sm:grid-cols-2">
              <li className="flex items-center gap-2"><Truck size={16} style={{ color: S }} aria-hidden /> Envío gratis desde {FREE_SHIPPING_FROM} € en España</li>
              <li className="flex items-center gap-2"><ShieldCheck size={16} style={{ color: S }} aria-hidden /> Bizum · Apple Pay · Google Pay · tarjeta</li>
              <li className="flex items-center gap-2"><RotateCcw size={16} style={{ color: S }} aria-hidden /> Devolución en 14 días</li>
              <li className="flex items-center gap-2"><Zap size={16} style={{ color: S }} aria-hidden /> Impreso en 3D en España</li>
            </ul>

            {product.description && (
              <div className="mt-8 border-t border-white/10 pt-6">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-white/60">Descripción</h2>
                <div
                  className="max-w-none text-[15px] leading-relaxed text-white/75 [&_a]:underline [&_h2]:mt-4 [&_h2]:font-bold [&_h2]:text-white [&_h3]:mt-3 [&_h3]:font-bold [&_h3]:text-white [&_img]:my-3 [&_img]:rounded-xl [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3 [&_strong]:text-white"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 text-2xl font-black uppercase italic">Más de la colección</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      {/* Celular: barra fixa de compra (produto sem nome — o personalizado compra no cartão) */}
      {!personalized && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#120818]/95 px-4 py-3 backdrop-blur-md lg:hidden" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <div className="mx-auto flex max-w-6xl items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-white/50">{blocked || 'Total'}</p>
              <p className="truncate text-lg font-black">{range && range.min !== range.max ? priceLabel : eur(lineTotal)}</p>
            </div>
            <button type="button" onClick={add} disabled={Boolean(blocked)} aria-label="Añadir al carrito"
              className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-white/20 bg-white/5 text-white disabled:cursor-not-allowed disabled:opacity-40">
              {added ? <Check size={20} aria-hidden /> : <ShoppingCart size={19} aria-hidden />}
            </button>
            <button type="button" onClick={buyNow} disabled={Boolean(blocked)}
              className="h-12 shrink-0 cursor-pointer rounded-2xl px-5 text-sm font-black uppercase tracking-wide text-black disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: `linear-gradient(90deg, ${S}, ${P})`, boxShadow: `0 0 20px ${P}66` }}>
              Comprar ahora
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BuyBox({ qty, setQty, step, minQty, total, blocked, added, onAdd, onBuy, P, S }: {
  qty: number; setQty: (n: number) => void; step: number; minQty: number; total: number;
  blocked: string; added: boolean; onAdd: () => void; onBuy: () => void; P: string; S: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-white/70">Cantidad</span>
        <div className="flex items-center rounded-xl border border-white/15">
          <button type="button" onClick={() => setQty(Math.max(minQty, qty - step))} disabled={qty <= minQty} aria-label="Menos"
            className="flex h-11 w-11 cursor-pointer items-center justify-center text-white disabled:opacity-30"><Minus size={16} aria-hidden /></button>
          <span className="w-10 text-center font-bold tabular-nums">{qty}</span>
          <button type="button" onClick={() => setQty(qty + step)} aria-label="Más"
            className="flex h-11 w-11 cursor-pointer items-center justify-center text-white"><Plus size={16} aria-hidden /></button>
        </div>
      </div>
      {blocked && <p className="mt-3 text-sm font-semibold" style={{ color: S }}>{blocked}</p>}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={onAdd} disabled={Boolean(blocked)}
          className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">
          {added ? <><Check size={17} aria-hidden /> ¡Añadido!</> : <><ShoppingCart size={17} aria-hidden /> Añadir</>}
        </button>
        <button type="button" onClick={onBuy} disabled={Boolean(blocked)}
          className="h-12 cursor-pointer rounded-2xl text-sm font-black uppercase tracking-wide text-black transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: `linear-gradient(90deg, ${S}, ${P})`, boxShadow: `0 0 22px ${P}66` }}>
          Comprar · {total.toFixed(2).replace('.', ',')} €
        </button>
      </div>
    </div>
  );
}
