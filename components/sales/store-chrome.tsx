'use client';

// Cabeçalho e rodapé das lojas próprias (multi-loja), ex.: VICE CITY STORE.
// Usados na página da loja (/<slug>) e na página de produto dos produtos dela,
// no lugar do cabeçalho/rodapé da Kitoys — quem entra pelo Instagram da loja
// não vê nada da Kitoys. Carrinho e checkout continuam os mesmos.
//
// Cabeçalho: barra de vidro flutuante (72px de altura total). Com overlay, ele
// fica POR CIMA da capa (a foto começa no topo da tela, atrás do vidro).

import { useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { storeLegalHref, storePath, type SalesPageConfig } from '@/lib/sales-pages-shared';
import { rememberStore } from '@/lib/store-context';

type Brand = Pick<SalesPageConfig, 'slug' | 'title' | 'logoImage' | 'neonPrimary' | 'neonSecondary' | 'footerNote'>;

export function StoreHeader({ store, overlay = false, onCatalog }: { store: Brand; overlay?: boolean; onCatalog?: () => void }) {
  const { setIsCartOpen, totalItems } = useCart();
  // Lembra a loja nesta visita (checkout e carrinho vazio voltam para ela).
  useEffect(() => { rememberStore(store.slug); }, [store.slug]);
  const home = storePath(store.slug);

  return (
    <header className={`sticky top-0 z-40 px-3 pt-3 text-white ${overlay ? '-mb-[72px]' : ''}`}>
      <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[#0d0418]/55 px-3 shadow-[0_10px_30px_rgba(0,0,0,.35)] backdrop-blur-xl sm:px-4">
        <Link href={home} className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: store.neonSecondary }} aria-label={store.title}>
          {store.logoImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logoImage} alt={store.title} className="h-10 w-auto max-w-[170px] object-contain" />
          ) : (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `linear-gradient(135deg, ${store.neonSecondary}, ${store.neonPrimary})` }}>
                <Sparkles size={17} className="text-black" aria-hidden />
              </span>
              <span className="font-store-display truncate text-base uppercase tracking-[0.12em]" style={{ textShadow: `0 0 14px ${store.neonPrimary}` }}>{store.title}</span>
            </>
          )}
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          {onCatalog ? (
            <button type="button" onClick={onCatalog} className="hidden h-10 cursor-pointer items-center rounded-xl px-3.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:flex">Colección</button>
          ) : (
            <Link href={`${home}#productos`} className="hidden h-10 items-center rounded-xl px-3.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:flex">Colección</Link>
          )}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={totalItems > 0 ? `Abrir carrito (${totalItems})` : 'Abrir carrito'}
            className="relative flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.12]"
          >
            <ShoppingBag size={18} aria-hidden />
            <span className="hidden sm:inline">Carrito</span>
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[11px] font-bold text-black" style={{ background: store.neonSecondary, boxShadow: `0 0 10px ${store.neonSecondary}` }}>
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export function StoreFooter({ store }: { store: Brand }) {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#08020f] px-4 pb-10 pt-10 text-center text-white/55">
      <p className="font-store-display text-lg uppercase tracking-[0.18em] text-white/90" style={{ textShadow: `0 0 16px ${store.neonPrimary}66` }}>{store.title}</p>
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
