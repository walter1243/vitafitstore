'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, Leaf } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

const navLinks = [
  { href: '#productos', label: 'Productos' },
  { href: '#salud', label: 'Salud y Bienestar' },
  { href: '#fitness', label: 'Fitness' },
  { href: '#nosotros', label: 'Nosotros' },
];

export function Header() {
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 group-hover:bg-emerald-400 transition-colors duration-200">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold">
                <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">Vita</span>
                <span className="bg-gradient-to-r from-green-300 to-teal-300 bg-clip-text text-transparent">Fit</span>
                <span className="text-white/90"> Store</span>
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
