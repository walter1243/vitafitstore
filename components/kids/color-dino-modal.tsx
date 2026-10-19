'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Eraser, RotateCcw, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { OfferPrompt } from './offer-prompt';
import { loadColoringRegions } from '@/lib/coloring-regions';
import { type Product } from '@/lib/products';

// Prefere oferecer um dinossauro da colecao.
const DINO = /dino|tricer|estego|t-?rex|stego/i;

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

// Desenho de colorir (triceratops no ovo) em 2x e o mapa das areas
// pintaveis, gerado a partir dele: cada pixel do mapa guarda o numero da
// area (0 = fundo). O traco original tem falhas, entao as areas foram
// fechadas pela silhueta do desenho — sem isso a cabeca "vazava" pro fundo.
const DRAWING = '/images/dino-colorear-2x.png';
const AREAS = '/images/dino-colorear-areas.png';

type Regions = {
  w: number;
  h: number;
  lum: Uint8Array;        // luminosidade do desenho (mantem o traco ao pintar)
  label: Uint8Array | Int32Array; // area de cada pixel (0 = fundo)
  paintable: number[];
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function pixels(img: HTMLImageElement) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, c.width, c.height);
}

async function loadRegions(): Promise<Regions> {
  const [drawing, areas] = await Promise.all([loadImage(DRAWING), loadImage(AREAS)]);
  const d = pixels(drawing), m = pixels(areas);
  const w = d.width, h = d.height;
  const lum = new Uint8Array(w * h), label = new Uint8Array(w * h);
  const ids = new Set<number>();
  for (let i = 0; i < w * h; i++) {
    lum[i] = d.data[i * 4];
    label[i] = m.data[i * 4];
    if (label[i]) ids.add(label[i]);
  }
  return { w, h, lum, label, paintable: [...ids] };
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// "¡Colorea a tu manera!" — a crianca toca nas areas do desenho e elas se
// enchem de cor. Pintou tudo (ou "¡Terminé!") → pergunta se quer levar:
// adiciona ao carrinho e abre o carrinho.
// Sem `drawingUrl`: triceratops da colecao (mapa de areas pronto).
// Com `drawingUrl` (amostra de um produto): detecta as areas na hora.
export function ColorDinoModal({ open, onOpenChange, slug, drawingUrl, product }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionHref?: string;
  slug?: string;
  drawingUrl?: string;
  product?: Product;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const regionsRef = useRef<Regions | null>(null);
  const fillsRef = useRef<Map<number, string>>(new Map());
  const [ready, setReady] = useState(false);
  const [color, setColor] = useState(PALETTE[0].hex);
  const [painted, setPainted] = useState(0);
  const [finished, setFinished] = useState(false);
  const [failed, setFailed] = useState(false);


  // Redesenha tudo: cor da area multiplicada pela luminosidade original,
  // assim o traco e o sombreado do desenho continuam por cima da tinta.
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const reg = regionsRef.current;
    if (!canvas || !reg) return;
    // O popup recria o canvas a cada abertura — garante o tamanho certo.
    if (canvas.width !== reg.w) { canvas.width = reg.w; canvas.height = reg.h; }
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(reg.w, reg.h);
    const rgbByLabel = new Map<number, number[]>();
    fillsRef.current.forEach((hex, id) => rgbByLabel.set(id, hexToRgb(hex)));
    for (let i = 0; i < reg.w * reg.h; i++) {
      const l = reg.lum[i];
      const rgb = rgbByLabel.get(reg.label[i]);
      const o = i * 4;
      if (rgb) {
        img.data[o] = (rgb[0] * l) / 255;
        img.data[o + 1] = (rgb[1] * l) / 255;
        img.data[o + 2] = (rgb[2] * l) / 255;
      } else {
        img.data[o] = l; img.data[o + 1] = l; img.data[o + 2] = l;
      }
      img.data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const reg2 = regionsRef.current!;
    setPainted(reg2.paintable.filter((id) => fillsRef.current.has(id)).length);
  }, []);

  // Carrega o desenho e calcula as areas quando o popup abre.
  useEffect(() => {
    if (!open) return;
    setFinished(false);
    fillsRef.current = new Map();
    setPainted(0);
    if (regionsRef.current) { requestAnimationFrame(render); return; }
    let cancelled = false;
    (drawingUrl ? loadColoringRegions(drawingUrl) : loadRegions()).then((reg) => {
      if (cancelled) return;
      regionsRef.current = reg;
      setReady(true);
      render();
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [open, render, drawingUrl]);

  const total = regionsRef.current?.paintable.length ?? 0;
  useEffect(() => { if (total > 0 && painted === total) setFinished(true); }, [painted, total]);

  function paintAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    const reg = regionsRef.current;
    if (!canvas || !reg || finished) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * reg.w);
    const y = Math.floor(((clientY - rect.top) / rect.height) * reg.h);
    // Tocou bem em cima da linha: procura a area mais proxima.
    let id = -1;
    for (let r = 0; r <= 6 && id < 0; r += 2) {
      for (const [dx, dy] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) {
        const px = x + dx, py = y + dy;
        if (px < 0 || py < 0 || px >= reg.w || py >= reg.h) continue;
        const l = reg.label[py * reg.w + px];
        if (l > 0) { id = l; break; }
      }
    }
    if (id <= 0) return;
    if (color === WHITE) fillsRef.current.delete(id);
    else fillsRef.current.set(id, color);
    render();
  }

  function surprise() {
    const reg = regionsRef.current;
    if (!reg) return;
    for (const id of reg.paintable) fillsRef.current.set(id, PALETTE[Math.floor(Math.random() * PALETTE.length)].hex);
    render();
  }

  function restart() {
    fillsRef.current = new Map();
    setFinished(false);
    render();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="kids max-h-[95vh] w-full overflow-y-auto rounded-[32px] border-0 bg-[#F1FBEF] p-5 sm:max-w-[560px] sm:p-7">
        <DialogTitle className="text-center font-kids text-3xl font-bold text-[#23263f] sm:text-4xl">
          {finished ? (drawingUrl ? '¡Qué dibujo tan bonito!' : '¡Qué dinosaurio tan bonito!') : '¡Colorea a tu manera!'}
        </DialogTitle>
        <DialogDescription className="text-center text-base text-[#565a78]">
          {finished
            ? 'Así de divertido es pintar nuestros juguetes impresos en 3D.'
            : drawingUrl ? 'Elige un color y toca una parte del dibujo para pintarla.' : 'Elige un color y toca una parte del dinosaurio para pintarla.'}
        </DialogDescription>

        <div className="mx-auto w-full max-w-[300px] rounded-[28px] bg-white p-3">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={drawingUrl ? `Dibujo para colorear de ${product?.name ?? 'nuestro juguete'}` : 'Dibujo de un triceratops saliendo del huevo para colorear'}
            onPointerDown={(e) => paintAt(e.clientX, e.clientY)}
            className={`block h-auto w-full touch-manipulation ${finished ? '' : 'cursor-crosshair'}`}
            style={{ aspectRatio: regionsRef.current ? `${regionsRef.current.w} / ${regionsRef.current.h}` : '596 / 714' }}
          />
          {!ready && !failed && <p className="py-2 text-center text-sm text-[#565a78]">Cargando dibujo…</p>}
          {failed && <p className="py-2 text-center text-sm text-[#565a78]">No se pudo cargar el dibujo.</p>}
        </div>

        {finished ? (
          <div className="flex flex-col gap-3">
            <OfferPrompt
              slug={slug}
              product={product}
              question="¿Lo añadimos al carrito?"
              prefer={DINO}
              fallbackLabel="Ver juguetes para pintar"
              onClose={() => onOpenChange(false)}
            />
            <button
              type="button"
              onClick={restart}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#F2F4FA] font-extrabold text-[#23263f] transition-colors hover:bg-[#E6E9F3]"
            >
              <RotateCcw className="h-5 w-5" /> Pintar otra vez
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
                aria-label="Goma (borrar)"
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
