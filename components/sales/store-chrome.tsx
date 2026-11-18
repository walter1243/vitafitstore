'use client';

// Cabeçalho e rodapé das lojas próprias (multi-loja), ex.: VICE CITY STORE.
// Usados na página da loja (/<slug>) e na página de produto dos produtos dela,
// no lugar do cabeçalho/rodapé da Kitoys — quem entra pelo Instagram da loja
// não vê nada da Kitoys. Carrinho e checkout continuam os mesmos.
//
// Cabeçalho: barra de vidro flutuante; a altura acompanha o tamanho do logo. Com overlay, ele
// fica POR CIMA da capa (a foto começa no topo da tela, atrás do vidro).

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag } from 'lucide-react';
import { storeFontClass } from '@/components/sales/store-fonts';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useCart } from '@/lib/cart-context';
import { clampLogoHeight, storeBarHeight, storeHeaderOffset, storeLegalHref, storePath, type SalesPageConfig } from '@/lib/sales-pages-shared';
import { rememberStore } from '@/lib/store-context';
import { PAYMENT_LOGOS } from '@/components/payment-logos';

type Brand = Pick<SalesPageConfig, 'slug' | 'title' | 'logoImage' | 'neonPrimary' | 'neonSecondary' | 'footerNote'> & { logoHeight?: number; whatsappEnabled?: boolean; whatsappNumber?: string; instagram?: string };

// Busca da loja: o topo e a lista de produtos conversam por este evento.
export const STORE_SEARCH_EVENT = 'kt-store-search';

