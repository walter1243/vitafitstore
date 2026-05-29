'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Star, ShoppingCart, Check, Lock, Truck, RotateCcw,
  Minus, Plus, X, ChevronLeft, ChevronRight, Play, ChevronDown,
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { type Product, productReviews } from '@/lib/products';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

const badgeStyles: Record<string, string> = {
  'mas-vendido': 'bg-emerald-500',
  oferta: 'bg-rose-500',
  nuevo: 'bg-violet-500',
};
const badgeText: Record<string, string> = {
  'mas-vendido': 'Más vendido',
  oferta: 'Oferta',
  nuevo: 'Nuevo',
};

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${sz} ${i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'fill-white/10 text-white/10'}`}
        />
      ))}
    </div>
  );
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (product) {
      setActiveImage(null);
      setImageError(false);
      setQuantity(1);
      setAdded(false);
      setAdding(false);
      setDetailOpen(false);
    }
  }, [product?.id]);

  // Lock body scroll while open
  useEffect(() => {
    if (!product) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [product]);

  if (!product) return null;

  const reviews = productReviews[product.id] || [];
  const mainImage = product.mainImage ?? product.image;
  const galleryImages = [mainImage, ...(product.additionalImages ?? [])].filter(Boolean) as string[];
  const displayImage = activeImage ?? mainImage;
  const videoUrl = product.videoUrl ?? '';

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  function isYouTubeUrl(url: string) {
    return /(?:youtube\.com|youtu\.be)/i.test(url);
  }
  function toYouTubeEmbed(url: string) {
    const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0` : url;
  }

  function handleAddToCart() {
    setAdding(true);
    setTimeout(() => {
      for (let i = 0; i < quantity; i++) addItem(product);
      setAdding(false);
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
        setQuantity(1);
        onClose();
      }, 1200);
    }, 700);
  }

  function prevImage() {
    const idx = galleryImages.indexOf(displayImage ?? '');
    const prev = galleryImages[(idx - 1 + galleryImages.length) % galleryImages.length];
    setActiveImage(prev);
    setImageError(false);
  }
  function nextImage() {
    const idx = galleryImages.indexOf(displayImage ?? '');
    const next = galleryImages[(idx + 1) % galleryImages.length];
    setActiveImage(next);
    setImageError(false);
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 flex w-full flex-col bg-[#0f1117] shadow-2xl
        rounded-t-3xl sm:rounded-3xl
        max-h-[95dvh] sm:max-h-[92vh]
        sm:w-[calc(100%-2rem)] lg:w-full lg:max-w-5xl xl:max-w-6xl
        animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

        {/* ── Close button ── */}
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* ─────────────────────────────────────────────────────────── */}
        {/*  LAYOUT: mobile = single col scroll | desktop = two col    */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col overflow-hidden lg:grid lg:grid-cols-[52%_48%] lg:max-h-[92vh]">

          {/* ── IMAGE COLUMN ── */}
          <div className="flex flex-col bg-[#090b10] lg:rounded-l-3xl">
            {/* Main image */}
            <div className="relative overflow-hidden
              h-[280px] xs:h-[320px] sm:h-[380px]
              lg:flex-1 lg:h-auto lg:min-h-[380px]
              lg:rounded-l-3xl">
              {!imageError && displayImage ? (
                <Image
                  src={displayImage}
                  alt={product.name}
                  fill
                  className="object-contain p-4 lg:p-8 transition-opacity duration-300"
                  onError={() => setImageError(true)}
                  priority
                />
              ) : (
                <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${product.gradient}`}>
                  <span className="text-9xl">{product.emoji}</span>
                </div>
              )}

              {/* Badge */}
              {product.badge && (
                <span className={`absolute top-4 left-4 ${badgeStyles[product.badge]} text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg`}>
                  {badgeText[product.badge]}
                </span>
              )}

              {/* Discount pill */}
              {discount && (
                <span className="absolute top-4 right-12 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  -{discount}%
                </span>
              )}

              {/* Prev/Next arrows — only when multiple images */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-all cursor-pointer"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-all cursor-pointer"
                    aria-label="Imagen siguiente"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {galleryImages.length > 1 && (
              <div ref={thumbsRef} className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
                {galleryImages.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    onClick={() => { setActiveImage(src); setImageError(false); }}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${displayImage === src ? 'border-emerald-500' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <Image src={src} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
                {videoUrl && (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 border-white/10 flex items-center justify-center bg-white/5">
                    <Play size={20} className="text-white/60" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── DETAILS COLUMN ── */}
          <div
            ref={scrollRef}
            className="flex flex-col overflow-y-auto
              max-h-[calc(95dvh-280px)] sm:max-h-[calc(92vh-380px)]
              lg:max-h-[92vh]
              pb-safe"
          >
            <div className="flex flex-col gap-0 px-5 pt-5 pb-4 sm:px-7 sm:pt-6">

              {/* Category */}
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400">
                {product.category === 'salud' ? 'Salud y Bienestar' : 'Fitness & Performance'}
              </p>

              {/* Product name */}
              <h2 className="text-xl font-bold leading-tight text-white sm:text-2xl"
                style={{ fontFamily: 'var(--font-heading, inherit)', letterSpacing: '-0.02em' }}>
                {product.name}
              </h2>

              {/* Stars + review count */}
              <div className="mt-2.5 flex items-center gap-2.5">
                <StarRating rating={product.rating} />
                <span className="text-sm font-semibold text-amber-400">{product.rating}</span>
                <span className="text-sm text-white/40 cursor-pointer hover:text-white/60 transition-colors">
                  ({product.reviews} reseñas)
                </span>
              </div>

              {/* Price block */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-4xl font-black text-white">{product.price.toFixed(2)}€</span>
                {product.originalPrice && (
                  <>
                    <span className="text-lg font-medium text-white/30 line-through">{product.originalPrice.toFixed(2)}€</span>
                    <span className="rounded-md bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-400">
                      Ahorras {(product.originalPrice - product.price).toFixed(2)}€
                    </span>
                  </>
                )}
              </div>

              {/* Benefits */}
              <div className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {product.benefits.slice(0, 4).map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/75">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                      <Check className="h-2.5 w-2.5 text-emerald-400" />
                    </div>
                    {b}
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="my-4 h-px bg-white/8" />

              {/* Quantity selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-white/60">Cantidad</span>
                <div className="flex items-center rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                    aria-label="Reducir cantidad"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-base font-bold text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="flex h-10 w-10 items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-xs font-medium text-emerald-400">
                  {product.stock} disponibles
                </span>
              </div>

              {/* Trust strip */}
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
                {[
                  { icon: <Lock className="h-3.5 w-3.5 text-emerald-400" />, label: 'Pago seguro' },
                  { icon: <Truck className="h-3.5 w-3.5 text-emerald-400" />, label: 'Envío gratis' },
                  { icon: <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />, label: '30 días' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    {item.icon}
                    <span className="text-[10px] font-medium text-white/50">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Expandable description preview ── */}
            <div className="px-5 sm:px-7 pb-2">
              <button
                onClick={() => setDetailOpen(true)}
                className="w-full text-left group cursor-pointer"
                aria-label="Ver descripción completa"
              >
                <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 px-4 pt-3.5 pb-0">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-400 mb-1.5">Descripción</p>
                  {/* Truncated HTML preview — 3 lines */}
                  <div
                    className="text-sm leading-relaxed text-white/60 line-clamp-3 prose prose-invert prose-sm max-w-none prose-p:text-white/60 prose-p:my-0"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                  {/* Fade gradient at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#1a1d27] to-transparent pointer-events-none" />
                  {/* Expand row */}
                  <div className="relative flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    Ver más
                    <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </button>
            </div>

            {/* ── Reviews strip ── */}
            {reviews.length > 0 && (
              <div className="px-5 sm:px-7 pb-4 mt-1">
                <div className="space-y-2">
                  {reviews.slice(0, 2).map((review) => (
                    <div key={review.id} className="rounded-xl border border-white/8 bg-white/4 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-white text-xs">{review.author}</span>
                        <span className="text-[10px] text-white/30">{review.date}</span>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                      <p className="text-white/55 text-xs leading-relaxed mt-1 line-clamp-2">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── STICKY CTA — desktop: inside scroll | mobile: fixed bottom ── */}
            <div className="sticky bottom-0 border-t border-white/10 bg-[#0f1117]/95 backdrop-blur-sm px-5 py-4 sm:px-7 lg:block">
              <button
                onClick={handleAddToCart}
                disabled={adding || added}
                className={`flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold text-white transition-all duration-300 cursor-pointer
                  ${added
                    ? 'bg-emerald-500'
                    : adding
                    ? 'bg-slate-700'
                    : 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 hover:shadow-[0_0_28px_rgba(34,197,94,0.4)] active:scale-[0.98]'
                  }`}
              >
                {added ? (
                  <><Check className="h-5 w-5" /> ¡Añadido al carrito!</>
                ) : adding ? (
                  <><span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando...</>
                ) : (
                  <><ShoppingCart className="h-5 w-5" /> Añadir al carrito &nbsp;·&nbsp; {(product.price * quantity).toFixed(2)}€</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── DETAIL DRAWER — slides up over the modal ── */}
        {detailOpen && (
          <div className="absolute inset-0 z-30 flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 sm:px-7 bg-[#13151f] border-b border-white/10 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">{product.name}</h3>
                <p className="text-xs text-white/40 mt-0.5">Información detallada del producto</p>
              </div>
              <button
                onClick={() => setDetailOpen(false)}
                aria-label="Cerrar descripción"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto bg-[#0f1117] px-5 py-5 sm:px-7 space-y-6">

              {/* Full description */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-400 mb-3">Descripción</h4>
                <div
                  className="prose prose-invert prose-sm max-w-none text-white/70 prose-p:text-white/70 prose-li:text-white/70 prose-headings:text-white"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </section>

              {/* Additional images grid */}
              {(product.additionalImages ?? []).length > 0 && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-400 mb-3">Fotos del producto</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[product.mainImage ?? product.image, ...(product.additionalImages ?? [])].filter(Boolean).map((src, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-[#090b10]">
                        <Image
                          src={src as string}
                          alt={`${product.name} ${i + 1}`}
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Video */}
              {videoUrl && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-400 mb-3">Vídeo</h4>
                  <div className="overflow-hidden rounded-2xl bg-black border border-white/10">
                    {isYouTubeUrl(videoUrl) ? (
                      <iframe
                        className="h-52 w-full sm:h-64"
                        src={toYouTubeEmbed(videoUrl)}
                        title={`${product.name} vídeo`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video src={videoUrl} controls className="h-52 w-full object-cover sm:h-64" />
                    )}
                  </div>
                </section>
              )}

              {/* Ingredients */}
              {product.ingredients && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-400 mb-3">Ingredientes</h4>
                  <p className="text-sm text-white/65 leading-relaxed">{product.ingredients}</p>
                </section>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-400 mb-3">
                    Reseñas ({reviews.length})
                  </h4>
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <div key={review.id} className="rounded-xl border border-white/8 bg-white/4 p-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-white text-sm">{review.author}</span>
                          <span className="text-xs text-white/30">{review.date}</span>
                        </div>
                        <StarRating rating={review.rating} />
                        <p className="text-white/60 text-xs leading-relaxed mt-2">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="h-4" />
            </div>

            {/* Footer CTA */}
            <div className="border-t border-white/10 bg-[#0f1117]/95 backdrop-blur-sm px-5 py-4 sm:px-7 shrink-0">
              <button
                onClick={() => { setDetailOpen(false); handleAddToCart(); }}
                disabled={adding || added}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold text-white bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 transition-all cursor-pointer disabled:opacity-70"
              >
                <ShoppingCart className="h-5 w-5" />
                Añadir al carrito &nbsp;·&nbsp; {(product.price * quantity).toFixed(2)}€
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
