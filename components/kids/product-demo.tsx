'use client';
import { useState } from 'react';
import { Lightbulb, Paintbrush, Puzzle } from 'lucide-react';
import { type Product } from '@/lib/products';
import { ColorDinoModal } from './color-dino-modal';
import { LampSwitchModal } from './lamp-switch-modal';
import { ProductPuzzleModal } from './product-puzzle-modal';
import { useSectors } from './sectors-context';

const COPY = {
  rompecabezas: { icon: Puzzle, title: '¡Móntalo antes de comprar!', button: '¡Pon la pieza que falta!' },
  colorear: { icon: Paintbrush, title: '¡Píntalo antes de comprar!', button: '¡Pruébalo gratis: píntalo!' },
  encender: { icon: Lightbulb, title: '¡Mira cómo ilumina!', button: 'Enciende la lámpara' },
} as const;

// "Amostra gratis" de um produto (Admin → Produtos → Amostra interativa):
// um cartao na pagina do produto que abre a brincadeira com as imagens DELE
// e, no fim, oferece adicionar esse produto ao carrinho.
export function ProductDemo({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const { collectionForProduct } = useSectors();
  // Sem brincadeira propria no cadastro: usa a da colecao do produto
  // (Rompecabezas → montar, Lamparas → acender, Para pintar → pintar).
  const fromCollection = collectionForProduct(product)?.interactive;
  const type = product.demoType && product.demoType !== 'none'
    ? product.demoType
    : fromCollection === 'rompecabezas' || fromCollection === 'colorear' || fromCollection === 'encender' ? fromCollection : undefined;
  if (!type) return null;
  const copy = COPY[type];
  const Icon = copy.icon;
  const image = product.demoImage || product.mainImage || product.image;

  return (
    <div className="kids mt-4 flex flex-col items-start gap-3 rounded-3xl bg-[#FFF4E0] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#c2410c]">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <span>
          <span className="block font-kids text-lg font-bold text-[#23263f]">{copy.title}</span>
          <span className="block text-sm text-[#565a78]">Muestra gratis e interactiva para los peques.</span>
        </span>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#23263f] px-6 font-bold text-white transition-colors hover:bg-[#363a5c]"
      >
        {copy.button}
      </button>

      {type === 'rompecabezas' && <ProductPuzzleModal open={open} onOpenChange={setOpen} image={image} product={product} />}
      {type === 'colorear' && <ColorDinoModal open={open} onOpenChange={setOpen} drawingUrl={product.demoImage || undefined} product={product} />}
      {type === 'encender' && <LampSwitchModal open={open} onOpenChange={setOpen} photo={image} product={product} />}
    </div>
  );
}
