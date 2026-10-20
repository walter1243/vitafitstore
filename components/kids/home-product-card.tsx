'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Plus } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { type Product } from '@/lib/products';

// Card do visual "Casa / Hogar": foto alta num fundo areia, sem bordas
// grossas, nome e preco discretos e um botao redondo de adicionar.
export function HomeProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const secondary = product.additionalImages?.[0];
  const needsChoice = Boolean(product.colorOptions?.length || product.sizes?.length);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <Link
      href={`/producto/${product.id}-${product.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group flex h-full cursor-pointer flex-col rounded-[22px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2b2620]"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[#ece3d6]">
        <Image
          src={hovered && secondary ? secondary : (product.mainImage ?? product.image)}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, 60vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
        />
        {needsChoice ? (
          <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#2b2620] backdrop-blur">
            Elegir
          </span>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            aria-label={`Añadir ${product.name} al carrito`}
            className={`absolute bottom-3 right-3 inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm font-semibold shadow-sm transition-colors duration-200 ${added ? 'bg-[#3f6b4f] text-white' : 'bg-white/95 text-[#2b2620] hover:bg-[#2b2620] hover:text-white'}`}
          >
            {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {added ? 'Añadido' : 'Añadir'}
          </button>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 px-1 pt-3">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-[#2b2620] sm:text-base">{product.name}</h3>
        <span className="shrink-0 text-[15px] font-semibold text-[#2b2620] sm:text-base">{product.price.toFixed(2)}€</span>
      </div>
    </Link>
  );
}
