'use client';
// Card de produto da loja (o mesmo na home, nos setores, nas coleções e na busca):
// foto, selo (desconto / pack / personalizável), nome, preço e botão azul
// (carrinho; com cor/tamanho/nome leva à página do produto).
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, PenLine, ShoppingCart, SlidersHorizontal } from 'lucide-react';
import { type Product } from '@/lib/products';
import { useCart } from '@/lib/cart-context';
import { cardPrice } from '@/lib/personalize';

const INK = '#1d1d1f';
const BLUE = '#0071e3';

function badgeOf(p: Product, off: number, sub: string) {
  if (off > 0) return { text: `-${off}%`, bg: '#d70015' };
  if (sub) return { text: sub.toUpperCase(), bg: '#1d8a3a' };
  if (p.personalize?.enabled) return { text: 'PERSONALIZABLE', bg: '#6e3cbc' };
  return null;
}

export function StoreProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const cp = cardPrice(product.price, product.personalize, product.sizes);
  const href = `/producto/${product.id}-${product.slug}`;
  // Com cor/tamanho/nome a escolha e na pagina do produto.
  const personal = Boolean(product.personalize?.enabled);
  const needsChoice = Boolean(personal || product.colorOptions?.length || product.sizes?.length);
  const img = product.mainImage ?? product.image;
  const badge = badgeOf(product, cp.off, cp.sub);

  function add(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <Link
      href={href}
      data-edit="produto"
      data-edit-item={String(product.id)}
      data-edit-label={`Produto: ${product.name}`}
      className="group flex h-full flex-col rounded-[20px] border border-black/[0.06] bg-white p-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-shadow duration-200 hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:p-3"
      style={{ outlineColor: BLUE }}
    >
      <div className="relative aspect-square overflow-hidden rounded-[14px] bg-[#f5f5f7]">
        {img && <Image src={img} alt={product.name} fill sizes="(min-width: 1024px) 260px, (min-width: 640px) 33vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />}
        {badge && (
          <span className="absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide text-white" style={{ background: badge.bg }}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-3">
        <h3 className="line-clamp-2 text-[14px] font-medium leading-snug sm:text-[15px]" style={{ color: INK }}>{product.name}</h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <p className="whitespace-nowrap text-[18px] font-bold leading-none sm:text-[20px]" style={{ color: INK }}>{cp.main}</p>
          {needsChoice ? (
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: BLUE }}
              aria-label={personal ? 'Personalizar' : 'Elegir opciones'}
              title={personal ? 'Personalizar' : 'Elegir opciones'}
            >
              {personal ? <PenLine className="h-[18px] w-[18px]" aria-hidden="true" /> : <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />}
            </span>
          ) : (
            <button
              type="button"
              onClick={add}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition-colors"
              style={{ background: added ? '#1d8a3a' : BLUE }}
              aria-label={`Añadir ${product.name} al carrito`}
            >
              {added ? <Check className="h-5 w-5" aria-hidden="true" /> : <ShoppingCart className="h-[18px] w-[18px]" aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

