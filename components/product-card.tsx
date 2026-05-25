'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Star, ShoppingCart, Eye, Check } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { type Product } from '@/lib/products';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
}

const badgeConfig: Record<string, { text: string; cls: string }> = {
  'mas-vendido': { text: 'Más vendido', cls: 'bg-gradient-to-r from-emerald-500 to-green-400' },
  oferta: { text: 'Oferta', cls: 'bg-gradient-to-r from-rose-500 to-pink-500' },
  nuevo: { text: 'Nuevo', cls: 'bg-gradient-to-r from-violet-500 to-purple-500' },
};

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const { addItem } = useCart();
  const [imageError, setImageError] = useState(false);
  const [added, setAdded] = useState(false);

  const badge = product.badge ? badgeConfig[product.badge] : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div
      className="group relative rounded-2xl bg-white border border-gray-100 overflow-hidden cursor-pointer select-none
        transition-all duration-[350ms] cubic-bezier(0.34,1.56,0.64,1)
        hover:-translate-y-3 hover:shadow-[0_20px_60px_rgba(0,0,0,0.13)] hover:border-gray-200"
      style={{ willChange: 'transform' }}
      onClick={() => onViewDetails(product)}
    >
      {/* Badge */}
      {badge && (
        <span
          className={`absolute left-3 top-3 z-10 ${badge.cls} text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm`}
        >
          {badge.text}
        </span>
      )}

      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {!imageError ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.08]"
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${product.gradient}`}
          >
            <span className="text-5xl">{product.emoji}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            className="flex items-center gap-2 bg-white/95 text-gray-900 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white transition-colors cursor-pointer shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
          >
            <Eye className="h-4 w-4" />
            Ver detalles
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
          {product.category === 'salud' ? 'Salud y Bienestar' : 'Fitness'}
        </p>

        <h3
          className="font-bold text-gray-900 text-base leading-tight line-clamp-1 mb-1"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {product.name}
        </h3>

        <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
          {product.shortDescription}
        </p>

        {/* Stars */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < Math.floor(product.rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-gray-700">{product.rating}</span>
          <span className="text-xs text-gray-400">({product.reviews})</span>
        </div>

        {/* Price + Button */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-xl font-bold text-gray-900">{product.price.toFixed(2)}€</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through ml-1.5">
                {product.originalPrice.toFixed(2)}€
              </span>
            )}
          </div>

          <button
            onClick={handleAdd}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer
              ${added ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white hover:bg-emerald-500'}`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" />
                <span>Añadido</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Añadir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
