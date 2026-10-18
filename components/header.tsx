'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Menu, X, Smile, LayoutGrid, Printer } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { COLLECTIONS } from '@/lib/collections';

// Menu fixo da vitrine infantil: as colecoes vem de lib/collections.ts
// (cada uma com a sua pagina), entao o cabecalho nao precisa mais buscar
// categorias/produtos a cada 15s pra montar os links.
const navLinks = [
  { href: '/#colecciones', label: 'Colecciones', icon: LayoutGrid, color: '#F2384A' },
  ...COLLECTIONS.map((c) => ({ href: `/coleccion/${c.slug}`, label: c.shortName, icon: c.icon, color: c.color.main })),
  { href: '/#como-se-hace', label: 'Nuestro taller', icon: Printer, color: '#22B14C' },
];

// Logo padrao da marca — usado no modo "logo direto" enquanto o admin nao
// tiver enviado uma logo.
const DEFAULT_LOGO = '/images/logo-kitoys-3d.png';

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
  const [logoStyle, setLogoStyle] = useState<'icone_nome' | 'logo_direto'>(cachedBranding?.logoStyle ?? 'logo_direto');
  const [themeColor, setThemeColor] = useState(cachedBranding?.themeColor ?? '#c2410c');
  const [announcement, setAnnouncement] = useState('');

  // The header floats fixed below whatever stack of thin bars (free-shipping
  // announcement) is showing — it can appear
  // independently, so the offset is measured instead of hardcoded, and
  // updates itself whenever the bar is added/removed.
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
        const nextThemeColor = data?.themeColor ?? '#c2410c';
        const nextLogoStyle = data?.logoStyle === 'icone_nome' ? 'icone_nome' : 'logo_direto';
        setStoreName(nextStoreName);
        setLogoUrl(nextLogoUrl);
        setThemeColor(nextThemeColor);
        setLogoStyle(nextLogoStyle);
        try {
          window.sessionStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify({
            storeName: nextStoreName, logoUrl: nextLogoUrl, themeColor: nextThemeColor, logoStyle: nextLogoStyle,
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

  const directLogo = logoUrl || DEFAULT_LOGO;

  return (
    <>
      <div ref={topBarRef} className="fixed top-0 left-0 right-0 z-[60]">
        {announcement && (
          <div className="bg-[#1f2340] px-4 py-1 text-center text-[10px] font-semibold tracking-wide text-white sm:text-[11px]">
            {announcement}
          </div>
        )}
      </div>
      <header
        className="kids fixed left-0 right-0 z-50 px-3 transition-all duration-300 sm:px-5"
        style={{ top: topBarHeight + (scrolled ? 6 : 12) }}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between rounded-full border-4 border-[#1f2340] bg-white py-1 pl-3 pr-2 transition-shadow duration-300 sm:pl-5 ${scrolled ? 'shadow-[0_6px_0_rgba(31,35,64,0.18)]' : 'shadow-[0_4px_0_rgba(31,35,64,0.12)]'}`}
        >
          {/* Logo — "logo_direto" (padrao; Admin → Informações da Loja)
              mostra a imagem do logo sozinha, do jeito que ela e. */}
          {logoStyle === 'logo_direto' ? (
            <Link href="/" className="-my-3 flex items-center transition-transform duration-200 hover:scale-105" aria-label={storeName}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={directLogo} alt={storeName} className="h-[68px] w-auto object-contain sm:h-[76px]" />
            </Link>
          ) : (
            <Link href="/" className="group flex items-center gap-2 py-1">
              <div
                className="flex h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-full"
                style={{ background: themeColor }}
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <Smile className="h-6 w-6 text-white" aria-hidden="true" />
                )}
              </div>
              <span className="font-kids text-xl font-bold text-[#1f2340]">{storeName}</span>
            </Link>
          )}

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-11 items-center gap-2 rounded-full px-4 font-kids text-lg font-bold text-[#1f2340] transition-colors duration-200 hover:bg-[#F3F6FF]"
                >
                  <Icon className="h-5 w-5" style={{ color: link.color }} aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="kid-btn relative flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#1f2340] bg-[#FFC93C]"
              aria-label="Abrir carrito"
            >
              <ShoppingCart className="h-5 w-5 text-[#1f2340]" />
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-[#1f2340] bg-[#F2384A] px-1 text-xs font-extrabold text-white">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#1f2340] bg-white lg:hidden"
              aria-label="Menú"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5 text-[#1f2340]" /> : <Menu className="h-5 w-5 text-[#1f2340]" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[#1f2340]/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="kids fixed bottom-0 right-0 top-0 z-50 flex w-[290px] flex-col rounded-l-[32px] border-l-4 border-[#1f2340] bg-[#F3FAFF] lg:hidden">
            <div className="flex items-center justify-between p-6">
              <span className="font-kids text-3xl font-extrabold text-[#1f2340]">¡Hola!</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#1f2340] bg-white text-[#1f2340]"
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
                    className="kid-btn flex min-h-14 items-center gap-3 rounded-2xl px-5 font-kids text-xl font-bold text-white"
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
