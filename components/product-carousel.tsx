'use client';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Check, Eye } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { type Product } from '@/lib/products';

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
  onViewDetails: (product: Product) => void;
}

const badgeConfig: Record<string, { text: string; cls: string }> = {
  'mas-vendido': { text: 'Más vendido', cls: 'bg-gradient-to-r from-emerald-500 to-green-400' },
  oferta: { text: 'Oferta', cls: 'bg-gradient-to-r from-rose-500 to-pink-500' },
  nuevo: { text: 'Nuevo', cls: 'bg-gradient-to-r from-violet-500 to-purple-500' },
};

export function ProductCarousel({ products, title, subtitle, categoryLabel, categoryMedia, onViewDetails }: ProductCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', dragFree: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addedId, setAddedId] = useState<number | null>(null);
  const { addItem } = useCart();

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
    <section className="relative py-16 overflow-hidden" style={{ background: '#060f1e' }}>
      {/* Grid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {categoryMedia?.bannerUrl && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-500/20 bg-black/20">
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
        <div className="flex items-end justify-between mb-8">
          <div className="flex items-end gap-3">
            {categoryMedia?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={categoryMedia.logoUrl}
                alt={`${title} logo`}
                className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-xl border border-emerald-500/30"
              />
            )}
            <div>
            <p className="text-emerald-400 text-sm font-semibold tracking-[0.3em] uppercase mb-2">
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
              className="w-10 h-10 rounded-full border border-emerald-500/30 bg-black/40 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-all cursor-pointer"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={scrollNext}
              className="w-10 h-10 rounded-full border border-emerald-500/30 bg-black/40 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-all cursor-pointer"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Embla viewport */}
        <div ref={emblaRef} className="overflow-hidden px-2 sm:px-2 lg:px-0">
          <div className="flex gap-10 sm:gap-8 lg:gap-8">
            {products.map((product) => {
              const badge = product.badge ? badgeConfig[product.badge] : null;
              const isAdded = addedId === product.id;

              return (
                <div
                  key={product.id}
                  className="flex-none w-[228px] sm:w-[268px] lg:w-[276px] cursor-pointer"
                  onClick={() => onViewDetails(product)}
                >
                  <div
                    className="group relative rounded-2xl border border-white/8 overflow-hidden
                      transition-all duration-[350ms]
                      hover:-translate-y-3 hover:border-emerald-500/30
                      hover:shadow-[0_16px_40px_rgba(16,185,129,0.15)]"
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
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                        {categoryLabel ?? (product.category === 'salud' ? 'Salud y Bienestar' : 'Fitness')}
                      </p>
                      <h3 className="font-bold text-white text-sm leading-tight line-clamp-1 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-white/45 text-xs line-clamp-2 mb-3 leading-relaxed">
                        {product.shortDescription}
                      </p>

                      {/* Stars */}
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
                                ? 'bg-emerald-500 text-white'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500 hover:text-white'
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
                </div>
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
                background: i === selectedIndex ? '#10b981' : 'rgba(255,255,255,0.2)',
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
