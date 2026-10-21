'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Menu, X, Smile, Search } from 'lucide-react';
import { ProductSearch } from '@/components/product-search';
import { useCart } from '@/lib/cart-context';
import { useSectors } from '@/components/kids/sectors-context';
import { softOf } from '@/lib/sectors-shared';
import { CollectionsMenuPanel, homeCategoryHref, selectHomeCategory, useHomeCategories } from '@/components/kids/menu-panel';


// Logo da marca (Kitoys 3D) mostrado inteiro no modo "logo direto". A logo
// enviada no admin continua sendo usada no modo "icone + nome".
const DEFAULT_LOGO = '/images/logo-kitoys-3d.png';

const NAV_ITEM = 'whitespace-nowrap rounded-full px-3 py-2 font-kids text-base font-semibold text-[#23263f] transition-colors duration-200 hover:bg-[#FFF4E0] cursor-pointer lg:px-4 lg:text-lg';
const MOBILE_ITEM = 'block rounded-xl px-4 py-3 font-kids text-xl font-bold text-[#23263f] transition-colors hover:bg-[#FFF4E0]';

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
  const menuSectors = sectors.filter((s) => s.collections.length > 0);
  // Painel "Colecciones": abre no hover (desktop) ou clique; fecha com Esc,
  // clique fora ou ao escolher um link.
  const [colOpen, setColOpen] = useState(false);
  const colRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openCols = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setColOpen(true); };
  const closeColsSoon = () => { closeTimer.current = setTimeout(() => setColOpen(false), 160); };
  useEffect(() => {
    if (!colOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setColOpen(false); };
    const onClick = (e: MouseEvent) => { if (colRef.current && !colRef.current.contains(e.target as Node)) setColOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [colOpen]);
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const mobileHomeCats = useHomeCategories(mobileOpen);
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
        <div ref={colRef} className="relative">
        {/* Logo · busca · menu · carrinho (no celular a busca abre por baixo) */}
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-6 lg:px-8">
          <div className="flex shrink-0 items-center">
            {/* Logo — "logo_direto" (padrao; Admin → Informações da Loja)
                mostra a imagem do logo sozinha, do jeito que ela e. */}
            {logoStyle === 'logo_direto' ? (
              <Link href="/" className="flex shrink-0 items-center" aria-label={`${storeName} — Inicio`}>
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

          </div>

          {/* Busca (desktop) */}
          <ProductSearch className="hidden max-w-xl flex-1 md:block" />

          {/* Right side: menu + carrinho */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Menu: Inicio · Colecciones (painel com setores) · Nuestro taller */}
            <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
              <Link href="/" className={NAV_ITEM}>Inicio</Link>
              <button
                type="button"
                className={`${NAV_ITEM} ${colOpen ? 'bg-[#FFF4E0]' : ''}`}
                aria-expanded={colOpen}
                aria-controls="menu-colecciones"
                onClick={() => setColOpen((v) => !v)}
                onMouseEnter={openCols}
                onMouseLeave={closeColsSoon}
              >
                Colecciones
              </button>
              <Link href="/#como-se-hace" className={NAV_ITEM}>Nuestro taller</Link>
            </nav>
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#F2F4FA] transition-colors hover:bg-[#E6E9F3] md:hidden"
              aria-label="Buscar productos"
              aria-expanded={searchOpen}
            >
              {searchOpen ? <X className="h-5 w-5 text-[#23263f]" /> : <Search className="h-5 w-5 text-[#23263f]" />}
            </button>
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

        {searchOpen && (
          <div className="kids absolute inset-x-0 top-full border-t border-[#efe7da] bg-white px-4 py-3 shadow-[0_16px_32px_rgba(35,38,63,0.12)] md:hidden">
            <ProductSearch autoFocus onDone={() => setSearchOpen(false)} />
          </div>
        )}

        {/* Painel "Colecciones": todas as colecoes lado a lado + categorias.
            Fica montado (so escondido) pra brincadeira aberta dali continuar
            aberta quando o painel fecha. */}
        <div
          id="menu-colecciones"
          className={`kids absolute inset-x-0 top-full max-h-[75vh] overflow-y-auto border-t border-[#efe7da] bg-white shadow-[0_24px_48px_rgba(35,38,63,0.12)] ${colOpen ? 'hidden md:block' : 'hidden'}`}
          onMouseEnter={openCols}
          onMouseLeave={closeColsSoon}
        >
          <CollectionsMenuPanel open={colOpen} onNavigate={() => setColOpen(false)} />
        </div>
        </div>
      </header>

      {/* Mobile drawer: Inicio, setores com as colecoes e Nuestro taller */}
      {mobileOpen && (
        <>
          {/* Abre ABAIXO da faixa do cabecalho (logo, carrinho e o X de
              fechar continuam visiveis na mesma faixa). */}
          <div
            className="fixed inset-x-0 bottom-0 z-40 bg-[#23263f]/40 md:hidden"
            style={{ top: topBarHeight + 73 }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="kids fixed bottom-0 right-0 z-40 flex w-full max-w-[320px] flex-col border-l border-[#efe7da] bg-white shadow-[-12px_0_32px_rgba(35,38,63,0.12)] md:hidden"
            style={{ top: topBarHeight + 73 }}
          >
            <nav className="flex flex-1 flex-col overflow-y-auto p-3" aria-label="Principal">
              <Link href="/" onClick={() => setMobileOpen(false)} className={MOBILE_ITEM}>Inicio</Link>
              {menuSectors.map((sector) => (
                <div key={sector.id || sector.slug} className="mt-2">
                  <Link href={`/sector/${sector.slug}`} onClick={() => setMobileOpen(false)} className={MOBILE_ITEM}>
                    {sector.name}
                  </Link>
                  {sector.collections.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/coleccion/${c.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="ml-3 flex items-center gap-3 rounded-xl px-3 py-2 text-base font-semibold text-[#565a78] transition-colors hover:bg-[#FFF4E0] hover:text-[#23263f]"
                    >
                      <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg" style={{ background: softOf(c) }}>
                        {(c.imageUrl || c.photoUrl) && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.imageUrl || c.photoUrl} alt="" className="h-full w-full object-contain p-0.5" />
                        )}
                      </span>
                      {c.name}
                    </Link>
                  ))}
                </div>
              ))}
              {/* Hogar: categorias de casa (sem colecao) — mesmo jeito das colecoes */}
              {mobileHomeCats.length > 0 && !menuSectors.some((s) => s.style === 'hogar') && (
                <div className="mt-2">
                  <Link href="/hogar" onClick={() => setMobileOpen(false)} className={MOBILE_ITEM}>Hogar</Link>
                  {mobileHomeCats.map((cat) => (
                    <Link
                      key={cat.name}
                      href={homeCategoryHref(cat.name)}
                      onClick={() => { selectHomeCategory(cat.name); setMobileOpen(false); }}
                      className="ml-3 flex items-center gap-3 rounded-xl px-3 py-2 text-base font-semibold text-[#565a78] transition-colors hover:bg-[#f3ece2] hover:text-[#2b2620]"
                    >
                      <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-[#ece3d6]">
                        {cat.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cat.image} alt="" className="h-full w-full object-cover" />
                        )}
                      </span>
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
              <Link href="/#como-se-hace" onClick={() => setMobileOpen(false)} className={`${MOBILE_ITEM} mt-2`}>Nuestro taller</Link>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
