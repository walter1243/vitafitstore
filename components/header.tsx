'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Menu, X, LayoutGrid, Printer, Smile } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { ChristmasPromo } from '@/components/christmas-promo';
import { COLLECTIONS } from '@/lib/collections';

// Menu fixo da vitrine infantil: as colecoes vem de lib/collections.ts
// (cada uma com a sua pagina), entao o cabecalho nao precisa mais buscar
// categorias/produtos a cada 15s pra montar os links.
const navLinks = [
  { href: '/#colecciones', label: 'Colecciones', icon: LayoutGrid, color: '#1D4ED8' },
  ...COLLECTIONS.map((c) => ({ href: `/coleccion/${c.slug}`, label: c.shortName, icon: c.icon, color: c.color.deep })),
  { href: '/#como-se-hace', label: 'Cómo se hace', icon: Printer, color: '#15803D' },
];

const BRANDING_CACHE_KEY = 'store_branding_cache';

// Header has no shared layout to live in (checkout/admin render their own
// chrome), so it remounts fresh on every storefront navigation — without
// this, each click briefly flashes the hardcoded "Nuestra Tienda" name and
// flame-icon fallback before the real branding fetch resolves. Reading a
// same-session cache synchronously on mount skips that flash after the
// first successful load.
function readCachedBranding() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(BRANDING_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function Header() {
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cachedBranding = readCachedBranding();
  const [storeName, setStoreName] = useState(cachedBranding?.storeName ?? 'Nuestra Tienda');
  const [logoUrl, setLogoUrl] = useState(cachedBranding?.logoUrl ?? '');
  const [themeColor, setThemeColor] = useState(cachedBranding?.themeColor ?? '#FF6B6B');
  const [announcement, setAnnouncement] = useState('');

  // The header floats fixed below whatever stack of thin bars (free-shipping
  // announcement, Christmas countdown) is showing — both can appear
  // independently, so the offset is measured instead of hardcoded, and
  // updates itself whenever a bar is added/removed (e.g. the countdown
  // disappearing once Christmas passes).
  const topBarRef = useRef<HTMLDivElement>(null);
  const [topBarHeight, setTopBarHeight] = useState(0);

  useEffect(() => {
    const el = topBarRef.current;
    if (!el) return;
    const update = () => setTopBarHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    fetch('/api/site-content', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.hero?.badgeText) setAnnouncement(data.hero.badgeText); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const loadStoreSettings = async () => {
      try {
        const res = await fetch('/api/store-settings', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const nextStoreName = data?.storeName ?? 'Nuestra Tienda';
        const nextLogoUrl = data?.logoUrl ?? '';
        const nextThemeColor = data?.themeColor ?? '#FF6B6B';
        setStoreName(nextStoreName);
        setLogoUrl(nextLogoUrl);
        setThemeColor(nextThemeColor);
        try {
          window.sessionStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify({
            storeName: nextStoreName, logoUrl: nextLogoUrl, themeColor: nextThemeColor,
          }));
        } catch {
          // sessionStorage unavailable (private mode, etc.) — just skip caching
        }
      } catch {
        // ignore settings load errors
      }
    };

    void loadStoreSettings();

    const intervalId = window.setInterval(() => {
      void loadStoreSettings();
    }, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadStoreSettings();
      }
    };

    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <>
      <div ref={topBarRef} className="fixed top-0 left-0 right-0 z-[60]">
        <ChristmasPromo />
        {announcement && (
          <div className="bg-[#1e2a4a] px-4 py-1 text-center text-[10px] font-bold tracking-wide text-white sm:text-[11px]">
            {announcement}
          </div>
        )}
      </div>
      <header
        className="kids fixed left-0 right-0 z-50 px-2 transition-all duration-500 sm:px-4"
        style={{ top: topBarHeight + (scrolled ? 6 : 10) }}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between rounded-full border-[3px] border-white bg-white/90 pl-2 pr-2 backdrop-blur-xl transition-all duration-500 sm:pl-3 ${scrolled ? 'py-1.5 shadow-[0_8px_24px_rgba(30,42,74,0.12)]' : 'py-2 shadow-[0_4px_0_rgba(30,42,74,0.08)]'}`}
        >
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <div
              className="flex h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-full transition-transform duration-300 group-hover:rotate-12"
              style={{ background: themeColor }}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <Smile className="h-6 w-6 text-white" aria-hidden="true" />
              )}
            </div>
            <span className="font-kids text-lg font-bold text-[#1e2a4a] sm:text-xl">{storeName}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-extrabold text-[#1e2a4a] transition-colors duration-200 hover:bg-slate-100"
                >
                  <Icon className="h-4 w-4" style={{ color: link.color }} aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#FFD23F] transition-transform duration-200 hover:scale-105 active:scale-95"
              aria-label="Abrir carrito"
            >
              <ShoppingCart className="h-5 w-5 text-[#1e2a4a]" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#FF6B6B] px-1 text-[11px] font-extrabold text-white">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 lg:hidden"
              aria-label="Menú"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5 text-[#1e2a4a]" /> : <Menu className="h-5 w-5 text-[#1e2a4a]" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[#1e2a4a]/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="kids fixed bottom-0 right-0 top-0 z-50 flex w-[290px] flex-col rounded-l-[32px] bg-[#FFF8EC] lg:hidden">
            <div className="flex items-center justify-between p-6">
              <span className="font-kids text-2xl font-bold text-[#1e2a4a]">¡Hola!</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1e2a4a]"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-3 px-5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-14 items-center gap-3 rounded-2xl px-4 text-base font-extrabold text-white shadow-[0_4px_0_rgba(30,42,74,0.12)] transition-transform active:scale-[0.98]"
                    style={{ background: link.color }}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
