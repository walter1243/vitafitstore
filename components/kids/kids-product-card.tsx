'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { type Product } from '@/lib/products';

type Props = { product: Product; color?: string; soft?: string; tag?: string };

// Card "de brinquedo": borda grossa colorida, foto num fundo pastel, preco
// em destaque e botao gordinho. A cor vem da colecao do produto.
export function KidsProductCard({ product, color = '#1E88FF', soft = '#E6F3FF', tag }: Props) {
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
      className="kid-card group flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] border-4 bg-white"
      style={{ borderColor: soft }}
    >
      <div className="relative m-2 aspect-square overflow-hidden rounded-[22px]" style={{ background: soft }}>
        <Image
          src={hovered && secondary ? secondary : (product.mainImage ?? product.image)}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {tag && (
          <span className="absolute left-2.5 top-2.5 rounded-full px-3 py-1 text-xs font-extrabold text-white" style={{ background: color }}>
            {tag}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-2">
        <h3 className="line-clamp-2 text-lg font-bold text-[var(--k-ink)]">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="font-kids text-2xl font-extrabold" style={{ color }}>{product.price.toFixed(2)}€</span>
          {needsChoice ? (
            <span className="kid-btn flex min-h-11 items-center rounded-full px-4 text-sm font-extrabold text-white" style={{ background: color }}>
              Elegir
            </span>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              aria-label={`Añadir ${product.name} al carrito`}
              className="kid-btn flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-extrabold text-white"
              style={{ background: added ? '#22B14C' : color }}
            >
              {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              <span className="hidden sm:inline">{added ? '¡Listo!' : 'Añadir'}</span>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
