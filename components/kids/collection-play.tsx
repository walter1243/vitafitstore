'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Lamp, Lightbulb, Paintbrush, Palette, Puzzle, Sparkles } from 'lucide-react';
import { type Interactive } from '@/lib/sectors-shared';
import { useSectors } from './sectors-context';
import { PILL } from './pill';
import { ColorDinoModal } from './color-dino-modal';
import { LampSwitchModal } from './lamp-switch-modal';
import { PuzzleModal } from './puzzle-modal';

// Recebem so o `slug` e buscam a colecao nos setores (Admin → Setores e
// coleções). Icone de uma colecao = o da brincadeira dela.
export function iconFor(interactive: Interactive) {
  return interactive === 'rompecabezas' ? Puzzle : interactive === 'colorear' ? Palette : interactive === 'encender' ? Lamp : Sparkles;
}

// Imagem da colecao. Na de pintar, as cores "pintam" os brinquedos em
// branco em loop (classe .paint-reveal em globals.css).
export function CollectionImage({ slug, sizes, priority }: { slug: string; sizes: string; priority?: boolean }) {
  const { getCollection } = useSectors();
  const collection = getCollection(slug);
  if (!collection || !collection.imageUrl) return null;
  return (
    <>
      <Image src={collection.imageUrl} alt={collection.name} fill sizes={sizes} priority={priority} className="object-contain" />
      {collection.interactive === 'colorear' && <span className="paint-reveal" aria-hidden="true" />}
    </>
  );
}

// Botao da brincadeira da colecao + o modal dela. "solid": botao cheio na
// cor da colecao; "pill"/"pill-dark": pilula contornada dos destaques
// estilo Apple (mesmo tamanho da pilula cheia ao lado).

export function CollectionPlayButton({ slug, appearance = 'solid' }: { slug: string; appearance?: 'solid' | 'pill' | 'pill-dark' | 'chip' }) {
  const [open, setOpen] = useState(false);
  const { getCollection } = useSectors();
  const collection = getCollection(slug);
  if (!collection || collection.interactive === 'none') return null;
  const href = `/coleccion/${collection.slug}`;
  const kind = collection.interactive;
  const Icon = kind === 'colorear' ? Paintbrush : kind === 'encender' ? Lightbulb : Puzzle;
  const label = kind === 'colorear' ? '¡Pinta el dinosaurio!' : kind === 'encender' ? 'Enciende la lámpara' : '¡Pon la pieza que falta!';
  return (
    <>
      {appearance === 'chip' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full border-2 border-[#1E1B4B] bg-white px-3.5 text-sm font-extrabold text-[#1E1B4B] transition-colors duration-200 hover:bg-[#1E1B4B] hover:text-white"
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          Jugar
        </button>
      ) : appearance === 'solid' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl px-5 font-extrabold text-white transition-colors duration-200"
          style={{ background: '#23263f' }}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          {label}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`${PILL} border-2 ${appearance === 'pill-dark' ? 'border-white text-white hover:bg-white/10' : 'border-[#23263f] text-[#23263f] hover:bg-[#23263f]/5'}`}
        >
          {label}
        </button>
      )}
      {kind === 'colorear' && <ColorDinoModal open={open} onOpenChange={setOpen} collectionHref={href} slug={collection.slug} />}
      {kind === 'encender' && <LampSwitchModal open={open} onOpenChange={setOpen} collectionHref={href} slug={collection.slug} />}
      {kind === 'rompecabezas' && <PuzzleModal open={open} onOpenChange={setOpen} collectionHref={href} slug={collection.slug} />}
    </>
  );
}
