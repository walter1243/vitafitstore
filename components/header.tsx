'use client';
import Link from 'next/link';
import { DEFAULT_CABECALHO, DEFAULT_TOPBAR, type Branding, type CabecalhoContent, type TopbarContent } from '@/lib/site-content-defaults';
import { useState, useEffect, useRef, useMemo } from 'react';
import { ShoppingCart, Menu, X, Smile } from 'lucide-react';
import { ProductSearch } from '@/components/product-search';
import { useStoreProducts } from '@/components/kids/use-store-products';
import { useCart } from '@/lib/cart-context';
import { useSectors } from '@/components/kids/sectors-context';
import { LanguageSwitcher, Tr, UI } from '@/components/language-switcher';
import { OPEN_MENU_EVENT, OPEN_SEARCH_EVENT, goHome, MobileTabBar } from '@/components/mobile-tab-bar';
import { CollectionsMenuPanel, homeCategoryHref, selectHomeCategory, useHomeCategories } from '@/components/kids/menu-panel';


// Logo da marca (Kitoys 3D) mostrado inteiro no modo "logo direto". A logo
// enviada no admin continua sendo usada no modo "icone + nome".
const DEFAULT_LOGO = '/images/logo-kitoys-3d.png';

const NAV_ITEM = 'whitespace-nowrap rounded-full px-3 py-2 font-kids text-base font-semibold text-[#23263f] transition-colors duration-200 hover:bg-[#FFF4E0] cursor-pointer lg:px-4 lg:text-lg';

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

