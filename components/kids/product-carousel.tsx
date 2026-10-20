'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type Product } from '@/lib/products';
import { KidsProductCard } from './kids-product-card';
import { type Accent } from './palette';

// Carrossel horizontal de produtos (sem setas): desliza com o dedo, com o
// trackpad/roda do mouse ou arrastando com o mouse; as bolinhas embaixo
// mostram a posicao e levam pra cada parte. Poucos produtos = centralizados.
export function ProductCarousel({ products, accent }: { products: Product[]; accent: Accent }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const n = el.scrollWidth > el.clientWidth + 4 ? Math.ceil(el.scrollWidth / el.clientWidth) : 1;
    setPages(n);
    const max = el.scrollWidth - el.clientWidth;
    setPage(max > 0 ? Math.round((el.scrollLeft / max) * (n - 1)) : 0);
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [measure, products.length]);

  function goTo(i: number) {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: pages > 1 ? (max * i) / (pages - 1) : 0, behavior: 'smooth' });
  }

  // Arrastar com o mouse (no toque o navegador ja desliza sozinho).
  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== 'mouse' || pages <= 1) return;
    drag.current = { x: e.clientX, left: trackRef.current!.scrollLeft, moved: false };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 5) d.moved = true;
    if (d.moved) trackRef.current!.scrollLeft = d.left - dx;
  }
  function endDrag() {
    // Mantem o "moved" ate o click seguinte, pra arrastar nao abrir o produto.
    setTimeout(() => { drag.current = null; }, 0);
  }

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={measure}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={(e) => { if (drag.current?.moved) { e.preventDefault(); e.stopPropagation(); } }}
        onDragStart={(e) => e.preventDefault()}
        className={`-mx-5 snap-x snap-mandatory overflow-x-auto scroll-px-5 px-5 pb-4 pt-1 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 [&::-webkit-scrollbar]:hidden ${pages > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
        aria-label="Productos"
        role="region"
        tabIndex={0}
      >
        {/* w-max + mx-auto: centraliza quando cabe, rola quando nao cabe. */}
        <ul className="mx-auto flex w-max gap-4 sm:gap-6">
          {products.map((p) => (
            <li key={p.id} className="w-[200px] shrink-0 snap-start sm:w-[250px]">
              <KidsProductCard product={p} accent={accent} />
            </li>
          ))}
        </ul>
      </div>

      {pages > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir a la parte ${i + 1} de ${pages}`}
              aria-current={i === page}
              className="flex h-11 w-7 cursor-pointer items-center justify-center"
            >
              <span
                className={`block h-3 rounded-full border-2 border-[#1E1B4B] transition-all duration-200 ${i === page ? 'w-7' : 'w-3 bg-white'}`}
                style={i === page ? { background: accent.deep } : undefined}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
