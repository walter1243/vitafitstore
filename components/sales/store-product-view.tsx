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
import { useCart } from '@/lib/cart-context';
import type { Product } from '@/lib/products';
import { deliveryText } from '@/lib/delivery';
import { DEFAULT_ENTREGA, type EntregaContent } from '@/lib/site-content-defaults';
import { DEFAULT_NAME_COLORS, cleanCustomText, lineTotalFor, minQtyFor, nameRequiredFor, packOf, parsePersonalize, sizeRange, sizedPrice } from '@/lib/personalize';
import { NamePersonalizer, NamePreview } from '@/components/personalize/name-personalizer';
import { FREE_SHIPPING_FROM } from '@/lib/checkout-pricing';
import { storeArt, storePath, type SalesPageConfig } from '@/lib/sales-pages-shared';
import { ProductCard } from '@/components/sales/vice-city-store';
import { flyToCart } from '@/lib/fly-to-cart';
import { useStoreContact, waLink } from '@/components/sales/store-chrome';

type Store = Pick<SalesPageConfig, 'slug' | 'title' | 'neonPrimary' | 'neonSecondary' | 'theme' | 'backgroundImage'> & { whatsappEnabled?: boolean; whatsappNumber?: string };

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
  const { phone } = useStoreContact(store);
  const canWhatsApp = store.whatsappEnabled !== false && Boolean(phone);

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
  const galleryEl = useRef<HTMLDivElement>(null);
  function add() {
    if (blocked) return;
    addItem(product, variant, qty, { openCart: false });
    void flyToCart(galleryEl.current, activeImage || product.mainImage || product.image);
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

  // Mensagem pronta: produto, nome escrito, cor/tamanho e o link do produto.
  function orderByWhatsApp() {
    const lines = [
      `¡Hola ${store.title}! Quiero el «${product.name}» personalizado.`,
      `Nombre: ${cleanCustomText(customName, pcfg.maxLength) || '(lo escribo aquí)'}`,
      selectedColor && product.colorOptions?.length ? `Color: ${selectedColor}` : '',
      needsSize && selectedSize ? `Tamaño: ${selectedSize}` : '',
      window.location.href,
    ].filter(Boolean);
    window.open(waLink(phone, lines.join('\n')), '_blank', 'noopener');
  }

  const BTN = 'inline-flex h-12 cursor-pointer items-center justify-center rounded-md px-5 text-sm font-bold uppercase tracking-[0.12em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

  return (
    <div className="relative overflow-x-clip bg-[#0b0614] text-white" style={{ ['--vc-primary' as string]: P, ['--vc-secondary' as string]: S }}>
      {/* fundo: a arte da loja desfocada no topo, sumindo no escuro */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[75vh] overflow-hidden">
        <div className="absolute -inset-16 bg-cover bg-center opacity-55 blur-[56px]" style={{ backgroundImage: `url(${art.ambient})` }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 0%, #0b061499 45%, #0b0614 100%)' }} />
      </div>

      <div className={`relative z-10 mx-auto max-w-6xl px-4 pt-6 ${personalized ? 'pb-16' : 'pb-32 lg:pb-16'}`}>
        <nav aria-label="Ruta" className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
          <Link href={storePath(store.slug)} className="transition-colors hover:text-white">{store.title}</Link>
          <span className="px-2 text-white/30">/</span>
          <Link href={`${storePath(store.slug)}#productos`} className="transition-colors hover:text-white">Productos</Link>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          {/* Galeria */}
          <div className="min-w-0">
            <div
              ref={galleryEl}
              className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[#1a1024]"
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
                <p className="absolute bottom-3 right-3 rounded bg-black/60 px-2.5 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur">{active + 1} / {images.length}</p>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {images.map((src, i) => (
                  <button key={src} type="button" onClick={() => go(i)} aria-label={`Ver foto ${i + 1}`}
                    className="relative h-20 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 bg-[#1a1024] transition-colors"
                    style={{ borderColor: i === active ? '#fff' : 'transparent', opacity: i === active ? 1 : 0.6 }}>
                    <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Compra */}
          <div className="min-w-0">
            {product.categoryLabel && <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">{product.categoryLabel}</p>}
            <h1 className="font-store-display mt-2 text-5xl uppercase leading-[0.95] sm:text-6xl">{product.name}</h1>
            <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="font-store-display text-5xl leading-none">{priceLabel}</p>
              {pack && <span className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">Pack {pack.qty} uds</span>}
              <span className="text-sm text-white/50">IVA incluido</span>
            </div>
            {eta && <p className="mt-3 text-sm text-white/70">{eta}</p>}

            {/* Cores */}
            {!!product.colorOptions?.length && (
              <fieldset className="mt-8">
                <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Color · <span className="text-white">{selectedColor}</span></legend>
                <div className="flex flex-wrap gap-2.5">
                  {product.colorOptions.map((c) => {
                    const on = c.label === selectedColor;
                    return (
                      <button key={c.label} type="button" onClick={() => pickColor(c.label, c.image)} aria-pressed={on} aria-label={c.label} title={c.label}
                        className="relative h-12 w-12 cursor-pointer overflow-hidden rounded-md border-2 transition-colors"
                        style={{ borderColor: on ? '#fff' : 'rgba(255,255,255,.15)', background: c.hex || '#333' }}>
                        {c.image && <Image src={c.image} alt="" fill sizes="48px" className="object-cover" />}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {/* Tamanhos */}
            {needsSize && (
              <fieldset className="mt-8">
                <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{sizeWord === 'tamaño' ? 'Tamaño' : 'Talla'}</legend>
                <div className="flex flex-wrap gap-2.5">
                  {product.sizes!.map((size) => {
                    const on = size === selectedSize;
                    const sp = pcfg.sizePrices[size];
                    return (
                      <button key={size} type="button" onClick={() => setSelectedSize(size)} aria-pressed={on}
                        className={`min-h-12 min-w-16 cursor-pointer rounded-md border px-4 py-2 text-sm font-bold uppercase transition-colors ${on ? 'border-white bg-white text-[#0b0614]' : 'border-white/20 text-white hover:border-white/60'}`}>
                        {size}
                        {sp > 0 && <span className={`block text-xs font-semibold normal-case ${on ? 'text-[#0b0614]/70' : 'text-white/55'}`}>{eur(sp)}</span>}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {/* Observação do cliente */}
            {pcfg.askNote && (
              <div className="mt-8">
                <label htmlFor="obs-store" className="mb-3 block text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Observaciones{pcfg.noteRequired ? ' *' : ' (opcional)'}</label>
                <textarea id="obs-store" value={obs} onChange={(e) => setObs(e.target.value.slice(0, 250))} rows={3}
                  placeholder={pcfg.notePlaceholder || 'Ej: color y nombre de cada uno'}
                  className="w-full resize-none rounded-md border border-white/20 bg-white/5 px-3 py-2.5 text-base text-white outline-none placeholder:text-white/35 focus:border-white" />
              </div>
            )}

            {/* Nome personalizado: mesmo personalizador da loja, num cartão claro */}
            {personalized ? (
              <div className="mt-8 rounded-lg bg-white p-4 text-slate-900">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{nameOptional ? 'Ponle un nombre (opcional)' : 'Escribe el nombre'}</p>
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
                {canWhatsApp && (
                  <button type="button" onClick={orderByWhatsApp}
                    className="mt-3 h-12 w-full cursor-pointer rounded-md border border-slate-300 text-sm font-bold uppercase tracking-[0.1em] text-slate-800 transition-colors hover:border-[#25D366] hover:text-[#128C4B]">
                    ¿Prefieres pedirlo por WhatsApp?
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-8 hidden lg:block">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Cantidad</span>
                  <div className="flex items-center rounded-md border border-white/20">
                    <button type="button" onClick={() => setQty(Math.max(minQty, qty - step))} disabled={qty <= minQty} aria-label="Menos"
                      className="h-11 w-11 cursor-pointer text-xl text-white disabled:opacity-30">−</button>
                    <span className="w-10 text-center font-bold tabular-nums">{qty}</span>
                    <button type="button" onClick={() => setQty(qty + step)} aria-label="Más"
                      className="h-11 w-11 cursor-pointer text-xl text-white">+</button>
                  </div>
                </div>
                {blocked && <p className="mt-3 text-sm font-semibold text-white">{blocked}</p>}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button type="button" onClick={add} disabled={Boolean(blocked)}
                    className={`${BTN} border border-white text-white hover:bg-white hover:text-[#0b0614]`}>
                    {added ? 'Añadido' : 'Añadir al carrito'}
                  </button>
                  <button type="button" onClick={buyNow} disabled={Boolean(blocked)}
                    className={`${BTN} bg-white text-[#0b0614] hover:bg-[var(--vc-primary)]`}>
                    Comprar · {lineTotal.toFixed(2).replace('.', ',')} €
                  </button>
                </div>
              </div>
            )}

            {/* Condições (padrão europeu), só texto */}
            <dl className="mt-8 divide-y divide-white/10 border-y border-white/10 text-sm">
              {[
                ['Envío', `Con seguimiento · gratis en España desde ${FREE_SHIPPING_FROM} €`],
                ['Pago', 'Bizum, Apple Pay, Google Pay o tarjeta'],
                ['Devolución', '14 días'],
                ['Fabricación', 'Impreso en 3D en España'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-4 py-3">
                  <dt className="w-28 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">{k}</dt>
                  <dd className="text-white/80">{v}</dd>
                </div>
              ))}
            </dl>

            {product.description && (
              <div className="mt-8">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Descripción</h2>
                <div
                  className="max-w-none text-base leading-relaxed text-white/75 [&_a]:underline [&_h2]:mt-4 [&_h2]:font-bold [&_h2]:text-white [&_h3]:mt-3 [&_h3]:font-bold [&_h3]:text-white [&_img]:my-3 [&_img]:rounded-md [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3 [&_strong]:text-white"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="font-store-display border-b border-white/10 pb-4 text-4xl uppercase sm:text-5xl">Más de la colección</h2>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      {/* Celular: barra fixa de compra (produto sem nome — o personalizado compra no cartão) */}
      {!personalized && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0614]/95 px-4 py-3 backdrop-blur-md lg:hidden" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">{blocked || 'Total'}</p>
              <p className="font-store-display truncate text-2xl leading-tight">{range && range.min !== range.max ? priceLabel : eur(lineTotal)}</p>
            </div>
            <button type="button" onClick={add} disabled={Boolean(blocked)}
              className={`${BTN} border border-white px-4 text-white`}>
              {added ? 'Añadido' : 'Añadir'}
            </button>
            <button type="button" onClick={buyNow} disabled={Boolean(blocked)}
              className={`${BTN} bg-white px-4 text-[#0b0614]`}>
              Comprar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
