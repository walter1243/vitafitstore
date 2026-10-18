'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

// "Enciende la lámpara" — o site escurece (fundo quase preto), a foto do
// quarto aparece apagada e um interruptor de parede acende a lampada
// foguete: a foto ganha luz e um brilho quente pulsa em volta.
export function LampSwitchModal({ open, onOpenChange, collectionHref }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionHref: string;
}) {
  const [on, setOn] = useState(false);

  // Sempre abre com a luz apagada.
  useEffect(() => { if (open) setOn(false); }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="kids lamp-dark max-h-[95vh] overflow-y-auto rounded-[32px] border-0 bg-[#0b0d1a] p-5 text-white sm:max-w-[920px] sm:p-8 [&>button]:text-white"
      >
        <DialogTitle className="text-center font-kids text-3xl font-bold text-white sm:text-4xl">
          {on ? '¡Buenas noches!' : 'Shhh... es hora de dormir'}
        </DialogTitle>
        <DialogDescription className="text-center text-base text-white/75">
          {on ? 'Así ilumina nuestra lámpara cohete la habitación.' : 'La habitación está a oscuras. Pulsa el interruptor.'}
        </DialogDescription>

        <div className="mt-2 grid items-center gap-6 sm:grid-cols-[1fr_200px]">
        <div className="relative overflow-hidden rounded-[24px]">
          <div className="relative aspect-[4/3]">
            <Image
              src="/images/lampara-cohete-habitacion.jpg"
              alt="Lámpara cohete impresa en 3D iluminando una habitación infantil con estrellas proyectadas en la pared"
              fill
              sizes="(min-width: 768px) 700px, 100vw"
              className="object-cover transition-[filter] duration-700 ease-out"
              style={{ filter: on ? 'brightness(1.05) saturate(1.05)' : 'brightness(0.16) saturate(0.4)' }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 transition-opacity duration-700"
              style={{
                opacity: on ? 1 : 0,
                background: 'radial-gradient(circle at 52% 52%, rgba(255,196,110,0.35) 0%, rgba(255,170,60,0.12) 30%, transparent 60%)',
                animation: on ? 'lamp-glow 3.2s ease-in-out infinite' : undefined,
              }}
            />
          </div>
        </div>

        {/* Interruptor de parede — ao lado da foto, sempre a vista */}
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={on ? 'Apagar la lámpara' : 'Encender la lámpara'}
            onClick={() => setOn((v) => !v)}
            className="relative flex h-28 w-20 cursor-pointer items-center justify-center rounded-2xl border-4 border-[#e8e2d6] bg-[#f7f3ea] shadow-[0_8px_0_rgba(0,0,0,0.35)] transition-transform active:translate-y-1"
          >
            <span
              aria-hidden="true"
              className="block h-16 w-10 rounded-xl border-2 border-[#d9d1c1] bg-white transition-all duration-200"
              style={{
                transform: on ? 'perspective(120px) rotateX(18deg)' : 'perspective(120px) rotateX(-18deg)',
                boxShadow: on ? 'inset 0 -10px 0 #e9e2d3' : 'inset 0 10px 0 #e9e2d3',
              }}
            />
            <span
              aria-hidden="true"
              className="absolute top-2 h-1.5 w-1.5 rounded-full transition-colors"
              style={{ background: on ? '#22B14C' : '#9aa0b4' }}
            />
          </button>
          <span className="text-center font-kids text-xl font-bold">
            {on ? 'Apagar la lámpara' : 'Encender la lámpara'}
          </span>
          <Link
            href={collectionHref}
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-2xl bg-[#FFC93C] px-4 font-extrabold text-[#23263f] transition-colors hover:bg-[#FFB800]"
          >
            Ver lámparas
          </Link>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
