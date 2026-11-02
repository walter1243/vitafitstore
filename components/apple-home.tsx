'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, LayoutGrid, PenLine, ShoppingCart, SlidersHorizontal } from 'lucide-react';
import { type Product } from '@/lib/products';
import { toStoreProduct } from '@/lib/store-product';
import { useCart } from '@/lib/cart-context';
import { cardPrice } from '@/lib/personalize';
import { useSectors } from '@/components/kids/sectors-context';
import { useStoreProducts } from '@/components/kids/use-store-products';
import { GO_HOME_EVENT } from '@/components/mobile-tab-bar';

// Home no formato de app de loja: banner com slides, setores em cards que
// filtram os produtos, cards com selo + botao de carrinho e uma faixa de
// oferta no meio. A escolha de colecao detalhada continua no menu.

const FONT = { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif' };
const INK = '#1d1d1f';
const MUTED = '#6e6e73';
const BLUE = '#0071e3';
// Fundo de cada slide do banner (texto branco por cima: contraste alto).
const SLIDE_BG: [string, string][] = [
  ['#0b1730', '#12306b'],
  ['#3b0a0a', '#8f1d1d'],
  ['#0c2a1f', '#14594a'],
  ['#2a0d3d', '#5b2a86'],
  ['#2b1a0a', '#7a4a16'],
];
const slideBg = (k: number) => { const [a, b] = SLIDE_BG[k % SLIDE_BG.length]; return { a, b, css: `linear-gradient(120deg,${a} 0%,${b} 100%)` }; };

type Block = { key: string; title: string; tagline: string; href: string; products: Product[] };

function badgeOf(p: Product, off: number, sub: string) {
  if (off > 0) return { text: `-${off}%`, bg: '#d70015' };
  if (sub) return { text: sub.toUpperCase(), bg: '#1d8a3a' };
  if (p.personalize?.enabled) return { text: 'PERSONALIZABLE', bg: '#6e3cbc' };
  return null;
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const cp = cardPrice(product.price, product.personalize, product.sizes);
  const href = `/producto/${product.id}-${product.slug}`;
  // Com cor/tamanho/nome a escolha e na pagina do produto.
  const personal = Boolean(product.personalize?.enabled);
  const needsChoice = Boolean(personal || product.colorOptions?.length || product.sizes?.length);
  const img = product.mainImage ?? product.image;
  const badge = badgeOf(product, cp.off, cp.sub);

  function add(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-[20px] border border-black/[0.06] bg-white p-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-shadow duration-200 hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:p-3"
      style={{ outlineColor: BLUE }}
    >
      <div className="relative aspect-square overflow-hidden rounded-[14px] bg-[#f5f5f7]">
        {img && <Image src={img} alt={product.name} fill sizes="(min-width: 1024px) 260px, (min-width: 640px) 33vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />}
        {badge && (
          <span className="absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide text-white" style={{ background: badge.bg }}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-3">
        <h3 className="line-clamp-2 text-[14px] font-medium leading-snug sm:text-[15px]" style={{ color: INK }}>{product.name}</h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <p className="whitespace-nowrap text-[18px] font-bold leading-none sm:text-[20px]" style={{ color: INK }}>{cp.main}</p>
          {needsChoice ? (
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: BLUE }}
              aria-label={personal ? 'Personalizar' : 'Elegir opciones'}
              title={personal ? 'Personalizar' : 'Elegir opciones'}
            >
              {personal ? <PenLine className="h-[18px] w-[18px]" aria-hidden="true" /> : <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />}
            </span>
          ) : (
            <button
              type="button"
              onClick={add}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition-colors"
              style={{ background: added ? '#1d8a3a' : BLUE }}
              aria-label={`Añadir ${product.name} al carrito`}
            >
              {added ? <Check className="h-5 w-5" aria-hidden="true" /> : <ShoppingCart className="h-[18px] w-[18px]" aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

function SectionHead({ title, tagline, href }: { title: string; tagline?: string; href?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-[22px] font-bold leading-tight tracking-[-0.01em] sm:text-[30px]" style={{ color: INK }}>{title}</h2>
        {tagline && <p className="mt-0.5 truncate text-[14px] sm:text-[16px]" style={{ color: MUTED }}>{tagline}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-[15px] font-medium hover:underline" style={{ color: BLUE }}>
          Ver todo <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function Carousel({ products }: { products: Product[] }) {
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:gap-4 sm:px-6 [&::-webkit-scrollbar]:hidden">
      {products.map((p) => (
        <li key={p.id} className="w-[44vw] max-w-[230px] shrink-0 snap-start sm:w-[230px]">
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}

// Banner do topo: um slide por setor; passa sozinho (para no hover/foco e com
// "reduzir movimento"), arrasta com o dedo e tem os pontinhos pra escolher.
function HeroSlides({ blocks, onShop }: { blocks: Block[]; onShop: (key: string) => void }) {
  const slides = blocks
    .map((b) => ({ ...b, img: b.products.map((p) => p.mainImage ?? p.image).find(Boolean) as string | undefined }))
    .filter((s) => s.img)
    .slice(0, 5);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = slides.length;

  useEffect(() => {
    if (n < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), 5500);
    return () => clearInterval(t);
  }, [n, paused]);

  if (!n) return <div className="aspect-[16/9] rounded-[24px] bg-[#f5f5f7] sm:aspect-[21/8]" aria-hidden="true" />;

  return (
    <div
      className="relative overflow-hidden rounded-[24px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true); }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
        if (Math.abs(dx) > 40) setI((v) => (v + (dx < 0 ? 1 : -1) + n) % n);
        touchX.current = null;
      }}
      aria-roledescription="carrusel"
    >
      <div className="flex transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, k) => (
          <div
            key={s.key}
            className="relative flex min-h-[210px] w-full shrink-0 items-center sm:min-h-[340px]"
            style={{ background: slideBg(k).css }}
            aria-hidden={k !== i}
            role="group"
            aria-label={`${k + 1} de ${n}`}
          >
            <div className="relative z-10 w-[60%] pb-10 pl-5 pr-2 pt-6 sm:w-1/2 sm:py-12 sm:pl-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7cc4ff] sm:text-[13px]">{k === 0 ? 'Novedades' : 'Colección'}</p>
              <h1 className="mt-1.5 text-[24px] font-extrabold uppercase leading-[1.05] text-white sm:text-[46px]">{s.title}</h1>
              {s.tagline && <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-white/85 sm:text-[18px]">{s.tagline}</p>}
              <button
                type="button"
                tabIndex={k === i ? 0 : -1}
                onClick={() => onShop(s.key)}
                className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full pl-4 pr-1.5 text-[12px] font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 sm:mt-6 sm:text-[15px]"
                style={{ background: BLUE }}
              >
                Comprar ahora
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white" style={{ color: BLUE }}><ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 w-[46%] sm:w-1/2">
              <Image src={s.img!} alt="" fill priority={k === 0} sizes="(min-width: 1024px) 560px, 50vw" className="object-cover" />
              {/* funde a foto no fundo do slide */}
              <div className="absolute inset-y-0 left-0 w-1/3" style={{ background: `linear-gradient(90deg, ${slideBg(k).b} 0%, transparent 100%)` }} />
            </div>
          </div>
        ))}
      </div>
      {n > 1 && (
        <div className="absolute bottom-3 left-5 z-20 flex gap-1.5 sm:bottom-5 sm:left-12">
          {slides.map((s, k) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setI(k)}
              className="flex h-6 cursor-pointer items-center"
              aria-label={`Ver ${s.title}`}
              aria-current={k === i}
            >
              <span className={`block h-2 rounded-full transition-all duration-300 ${k === i ? 'w-6 bg-white' : 'w-2 bg-white/45'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppleHome() {
  const { products } = useStoreProducts();
  const { sectors, collectionForProduct } = useSectors();
  const [active, setActive] = useState('todos');
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reset = () => setActive('todos');
    window.addEventListener(GO_HOME_EVENT, reset);
    return () => window.removeEventListener(GO_HOME_EVENT, reset);
  }, []);

  const blocks: Block[] = useMemo(() => {
    const bySector: Record<string, Product[]> = {};
    const loose: Product[] = [];
    for (const p of products) {
      const c = collectionForProduct(p);
      const s = c ? sectors.find((x) => x.collections.some((y) => y.slug === c.slug)) : null;
      if (s) (bySector[s.slug] ??= []).push(toStoreProduct(p));
      else loose.push(toStoreProduct(p));
    }
    const list: Block[] = sectors
      .filter((s) => bySector[s.slug]?.length)
      .map((s) => ({ key: s.slug, title: s.name, tagline: s.tagline, href: `/sector/${s.slug}`, products: bySector[s.slug] }));
    if (loose.length) list.push({ key: 'mas', title: 'Más productos', tagline: 'Detalles impresos en 3D para tu casa', href: '', products: loose });
    return list;
  }, [products, sectors, collectionForProduct]);

  // Navidad primeiro no banner durante a temporada.
  const heroBlocks = useMemo(() => {
    const nav = blocks.find((b) => b.key === 'navidad');
    return nav ? [nav, ...blocks.filter((b) => b !== nav && b.key !== 'mas')] : blocks.filter((b) => b.key !== 'mas');
  }, [blocks]);

  const personalizable = useMemo(() => products.map(toStoreProduct).filter((p) => p.personalize?.enabled), [products]);
  const promoImg = personalizable.map((p) => p.mainImage ?? p.image).find(Boolean);
  const selected = blocks.find((b) => b.key === active);

  function choose(key: string) {
    setActive(key);
    requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  const promo = personalizable.length > 0 && (
    <section className="my-10 overflow-hidden rounded-[24px] sm:my-14" style={{ background: 'linear-gradient(120deg,#0b1730 0%,#1b3f8f 100%)' }}>
      <div className="relative flex min-h-[170px] items-center sm:min-h-[240px]">
        <div className="relative z-10 w-[60%] py-6 pl-5 sm:w-1/2 sm:py-10 sm:pl-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7cc4ff] sm:text-[13px]">Hecho para ti</p>
          <h2 className="mt-1 text-[22px] font-extrabold uppercase leading-[1.05] text-white sm:text-[38px]">Con su nombre</h2>
          <p className="mt-1.5 text-[13px] leading-snug text-white/85 sm:text-[17px]">Escribe el nombre y míralo al instante antes de comprar.</p>
          <button
            type="button"
            onClick={() => { setActive('personalizables'); requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}
            className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-5 text-[13px] font-bold uppercase tracking-wide transition-opacity hover:opacity-90 sm:text-[15px]"
            style={{ color: BLUE }}
          >
            Personalizar <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {promoImg && (
          <div className="absolute inset-y-0 right-0 w-[44%] sm:w-[45%]">
            <Image src={promoImg} alt="" fill sizes="(min-width: 1024px) 500px, 45vw" className="object-cover" />
            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#1b3f8f] to-transparent" />
          </div>
        )}
      </div>
    </section>
  );

  const chips = [
    { key: 'todos', label: 'Todo', img: undefined as string | undefined },
    ...blocks.filter((b) => b.key !== 'mas').map((b) => ({ key: b.key, label: b.title.replace(/ personalizados?$/i, ''), img: b.products.map((p) => p.mainImage ?? p.image).find(Boolean) })),
    ...(personalizable.length ? [{ key: 'personalizables', label: 'Con nombre', img: promoImg }] : []),
  ];

  const filtered = active === 'personalizables'
    ? { key: 'personalizables', title: 'Con su nombre', tagline: 'Personaliza y míralo al instante', href: '', products: personalizable }
    : selected;

  return (
    <div style={FONT} className="bg-[#f5f5f7] antialiased [&_h1]:[font-family:inherit] [&_h2]:[font-family:inherit] [&_h3]:[font-family:inherit]">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-[178px] sm:px-6 md:pt-[124px]">
        <HeroSlides blocks={heroBlocks} onShop={choose} />

        {/* Setores em cards: tocar filtra os produtos logo abaixo */}
        <nav aria-label="Categorías" className="mt-6 sm:mt-8">
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-3 sm:px-0 [&::-webkit-scrollbar]:hidden">
            {chips.map((c) => {
              const on = active === c.key;
              return (
                <li key={c.key} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => choose(c.key)}
                    aria-pressed={on}
                    className="flex w-[78px] cursor-pointer flex-col items-center gap-1.5 rounded-2xl py-1.5 transition-colors sm:w-[96px]"
                  >
                    <span
                      className={`relative flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-2 transition-all duration-200 sm:h-[72px] sm:w-[72px] ${on ? '' : 'ring-transparent hover:ring-black/10'}`}
                      style={on ? { ['--tw-ring-color' as string]: BLUE } : undefined}
                    >
                      {c.img ? <Image src={c.img} alt="" fill sizes="72px" className="object-cover" /> : <LayoutGrid className="h-6 w-6" style={{ color: on ? BLUE : INK }} aria-hidden="true" />}
                    </span>
                    <span className={`line-clamp-1 text-[12px] sm:text-[13px] ${on ? 'font-bold' : 'font-medium'}`} style={{ color: on ? BLUE : INK }}>{c.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div id="productos" ref={listRef} className="scroll-mt-28 pt-6 sm:pt-8">
          {filtered ? (
            <section aria-live="polite">
              <SectionHead title={filtered.title} tagline={filtered.tagline} href={filtered.href || undefined} />
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {filtered.products.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
              </ul>
            </section>
          ) : (
            blocks.map((b, k) => (
              <div key={b.key}>
                <section id={b.key} className="scroll-mt-28 pt-6 first:pt-0 sm:pt-8">
                  <SectionHead title={b.title} tagline={b.tagline} href={b.href || undefined} />
                  <Carousel products={b.products} />
                </section>
                {k === 0 && promo}
              </div>
            ))
          )}
          {blocks.length === 0 && <div className="h-64" aria-hidden="true" />}
        </div>
      </div>
    </div>
  );
}
