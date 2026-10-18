'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { type Product } from '@/lib/products';

type Props = { product: Product; soft?: string; tag?: string };

// Card de produto da vitrine infantil: foto num fundo pastel macio, nome,
// preco e botao de adicionar. Limpo, como numa loja de brinquedos real.
export function KidsProductCard({ product, soft = '#F2F4FA', tag }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
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
      href={`/producto/${product.id}-${product.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group flex h-full cursor-pointer flex-col"
    >
      <div className="relative aspect-square overflow-hidden rounded-3xl" style={{ background: soft }}>
        <Image
          src={hovered && secondary ? secondary : (product.mainImage ?? product.image)}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {tag && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[var(--k-ink)]">
            {tag}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-[var(--k-ink)] sm:text-lg" style={{ fontFamily: 'Nunito, system-ui, sans-serif' }}>
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-lg font-extrabold text-[var(--k-ink)]">{product.price.toFixed(2)}€</span>
          {needsChoice ? (
            <span className="inline-flex min-h-11 items-center rounded-xl border-2 border-[var(--k-ink)] px-3 text-sm font-extrabold text-[var(--k-ink)] transition-colors group-hover:bg-[var(--k-ink)] group-hover:text-white">
              Elegir
            </span>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              aria-label={`Añadir ${product.name} al carrito`}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-extrabold text-white transition-colors duration-200 ${added ? 'bg-[#15803d]' : 'bg-[var(--k-cta)] hover:bg-[var(--k-cta-hover)]'}`}
            >
              {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              <span className="hidden sm:inline">{added ? 'Añadido' : 'Añadir'}</span>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
