'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, PenLine, Plus } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { type Product } from '@/lib/products';
import { type SectorTheme } from './sector-themes';

// Card de produto no visual do setor:
//  - hogar:    foto alta em areia, nome e preco discretos
//  - llaveros: card branco com sombra indigo suave, nome em Fredoka
//  - mascotas: a FOTO e o card (nome/preco por cima, com degrade)
// Produto com cor/tamanho ou com nome personalizado leva pra pagina dele.
export function ThemedProductCard({ product, theme }: { product: Product; theme: SectorTheme }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const secondary = product.additionalImages?.[0];
  const personalized = Boolean(product.personalize?.enabled);
  const needsChoice = personalized || Boolean(product.colorOptions?.length || product.sizes?.length);
  const href = `/producto/${product.id}-${product.slug}`;
  const img = hovered && secondary ? secondary : (product.mainImage ?? product.image);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  const action = needsChoice ? (
    <span
      className="inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors duration-200"
      style={{ background: theme.cta, color: theme.ctaText }}
    >
      {personalized && <PenLine className="h-4 w-4" aria-hidden="true" />}
      {personalized ? 'Personalizar' : 'Elegir'}
    </span>
  ) : (
    <button
      type="button"
      onClick={handleAdd}
      aria-label={`Añadir ${product.name} al carrito`}
      className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors duration-200"
      style={{ background: added ? '#15803d' : theme.cta, color: theme.ctaText }}
    >
      {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
      {added ? 'Añadido' : 'Añadir'}
    </button>
  );

  // Mascotas: a foto ocupa o card inteiro.
  if (theme.key === 'mascotas') {
    return (
      <Link
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative block aspect-[4/5] cursor-pointer overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        style={{ borderRadius: theme.radius, background: theme.surface, outlineColor: theme.ink }}
      >
        <Image src={img} alt={product.name} fill sizes="(min-width: 1024px) 25vw, 60vw" className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#2a1002]/85 via-[#2a1002]/40 to-transparent" aria-hidden="true" />
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <span className="min-w-0">
            <span className="line-clamp-2 block text-base font-bold leading-snug text-white" style={{ fontFamily: theme.heading }}>{product.name}</span>
            <span className="mt-0.5 block text-base font-bold text-[#FDE68A]">{product.price.toFixed(2)}€</span>
          </span>
          {action}
        </span>
      </Link>
    );
  }

  const llaveros = theme.key === 'llaveros';
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group flex h-full cursor-pointer flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${llaveros ? 'bg-white p-3 transition-shadow duration-300' : ''}`}
      style={{
        borderRadius: theme.radius,
        outlineColor: theme.ink,
        boxShadow: llaveros ? (hovered ? '0 18px 40px rgba(79,70,229,0.22)' : '0 8px 24px rgba(79,70,229,0.12)') : undefined,
      }}
    >
      <div className={`relative overflow-hidden ${llaveros ? 'aspect-square' : 'aspect-[4/5]'}`} style={{ borderRadius: `calc(${theme.radius} - 6px)`, background: llaveros ? theme.bgAlt : theme.surface }}>
        <Image src={img} alt={product.name} fill sizes="(min-width: 1024px) 25vw, 60vw" className={`${llaveros ? 'object-contain p-3' : 'object-cover'} transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none`} />
      </div>
      <div className={`flex flex-1 flex-col ${llaveros ? 'px-1 pt-3' : 'px-1 pt-3'}`}>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug" style={{ fontFamily: theme.heading, color: theme.ink }}>{product.name}</h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="text-base font-bold" style={{ color: theme.ink }}>{product.price.toFixed(2)}€</span>
          {action}
        </div>
      </div>
    </Link>
  );
}
