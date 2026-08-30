'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Check, Eye } from 'lucide-react';
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
  'mas-vendido': { text: 'Más vendido', cls: 'bg-gradient-to-r from-sky-500 to-sky-400' },
  oferta: { text: 'Oferta', cls: 'bg-gradient-to-r from-rose-500 to-pink-500' },
  nuevo: { text: 'Nuevo', cls: 'bg-gradient-to-r from-violet-500 to-purple-500' },
};

export function ProductCarousel({ products, title, subtitle, categoryLabel, categoryMedia }: ProductCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', dragFree: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addedId, setAddedId] = useState<number | null>(null);
  const { addItem } = useCart();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<Array<HTMLDivElement | null>>([]);

  // Entrance animation: header + cards float in with a stagger the first
  // time this category section reaches the viewport.
  useEffect(() => {
    if (!sectionRef.current) return;
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
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

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const handleAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    e.preventDefault();
    addItem(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1800);
  };

  return (
    <section ref={sectionRef} className="relative py-16 overflow-hidden" style={{ background: '#060f1e' }}>
      {/* Grid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(14,165,233,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {categoryMedia?.bannerUrl && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-sky-500/20 bg-black/20">
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
                className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-xl border border-sky-500/30"
              />
            )}
            <div>
            <p className="text-sky-400 text-sm font-semibold tracking-[0.3em] uppercase mb-2">
              {subtitle}
            </p>
            <h2 className="text-white text-3xl sm:text-4xl font-black tracking-tight">
              {title}
            </h2>
            </div>
          </div>
          <div className="hidden sm:flex gap-2">
            <button
              onClick={scrollPrev}
              className="w-10 h-10 rounded-full border border-sky-500/30 bg-black/40 text-sky-400 flex items-center justify-center hover:bg-sky-500/20 transition-all cursor-pointer"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={scrollNext}
              className="w-10 h-10 rounded-full border border-sky-500/30 bg-black/40 text-sky-400 flex items-center justify-center hover:bg-sky-500/20 transition-all cursor-pointer"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Embla viewport */}
        <div ref={emblaRef} className="overflow-hidden px-2 sm:px-2 lg:px-0">
          <div className="-ml-3 flex sm:-ml-4 lg:-ml-5">
            {products.map((product, index) => {
              const badge = product.badge ? badgeConfig[product.badge] : null;
              const isAdded = addedId === product.id;

              return (
                <Link
                  key={product.id}
                  href={`/producto/${product.id}-${product.slug}`}
                  ref={(el) => { cardsRef.current[index] = el as unknown as HTMLDivElement; }}
                  className="flex-none pl-3 sm:pl-4 lg:pl-5 w-[228px] sm:w-[268px] lg:w-[276px] cursor-pointer block"
                >
                  <div
                    className="group relative rounded-2xl border border-white/8 overflow-hidden
                      transition-all duration-[350ms]
                      hover:-translate-y-3 hover:border-sky-500/30
                      hover:shadow-[0_16px_40px_rgba(14,165,233,0.15)]"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(4px)',
                      willChange: 'transform',
                    }}
                  >
                    {badge && (
                      <span
                        className={`absolute left-3 top-3 z-10 ${badge.cls} text-white text-[11px] font-bold px-2.5 py-1 rounded-full`}
                      >
                        {badge.text}
                      </span>
                    )}

                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-white/5">
                      <Image
                        src={product.mainImage ?? product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.07]"
                      />
                      <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="flex items-center gap-2 bg-white/95 text-gray-900 px-4 py-2 rounded-xl text-sm font-semibold">
                          <Eye className="h-4 w-4" />
                          Ver detalles
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-1">
                        {categoryLabel ?? (product.category === 'salud' ? 'Salud y Bienestar' : 'Fitness')}
                      </p>
                      <h3 className="font-bold text-white text-sm leading-tight line-clamp-1 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-white/45 text-xs line-clamp-2 mb-3 leading-relaxed">
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
                                  : 'fill-white/15 text-white/15'
                              }`}
                            />
                          ))}
                          <span className="text-xs text-white/40 ml-1">({product.reviews})</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-base font-bold text-white">
                            {product.price.toFixed(2)}€
                          </span>
                          {product.originalPrice && (
                            <span className="text-xs text-white/35 line-through ml-1.5">
                              {product.originalPrice.toFixed(2)}€
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => handleAdd(e, product)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 cursor-pointer
                            ${
                              isAdded
                                ? 'bg-sky-500 text-white'
                                : 'bg-sky-500/15 text-sky-400 border border-sky-500/25 hover:bg-sky-500 hover:text-white'
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
            })}
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
                background: i === selectedIndex ? '#0ea5e9' : 'rgba(255,255,255,0.2)',
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
