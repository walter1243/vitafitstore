'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, MessageCircle, Search, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { Tr, UI } from '@/components/language-switcher';

// Barra de baixo no celular (formato de app): Inicio, Colecciones (abre o
// menu do Header), Carrito no centro, Buscar (abre a busca do Header) e Ayuda
// (WhatsApp). Os botoes do Header escutam os eventos abaixo.
export const OPEN_MENU_EVENT = 'kt:open-menu';
export const OPEN_SEARCH_EVENT = 'kt:open-search';
export const GO_HOME_EVENT = 'kt:go-home';

// "Inicio": fora da home navega normal; ja na home volta pro topo e a home
// limpa o filtro de setor (o Link sozinho nao faz nada na mesma pagina).
export function goHome(e: React.MouseEvent) {
  if (window.location.pathname !== '/') return;
  e.preventDefault();
  if (window.location.hash) history.replaceState(null, '', '/');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  window.dispatchEvent(new Event(GO_HOME_EVENT));
}

const ITEM = 'flex min-h-[52px] flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-[#1d1d1f] transition-colors hover:text-[#0071e3]';

export function MobileTabBar() {
  const { totalItems, setIsCartOpen } = useCart();
  const [wa, setWa] = useState('');
  const home = usePathname() === '/';
  // Fica transparente (40%) para não tapar a loja; ao tocar fica 100% e volta depois de 4 s.
  const [awake, setAwake] = useState(false);
  const sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wake = () => {
    setAwake(true);
    if (sleepTimer.current) clearTimeout(sleepTimer.current);
    sleepTimer.current = setTimeout(() => setAwake(false), 4000);
  };
  useEffect(() => () => { if (sleepTimer.current) clearTimeout(sleepTimer.current); }, []);

  useEffect(() => {
    fetch('/api/store-settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        const digits = String(s?.whatsapp ?? '').replace(/\D/g, '');
        if (digits) setWa(`https://wa.me/${digits}`);
      })
      .catch(() => {});
  }, []);

  return (
    <nav
      aria-label="Navegación"
      onPointerDown={wake}
      onFocusCapture={wake}
      className={`fixed inset-x-0 bottom-0 z-40 transition-opacity duration-200 ${awake ? 'opacity-100' : 'opacity-40'} border-t border-black/[0.06] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgba(0,0,0,0.06)] backdrop-blur md:hidden`}
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' }}
    >
      <div className="mx-auto flex max-w-md items-end px-2">
        <Link href="/" onClick={goHome} className={`${ITEM} ${home ? '!text-[#0071e3]' : ''}`} aria-current={home ? 'page' : undefined}>
          <Home className="h-[22px] w-[22px]" aria-hidden="true" /><Tr t={UI.inicio} />
        </Link>
        <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_MENU_EVENT))} className={ITEM}>
          <LayoutGrid className="h-[22px] w-[22px]" aria-hidden="true" /><Tr t={UI.colecciones} />
        </button>
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative -mt-6 mb-1 flex h-[60px] w-[60px] cursor-pointer flex-col items-center justify-center rounded-full bg-[#0071e3] text-[10px] font-semibold text-white shadow-[0_8px_20px_rgba(0,113,227,0.4)] ring-4 ring-white"
            aria-label={`Abrir carrito${totalItems ? `, ${totalItems} productos` : ''}`}
          >
            <ShoppingBag className="h-6 w-6" aria-hidden="true" />
            <Tr t={UI.carrito} />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d70015] px-1 text-[11px] font-bold">{totalItems}</span>
            )}
          </button>
        </div>
        <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); window.dispatchEvent(new Event(OPEN_SEARCH_EVENT)); }} className={ITEM}>
          <Search className="h-[22px] w-[22px]" aria-hidden="true" /><Tr t={UI.buscar} />
        </button>
        {wa ? (
          <a href={wa} target="_blank" rel="noopener noreferrer" className={ITEM}>
            <MessageCircle className="h-[22px] w-[22px]" aria-hidden="true" /><Tr t={UI.ayuda} />
          </a>
        ) : (
          <span className={ITEM} aria-hidden="true" />
        )}
      </div>
    </nav>
  );
}
