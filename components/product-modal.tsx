'use client';
import { useState } from 'react';
import Image from 'next/image';
import {
  Star,
  ShoppingCart,
  Check,
  Lock,
  Truck,
  RotateCcw,
  Minus,
  Plus,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCart } from '@/lib/cart-context';
import { type Product, productReviews } from '@/lib/products';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

type Tab = 'descripcion' | 'ingredientes' | 'resenas';

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

export function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem } = useCart();
  const [imageError, setImageError] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>('descripcion');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const reviews = productReviews[product.id] || [];
  const mainImage = product.mainImage ?? product.image;
  const galleryImages = [mainImage, ...(product.additionalImages ?? [])].filter(Boolean) as string[];
  const displayImage = activeImage ?? mainImage;
  const videoUrl = product.videoUrl ?? '';

  const handleAddToCart = () => {
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
    }, 800);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'descripcion', label: 'Descripción' },
    { key: 'ingredientes', label: 'Ingredientes' },
    { key: 'resenas', label: `Reseñas (${reviews.length})` },
  ];

  function isYouTubeUrl(url: string) {
    return /(?:youtube\.com|youtu\.be)/i.test(url);
  }

  function toYouTubeEmbed(url: string) {
    const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  }

  return (
    <Dialog open={!!product} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[92vh] max-w-[calc(100%-1rem)] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl sm:max-w-[calc(100%-2rem)] lg:max-w-5xl xl:max-w-6xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>{product.shortDescription}</DialogDescription>
        </DialogHeader>

        <div className="grid lg:grid-cols-[56%_44%]">
          {/* Image side */}
          <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden lg:aspect-auto lg:min-h-[560px] lg:rounded-l-2xl lg:rounded-tr-none">
            {!imageError && displayImage ? (
              <Image
                src={displayImage}
                alt={product.name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div
                className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${product.gradient}`}
              >
                <span className="text-8xl">{product.emoji}</span>
              </div>
            )}
            {product.badge && (
              <span
                className={`absolute top-4 left-4 ${badgeStyles[product.badge]} text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md`}
              >
                {badgeText[product.badge]}
              </span>
            )}
          </div>

          {/* Details side */}
          <div className="flex max-h-[92vh] flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-2">
              {product.category === 'salud' ? 'Salud y Bienestar' : 'Fitness'}
            </p>

            <h2
              className="text-2xl font-bold text-gray-900 mb-2 leading-tight"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              {product.name}
            </h2>

            {/* Stars */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700">{product.rating}</span>
              <span className="text-sm text-gray-400 underline decoration-dotted cursor-pointer">
                ({product.reviews} reseñas)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-4xl font-bold text-gray-900">{product.price.toFixed(2)}€</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-400 line-through">
                  {product.originalPrice.toFixed(2)}€
                </span>
              )}
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-1.5 mb-5">
              {product.benefits.slice(0, 4).map((b, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  {b}
                </div>
              ))}
            </div>

            {/* Quantity */}
            <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-sm font-medium text-gray-700">Cantidad:</span>
              <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-semibold text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs text-emerald-600 font-medium">{product.stock} disponibles</span>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={adding || added}
              className={`mb-3 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-white transition-all duration-300 cursor-pointer
                ${
                  added
                    ? 'bg-emerald-500'
                    : adding
                    ? 'bg-gray-700'
                    : 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 hover:shadow-[0_0_24px_rgba(34,197,94,0.35)]'
                }`}
            >
              {added ? (
                <>
                  <Check className="h-5 w-5" /> ¡Añadido!
                </>
              ) : adding ? (
                <>
                  <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  Procesando...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" /> Añadir al carrito
                </>
              )}
            </button>

            {/* Trust strip */}
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mb-5">
              <span className="flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-emerald-500" /> Pago seguro
              </span>
              <span className="flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 text-emerald-500" /> Envío gratis
              </span>
              <span className="flex items-center gap-1">
                <RotateCcw className="h-3.5 w-3.5 text-emerald-500" /> 30 días
              </span>
            </div>

            {/* Tabs */}
            <div className="border-t border-gray-100 pt-4 flex-1">
              {galleryImages.length > 1 && (
                <div className="mb-5">
                  <div className="grid grid-cols-4 gap-2">
                    {galleryImages.map((src, index) => (
                      <button
                        key={`${src}-${index}`}
                        type="button"
                        onClick={() => {
                          setActiveImage(src);
                          setImageError(false);
                        }}
                        className={`relative aspect-square overflow-hidden rounded-lg border transition-colors ${
                          displayImage === src ? 'border-emerald-500' : 'border-gray-200'
                        }`}
                      >
                        <Image src={src} alt={`${product.name} ${index + 1}`} fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {videoUrl && (
                <div className="mb-5 overflow-hidden rounded-2xl border border-gray-200 bg-black">
                  {isYouTubeUrl(videoUrl) ? (
                    <iframe
                      className="h-56 w-full md:h-72"
                      src={toYouTubeEmbed(videoUrl)}
                      title={`${product.name} vídeo`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={videoUrl} controls className="h-56 w-full object-cover md:h-72" />
                  )}
                </div>
              )}

              <div className="flex border-b border-gray-100 mb-4 -mx-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative px-4 py-2.5 text-sm font-medium transition-colors duration-200 cursor-pointer
                      ${activeTab === tab.key ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="text-sm text-gray-600 leading-relaxed">
                {activeTab === 'descripcion' && (
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                )}
                {activeTab === 'ingredientes' && (
                  <p>{product.ingredients ?? 'Ingredientes no disponibles para este producto.'}</p>
                )}
                {activeTab === 'resenas' && (
                  <div className="space-y-3">
                    {reviews.length === 0 && (
                      <p className="text-gray-400">Sin reseñas todavía.</p>
                    )}
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-gray-800 text-sm">{review.author}</span>
                          <span className="text-xs text-gray-400">{review.date}</span>
                        </div>
                        <div className="flex mb-1.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-gray-200 text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-gray-600 text-xs leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
