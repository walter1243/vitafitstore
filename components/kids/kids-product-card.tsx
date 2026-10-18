'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, ShoppingCart, Sparkles } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { type Product } from '@/lib/products';

type Props = {
  product: Product;
  color: { main: string; soft: string; deep: string };
  tag?: string;
};

export function KidsProductCard({ product, color, tag }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const href = `/producto/${product.id}-${product.slug}`;
  const secondary = product.additionalImages?.[0];
  // Produto com cor/tamanho precisa escolher na pagina dele — adicionar
  // direto daqui iria pro carrinho sem a opcao.
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
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="kids-pop group flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] border-[3px] bg-white"
      style={{ borderColor: color.soft }}
    >
      <div className="relative m-2.5 aspect-square overflow-hidden rounded-[22px]" style={{ background: color.soft }}>
        <Image
          src={hovered && secondary ? secondary : (product.mainImage ?? product.image)}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
        {tag && (
          <span
            className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white shadow-sm"
            style={{ background: color.deep }}
          >
            {tag}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-1">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[#1e2a4a] sm:text-lg">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">{product.shortDescription}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="font-kids text-xl font-bold" style={{ color: color.deep }}>
            {product.price.toFixed(2)}€
          </span>
          {needsChoice ? (
            <span
              className="flex min-h-11 items-center gap-1 rounded-full px-3.5 text-sm font-extrabold text-white"
              style={{ background: color.deep }}
            >
              <Sparkles className="h-3.5 w-3.5" /> Elegir
            </span>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              aria-label={`Añadir ${product.name} al carrito`}
              className="flex min-h-11 items-center gap-1 rounded-full px-3.5 text-sm font-extrabold text-white transition-colors duration-200 active:scale-95"
              style={{ background: added ? '#15803D' : color.deep }}
            >
              {added ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
              {added ? '¡Listo!' : 'Añadir'}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
