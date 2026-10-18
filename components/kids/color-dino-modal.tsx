'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

// Desenho de colorir (triceratops no ovo) — linhas pretas sobre branco.
const DRAWING = '/images/dino-colorear.png';
const SCALE = 2;          // canvas em 2x pra pintura ficar nitida
const LINE_LUM = 160;     // mais escuro que isso = linha (borda das areas)
const MIN_AREA = 60;      // areas menores (respingos do traco) nao contam

type Regions = {
  w: number;
  h: number;
  lum: Uint8Array;        // luminosidade original (pra manter o traco ao pintar)
  label: Int32Array;      // area de cada pixel (-1 = linha)
  outside: number;        // area do fundo em volta do desenho
  paintable: number[];    // areas "de verdade" pra pintar
};

// Divide o desenho nas areas fechadas pelas linhas (como o balde de tinta
// dos livros de colorir digitais). Roda uma vez, quando o desenho carrega.
function buildRegions(data: ImageData): Regions {
  const { width: w, height: h } = data;
  const lum = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = data.data[i * 4], g = data.data[i * 4 + 1], b = data.data[i * 4 + 2];
    lum[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  const label = new Int32Array(w * h).fill(-2);
  const sizes: number[] = [];
  const stack: number[] = [];
  for (let start = 0; start < w * h; start++) {
    if (label[start] !== -2) continue;
    if (lum[start] < LINE_LUM) { label[start] = -1; continue; }
    const id = sizes.length;
    let size = 0;
    stack.push(start);
    label[start] = id;
    while (stack.length) {
      const p = stack.pop()!;
      size++;
      const x = p % w, y = (p - x) / w;
      const n = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of n) {
        if (q < 0 || label[q] !== -2) continue;
        if (lum[q] < LINE_LUM) { label[q] = -1; continue; }
        label[q] = id;
        stack.push(q);
      }
    }
    sizes.push(size);
  }
  const outside = label[0];
  const paintable = sizes.map((s, id) => (id !== outside && s >= MIN_AREA ? id : -1)).filter((id) => id >= 0);
  return { w, h, lum, label, outside, paintable };
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// "¡Colorea a tu manera!" — a crianca toca nas areas do desenho do
// dinossauro e elas se enchem de cor. Pintou tudo (ou "¡Terminé!") →
// pergunta se quer levar: adiciona ao carrinho e abre o carrinho.
export function ColorDinoModal({ open, onOpenChange, collectionHref, slug }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionHref: string;
  slug: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const regionsRef = useRef<Regions | null>(null);
  const fillsRef = useRef<Map<number, string>>(new Map());
  const [ready, setReady] = useState(false);
  const [color, setColor] = useState(PALETTE[0].hex);
  const [painted, setPainted] = useState(0);
  const [finished, setFinished] = useState(false);
  const { products } = useStoreProducts();
  const { addItem, setIsCartOpen } = useCart();

  // Produto oferecido no fim: um "dino" da colecao de pintar, senao o
  // primeiro da colecao. Sem produto cadastrado ainda, leva pra colecao.
  const offer = useMemo(() => {
    const items = products.filter((p) => collectionForCategory(p.category)?.slug === slug);
    const dino = items.find((p) => /dino|tricer|estego|t-?rex|stego/i.test(p.name));
    const chosen = dino ?? items[0];
    return chosen ? toStoreProduct(chosen) : null;
  }, [products, slug]);

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
    const img = new window.Image();
    img.src = DRAWING;
    img.onload = () => {
      const w = img.naturalWidth * SCALE, h = img.naturalHeight * SCALE;
      const off = document.createElement('canvas');
      off.width = w; off.height = h;
      const octx = off.getContext('2d')!;
      octx.imageSmoothingQuality = 'high';
      octx.drawImage(img, 0, 0, w, h);
      regionsRef.current = buildRegions(octx.getImageData(0, 0, w, h));
      const canvas = canvasRef.current;
      if (canvas) { canvas.width = w; canvas.height = h; }
      setReady(true);
      render();
    };
  }, [open, render]);

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
    for (let r = 0; r <= 8 && id < 0; r += 2) {
      for (const [dx, dy] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) {
        const px = x + dx, py = y + dy;
        if (px < 0 || py < 0 || px >= reg.w || py >= reg.h) continue;
        const l = reg.label[py * reg.w + px];
        if (l >= 0) { id = l; break; }
      }
    }
    if (id < 0 || id === reg.outside) return;
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

  function addToCart() {
    if (!offer) return;
    addItem(offer);
    onOpenChange(false);
    setTimeout(() => setIsCartOpen(true), 250);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="kids max-h-[95vh] w-full overflow-y-auto rounded-[32px] border-0 bg-[#F1FBEF] p-5 sm:max-w-[560px] sm:p-7">
        <DialogTitle className="text-center font-kids text-3xl font-bold text-[#23263f] sm:text-4xl">
          {finished ? '¡Qué dinosaurio tan bonito!' : '¡Colorea a tu manera!'}
        </DialogTitle>
        <DialogDescription className="text-center text-base text-[#565a78]">
          {finished
            ? 'Así de divertido es pintar nuestros juguetes impresos en 3D.'
            : 'Elige un color y toca una parte del dinosaurio para pintarla.'}
        </DialogDescription>

        <div className="mx-auto w-full max-w-[300px] rounded-[28px] bg-white p-3">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Dibujo de un triceratops saliendo del huevo para colorear"
            onPointerDown={(e) => paintAt(e.clientX, e.clientY)}
            className={`block h-auto w-full touch-manipulation ${finished ? '' : 'cursor-crosshair'}`}
            style={{ aspectRatio: '298 / 357' }}
          />
          {!ready && <p className="py-2 text-center text-sm text-[#565a78]">Cargando dibujo…</p>}
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