export function StoreHeader({ store, overlay = false, onCatalog }: { store: Brand; overlay?: boolean; onCatalog?: () => void }) {
  const router = useRouter();
  const { setIsCartOpen, totalItems, isCartOpen } = useCart();
  // Aviso "Añadido al carrito" (some sozinho; não aparece se a gaveta abriu).
  const cartOpenRef = useRef(isCartOpen);
  cartOpenRef.current = isCartOpen;
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    let hide: ReturnType<typeof setTimeout> | undefined;
    const onAdd = (e: Event) => {
      const name = String((e as CustomEvent).detail?.name ?? '');
      setTimeout(() => {
        if (cartOpenRef.current) return;
        setToast(name);
        if (hide) clearTimeout(hide);
        hide = setTimeout(() => setToast(null), 3400);
      }, 120);
    };
    window.addEventListener('kitoys:add-to-cart', onAdd);
    return () => { window.removeEventListener('kitoys:add-to-cart', onAdd); if (hide) clearTimeout(hide); };
  }, []);
  // Lembra a loja nesta visita (checkout e carrinho vazio voltam para ela).
  useEffect(() => { rememberStore(store.slug); }, [store.slug]);
  const home = storePath(store.slug);
  const P = store.neonPrimary;
  const S = store.neonSecondary;
  // Tamanho do logo (Editar loja): no celular 80% dele, para caber com o carrinho.
  const logoH = clampLogoHeight(store.logoHeight);
  const barH = storeBarHeight(store);

  // Busca: na página da loja filtra a lista na hora; nas outras páginas leva à loja com ?q=.
  const [q, setQ] = useState('');
  useEffect(() => {
    const on = (e: Event) => setQ(String((e as CustomEvent).detail ?? ''));
    window.addEventListener(STORE_SEARCH_EVENT, on);
    return () => window.removeEventListener(STORE_SEARCH_EVENT, on);
  }, []);
  const typed = (v: string) => {
    setQ(v);
    if (onCatalog) window.dispatchEvent(new CustomEvent(STORE_SEARCH_EVENT, { detail: v }));
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onCatalog) { window.dispatchEvent(new CustomEvent(STORE_SEARCH_EVENT, { detail: q })); onCatalog(); }
    else router.push(`${home}?q=${encodeURIComponent(q.trim())}#productos`);
  };
  const searchBox = (cls: string) => (
    <form role="search" onSubmit={submit} className={cls}>
      <label className="relative block">
        <span className="sr-only">Buscar en {store.title}</span>
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/55" aria-hidden />
        <input type="search" value={q} onChange={(e) => typed(e.target.value)} placeholder={`Buscar en ${store.title}…`} enterKeyHint="search"
          className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.07] pl-10 pr-3 text-base text-white outline-none transition-colors placeholder:text-white/45 focus:border-[var(--vc-s)]"
          style={{ ['--vc-s' as string]: S }} />
      </label>
    </form>
  );

  return (
    <header
      className={`sticky top-0 z-40 px-3 pt-3 text-white ${overlay ? 'mb-[calc(var(--hdr-m)*-1)] md:mb-[calc(var(--hdr-d)*-1)]' : ''}`}
      style={{ ['--hdr-m' as string]: `${storeHeaderOffset(store, true)}px`, ['--hdr-d' as string]: `${storeHeaderOffset(store)}px` }}
    >
      <div className="mx-auto max-w-6xl rounded-2xl border border-white/15 bg-[#0d0418]/60 px-3 shadow-[0_10px_30px_rgba(0,0,0,.35)] backdrop-blur-xl sm:px-4">
        <div style={{ height: barH }} className="flex items-center gap-3 md:gap-5">
          <Link href={home} className="flex min-w-0 shrink-0 items-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: S }} aria-label={store.title}>
            {store.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoImage} alt={store.title} style={{ ['--logo-h' as string]: `${logoH}px`, ['--logo-h-m' as string]: `${Math.round(logoH * 0.8)}px` }} className="h-[var(--logo-h-m)] w-auto max-w-[58vw] object-contain md:h-[var(--logo-h)] md:max-w-[340px]" />
            ) : (
              <span className="font-store-display truncate bg-clip-text text-2xl uppercase text-transparent" style={{ backgroundImage: `linear-gradient(95deg, #fff 0%, ${S} 45%, ${P} 100%)` }}>{store.title}</span>
            )}
          </Link>
          {/* computador: busca entre o logo e Colección/Carrito */}
          {searchBox('hidden min-w-0 flex-1 md:block')}
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {onCatalog ? (
              <button type="button" onClick={onCatalog} className="hidden h-10 cursor-pointer items-center rounded-xl px-3.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:flex">Colección</button>
            ) : (
              <Link href={`${home}#productos`} className="hidden h-10 items-center rounded-xl px-3.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:flex">Colección</Link>
            )}
            {/* idioma com bandeira, igual à Kitoys */}
            <LanguageSwitcher tone="dark" />
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              data-cart-target
              aria-label={totalItems > 0 ? `Abrir carrito (${totalItems})` : 'Abrir carrito'}
              className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            >
              <ShoppingBag size={26} strokeWidth={1.8} aria-hidden />
              {totalItems > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[11px] font-bold text-black" style={{ background: S, boxShadow: `0 0 10px ${S}` }}>
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
        {/* celular: busca numa linha embaixo do logo */}
        {searchBox('pb-3 md:hidden')}
      </div>
      {toast !== null && (
        <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-3 top-full mt-2 flex justify-end">
          <div className="pointer-events-auto mx-auto flex w-full max-w-sm items-center gap-4 rounded-xl border-l-4 bg-[#0d0418]/95 py-3 pl-4 pr-3 shadow-[0_16px_40px_rgba(0,0,0,.5)] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 sm:mx-0 sm:mr-[max(0px,calc((100%-72rem)/2))]" style={{ borderColor: P }}>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">Añadido al carrito</p>
              {toast && <p className="mt-0.5 truncate text-sm text-white/65">{toast}</p>}
            </div>
            <button type="button" onClick={() => { setToast(null); setIsCartOpen(true); }}
              className="h-10 shrink-0 cursor-pointer rounded-lg px-3.5 text-xs font-bold uppercase tracking-[0.12em] text-black"
              style={{ background: `linear-gradient(90deg, ${S}, ${P})` }}>
              Ver carrito
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

// Mesmo critério do rodapé da Kitoys: só mostra o logo do método que está ATIVO
// na conta Stripe (/api/checkout/stripe-status) — nunca prometer o que o checkout não tem.
const LOGO_NEEDS: Record<string, (methods: string[], bizum: string) => boolean> = {
  visa: (m) => m.includes('card'),
  mastercard: (m) => m.includes('card'),
  'apple-pay': (m) => m.includes('card'),
  'google-pay': (m) => m.includes('card'),
  paypal: (m) => m.includes('paypal'),
  bizum: (_m, bizum) => bizum === 'active',
};

function PaymentRow() {
  const [payment, setPayment] = useState<{ methods: string[]; bizum: string } | null>(null);
  useEffect(() => {
    fetch('/api/checkout/stripe-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (Array.isArray(d?.paymentMethods)) setPayment({ methods: d.paymentMethods, bizum: String(d.bizum ?? '') }); })
      .catch(() => {});
  }, []);
  const logos = PAYMENT_LOGOS.filter(({ key }) => (payment ? LOGO_NEEDS[key]?.(payment.methods, payment.bizum) : key === 'visa' || key === 'mastercard'));
  return (
    <div className="flex flex-wrap justify-center gap-1.5" aria-label="Métodos de pago aceptados">
      {logos.map(({ key, label, Logo }) => (
        <span key={key} title={label} className="overflow-hidden rounded-md">
          <Logo w={44} h={28} />
        </span>
      ))}
    </div>
  );
}

// Contato da loja: número próprio (Editar loja) ou o WhatsApp/e-mail da Kitoys.
export function useStoreContact(store: Pick<Brand, 'whatsappNumber'>) {
  const [settings, setSettings] = useState<{ whatsapp: string; email: string }>({ whatsapp: '', email: '' });
  useEffect(() => {
    fetch('/api/store-settings', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setSettings({ whatsapp: String(d.whatsapp ?? ''), email: String(d.email ?? '').trim() }); })
      .catch(() => {});
  }, []);
  const display = (store.whatsappNumber || settings.whatsapp).trim();
  return { phone: display.replace(/\D/g, ''), phoneLabel: display, email: settings.email };
}

export const waLink = (phone: string, text: string) => (phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : '');

function WhatsAppGlyph({ size = 20 }: { size?: number }) {
  // logo oficial do WhatsApp (Simple Icons)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

// Botão do WhatsApp flutuante (Editar loja → WhatsApp na loja). lift: sobe no
// celular para não ficar em cima da barra fixa de compra da página de produto.
export function StoreWhatsApp({ store, lift = false }: { store: Brand; lift?: boolean }) {
  const { phone } = useStoreContact(store);
  if (store.whatsappEnabled === false || !phone) return null;
  return (
    <a
      href={waLink(phone, `¡Hola ${store.title}! Quiero hacer un pedido personalizado con nombre.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className={`${storeFontClass} fixed right-4 z-40 inline-flex h-12 items-center gap-2 rounded-xl border border-white/40 px-4 text-sm uppercase tracking-wider text-white transition-transform hover:scale-[1.04] ${lift ? 'bottom-24 lg:bottom-6' : 'bottom-5'}`}
      style={{ background: 'linear-gradient(120deg, #6d28d9 0%, #ff2d9b 55%, #ff9a3c 100%)', boxShadow: '0 0 24px rgba(255,45,155,.55), 0 10px 26px rgba(0,0,0,.5)', textShadow: '0 1px 2px rgba(0,0,0,.35)' }}
    >
      <WhatsAppGlyph size={22} />
      <span className="font-store-display">WhatsApp</span>
    </a>
  );
}

function instagramHref(v?: string) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  return `https://instagram.com/${s.replace(/^@/, '')}`;
}

export function StoreFooter({ store }: { store: Brand }) {
  const { phone, phoneLabel, email } = useStoreContact(store);
  const home = storePath(store.slug);
  const ig = instagramHref(store.instagram);
  const legal = (doc: string) => storeLegalHref(store.slug, doc);
  const link = 'text-white/65 transition-colors hover:text-white';
  const Col = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">{title}</p>
      <ul className="mt-4 space-y-3 text-sm">{children}</ul>
    </div>
  );

  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#07030d] text-white/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <p className="font-store-display text-4xl uppercase leading-none text-white">{store.title}</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed">{store.footerNote}</p>
          {ig && (
            <a href={ig} target="_blank" rel="noopener noreferrer"
              className="mt-6 inline-flex h-10 items-center rounded-md border border-white/20 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:border-white">
              Instagram
            </a>
          )}
        </div>
        <Col title="Tienda">
          <li><Link href={`${home}#productos`} className={link}>Productos</Link></li>
          <li><Link href={legal('envios')} className={link}>Envíos</Link></li>
          <li><Link href={legal('devoluciones')} className={link}>Devoluciones</Link></li>
        </Col>
        <Col title="Ayuda">
          {store.whatsappEnabled !== false && phone && (
            <li><a href={waLink(phone, `¡Hola ${store.title}! Tengo una duda.`)} target="_blank" rel="noopener noreferrer" className={link}>WhatsApp · {phoneLabel}</a></li>
          )}
          {email && <li><a href={`mailto:${email}`} className={`${link} break-all`}>{email}</a></li>}
          <li><Link href={legal('terminos')} className={link}>Términos y condiciones</Link></li>
        </Col>
        <Col title="Legal">
          <li><Link href={legal('privacidad')} className={link}>Privacidad</Link></li>
          <li><Link href={legal('cookies')} className={link}>Cookies</Link></li>
          <li><Link href={legal('aviso-legal')} className={link}>Aviso legal</Link></li>
        </Col>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-6 md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Pago seguro</span>
            <PaymentRow />
          </div>
          <p className="text-center text-xs text-white/40">© {new Date().getFullYear()} {store.title} · Precios con IVA incluido</p>
        </div>
      </div>
    </footer>
  );
}
