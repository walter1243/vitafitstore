'use client';

// Carrinho lateral das lojas próprias (ex.: VICE CITY STORE), no mesmo visual
// da loja: fundo escuro com a arte da capa desfocada, Anton + Barlow, botões
// brancos com texto, sem ícones. As regras são as mesmas do carrinho da Kitoys
// (components/cart-sidebar.tsx): quantidades/packs, nome, frete da Packlink,
// barra do envío gratis e o mesmo checkout.

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SAMPLE_ZIP, loadMethod, loadZip, useShipQuote, type ShipMethod } from '@/components/shipping/shipping-options';
import { useCart } from '@/lib/cart-context';
import { FREE_SHIPPING_FROM as FREE_SHIPPING, resolveShipping } from '@/lib/checkout-pricing';
import { itemShipping, qtyLabel } from '@/lib/personalize';
import { storeArt, type SalesPageConfig } from '@/lib/sales-pages-shared';
import { storeFontClass } from '@/components/sales/store-fonts';

type Store = Pick<SalesPageConfig, 'neonPrimary' | 'neonSecondary' | 'theme' | 'backgroundImage'>;

const eur = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;

export function StoreCartSidebar({ store }: { store: Store }) {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeItem, totalPrice, lineTotal, totalItems } = useCart();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const P = store.neonPrimary;
  const art = storeArt(store);

  // Mesma regra do checkout: maior frete entre os produtos (ou a tabela padrão).
  const qtyOf = (id: number) => items.reduce((n, it) => n + (it.product.id === id ? it.quantity : 0), 0);
  const fallbackShipping = resolveShipping(totalPrice, 'ES', items.map((i) => itemShipping(i.product.shippingCost, i.product.personalize, qtyOf(i.product.id))));
  const [zip, setZip] = useState('');
  const [method, setMethod] = useState<ShipMethod>('pickup');
  useEffect(() => { if (isCartOpen) { setZip(loadZip()); setMethod(loadMethod()); } }, [isCartOpen]);
  const shipItems = isCartOpen ? items.map((i) => ({ productId: i.product.id, quantity: i.quantity, size: i.selectedSize })) : [];
  const { quote } = useShipQuote(shipItems, zip.length === 5 ? zip : SAMPLE_ZIP);
  const chosen = quote ? (quote[method] ?? quote.pickup ?? quote.home) : null;
  const shipping = chosen ? chosen.charged : fallbackShipping;
  const total = totalPrice + shipping;
  const freeFrom = quote ? (quote.freeOver ?? null) : FREE_SHIPPING;
  const hasFreeShipping = (freeFrom != null && totalPrice >= freeFrom) || Boolean(quote?.free);
  const remaining = freeFrom != null ? freeFrom - totalPrice : 0;
  const progress = freeFrom != null ? Math.min(100, (totalPrice / freeFrom) * 100) : 0;

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent
        showCloseButton={false}
        className={`${storeFontClass} flex w-full flex-col overflow-hidden border-l border-white/10 bg-[#0b0614] p-0 text-white`}
        style={{ maxWidth: 440 }}
      >
        {/* fundo: a arte da loja desfocada no topo */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden">
          <div className="absolute -inset-12 bg-cover bg-center opacity-60 blur-[48px]" style={{ backgroundImage: `url(${art.ambient})` }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 0%, #0b0614cc 55%, #0b0614 100%)' }} />
        </div>

        <SheetHeader className="relative shrink-0 border-b border-white/10 px-6 pb-5 pt-6">
          <SheetTitle className="m-0 flex items-end justify-between gap-4 text-white">
            <span className="font-store-display text-4xl uppercase leading-none">
              Carrito{items.length > 0 && <span className="ml-2 align-top text-lg text-white/50">({totalItems})</span>}
            </span>
            <button type="button" onClick={() => setIsCartOpen(false)}
              className="h-10 cursor-pointer px-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-white">
              Cerrar
            </button>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="relative flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
            <div>
              <p className="font-store-display text-3xl uppercase">Tu carrito está vacío</p>
              <p className="mt-2 text-base text-white/55">Elige una pieza de la colección para empezar.</p>
            </div>
            <button type="button" onClick={() => setIsCartOpen(false)}
              className="h-12 cursor-pointer rounded-md bg-white px-8 text-sm font-bold uppercase tracking-[0.12em] text-[#0b0614] transition-colors hover:bg-[var(--vc-primary)]"
              style={{ ['--vc-primary' as string]: P }}>
              Ver productos
            </button>
          </div>
        ) : (
          <>
            {/* envío gratis */}
            {(freeFrom != null || hasFreeShipping) && (
              <div className="relative shrink-0 px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                  {hasFreeShipping ? 'Tu envío es gratis' : `Te faltan ${eur(Math.max(0, remaining))} para el envío gratis`}
                </p>
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${hasFreeShipping ? 100 : progress}%`, background: P }} />
                </div>
              </div>
            )}

            {/* itens */}
            <ul className="relative flex-1 divide-y divide-white/10 overflow-y-auto px-6">
              {items.map((item) => {
                const variant = { color: item.selectedColor, size: item.selectedSize, text: item.customText, note: item.customNote };
                const key = [item.product.id, item.selectedColor, item.selectedSize, item.customText, item.customNote].join('|');
                const details = [item.customText && `Nombre: «${item.customText}»`, item.customNote, item.selectedColor && `Color: ${item.selectedColor}`, item.selectedSize && `Talla: ${item.selectedSize}`].filter(Boolean).join(' · ');
                return (
                  <li key={key} className="flex gap-4 py-5">
                    <div className="relative h-24 w-[76px] shrink-0 overflow-hidden rounded-md bg-[#1a1024]">
                      {!imageErrors[key] ? (
                        <Image src={item.product.image} alt={item.product.name} fill sizes="76px" className="object-cover"
                          onError={() => setImageErrors((p) => ({ ...p, [key]: true }))} />
                      ) : (
                        <span className="font-store-display flex h-full items-center justify-center text-3xl text-white/40">{item.product.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="line-clamp-2 text-base font-semibold leading-snug text-white">{item.product.name}</h4>
                        <p className="font-store-display shrink-0 text-xl leading-none text-white">{eur(lineTotal(item))}</p>
                      </div>
                      {details && <p className="mt-1 text-sm text-white/55">{details}</p>}
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div className="flex items-center rounded-md border border-white/20">
                          <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity - 1, variant)} aria-label="Quitar uno"
                            className="h-9 w-9 cursor-pointer text-lg text-white transition-colors hover:bg-white/10">−</button>
                          <span className="min-w-8 select-none whitespace-nowrap px-1 text-center text-sm font-bold tabular-nums">{qtyLabel(item.product.personalize, item.quantity)}</span>
                          <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity + 1, variant)} aria-label="Añadir uno"
                            className="h-9 w-9 cursor-pointer text-lg text-white transition-colors hover:bg-white/10">+</button>
                        </div>
                        <button type="button" onClick={() => removeItem(item.product.id, variant)} aria-label={`Quitar ${item.product.name}`}
                          className="h-9 cursor-pointer px-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/50 underline-offset-4 transition-colors hover:text-white hover:underline">
                          Quitar
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* totais + finalizar */}
            <div className="relative shrink-0 space-y-4 border-t border-white/10 bg-[#0b0614] px-6 pb-6 pt-5">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-white/55">Subtotal</dt>
                  <dd className="text-white">{eur(totalPrice)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/55">Envío{chosen ? (chosen.type === 'pickup' ? ' · recoger en punto' : ' · a domicilio') : ''}</dt>
                  <dd className="text-white">{hasFreeShipping || shipping === 0 ? 'Gratis' : eur(shipping)}</dd>
                </div>
                <div className="flex items-end justify-between border-t border-white/10 pt-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Total · IVA incluido</dt>
                  <dd className="font-store-display text-4xl leading-none">{eur(total)}</dd>
                </div>
              </dl>

              <Link href="/checkout" onClick={() => setIsCartOpen(false)}
                className="flex h-14 w-full items-center justify-center rounded-md bg-white text-sm font-bold uppercase tracking-[0.12em] text-[#0b0614] transition-colors hover:bg-[var(--vc-primary)]"
                style={{ ['--vc-primary' as string]: P }}>
                Finalizar compra
              </Link>
              <button type="button" onClick={() => setIsCartOpen(false)}
                className="h-12 w-full cursor-pointer rounded-md border border-white/25 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-white">
                Seguir comprando
              </button>
              <p className="text-center text-xs text-white/45">Pago seguro con Bizum, Apple Pay, Google Pay o tarjeta</p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
