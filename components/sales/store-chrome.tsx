'use client';

// Cabeçalho e rodapé das lojas próprias (multi-loja), ex.: VICE CITY STORE.
// Usados na página da loja (/<slug>) e na página de produto dos produtos dela,
// no lugar do cabeçalho/rodapé da Kitoys — quem entra pelo Instagram da loja
// não vê nada da Kitoys. Carrinho e checkout continuam os mesmos.

import { useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { storePath, type SalesPageConfig } from '@/lib/sales-pages-shared';
import { rememberStore } from '@/lib/store-context';

type Brand = Pick<SalesPageConfig, 'slug' | 'title' | 'logoImage' | 'neonPrimary' | 'neonSecondary' | 'footerNote'>;

export function StoreHeader({ store }: { store: Brand }) {
  const { setIsCartOpen, totalItems } = useCart();
  // Lembra a loja nesta visita (checkout e carrinho vazio voltam para ela).
  useEffect(() => { rememberStore(store.slug); }, [store.slug]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#120818]/85 text-white backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href={storePath(store.slug)} className="flex min-w-0 items-center gap-2.5" aria-label={store.title}>
          {store.logoImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logoImage} alt={store.title} className="h-9 w-auto max-w-[160px] object-contain" />
          ) : (
            <>
              <Sparkles size={16} style={{ color: store.neonSecondary }} aria-hidden />
              <span className="truncate text-sm font-black uppercase tracking-[0.2em]" style={{ textShadow: `0 0 12px ${store.neonPrimary}` }}>{store.title}</span>
            </>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          aria-label="Abrir carrito"
          className="relative flex h-10 cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          <ShoppingBag size={17} aria-hidden />
          <span className="hidden sm:inline">Carrito</span>
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[11px] font-bold text-black" style={{ background: store.neonSecondary }}>
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

export function StoreFooter({ store }: { store: Brand }) {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#0c0416] px-4 py-8 text-center text-white/50">
      <p className="text-sm font-black uppercase tracking-[0.25em] text-white/80">{store.title}</p>
      <p className="mt-2 text-xs">{store.footerNote}</p>
      <nav className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
        <Link href="/legal/envios" className="hover:text-white">Envíos</Link>
        <Link href="/legal/aviso-legal" className="hover:text-white">Aviso legal</Link>
        <Link href="/legal/privacidad" className="hover:text-white">Privacidad</Link>
        <Link href="/legal/cookies" className="hover:text-white">Cookies</Link>
        <Link href="/legal/devoluciones" className="hover:text-white">Devoluciones</Link>
      </nav>
    </footer>
  );
}
