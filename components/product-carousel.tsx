'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, ShoppingCart, Check, Eye } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { type Product } from '@/lib/products';

gsap.registerPlugin(ScrollTrigger);

interface ProductCarouselProps {
  products: Product[];
  title: string;
  subtitle: string;
  categoryLabel?: string;
  categoryMedia?: {
    bannerType?: 'image' | 'video';
    bannerUrl?: string;
    logoUrl?: string;
  };
}

const badgeConfig: Record<string, { text: string; cls: string }> = {
  'mas-vendido': { text: 'Más vendido', cls: 'bg-gradient-to-r from-orange-700 to-orange-600' },
  oferta: { text: 'Oferta', cls: 'bg-gradient-to-r from-rose-500 to-pink-500' },
  nuevo: { text: 'Nuevo', cls: 'bg-gradient-to-r from-violet-500 to-purple-500' },
};

function ProductCard({ product, index, isAdded, onAdd, onRef, categoryLabel }: {
  product: Product;
  index: number;
  isAdded: boolean;
  onAdd: (e: React.MouseEvent, product: Product) => void;
  onRef: (el: HTMLAnchorElement | null, index: number) => void;
  categoryLabel?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const badge = product.badge ? badgeConfig[product.badge] : null;
  const secondaryImage = product.additionalImages?.[0];

  return (
    <Link
      href={`/producto/${product.id}-${product.slug}`}
      ref={(el) => onRef(el, index)}
      className="flex-none pl-3 sm:pl-4 lg:pl-5 w-[228px] sm:w-[268px] lg:w-[276px] cursor-pointer block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="card-shine group relative rounded-2xl border border-slate-200 bg-white overflow-hidden
          transition-all duration-[350ms]
          hover:-translate-y-2 hover:border-orange-200
          shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.09)]"
      >
        {badge && (
          <span className={`absolute left-3 top-3 z-10 ${badge.cls} text-white text-[11px] font-bold px-2.5 py-1 rounded-full`}>
            {badge.text}
          </span>
        )}

        {/* Image — swaps to a secondary photo on hover/tap when one exists */}
        <div className="relative aspect-square overflow-hidden bg-slate-50">
          <Image
            src={hovered && secondaryImage ? secondaryImage : (product.mainImage ?? product.image)}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
          <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="flex items-center gap-2 bg-white text-slate-800 px-4 py-2 rounded-xl text-sm font-semibold">
              <Eye className="h-4 w-4" />
              Ver detalles
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700 mb-1">
            {categoryLabel ?? (product.category === 'salud' ? 'Salud y Bienestar' : 'Fitness')}
          </p>
          <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1 mb-1">
            {product.name}
          </h3>
          <p className="text-slate-500 text-xs line-clamp-2 mb-3 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Stars — only shown once real review data exists */}
          {product.reviews > 0 && (
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(product.rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-slate-200 text-slate-200'
                  }`}
                />
              ))}
              <span className="text-xs text-slate-400 ml-1">({product.reviews})</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-base font-bold text-slate-900">
                {product.price.toFixed(2)}€
              </span>
              {product.originalPrice && (
                <span className="text-xs text-slate-400 line-through ml-1.5">
                  {product.originalPrice.toFixed(2)}€
                </span>
              )}
            </div>
            <button
              onClick={(e) => onAdd(e, product)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 cursor-pointer
                ${
                  isAdded
                    ? 'bg-orange-700 text-white'
                    : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-700 hover:text-white hover:border-orange-700'
                }`}
            >
              {isAdded ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <ShoppingCart className="h-3.5 w-3.5" />
              )}
              {isAdded ? '¡Listo!' : 'Añadir'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProductCarousel({ products, title, subtitle, categoryLabel, categoryMedia }: ProductCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', dragFree: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addedId, setAddedId] = useState<number | null>(null);
  const { addItem } = useCart();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<Array<HTMLAnchorElement | null>>([]);

  // Entrance animation: header + cards float in with a stagger the first
  // time this category section reaches the viewport.
  useEffect(() => {
    if (!sectionRef.current) return;
    const cards = cardsRef.current.filter(Boolean) as HTMLAnchorElement[];
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.set(headerRef.current, { opacity: 0, y: 30 });
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top 80%',
          once: true,
          onEnter: () => gsap.to(headerRef.current, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }),
        });
      }
      if (cards.length) {
        gsap.set(cards, { opacity: 0, y: 50, scale: 0.94 });
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top 78%',
          once: true,
          onEnter: () =>
            gsap.to(cards, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.7,
              stagger: 0.09,
              ease: 'back.out(1.4)',
            }),
        });
      }
    }, sectionRef);
    return () => ctx.revert();
    // Runs once per mount only — `products` is refetched on a background poll
    // every 15s and would otherwise re-hide already-visible cards each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateState = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    updateState();
    emblaApi.on('select', updateState);
    emblaApi.on('reInit', updateState);
    return () => { emblaApi.off('select', updateState); emblaApi.off('reInit', updateState); };
  }, [emblaApi, updateState]);

  // Auto-scroll
  useEffect(() => {
    if (!emblaApi) return;
    const id = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => clearInterval(id);
  }, [emblaApi]);

  const handleAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    e.preventDefault();
    addItem(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1800);
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-16 overflow-hidden bg-[#FAF8F5]"
    >
      {/* Soft warm speckle — replaces the old hard grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          backgroundImage: 'radial-gradient(rgba(194, 65, 12, 0.05) 1px, transparent 1.5px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {categoryMedia?.bannerUrl && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {categoryMedia.bannerType === 'video' ? (
              <video
                src={categoryMedia.bannerUrl}
                className="w-full h-[160px] sm:h-[220px] object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={categoryMedia.bannerUrl}
                alt={title}
                className="w-full h-[160px] sm:h-[220px] object-cover"
              />
            )}
          </div>
        )}

        {/* Section header */}
        <div ref={headerRef} className="flex items-end justify-between mb-8">
          <div className="flex items-end gap-3">
            {categoryMedia?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={categoryMedia.logoUrl}
                alt={`${title} logo`}
                className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-xl border border-slate-200"
              />
            )}
            <div>
            <p className="text-orange-700 text-sm font-semibold tracking-[0.3em] uppercase mb-2">
              {subtitle}
            </p>
            <h2 className="text-slate-900 text-3xl sm:text-4xl font-black tracking-tight">
              {title}
            </h2>
            </div>
          </div>
        </div>

        {/* Embla viewport */}
        <div ref={emblaRef} className="overflow-hidden px-2 sm:px-2 lg:px-0">
          <div className="-ml-3 flex sm:-ml-4 lg:-ml-5">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                isAdded={addedId === product.id}
                onAdd={handleAdd}
                categoryLabel={categoryLabel}
                onRef={(el, i) => { cardsRef.current[i] = el; }}
              />
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className="rounded-full transition-all duration-300 cursor-pointer"
              style={{
                width: i === selectedIndex ? '20px' : '6px',
                height: '6px',
                background: i === selectedIndex ? '#c2410c' : 'rgba(30,41,59,0.15)',
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
