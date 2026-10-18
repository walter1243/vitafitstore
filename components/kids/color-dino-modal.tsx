'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Eraser, RotateCcw, ShoppingCart, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useCart } from '@/lib/cart-context';
import { collectionForCategory } from '@/lib/collections';
import { toStoreProduct } from '@/lib/store-product';
import { useStoreProducts } from './use-store-products';

const PALETTE = [
  { name: 'Verde', hex: '#22B14C' },
  { name: 'Lima', hex: '#9BD13A' },
  { name: 'Amarillo', hex: '#FFC93C' },
  { name: 'Naranja', hex: '#FF8A00' },
  { name: 'Rojo', hex: '#F2384A' },
  { name: 'Rosa', hex: '#FF7AB6' },
  { name: 'Morado', hex: '#8B3FD9' },
  { name: 'Azul', hex: '#1E88FF' },
  { name: 'Turquesa', hex: '#14C8C0' },
  { name: 'Marrón', hex: '#9C6B3F' },
];
const WHITE = '#FFFFFF';

// Estegossauro de perfil, em partes que a crianca pinta tocando nelas.
// A ordem importa: as de cima no array ficam atras das de baixo.
const PARTS = [
  { id: 'placa1', label: 'Placa 1', d: 'M98 94 L110 60 L128 88 Z' },
  { id: 'placa2', label: 'Placa 2', d: 'M126 80 L146 40 L164 74 Z' },
  { id: 'placa3', label: 'Placa 3', d: 'M164 72 L186 30 L206 70 Z' },
  { id: 'placa4', label: 'Placa 4', d: 'M206 76 L226 42 L242 84 Z' },
  { id: 'placa5', label: 'Placa 5', d: 'M238 92 L256 64 L264 104 Z' },
  { id: 'pataTrasera2', label: 'Pata trasera', d: 'M226 140 L230 196 L252 196 L250 132 Z' },
  { id: 'pataDelantera2', label: 'Pata delantera', d: 'M98 140 L94 194 L116 194 L122 146 Z' },
  { id: 'puas', label: 'Púas de la cola', d: 'M292 98 L306 74 L304 102 Z M280 106 L290 82 L292 110 Z' },
  { id: 'cola', label: 'Cola', d: 'M252 116 C282 110 304 98 314 88 C308 112 290 136 256 148 Z' },
  { id: 'cuerpo', label: 'Cuerpo', d: 'M78 122 C78 74 148 56 200 70 C242 80 262 106 262 126 C262 152 228 166 170 166 C118 166 78 156 78 122 Z' },
  { id: 'barriga', label: 'Barriga', d: 'M104 146 C134 162 220 162 250 142 C240 160 202 168 170 168 C132 168 110 160 104 146 Z' },
  { id: 'pataTrasera', label: 'Pata trasera', d: 'M196 150 L194 198 L218 198 L222 150 Z' },
  { id: 'pataDelantera', label: 'Pata delantera', d: 'M126 156 L124 200 L148 200 L150 158 Z' },
  { id: 'cabeza', label: 'Cabeza', d: 'M90 116 C70 108 42 110 30 124 C20 136 30 152 52 152 C68 152 82 144 92 134 Z' },
];
const COLORABLE = PARTS.map((p) => p.id);
const emptyFill = () => Object.fromEntries(COLORABLE.map((id) => [id, WHITE])) as Record<string, string>;

