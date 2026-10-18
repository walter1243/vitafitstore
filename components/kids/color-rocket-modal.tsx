'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Eraser, RotateCcw, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const PALETTE = [
  { name: 'Rojo', hex: '#F2384A' },
  { name: 'Naranja', hex: '#FF8A00' },
  { name: 'Amarillo', hex: '#FFC93C' },
  { name: 'Verde', hex: '#22B14C' },
  { name: 'Azul', hex: '#1E88FF' },
  { name: 'Morado', hex: '#8B3FD9' },
  { name: 'Rosa', hex: '#FF7AB6' },
  { name: 'Turquesa', hex: '#14C8C0' },
];
const WHITE = '#FFFFFF';

// Partes do foguete que a crianca pinta tocando nelas.
const PARTS = [
  { id: 'llama', label: 'Llama', d: 'M82 222 Q100 292 118 222 Z' },
  { id: 'aletaIzq', label: 'Aleta izquierda', d: 'M66 160 L30 214 L30 238 L66 214 Z' },
  { id: 'aletaDer', label: 'Aleta derecha', d: 'M134 160 L170 214 L170 238 L134 214 Z' },
  { id: 'cuerpo', label: 'Cuerpo', d: 'M66 96 L134 96 L134 206 Q134 222 118 222 L82 222 Q66 222 66 206 Z' },
  { id: 'franja', label: 'Franja', d: 'M66 102 L134 102 L134 116 L66 116 Z' },
  { id: 'punta', label: 'Punta', d: 'M100 18 C76 44 66 74 66 96 L134 96 C134 74 124 44 100 18 Z' },
  { id: 'aro', label: 'Ventana', d: 'M100 124 m-24 0 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0 Z' },
  { id: 'cristal', label: 'Cristal', d: 'M100 124 m-15 0 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z' },
  { id: 'aletaCentro', label: 'Aleta central', d: 'M93 196 L107 196 L107 246 Q100 252 93 246 Z' },
];

const emptyFill = () => Object.fromEntries(PARTS.map((p) => [p.id, WHITE])) as Record<string, string>;

// "¡Colorea a tu manera!" — foguete em branco (como os brinquedos que
// chegam pra pintar) que a crianca pinta escolhendo a cor e tocando em
// cada parte. Tudo no navegador, nada e salvo.
export function ColorRocketModal({ open, onOpenChange, collectionHref }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionHref: string;
}) {
  const [color, setColor] = useState(PALETTE[0].hex);
  const [fills, setFills] = useState<Record<string, string>>(emptyFill);

  function surprise() {
    setFills(Object.fromEntries(PARTS.map((p) => [p.id, PALETTE[Math.floor(Math.random() * PALETTE.length)].hex])));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="kids max-h-[92vh] overflow-y-auto rounded-[32px] border-0 bg-[#FFF8EF] p-6 sm:max-w-[560px] sm:p-8">
        <DialogTitle className="text-center font-kids text-3xl font-bold text-[#23263f] sm:text-4xl">
          ¡Colorea a tu manera!
        </DialogTitle>
        <DialogDescription className="text-center text-base text-[#565a78]">
          Elige un color y toca el cohete para pintarlo. Así llegan nuestros juguetes: en blanco, listos para tu imaginación.
        </DialogDescription>

        <div className="mx-auto mt-2 w-full max-w-[260px] rounded-[28px] bg-white p-4">
          <svg viewBox="0 0 200 300" className="h-auto w-full" role="group" aria-label="Cohete para colorear">
            {[[28, 40], [168, 70], [40, 150], [175, 140]].map(([x, y], i) => (
              <path
                key={i}
                d={`M${x} ${y - 7} l2.1 4.6 5 .6 -3.7 3.4 1 5 -4.4 -2.5 -4.4 2.5 1 -5 -3.7 -3.4 5 -.6z`}
                fill="#FFC93C"
                aria-hidden="true"
              />
            ))}
            {PARTS.map((p) => (
              <path
                key={p.id}
                d={p.d}
                fill={fills[p.id]}
                stroke="#23263f"
                strokeWidth="4"
                strokeLinejoin="round"
                role="button"
                tabIndex={0}
                aria-label={`Pintar ${p.label}`}
                className="cursor-pointer outline-none transition-[fill] duration-300 focus-visible:stroke-[#1E88FF]"
                onClick={() => setFills((f) => ({ ...f, [p.id]: color }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setFills((f) => ({ ...f, [p.id]: color }));
                  }
                }}
              />
            ))}
          </svg>
        </div>

        <div className="flex flex-wrap justify-center gap-2.5" role="radiogroup" aria-label="Colores">
          {PALETTE.map((c) => (
            <button
              key={c.hex}
              type="button"
              role="radio"
              aria-checked={color === c.hex}
              aria-label={c.name}
              onClick={() => setColor(c.hex)}
              className={`h-11 w-11 cursor-pointer rounded-full transition-transform duration-150 ${color === c.hex ? 'scale-110 ring-4 ring-[#23263f] ring-offset-2 ring-offset-[#FFF8EF]' : 'hover:scale-105'}`}
              style={{ background: c.hex }}
            />
          ))}
          <button
            type="button"
            role="radio"
            aria-checked={color === WHITE}
            aria-label="Goma (blanco)"
            onClick={() => setColor(WHITE)}
            className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-[#efe7da] bg-white transition-transform duration-150 ${color === WHITE ? 'scale-110 ring-4 ring-[#23263f] ring-offset-2 ring-offset-[#FFF8EF]' : 'hover:scale-105'}`}
          >
            <Eraser className="h-5 w-5 text-[#23263f]" />
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={surprise}
            className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#FFC93C] font-extrabold text-[#23263f] transition-colors hover:bg-[#FFB800]"
          >
            <Sparkles className="h-5 w-5" /> Sorpréndeme
          </button>
          <button
            type="button"
            onClick={() => setFills(emptyFill())}
            className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white font-extrabold text-[#23263f] transition-colors hover:bg-[#FFF4E0]"
          >
            <RotateCcw className="h-5 w-5" /> Empezar de nuevo
          </button>
        </div>
        <Link
          href={collectionHref}
          onClick={() => onOpenChange(false)}
          className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl bg-[#c2410c] font-extrabold text-white transition-colors hover:bg-[#9a3412]"
        >
          Ver juguetes para pintar
        </Link>
      </DialogContent>
    </Dialog>
  );
}
