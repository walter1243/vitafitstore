'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { RotateCcw } from 'lucide-react';
import { OfferPrompt } from './offer-prompt';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

// Posicao do buraco na imagem do quebra-cabeca (473x303 px, ja recortada
// sem as bordas transparentes): a peca foi recortada comparando a imagem
// inteira com a que tem o buraco.
const BOARD = { w: 473, h: 303 };
const HOLE = { x: 325, y: 44, size: 73 };
const HOLE_PCT = {
  left: (HOLE.x / BOARD.w) * 100,
  top: (HOLE.y / BOARD.h) * 100,
  width: (HOLE.size / BOARD.w) * 100,
  height: (HOLE.size / BOARD.h) * 100,
};

type Pos = { x: number; y: number };

// "¡Pon la pieza que falta!" — o quebra-cabeca vem montado faltando uma
// peca; a crianca arrasta a peca solta ate o buraco (ou so toca nela, que
// ela vai sozinha). Ao encaixar: mensagem de parabens e convite pra pedir.
export function PuzzleModal({ open, onOpenChange, collectionHref, slug }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionHref: string;
  slug: string;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const [done, setDone] = useState(false);
  const [placing, setPlacing] = useState(false);

  // Geometria atual (px) do buraco e da posicao inicial da peca, relativa a area de jogo.
  function geometry() {
    const area = areaRef.current!.getBoundingClientRect();
    const board = boardRef.current!.getBoundingClientRect();
    const size = (HOLE.size / BOARD.w) * board.width;
    const hole = {
      x: board.left - area.left + (HOLE.x / BOARD.w) * board.width,
      y: board.top - area.top + (HOLE.y / BOARD.h) * board.height,
    };
    const start = { x: area.width / 2 - size / 2, y: board.bottom - area.top + 14 };
    return { size, hole, start };
  }

  function reset() {
    setDone(false);
    setPlacing(false);
    setPos(null);
    requestAnimationFrame(() => { if (areaRef.current && boardRef.current) setPos(geometry().start); });
  }

  // Abre sempre com a peca solta, embaixo do tabuleiro.
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(reset, 60);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function snapIn() {
    const { hole } = geometry();
    setPlacing(true);
    setPos(hole);
    setTimeout(() => setDone(true), 450);
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (done || !pos) return;
    const area = areaRef.current!.getBoundingClientRect();
    drag.current = { dx: e.clientX - area.left - pos.x, dy: e.clientY - area.top - pos.y, moved: false };
    setPlacing(false);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!drag.current) return;
    const area = areaRef.current!.getBoundingClientRect();
    drag.current.moved = true;
    setPos({ x: e.clientX - area.left - drag.current.dx, y: e.clientY - area.top - drag.current.dy });
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d || done) return;
    const { size, hole, start } = geometry();
    // Um toque sem arrastar tambem coloca a peca (mais facil pros pequenos).
    if (!d.moved) return snapIn();
    const p = pos ?? start;
    const near = Math.hypot(p.x - hole.x, p.y - hole.y) < size * 0.6;
    if (near) snapIn();
    else { setPlacing(true); setPos(start); }
  }

  const size = areaRef.current && boardRef.current ? geometry().size : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="kids max-h-[95vh] w-full overflow-y-auto rounded-[32px] border-0 bg-[#EAF4FF] p-5 sm:max-w-[600px] sm:p-7">
        <DialogTitle className="text-center font-kids text-3xl font-bold text-[#23263f] sm:text-4xl">
          {done ? '¡Enhorabuena!' : '¡Pon la pieza que falta!'}
        </DialogTitle>
        <DialogDescription className="text-center text-base text-[#565a78]">
          {done
            ? '¡Has completado el rompecabezas!'
            : 'Arrastra la pieza suelta hasta el hueco… o tócala y verás.'}
        </DialogDescription>

        <div ref={areaRef} className={`relative mx-auto w-full max-w-[480px] select-none ${done ? '' : 'pb-24'}`} style={{ touchAction: 'none' }}>
          <div ref={boardRef} className="relative w-full" style={{ aspectRatio: `${BOARD.w} / ${BOARD.h}` }}>
            <Image
              src={done ? '/images/rompecabezas-completo.png' : '/images/rompecabezas-hueco.png'}
              alt={done ? 'Rompecabezas completo de un perrito jugando con una pelota' : 'Rompecabezas de un perrito con una pieza que falta'}
              fill
              sizes="(min-width: 640px) 480px, 90vw"
              className="object-contain"
              draggable={false}
            />
            {!done && (
              <span
                aria-hidden="true"
                className="absolute animate-pulse rounded-xl border-4 border-dashed border-[#1E88FF]"
                style={{ left: `${HOLE_PCT.left}%`, top: `${HOLE_PCT.top}%`, width: `${HOLE_PCT.width}%`, height: `${HOLE_PCT.height}%` }}
              />
            )}
          </div>

          {!done && pos && size > 0 && (
            <button
              type="button"
              aria-label="Pieza suelta: pulsa para colocarla en el hueco"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); snapIn(); } }}
              className="absolute cursor-grab touch-none active:cursor-grabbing"
              style={{
                left: pos.x,
                top: pos.y,
                width: size,
                height: size,
                transition: placing ? 'left 420ms cubic-bezier(0.34,1.56,0.64,1), top 420ms cubic-bezier(0.34,1.56,0.64,1)' : 'none',
                filter: 'drop-shadow(1.5px 0 0 #23263f) drop-shadow(-1.5px 0 0 #23263f) drop-shadow(0 1.5px 0 #23263f) drop-shadow(0 -1.5px 0 #23263f) drop-shadow(0 6px 8px rgba(35,38,63,0.35))',
              }}
            >
              <Image src="/images/rompecabezas-pieza.png" alt="" fill sizes="80px" className="pointer-events-none object-contain" draggable={false} />
            </button>
          )}

        </div>

        {done ? (
          <div className="flex flex-col gap-3">
            <OfferPrompt
              slug={slug}
              question="¿Pedimos el rompecabezas?"
              fallbackLabel="Ver rompecabezas"
              onClose={() => onOpenChange(false)}
            />
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white font-extrabold text-[#23263f] transition-colors hover:bg-[#F2F4FA]"
            >
              <RotateCcw className="h-5 w-5" /> Jugar otra vez
            </button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
