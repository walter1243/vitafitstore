'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Lightbulb, Paintbrush } from 'lucide-react';
import { type Collection } from '@/lib/collections';
import { ColorRocketModal } from './color-rocket-modal';
import { LampSwitchModal } from './lamp-switch-modal';

// Imagem da colecao. Na de pintar, as cores "pintam" os brinquedos em
// branco em loop (classe .paint-reveal em globals.css).
export function CollectionImage({ collection, sizes, priority }: { collection: Collection; sizes: string; priority?: boolean }) {
  return (
    <>
      <Image src={collection.image} alt={collection.name} fill sizes={sizes} priority={priority} className="object-contain" />
      {collection.interactive === 'colorear' && <span className="paint-reveal" aria-hidden="true" />}
    </>
  );
}

// Botao da brincadeira da colecao + o modal dela.
export function CollectionPlayButton({ collection, className }: { collection: Collection; className?: string }) {
  const [open, setOpen] = useState(false);
  const href = `/coleccion/${collection.slug}`;
  const colorear = collection.interactive === 'colorear';
  const Icon = colorear ? Paintbrush : Lightbulb;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl px-5 font-extrabold text-white transition-colors duration-200 ${className ?? ''}`}
        style={{ background: collection.color.main }}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
        {colorear ? '¡Pinta el cohete!' : 'Enciende la lámpara'}
      </button>
      {colorear ? (
        <ColorRocketModal open={open} onOpenChange={setOpen} collectionHref={href} />
      ) : (
        <LampSwitchModal open={open} onOpenChange={setOpen} collectionHref={href} />
      )}
    </>
  );
}
