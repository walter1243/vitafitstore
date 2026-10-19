'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { type Product } from '@/lib/products';
import { OfferPrompt } from './offer-prompt';

// Grade imaginaria 4x3 sobre a foto; a peca sai da coluna 3, linha 2 (longe
// das bordas, pras abas do encaixe nao sairem da imagem).
const COLS = 4, ROWS = 3, COL = 2, ROW = 1;

type Box = { x: number; y: number; w: number; h: number };

// Contorno de peca de quebra-cabeca (abas pra cima e pra direita, encaixes
// embaixo e a esquerda) nas coordenadas da imagem.
function piecePath({ x, y, w, h }: Box) {
  const t = Math.min(w, h) * 0.22;
  const edge = (x1: number, y1: number, x2: number, y2: number, out: 1 | -1) => {
    const L = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    const nx = uy * out, ny = -ux * out;
    const ax = x1 + ux * L * 0.35, ay = y1 + uy * L * 0.35;
    const bx = x1 + ux * L * 0.65, by = y1 + uy * L * 0.65;
    return `L${ax},${ay} C${ax - ux * L * 0.12 + nx * t * 1.3},${ay - uy * L * 0.12 + ny * t * 1.3} ${bx + ux * L * 0.12 + nx * t * 1.3},${by + uy * L * 0.12 + ny * t * 1.3} ${bx},${by} L${x2},${y2}`;
  };
  return [
    `M${x},${y}`,
    edge(x, y, x + w, y, 1),
    edge(x + w, y, x + w, y + h, 1),
    edge(x + w, y + h, x, y + h, -1),
    edge(x, y + h, x, y, -1),
    'Z',
  ].join(' ');
}

// "¡Pon la pieza que falta!" com a foto de QUALQUER produto: o recorte da
// peca e calculado na hora. Ao encaixar, oferece o produto.
export function ProductPuzzleModal({ open, onOpenChange, image, product }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: string;
  product: Product;
}) {
  const clipId = useId().replace(/:/g, '');
  const areaRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [done, setDone] = useState(false);
  const [placing, setPlacing] = useState(false);

  // Tamanho real da foto (define o recorte e a proporcao do tabuleiro).
  useEffect(() => {
    if (!open || size) return;
    const img = new window.Image();
    img.onload = () => setSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = image;
  }, [open, image, size]);

  const cell: Box | null = size ? { x: (size.w / COLS) * COL, y: (size.h / ROWS) * ROW, w: size.w / COLS, h: size.h / ROWS } : null;
  const tab = cell ? Math.min(cell.w, cell.h) * 0.3 : 0;
  // Caixa da peca com folga pras abas.
  const box: Box | null = cell ? { x: cell.x - tab, y: cell.y - tab, w: cell.w + tab * 2, h: cell.h + tab * 2 } : null;

  // Geometria em px na tela: tamanho da peca e onde ficam o buraco e a bandeja.
  function geometry() {
    const area = areaRef.current!.getBoundingClientRect();
    const board = boardRef.current!.getBoundingClientRect();
    const k = board.width / size!.w;
    const hole = { x: board.left - area.left + box!.x * k, y: board.top - area.top + box!.y * k };
    const piece = { w: box!.w * k, h: box!.h * k };
    const start = { x: area.width / 2 - piece.w / 2, y: board.bottom - area.top + 10 };
    return { hole, piece, start };
  }

  function reset() {
    setDone(false);
    setPlacing(false);
    setPos(null);
    requestAnimationFrame(() => { if (areaRef.current && boardRef.current && size) setPos(geometry().start); });
  }

  useEffect(() => {
    if (!open || !size) return;
    const id = setTimeout(reset, 80);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, size]);

  function snapIn() {
    setPlacing(true);
    setPos(geometry().hole);
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
    // Um toque sem arrastar tambem coloca a peca (mais facil pros pequenos).
    if (!d.moved) return snapIn();
    const { hole, piece, start } = geometry();
    const p = pos ?? start;
    if (Math.hypot(p.x - hole.x, p.y - hole.y) < Math.min(piece.w, piece.h) * 0.45) snapIn();
    else { setPlacing(true); setPos(start); }
  }

  const pieceSize = size && areaRef.current && boardRef.current ? geometry().piece : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="kids max-h-[95vh] w-full overflow-y-auto rounded-[32px] border-0 bg-[#EAF4FF] p-5 sm:max-w-[600px] sm:p-7">
        <DialogTitle className="text-center font-kids text-3xl font-bold text-[#23263f] sm:text-4xl">
          {done ? '¡Enhorabuena!' : '¡Pon la pieza que falta!'}
        </DialogTitle>
        <DialogDescription className="text-center text-base text-[#565a78]">
          {done ? '¡Has completado el rompecabezas!' : 'Arrastra la pieza suelta hasta el hueco… o tócala y verás.'}
        </DialogDescription>

        <div ref={areaRef} className={`relative mx-auto w-full max-w-[480px] select-none ${done ? '' : 'pb-36'}`} style={{ touchAction: 'none' }}>
          {size && box && (
            <div ref={boardRef} className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: `${size.w} / ${size.h}` }}>
              <svg viewBox={`0 0 ${size.w} ${size.h}`} className="absolute inset-0 h-full w-full" role="img" aria-label={`Rompecabezas de ${product.name}`}>
                <image href={image} x="0" y="0" width={size.w} height={size.h} preserveAspectRatio="none" />
                {!done && (
                  <path d={piecePath(cell!)} fill="#EAF4FF" stroke="#1E88FF" strokeWidth={Math.max(2, size.w / 160)} strokeDasharray={`${size.w / 60} ${size.w / 90}`} />
                )}
              </svg>
            </div>
          )}

          {!done && pos && pieceSize && box && size && (
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
                width: pieceSize.w,
                height: pieceSize.h,
                transition: placing ? 'left 420ms cubic-bezier(0.34,1.56,0.64,1), top 420ms cubic-bezier(0.34,1.56,0.64,1)' : 'none',
                filter: 'drop-shadow(0 6px 8px rgba(35,38,63,0.35))',
              }}
            >
              <svg viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} className="pointer-events-none h-full w-full" aria-hidden="true">
                <defs>
                  <clipPath id={`pz-${clipId}`}><path d={piecePath(cell!)} /></clipPath>
                </defs>
                <image href={image} x="0" y="0" width={size.w} height={size.h} preserveAspectRatio="none" clipPath={`url(#pz-${clipId})`} />
                <path d={piecePath(cell!)} fill="none" stroke="#23263f" strokeWidth={Math.max(2, size.w / 200)} />
              </svg>
            </button>
          )}
        </div>

        {done && (
          <div className="flex flex-col gap-3">
            <OfferPrompt product={product} question="¿Lo añadimos al carrito?" fallbackLabel="Ver colecciones" onClose={() => onOpenChange(false)} />
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white font-extrabold text-[#23263f] transition-colors hover:bg-[#F2F4FA]"
            >
              <RotateCcw className="h-5 w-5" /> Jugar otra vez
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