// "¡Colorea a tu manera!" — dinossauro em branco (como os brinquedos que
// chegam pra pintar). Pintou tudo (ou tocou em "¡Terminé!") → pergunta se
// quer levar o dinossauro: adiciona ao carrinho e abre o carrinho.
export function ColorDinoModal({ open, onOpenChange, collectionHref, slug }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionHref: string;
  slug: string;
}) {
  const [color, setColor] = useState(PALETTE[0].hex);
  const [fills, setFills] = useState<Record<string, string>>(emptyFill);
  const [finished, setFinished] = useState(false);
  const { products } = useStoreProducts();
  const { addItem, setIsCartOpen } = useCart();

  // Produto oferecido no fim: um "dino" da colecao de pintar, senao o
  // primeiro da colecao. Sem produto cadastrado ainda, leva pra colecao.
  const offer = useMemo(() => {
    const items = products.filter((p) => collectionForCategory(p.category)?.slug === slug);
    const dino = items.find((p) => /dino|estego|t-?rex|stego/i.test(p.name));
    const chosen = dino ?? items[0];
    return chosen ? toStoreProduct(chosen) : null;
  }, [products, slug]);

  useEffect(() => { if (open) { setFills(emptyFill()); setFinished(false); } }, [open]);

  const painted = COLORABLE.filter((id) => fills[id] !== WHITE).length;
  useEffect(() => { if (painted === COLORABLE.length) setFinished(true); }, [painted]);

  function paint(id: string) {
    setFills((f) => ({ ...f, [id]: color }));
  }

  function surprise() {
    setFills(Object.fromEntries(COLORABLE.map((id) => [id, PALETTE[Math.floor(Math.random() * PALETTE.length)].hex])));
  }

  function addToCart() {
    if (!offer) return;
    addItem(offer);
    onOpenChange(false);
    setTimeout(() => setIsCartOpen(true), 250);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="kids max-h-[95vh] w-full overflow-y-auto rounded-[32px] border-0 bg-[#F1FBEF] p-5 sm:max-w-[600px] sm:p-7">
        <DialogTitle className="text-center font-kids text-3xl font-bold text-[#23263f] sm:text-4xl">
          {finished ? '¡Qué dinosaurio tan bonito!' : '¡Colorea a tu manera!'}
        </DialogTitle>
        <DialogDescription className="text-center text-base text-[#565a78]">
          {finished
            ? 'Así de divertido es pintar nuestros juguetes impresos en 3D.'
            : 'Elige un color y toca el dinosaurio para pintarlo.'}
        </DialogDescription>

        <div className="rounded-[28px] bg-white p-3">
          <svg viewBox="0 0 330 215" className="h-auto w-full" role="group" aria-label="Dinosaurio para colorear">
            <path d="M8 204 Q165 190 322 204" fill="none" stroke="#CDE8C4" strokeWidth="6" strokeLinecap="round" aria-hidden="true" />
            {PARTS.map((p) => (
              <path
                key={p.id}
                d={p.d}
                fill={fills[p.id]}
                stroke="#23263f"
                strokeWidth="3.5"
                strokeLinejoin="round"
                role="button"
                tabIndex={0}
                aria-label={`Pintar ${p.label}`}
                className="cursor-pointer outline-none transition-[fill] duration-300 focus-visible:stroke-[#1E88FF]"
                onClick={() => paint(p.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); paint(p.id); } }}
              />
            ))}
            <circle cx="48" cy="126" r="4.5" fill="#23263f" aria-hidden="true" />
            <path d="M36 140 Q46 146 58 141" fill="none" stroke="#23263f" strokeWidth="3" strokeLinecap="round" aria-hidden="true" />
          </svg>
        </div>

        {finished ? (
          <div className="flex flex-col gap-3 rounded-3xl bg-white p-4">
            {offer ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#FFEBD9]">
                    <Image src={offer.image} alt={offer.name} fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-kids text-xl font-bold text-[#23263f]">¿Lo añadimos al carrito?</p>
                    <p className="truncate text-sm text-[#565a78]">{offer.name} · {offer.price.toFixed(2)}€</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addToCart}
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#c2410c] font-extrabold text-white transition-colors hover:bg-[#9a3412]"
                >
                  <ShoppingCart className="h-5 w-5" /> ¡Sí, añadir al carrito!
                </button>
              </>
            ) : (
              <>
                <p className="text-center font-kids text-xl font-bold text-[#23263f]">¿Quieres uno para pintar en casa?</p>
                <Link
                  href={collectionHref}
                  onClick={() => onOpenChange(false)}
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl bg-[#c2410c] font-extrabold text-white transition-colors hover:bg-[#9a3412]"
                >
                  Ver juguetes para pintar
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => { setFills(emptyFill()); setFinished(false); }}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#F2F4FA] font-extrabold text-[#23263f] transition-colors hover:bg-[#E6E9F3]"
            >
              <RotateCcw className="h-5 w-5" /> Pintar otro
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-2.5" role="radiogroup" aria-label="Colores">
              {PALETTE.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  role="radio"
                  aria-checked={color === c.hex}
                  aria-label={c.name}
                  onClick={() => setColor(c.hex)}
                  className={`h-11 w-11 cursor-pointer rounded-full transition-transform duration-150 ${color === c.hex ? 'scale-110 ring-4 ring-[#23263f] ring-offset-2 ring-offset-[#F1FBEF]' : 'hover:scale-105'}`}
                  style={{ background: c.hex }}
                />
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={color === WHITE}
                aria-label="Goma (blanco)"
                onClick={() => setColor(WHITE)}
                className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-[#efe7da] bg-white transition-transform duration-150 ${color === WHITE ? 'scale-110 ring-4 ring-[#23263f] ring-offset-2 ring-offset-[#F1FBEF]' : 'hover:scale-105'}`}
              >
                <Eraser className="h-5 w-5 text-[#23263f]" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={surprise}
                className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#FFC93C] font-extrabold text-[#23263f] transition-colors hover:bg-[#FFB800]"
              >
                <Sparkles className="h-5 w-5" /> Sorpréndeme
              </button>
              <button
                type="button"
                onClick={() => setFinished(true)}
                disabled={painted === 0}
                className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#15803d] font-extrabold text-white transition-colors hover:bg-[#166534] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check className="h-5 w-5" /> ¡Terminé!
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
