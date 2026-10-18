'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Menu, X, Smile } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useSectors } from '@/components/kids/sectors-context';


// Logo da marca (Kitoys 3D) mostrado inteiro no modo "logo direto". A logo
// enviada no admin continua sendo usada no modo "icone + nome".
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

// Menu: um link por setor (Admin → Setores e coleções) + Nuestro taller.
export function Header() {
  const { sectors } = useSectors();
  const navLinks = [
    ...sectors.filter((s) => s.collections.length > 0).map((s) => ({ href: `/sector/${s.slug}`, label: s.name })),
    { href: '/#como-se-hace', label: 'Nuestro taller' },
  ];
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


  return (
    <>
      <div ref={topBarRef} className="fixed top-0 left-0 right-0 z-40">
        {announcement && (
          <div className="bg-[#23263f] px-4 py-1.5 text-center text-xs font-semibold text-white">
            {announcement}
          </div>
        )}
      </div>
      <header
        className={`kids fixed left-0 right-0 z-50 border-b bg-white transition-shadow duration-300 ${scrolled ? 'border-transparent shadow-[0_4px_20px_rgba(35,38,63,0.08)]' : 'border-[#efe7da]'}`}
        style={{ top: topBarHeight }}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo — "logo_direto" (padrao; Admin → Informações da Loja)
              mostra a imagem do logo sozinha, do jeito que ela e. */}
          {logoStyle === 'logo_direto' ? (
            <Link href="/" className="flex shrink-0 items-center" aria-label={storeName}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={DEFAULT_LOGO} alt="Kitoys 3D" className="h-[58px] w-auto object-contain" />
            </Link>
          ) : (
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <div className="flex h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-xl" style={{ background: themeColor }}>
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <Smile className="h-6 w-6 text-white" aria-hidden="true" />
                )}
              </div>
              <span className="font-kids text-xl font-bold text-[#23263f]">{storeName}</span>
            </Link>
          )}

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative py-2 font-kids text-lg font-semibold text-[#23263f] transition-colors duration-200 hover:text-[#c2410c]"
              >
                {link.label}
                <span className="absolute bottom-0.5 left-0 h-0.5 w-full origin-left scale-x-0 rounded-full bg-[#c2410c] transition-transform duration-200 group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#FFF4E0] transition-colors duration-200 hover:bg-[#FFE8C2]"
              aria-label="Abrir carrito"
            >
              <ShoppingCart className="h-5 w-5 text-[#23263f]" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c2410c] px-1 text-[11px] font-extrabold text-white">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#F2F4FA] transition-colors hover:bg-[#E6E9F3] md:hidden"
              aria-label="Menú"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5 text-[#23263f]" /> : <Menu className="h-5 w-5 text-[#23263f]" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-[#23263f]/40 md:hidden" onClick={() => setMobileOpen(false)} />
          <div className="kids fixed bottom-0 right-0 top-0 z-50 flex w-72 flex-col bg-white md:hidden">
            <div className="flex items-center justify-between border-b border-[#efe7da] p-5">
              <span className="font-kids text-2xl font-bold text-[#23263f]">Menú</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F2F4FA] text-[#23263f]"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col p-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3.5 font-kids text-xl font-semibold text-[#23263f] transition-colors hover:bg-[#FFF4E0]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
