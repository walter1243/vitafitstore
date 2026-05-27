'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, Leaf } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

type CategoryMeta = {
  name: string;
  slug: string;
  enabled?: boolean;
  position?: number;
};

function toAnchor(slug: string) {
  if (slug === 'salud') return '#salud';
  if (slug === 'fitness') return '#fitness';
  return `#cat-${slug}`;
}

const fallbackNavLinks = [
  { href: '#productos', label: 'Productos' },
  { href: '#salud', label: 'Salud y Bienestar' },
  { href: '#fitness', label: 'Fitness' },
  { href: '#nosotros', label: 'Nosotros' },
];

export function Header() {
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [storeName, setStoreName] = useState('VitaFit Store');
  const [logoUrl, setLogoUrl] = useState('');
  const [themeColor, setThemeColor] = useState('#10b981');
  const [categories, setCategories] = useState<CategoryMeta[]>([]);

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
        setStoreName(data?.storeName ?? 'VitaFit Store');
        setLogoUrl(data?.logoUrl ?? '');
        setThemeColor(data?.themeColor ?? '#10b981');
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

    void loadStoreSettings();
    void loadCategories();

    const intervalId = window.setInterval(() => {
      void loadStoreSettings();
      void loadCategories();
    }, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadStoreSettings();
        void loadCategories();
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

  const navLinks = categories.length
    ? [
        { href: '#productos', label: 'Productos' },
        ...categories.map((c) => ({ href: toAnchor(c.slug), label: c.name })),
        { href: '#nosotros', label: 'Nosotros' },
      ]
    : fallbackNavLinks;

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled
            ? 'rgba(6, 15, 30, 0.82)'
            : 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
          boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.18)' : 'none',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-all duration-400 ${scrolled ? 'py-3' : 'py-4'}`}>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg group-hover:opacity-90 transition-colors duration-200 overflow-hidden"
                style={{ background: themeColor }}>
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <Leaf className="h-4 w-4 text-white" />
                )}
              </div>
              <span className="text-lg font-bold">
                <span className="text-white/90">{storeName}</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 group cursor-pointer"
                >
                  {link.label}
                  <span className="absolute -bottom-0.5 left-0 h-px w-full bg-emerald-400 scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 transition-all duration-200 cursor-pointer"
                aria-label="Abrir carrito"
              >
                <ShoppingCart className="h-5 w-5 text-white" />
                {totalItems > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white animate-pulse">
                    {totalItems}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 transition-all duration-200 cursor-pointer"
                aria-label="Menú"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5 text-white" />
                ) : (
                  <Menu className="h-5 w-5 text-white" />
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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="fixed top-0 right-0 bottom-0 z-50 w-72 md:hidden flex flex-col"
            style={{
              background: 'rgba(6, 15, 30, 0.96)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex justify-between items-center p-6 border-b border-white/8">
              <span className="text-lg font-bold text-white">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl border border-white/15 text-white/70 hover:text-white cursor-pointer"
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
                  className="px-4 py-3 rounded-xl text-base font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all duration-200 cursor-pointer"
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
