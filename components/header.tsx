'use client';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Menu, X, Flame } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

type CategoryMeta = {
  name: string;
  slug: string;
  enabled?: boolean;
  position?: number;
};

type DbProduct = {
  category?: string;
};

function normalizeCategory(raw?: string) {
  if (!raw) return 'geral';
  return raw.trim().toLowerCase();
}

function slugifyCategory(raw?: string) {
  if (!raw) return 'geral';
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toAnchor(raw?: string) {
  const slug = slugifyCategory(raw);
  if (slug === 'salud') return '#salud';
  if (slug === 'fitness') return '#fitness';
  return `#cat-${slug}`;
}

const fallbackNavLinks = [
  { href: '#productos', label: 'Productos' },
  { href: '#nosotros', label: 'Nosotros' },
];

export function Header() {
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [storeName, setStoreName] = useState('Nuestra Tienda');
  const [logoUrl, setLogoUrl] = useState('');
  const [themeColor, setThemeColor] = useState('#c2410c');
  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [announcement, setAnnouncement] = useState('');

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
        setStoreName(data?.storeName ?? 'Nuestra Tienda');
        setLogoUrl(data?.logoUrl ?? '');
        setThemeColor(data?.themeColor ?? '#c2410c');
      } catch {
        // ignore settings load errors
      }
    };

    const loadCategories = async () => {
      try {
        const res = await fetch('/api/categories', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as CategoryMeta[];
        if (!Array.isArray(data)) return;
        const enabled = data.filter(c => c.enabled !== false);
        setCategories(enabled);
      } catch {
        // ignore category load errors
      }
    };

    const loadProducts = async () => {
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as DbProduct[];
        if (!Array.isArray(data)) return;
        setProducts(data);
      } catch {
        // ignore product load errors
      }
    };

    void loadStoreSettings();
    void loadCategories();
    void loadProducts();

    const intervalId = window.setInterval(() => {
      void loadStoreSettings();
      void loadCategories();
      void loadProducts();
    }, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadStoreSettings();
        void loadCategories();
        void loadProducts();
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

  const categoriesWithProducts = useMemo(() => {
    if (!categories.length) return [] as CategoryMeta[];

    const used = new Set(products.map((p) => normalizeCategory(p.category)));
    return categories.filter((c) => used.has(normalizeCategory(c.name)) || used.has(normalizeCategory(c.slug)));
  }, [categories, products]);

  const navLinks = categoriesWithProducts.length
    ? [
        { href: '#productos', label: 'Productos' },
        ...categoriesWithProducts.map((c) => ({ href: toAnchor(c.slug || c.name), label: c.name })),
        { href: '#nosotros', label: 'Nosotros' },
      ]
    : fallbackNavLinks;

  return (
    <>
      {announcement && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-[#431407] px-4 py-1 text-center text-[10px] font-medium tracking-wide text-white sm:text-[11px]">
          {announcement}
        </div>
      )}
      <header
        className={`fixed left-0 right-0 z-50 transition-all duration-500 ${announcement ? 'top-5 sm:top-6' : 'top-0'}`}
        style={{
          background: scrolled
            ? 'rgba(251, 248, 245, 0.92)'
            : 'rgba(251, 248, 245, 0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(30, 41, 59, 0.08)',
          boxShadow: scrolled ? '0 4px 24px rgba(30,41,59,0.06)' : 'none',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-all duration-400 ${scrolled ? 'py-2' : 'py-2.5'}`}>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg group-hover:opacity-90 transition-colors duration-200 overflow-hidden"
                style={{ background: themeColor }}>
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <Flame className="h-4 w-4 text-white" />
                )}
              </div>
              <span className="text-lg font-bold">
                <span className="text-slate-800">{storeName}</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200 group cursor-pointer"
                >
                  {link.label}
                  <span className="absolute -bottom-0.5 left-0 h-px w-full bg-orange-600 scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                aria-label="Abrir carrito"
              >
                <ShoppingCart className="h-5 w-5 text-slate-700" />
                {totalItems > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-700 text-xs font-bold text-white animate-pulse">
                    {totalItems}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                aria-label="Menú"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5 text-slate-700" />
                ) : (
                  <Menu className="h-5 w-5 text-slate-700" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="fixed top-0 right-0 bottom-0 z-50 w-72 md:hidden flex flex-col bg-[#FAF8F5]"
            style={{
              borderLeft: '1px solid rgba(30,41,59,0.08)',
            }}
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <span className="text-lg font-bold text-slate-800">Menú</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-2 p-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-xl text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 cursor-pointer"
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
