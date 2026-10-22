'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, PenLine, Plus } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { type Product } from '@/lib/products';
import { type SectorTheme } from './sector-themes';
import { cardPrice } from '@/lib/personalize';

// Card de produto no visual do setor:
//  - hogar:    foto alta em areia, nome e preco discretos
//  - llaveros: card branco com sombra indigo suave, nome em Fredoka
//  - mascotas: a FOTO e o card (nome/preco por cima, com degrade)
// Produto com cor/tamanho ou com nome personalizado leva pra pagina dele.
export function ThemedProductCard({ product, theme }: { product: Product; theme: SectorTheme }) {
  const cp = cardPrice(product.price, product.personalize);
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const secondary = product.additionalImages?.[0];
  const personalized = Boolean(product.personalize?.enabled);
  // Promocao por quantidade (ex: pack de 5 chaveiros)
  const pack = personalized && (product.personalize?.packPercent ?? 0) > 0 ? product.personalize! : null;
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

  // Navidad: card branco com borda e laco vermelhos (detalhe minimalista).
  if (theme.key === 'navidad') {
    return (
      <Link
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative flex h-full cursor-pointer flex-col rounded-[22px] border-2 border-[#DC2626] bg-white p-2.5 shadow-[0_14px_32px_rgba(0,0,0,0.22)] transition-transform duration-300 hover:-translate-y-1 motion-reduce:hover:translate-y-0"
      >
        {/* laco */}
        <svg className="absolute -top-3 left-1/2 z-10 h-7 w-12 -translate-x-1/2" viewBox="0 0 48 28" aria-hidden="true">
          <path d="M24 14C16 2 4 4 6 14c2 9 12 6 18 0zM24 14c8-12 20-10 18 0-2 9-12 6-18 0z" fill="#DC2626" />
          <circle cx="24" cy="14" r="4" fill="#B91C1C" />
        </svg>
        <div className="relative aspect-square overflow-hidden rounded-[16px] bg-[#F0FDF4]">
          <Image src={img} alt={product.name} fill sizes="(min-width: 1024px) 25vw, 60vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none" />
        </div>
        <div className="flex flex-1 flex-col px-1 pt-3">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[#14532D]" style={{ fontFamily: theme.heading }}>{product.name}</h3>
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <span className="text-base font-bold text-[#14532D]">{cp.main}{cp.sub && <span className="block whitespace-nowrap text-[11px] font-extrabold opacity-80">{cp.sub}{cp.off ? ` · -${cp.off}%` : ''}</span>}</span>
            {action}
          </div>
        </div>
      </Link>
    );
  }

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
            <span className="mt-0.5 block text-base font-bold text-[#FDE68A]">{cp.main}{cp.sub && <span className="block whitespace-nowrap text-[11px] font-extrabold opacity-80">{cp.sub}{cp.off ? ` · -${cp.off}%` : ''}</span>}</span>
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
          <span className="flex flex-col leading-tight"><span className="text-base font-bold" style={{ color: theme.ink }}>{cp.main}{cp.sub && <span className="block whitespace-nowrap text-[11px] font-extrabold opacity-80">{cp.sub}{cp.off ? ` · -${cp.off}%` : ''}</span>}</span>{pack && <span className="text-[11px] font-extrabold text-[#16a34a]">Pack {pack.minQty}: -{Math.round(pack.packPercent)}%</span>}{(product.personalize?.freeShipQty ?? 0) > 0 && <span className="text-[11px] font-extrabold text-[#2563eb]">Envío gratis desde {product.personalize!.freeShipQty} uds</span>}</span>
          {action}
        </div>
      </div>
    </Link>
  );
}
