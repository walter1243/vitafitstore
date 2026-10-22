'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { type Product } from '@/lib/products';
import { ACCENTS, type Accent } from './palette';
import { cardPrice } from '@/lib/personalize';

type Props = { product: Product; accent?: Accent; tag?: string; /** @deprecated use accent */ soft?: string };

// Card de produto infantil em bloco (ui-ux-pro-max "Vibrant & Block-based"):
// borda escura grossa, sombra solida na cor da colecao, foto num fundo pastel,
// preco num selo e botao laranja grande. Hover so mexe em transform/sombra
// (sem pular o layout).
export function KidsProductCard({ product, accent = ACCENTS.mint, tag, soft }: Props) {
  const cp = cardPrice(product.price, product.personalize, product.sizes);
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const secondary = product.additionalImages?.[0];
  // Produto com cor/tamanho precisa escolher na pagina dele — adicionar
  // direto daqui iria pro carrinho sem a opcao.
  const personalized = Boolean(product.personalize?.enabled);
  const needsChoice = personalized || Boolean(product.colorOptions?.length || product.sizes?.length);

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
      className="group flex h-full cursor-pointer flex-col rounded-[28px] border-[3px] border-[#1E1B4B] bg-white p-2.5 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#1E1B4B] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-3"
      style={{ boxShadow: `${hovered ? 8 : 5}px ${hovered ? 8 : 5}px 0 ${accent.deep}` }}
    >
      <div className="relative aspect-square overflow-hidden rounded-[20px]" style={{ background: soft ?? accent.tint }}>
        <Image
          src={hovered && secondary ? secondary : (product.mainImage ?? product.image)}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
        />
        {tag && (
          <span className="absolute left-2.5 top-2.5 rounded-full border-2 border-[#1E1B4B] bg-white px-2.5 py-0.5 text-xs font-extrabold text-[#1E1B4B]">
            {tag}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pt-3">
        <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-[#1E1B4B] sm:text-lg" style={{ fontFamily: 'Nunito, system-ui, sans-serif' }}>
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="min-w-0 leading-tight text-[#1E1B4B]">
            <span className="block whitespace-nowrap text-lg font-extrabold sm:text-xl">{cp.main}</span>
            {cp.sub && <span className="block whitespace-nowrap text-[11px] font-extrabold opacity-80">{cp.sub}{cp.off ? ` · -${cp.off}%` : ''}</span>}
          </span>
          {needsChoice ? (
            <span className="inline-flex min-h-11 items-center rounded-2xl border-[3px] border-[#1E1B4B] px-3 text-sm font-extrabold text-[#1E1B4B] transition-colors duration-200 group-hover:bg-[#1E1B4B] group-hover:text-white">
              {personalized ? 'Personalizar' : 'Elegir'}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              aria-label={`Añadir ${product.name} al carrito`}
              className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-[3px] border-[#1E1B4B] px-3 text-sm font-extrabold text-white transition-colors duration-200 ${added ? 'bg-[#15803d]' : 'bg-[#EA580C] hover:bg-[#C2410C]'}`}
            >
              {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingCart className="h-4 w-4" aria-hidden="true" />}
              <span className="hidden sm:inline">{added ? 'Añadido' : 'Añadir'}</span>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
