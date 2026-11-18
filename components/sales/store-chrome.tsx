'use client';

// Cabeçalho e rodapé das lojas próprias (multi-loja), ex.: VICE CITY STORE.
// Usados na página da loja (/<slug>) e na página de produto dos produtos dela,
// no lugar do cabeçalho/rodapé da Kitoys — quem entra pelo Instagram da loja
// não vê nada da Kitoys. Carrinho e checkout continuam os mesmos.
//
// Cabeçalho: barra de vidro flutuante; a altura acompanha o tamanho do logo. Com overlay, ele
// fica POR CIMA da capa (a foto começa no topo da tela, atrás do vidro).

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { clampLogoHeight, storeBarHeight, storeHeaderOffset, storeLegalHref, storePath, type SalesPageConfig } from '@/lib/sales-pages-shared';
import { rememberStore } from '@/lib/store-context';

type Brand = Pick<SalesPageConfig, 'slug' | 'title' | 'logoImage' | 'neonPrimary' | 'neonSecondary' | 'footerNote'> & { logoHeight?: number };

export function StoreHeader({ store, overlay = false, onCatalog }: { store: Brand; overlay?: boolean; onCatalog?: () => void }) {
  const { setIsCartOpen, totalItems, isCartOpen } = useCart();
  // Aviso "Añadido al carrito" (some sozinho; não aparece se a gaveta abriu).
  const cartOpenRef = useRef(isCartOpen);
  cartOpenRef.current = isCartOpen;
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    let hide: ReturnType<typeof setTimeout> | undefined;
    const onAdd = (e: Event) => {
      const name = String((e as CustomEvent).detail?.name ?? '');
      setTimeout(() => {
        if (cartOpenRef.current) return;
        setToast(name);
        if (hide) clearTimeout(hide);
        hide = setTimeout(() => setToast(null), 3400);
      }, 120);
    };
    window.addEventListener('kitoys:add-to-cart', onAdd);
    return () => { window.removeEventListener('kitoys:add-to-cart', onAdd); if (hide) clearTimeout(hide); };
  }, []);
  // Lembra a loja nesta visita (checkout e carrinho vazio voltam para ela).
  useEffect(() => { rememberStore(store.slug); }, [store.slug]);
  const home = storePath(store.slug);
  // Tamanho do logo (Editar loja): no celular 80% dele, para caber com o carrinho.
  const logoH = clampLogoHeight(store.logoHeight);
  const barH = storeBarHeight(store);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 text-white" style={overlay ? { marginBottom: -storeHeaderOffset(store) } : undefined}>
      <div style={{ height: barH }} className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-xl border border-white/12 bg-[#0b0614]/60 px-4 shadow-[0_10px_30px_rgba(0,0,0,.35)] backdrop-blur-xl sm:px-5">
        <Link href={home} className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: store.neonSecondary }} aria-label={store.title}>
          {store.logoImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logoImage} alt={store.title} style={{ ['--logo-h' as string]: `${logoH}px`, ['--logo-h-m' as string]: `${Math.round(logoH * 0.8)}px` }} className="h-[var(--logo-h-m)] w-auto max-w-[62vw] object-contain sm:h-[var(--logo-h)] sm:max-w-[460px]" />
          ) : (
            <span className="font-store-display truncate text-2xl uppercase leading-none tracking-wide">{store.title}</span>
          )}
        </Link>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {onCatalog ? (
            <button type="button" onClick={onCatalog} className="hidden h-11 cursor-pointer items-center px-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/75 transition-colors hover:text-white sm:flex">Productos</button>
          ) : (
            <Link href={`${home}#productos`} className="hidden h-11 items-center px-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/75 transition-colors hover:text-white sm:flex">Productos</Link>
          )}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            data-cart-target
            aria-label={totalItems > 0 ? `Abrir carrito (${totalItems})` : 'Abrir carrito'}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-md bg-white px-4 text-sm font-bold uppercase tracking-[0.14em] text-[#0b0614] transition-colors hover:bg-[var(--vc-primary,#ff2d9b)]"
          >
            Carrito
            {totalItems > 0 && <span className="tabular-nums">({totalItems})</span>}
          </button>
        </div>
      </div>
      {toast !== null && (
        <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-3 top-full mt-2 flex justify-end">
          <div className="pointer-events-auto mx-auto flex w-full max-w-sm items-center gap-4 rounded-lg border-l-4 bg-[#0b0614]/95 py-3 pl-4 pr-3 shadow-[0_16px_40px_rgba(0,0,0,.5)] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 sm:mx-0 sm:mr-[max(0px,calc((100%-72rem)/2))]" style={{ borderColor: store.neonPrimary }}>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">Añadido al carrito</p>
              {toast && <p className="mt-0.5 truncate text-sm text-white/65">{toast}</p>}
            </div>
            <button type="button" onClick={() => { setToast(null); setIsCartOpen(true); }}
              className="h-10 shrink-0 cursor-pointer rounded-md bg-white px-3.5 text-xs font-bold uppercase tracking-[0.12em] text-[#0b0614]">
              Ver carrito
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export function StoreFooter({ store }: { store: Brand }) {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#07030d] px-4 pb-10 pt-12 text-center text-white/55">
      <p className="font-store-display text-3xl uppercase tracking-wide text-white">{store.title}</p>
      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed">{store.footerNote}</p>
      <nav aria-label="Información legal" className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
        {([['envios', 'Envíos'], ['devoluciones', 'Devoluciones'], ['terminos', 'Términos'], ['privacidad', 'Privacidad'], ['cookies', 'Cookies'], ['aviso-legal', 'Aviso legal']] as const).map(([doc, label]) => (
          <Link key={doc} href={storeLegalHref(store.slug, doc)} className="hover:text-white">{label}</Link>
        ))}
      </nav>
      <p className="mt-5 text-[11px] text-white/35">Precios con IVA incluido · Pago seguro con Stripe</p>
    </footer>
  );
}