// Menu: Inicio + Colecciones (setores e colecoes do Admin).
// topbar/cabecalho/branding: só a cópia da loja no admin passa (rascunho ainda não publicado).
export function Header({ topbar: topbarOverride, cabecalho: cabecalhoOverride, branding }: { topbar?: Partial<TopbarContent>; cabecalho?: Partial<CabecalhoContent>; branding?: Partial<Branding> } = {}) {
  const { sectors, collectionForProduct } = useSectors();
  const [menuWanted, setMenuWanted] = useState(false);
  const { products: menuProducts, loaded: menuLoaded } = useStoreProducts(undefined, menuWanted);
  // Só coleções com pelo menos um produto (sem "nenhum produto" ao tocar); setor vazio some.
  const filledSlugs = useMemo(() => {
    const set = new Set<string>();
    for (const p of menuProducts) { const c = collectionForProduct(p as any); if (c) set.add(c.slug); }
    return set;
  }, [menuProducts, collectionForProduct]);
  const menuSectors = sectors
    .map((s) => ({ ...s, collections: menuLoaded ? s.collections.filter((c) => filledSlugs.has(c.slug)) : s.collections }))
    .filter((s) => s.collections.length > 0);
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
  useEffect(() => { if (mobileOpen) setMenuWanted(true); }, [mobileOpen]);
  const mobileHomeCats = useHomeCategories(mobileOpen);
  const [scrolled, setScrolled] = useState(false);
  // Barra de baixo do celular (MobileTabBar) abre o menu e a busca daqui.
  useEffect(() => {
    const menu = () => setMobileOpen(true);
    const search = () => { setMobileOpen(false); document.getElementById('busqueda-movil')?.focus(); };
    window.addEventListener(OPEN_MENU_EVENT, menu);
    window.addEventListener(OPEN_SEARCH_EVENT, search);
    return () => { window.removeEventListener(OPEN_MENU_EVENT, menu); window.removeEventListener(OPEN_SEARCH_EVENT, search); };
  }, []);
  const cachedBranding = readCachedBranding();
  const [storeName, setStoreName] = useState(cachedBranding?.storeName ?? 'Nuestra Tienda');
  const [logoUrl, setLogoUrl] = useState(cachedBranding?.logoUrl ?? '');
  const [logoStyle, setLogoStyle] = useState<'icone_nome' | 'logo_direto'>(cachedBranding?.logoStyle ?? 'logo_direto');
  const [themeColor, setThemeColor] = useState(cachedBranding?.themeColor ?? '#c2410c');
  const bStoreName = branding?.storeName ?? storeName;
  const bLogoUrl = branding?.logoUrl ?? logoUrl;
  const bLogoStyle = branding?.logoStyle ?? logoStyle;
  const bThemeColor = branding?.themeColor ?? themeColor;
  const [topbarSaved, setTopbarSaved] = useState<Partial<TopbarContent> | null>(null);
  const [cabSaved, setCabSaved] = useState<Partial<CabecalhoContent> | null>(null);
  const cab: CabecalhoContent = { ...DEFAULT_CABECALHO, ...(cabSaved ?? {}), ...(cabecalhoOverride ?? {}) };
  const topbar: TopbarContent = { ...DEFAULT_TOPBAR, text: '', ...(topbarSaved ?? {}), ...(topbarOverride ?? {}) };
  const announcement = topbar.enabled ? topbar.text.trim() : '';

  // The header floats fixed below whatever stack of thin bars (free-shipping
  // announcement) is showing — it can appear
  // independently, so the offset is measured instead of hardcoded, and
  // updates itself whenever the bar is added/removed.
  const topBarRef = useRef<HTMLDivElement>(null);
  // Altura real (faixa + cabeçalho) em --hdr-h: as páginas começam logo abaixo, sem buraco.
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const set = () => {
      const h = (topBarRef.current?.offsetHeight ?? 0) + (headerRef.current?.offsetHeight ?? 0);
      if (h > 0) document.documentElement.style.setProperty('--hdr-h', `${h}px`);
    };
    set();
    const ro = new ResizeObserver(set);
    if (topBarRef.current) ro.observe(topBarRef.current);
    if (headerRef.current) ro.observe(headerRef.current);
    return () => ro.disconnect();
  }, []);
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
      .then((data) => { if (data?.topbar) setTopbarSaved(data.topbar); if (data?.cabecalho) setCabSaved(data.cabecalho); })
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
          <div data-edit="topbar" data-edit-label="Faixa do topo" title={announcement} className="overflow-hidden text-ellipsis whitespace-nowrap px-3 py-1 text-center text-[clamp(10px,2.9vw,12px)] leading-[1.4] sm:py-1.5" style={{ background: topbar.bg, color: topbar.color, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif' }}>
            {topbar.href ? <a href={topbar.href} className="underline-offset-2 hover:underline">{announcement}</a> : announcement}
          </div>
        )}
      </div>
      <header
        ref={headerRef}
        className={`kids fixed left-0 right-0 z-50 border-b bg-white transition-shadow duration-300 ${scrolled ? 'border-transparent shadow-[0_4px_20px_rgba(35,38,63,0.08)]' : 'border-[#efe7da]'}`}
        style={{ top: topBarHeight }}
      >
        <div ref={colRef} className="relative">
        {/* Desktop: logo · busca · menu · carrinho.
            Celular (estilo app): menu | logo no centro | carrinho, e a busca
            sempre aberta logo abaixo. */}
        <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 md:h-[72px] lg:gap-6 lg:px-8">
          <div className="flex flex-1 shrink-0 items-center justify-center md:flex-none md:justify-start">
            {/* Logo — "logo_direto" (padrao; Admin → Informações da Loja)
                mostra a imagem do logo sozinha, do jeito que ela e. */}
            <div data-edit="cabecalho" data-edit-label="Logo e cabeçalho" className="flex shrink-0">
            {bLogoStyle === 'logo_direto' ? (
              <Link href="/" onClick={goHome} className="flex shrink-0 items-center" aria-label={`${bStoreName} — Inicio`}>
                {/* Logo principal do editor visual (Cabeçalho e logo); vazio = logo original da Kitoys.
                    A imagem de Informações da Loja é o ícone do modo "Ícone + nome". */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cab.logoImage || DEFAULT_LOGO} alt={bStoreName} className="h-[var(--logo-m)] w-auto object-contain md:h-[var(--logo-d)]" style={{ ['--logo-d' as string]: `${Math.max(28, Math.min(68, cab.logoHeight))}px`, ['--logo-m' as string]: `${Math.max(28, Math.min(52, Math.round(cab.logoHeight * 0.76)))}px` }} />
              </Link>
            ) : (
              <Link href="/" onClick={goHome} className="flex shrink-0 items-center gap-2">
                <div className="flex h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-xl" style={{ background: bThemeColor }}>
                  {bLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bLogoUrl} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Smile className="h-6 w-6 text-white" aria-hidden="true" />
                  )}
                </div>
                <span className="font-kids text-xl font-bold text-[#23263f]">{bStoreName}</span>
              </Link>
            )}
            </div>

          </div>

          {/* Busca (desktop) */}
          <div data-edit="cabecalho" data-edit-label="Busca" className="hidden max-w-xl flex-1 md:block">
            <ProductSearch placeholder={cab.searchPlaceholder} />
          </div>

          {/* Right side: menu + carrinho */}
          <div className="contents md:flex md:shrink-0 md:items-center md:gap-2">
            {/* Menu: Inicio · Colecciones (painel com setores) */}
            <nav data-edit="cabecalho" data-edit-label="Menu" className="hidden items-center gap-1 md:flex" aria-label="Principal">
              <Link href="/" onClick={goHome} className={NAV_ITEM}>{cab.homeLabel || <Tr t={UI.inicio} />}</Link>
              <button
                type="button"
                className={`${NAV_ITEM} ${colOpen ? 'bg-[#FFF4E0]' : ''}`}
                aria-expanded={colOpen}
                aria-controls="menu-colecciones"
                onClick={() => setColOpen((v) => !v)}
                onMouseEnter={openCols}
                onMouseLeave={closeColsSoon}
              >
                {cab.collectionsLabel || <Tr t={UI.colecciones} />}
              </button>
            </nav>
            <LanguageSwitcher className="order-last md:order-none" />
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative hidden h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 hover:bg-[#FFE8C2] md:flex md:bg-[#FFF4E0]"
              aria-label="Abrir carrito"
            >
              <ShoppingCart className="h-6 w-6 text-[#1d1d1f] md:h-5 md:w-5 md:text-[#23263f]" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0071e3] px-1 text-[11px] font-extrabold text-white md:bg-[#c2410c]">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="order-first flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[#F2F4FA] md:hidden"
              aria-label="Menú"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-6 w-6 text-[#1d1d1f]" /> : <Menu className="h-6 w-6 text-[#1d1d1f]" />}
            </button>
          </div>
        </div>

        <div className="px-4 pb-3 md:hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' }}>
          <div data-edit="cabecalho" data-edit-label="Busca"><ProductSearch soft inputId="busqueda-movil" placeholder={cab.searchPlaceholder} /></div>
        </div>

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

      {/* Mobile drawer: setores com as colecoes (Inicio fica na barra de baixo) */}
      {mobileOpen && (
        <>
          {/* Abre ABAIXO da faixa do cabecalho (logo, carrinho e o X de
              fechar continuam visiveis na mesma faixa). */}
          <div
            className="fixed inset-x-0 bottom-0 z-40 bg-[#23263f]/40 md:hidden"
            style={{ top: topBarHeight + 117 }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="kids fixed bottom-0 left-0 z-40 flex w-full max-w-[320px] flex-col border-r border-[#efe7da] bg-white shadow-[12px_0_32px_rgba(35,38,63,0.12)] md:hidden"
            style={{ top: topBarHeight + 117 }}
          >
            <nav className="flex flex-1 flex-col overflow-y-auto px-4 pb-28 pt-4" aria-label="Colecciones" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' }}>
              <p className="px-1 pb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#86868b]"><Tr t={UI.colecciones} /></p>
              {/* Um bloco por setor: nome + "Ver todo" e as coleções com foto */}
              {menuSectors.map((sector) => (
                <section key={sector.id || sector.slug} className="border-t border-black/[0.06] py-3 first-of-type:border-t-0">
                  <div className="flex items-center justify-between px-1 pb-1.5">
                    <h3 className="text-[17px] font-bold text-[#1d1d1f]">{sector.name}</h3>
                    <Link href={`/sector/${sector.slug}`} onClick={() => setMobileOpen(false)} className="inline-flex min-h-9 items-center gap-1 rounded-full px-2 text-[13px] font-medium text-[#0071e3]">
                      Ver todo <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                  <ul>
                    {sector.collections.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={`/coleccion/${c.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="flex min-h-11 items-center gap-3 rounded-xl px-1 py-1.5 text-[15px] text-[#1d1d1f] transition-colors active:bg-black/[0.04]"
                        >
                          <span className="min-w-0 flex-1 truncate">{c.name}</span>
                          <span className="text-[#c7c7cc]" aria-hidden="true">›</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {/* Hogar: categorias de casa (sem colecao) — mesmo jeito das colecoes */}
              {mobileHomeCats.length > 0 && !menuSectors.some((s) => s.style === 'hogar') && (
                <section className="border-t border-black/[0.06] py-3">
                  <div className="flex items-center justify-between px-1 pb-1.5">
                    <h3 className="text-[17px] font-bold text-[#1d1d1f]">Hogar</h3>
                    <Link href="/hogar" onClick={() => setMobileOpen(false)} className="inline-flex min-h-9 items-center gap-1 rounded-full px-2 text-[13px] font-medium text-[#0071e3]">
                      Ver todo <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                  <ul>
                    {mobileHomeCats.map((cat) => (
                      <li key={cat.name}>
                        <Link
                          href={homeCategoryHref(cat.name)}
                          onClick={() => { selectHomeCategory(cat.name); setMobileOpen(false); }}
                          className="flex min-h-11 items-center gap-3 rounded-xl px-1 py-1.5 text-[15px] text-[#1d1d1f] transition-colors active:bg-black/[0.04]"
                        >
                          <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                          <span className="text-[#c7c7cc]" aria-hidden="true">›</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </nav>
          </div>
        </>
      )}
      {/* barra de baixo estilo app (celular), em todas as páginas da loja */}
      <MobileTabBar />
    </>
  );
}
