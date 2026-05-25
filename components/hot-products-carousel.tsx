'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { allProducts } from '@/lib/products';

const ITEMS = [
  allProducts[0], // CollagenPro Elite
  allProducts[1], // SlimBurn Activo
  allProducts[3], // OmegaFit 3X
  allProducts[4], // MultiVita Complete
];

export default function HotProductsCarousel() {
  const [dotIndex, setDotIndex] = useState(0);

  const currentRef = useRef(0);
  const isAnimating = useRef(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const floatRAF = useRef(0);
  const floatT = useRef(0);

  const productRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const mirrorRef = useRef<HTMLImageElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const priceRef = useRef<HTMLSpanElement>(null);

  const stopFloat = useCallback(() => {
    cancelAnimationFrame(floatRAF.current);
  }, []);

  const startFloat = useCallback(() => {
    const loop = () => {
      if (!isAnimating.current && !isDragging.current && productRef.current) {
        floatT.current += 0.018;
        const y = -30 + Math.sin(floatT.current) * 10;
        productRef.current.style.transform = `translateY(${y}px) translateX(0)`;
      }
      floatRAF.current = requestAnimationFrame(loop);
    };
    floatRAF.current = requestAnimationFrame(loop);
  }, []);

  const goTo = useCallback(
    (index: number, direction?: number) => {
      if (isAnimating.current || index === currentRef.current) return;
      isAnimating.current = true;
      stopFloat();

      const dir = direction !== undefined ? direction : index > currentRef.current ? 1 : -1;
      const product = productRef.current;
      const info = infoRef.current;
      if (!product || !info) { isAnimating.current = false; return; }

      // — Exit —
      const exitX = dir < 0 ? 120 : -120;
      product.style.transition = 'transform 0.35s cubic-bezier(0.4,0,1,1), opacity 0.25s';
      info.style.transition = 'transform 0.3s ease, opacity 0.25s';
      product.style.transform = `translateY(-30px) translateX(${exitX}px)`;
      product.style.opacity = '0';
      info.style.transform = 'translateY(12px)';
      info.style.opacity = '0';

      setTimeout(() => {
        // — Swap content —
        currentRef.current = index;
        const p = ITEMS[index];
        if (imgRef.current) imgRef.current.src = p.image;
        if (mirrorRef.current) mirrorRef.current.src = p.image;
        if (nameRef.current) nameRef.current.textContent = p.name;
        if (descRef.current) descRef.current.textContent = p.shortDescription;
        if (priceRef.current) priceRef.current.textContent = `${p.price.toFixed(2)}€`;
        setDotIndex(index);

        // — Position for enter —
        const enterX = dir < 0 ? -120 : 120;
        product.style.transition = 'none';
        product.style.transform = `translateY(-80px) translateX(${enterX}px)`;
        product.style.opacity = '0';

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // — Enter —
            product.style.transition =
              'transform 0.6s cubic-bezier(0.23,1,0.32,1), opacity 0.4s ease';
            info.style.transition =
              'transform 0.5s cubic-bezier(0.23,1,0.32,1) 0.15s, opacity 0.4s ease 0.15s';
            product.style.transform = 'translateY(-30px) translateX(0)';
            product.style.opacity = '1';
            info.style.transform = 'translateY(0)';
            info.style.opacity = '1';

            setTimeout(() => {
              isAnimating.current = false;
              startFloat();
            }, 650);
          });
        });
      }, 300);
    },
    [startFloat, stopFloat]
  );

  // Initial entry
  useEffect(() => {
    const product = productRef.current;
    const info = infoRef.current;
    if (!product || !info) return;

    product.style.opacity = '0';
    product.style.transform = 'translateY(-80px)';
    info.style.opacity = '0';
    info.style.transform = 'translateY(12px)';

    const t = setTimeout(() => {
      product.style.transition = 'transform 0.7s cubic-bezier(0.23,1,0.32,1), opacity 0.5s ease';
      info.style.transition =
        'transform 0.6s cubic-bezier(0.23,1,0.32,1) 0.2s, opacity 0.5s ease 0.2s';
      product.style.transform = 'translateY(-30px)';
      product.style.opacity = '1';
      info.style.transform = 'translateY(0)';
      info.style.opacity = '1';
      setTimeout(startFloat, 800);
    }, 300);

    return () => { clearTimeout(t); stopFloat(); };
  }, [startFloat, stopFloat]);

  // Auto-play
  useEffect(() => {
    const id = setInterval(() => {
      if (!isDragging.current && !isAnimating.current) {
        goTo((currentRef.current + 1) % ITEMS.length, 1);
      }
    }, 4000);
    return () => clearInterval(id);
  }, [goTo]);

  // Global mouse drag
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !productRef.current || isAnimating.current) return;
      const diff = e.clientX - dragStartX.current;
      productRef.current.style.transform = `translateY(-30px) translateX(${diff * 0.3}px)`;
    };
    const onUp = (e: MouseEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      const diff = e.clientX - dragStartX.current;
      if (Math.abs(diff) > 60) {
        goTo(
          diff < 0
            ? (currentRef.current + 1) % ITEMS.length
            : (currentRef.current - 1 + ITEMS.length) % ITEMS.length,
          diff < 0 ? 1 : -1
        );
      } else if (productRef.current) {
        productRef.current.style.transition = 'transform 0.4s cubic-bezier(0.23,1,0.32,1)';
        productRef.current.style.transform = 'translateY(-30px) translateX(0)';
        startFloat();
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [goTo, startFloat]);

  const p0 = ITEMS[0];

  return (
    <section className="relative w-full h-screen bg-[#050a0f] overflow-hidden flex flex-col items-center justify-center">
      {/* Futuristic grid background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(16,185,129,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.07) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Title */}
      <div className="relative z-10 text-center mb-6 select-none px-4">
        <p className="text-emerald-400 text-sm font-semibold tracking-[0.3em] uppercase mb-2">
          Línea Premium
        </p>
        <h2 className="text-white text-4xl md:text-5xl font-black tracking-tight">
          Nuestros <span className="text-emerald-400">Suplementos</span>
        </h2>
        <p className="text-gray-500 text-sm mt-2">Arrastra para explorar</p>
      </div>

      {/* Stage */}
      <div
        className="relative z-10 w-full flex items-center justify-center select-none"
        style={{ height: 340, cursor: 'grab' }}
        onMouseDown={(e) => {
          isDragging.current = true;
          dragStartX.current = e.clientX;
          stopFloat();
        }}
        onTouchStart={(e) => { dragStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = e.changedTouches[0].clientX - dragStartX.current;
          if (Math.abs(diff) > 50) {
            goTo(
              diff < 0
                ? (currentRef.current + 1) % ITEMS.length
                : (currentRef.current - 1 + ITEMS.length) % ITEMS.length,
              diff < 0 ? 1 : -1
            );
          }
        }}
      >
        {/* Prev */}
        <button
          className="absolute left-4 md:left-16 z-20 w-12 h-12 rounded-full border border-emerald-500/30 bg-black/40 backdrop-blur-sm text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-all cursor-pointer select-none"
          onClick={() => goTo((currentRef.current - 1 + ITEMS.length) % ITEMS.length, -1)}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Next */}
        <button
          className="absolute right-4 md:right-16 z-20 w-12 h-12 rounded-full border border-emerald-500/30 bg-black/40 backdrop-blur-sm text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-all cursor-pointer select-none"
          onClick={() => goTo((currentRef.current + 1) % ITEMS.length, 1)}
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Product */}
        <div ref={productRef} className="flex flex-col items-center" style={{ opacity: 0 }}>
          {/* Glow behind image */}
          <div
            className="absolute w-64 h-64 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)',
              filter: 'blur(20px)',
            }}
          />
          {/* Product image */}
          <img
            ref={imgRef}
            src={p0.image}
            alt="Produto"
            className="relative z-10 w-56 h-56 object-contain drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 0 30px rgba(16,185,129,0.4))' }}
            draggable={false}
          />
          {/* Reflection */}
          <img
            ref={mirrorRef}
            src={p0.image}
            alt=""
            aria-hidden
            className="w-56 h-24 object-contain object-top pointer-events-none"
            style={{ transform: 'scaleY(-0.35)', opacity: 0.18, filter: 'blur(2px)' }}
            draggable={false}
          />
        </div>
      </div>

      {/* Info */}
      <div
        ref={infoRef}
        className="relative z-10 text-center mt-2 px-4"
        style={{ opacity: 0, transform: 'translateY(12px)' }}
      >
        <h3 ref={nameRef} className="text-white text-2xl font-bold mb-1">
          {p0.name}
        </h3>
        <p ref={descRef} className="text-gray-400 text-sm mb-3">
          {p0.shortDescription}
        </p>
        <div className="flex items-center justify-center gap-4">
          <span ref={priceRef} className="text-emerald-400 text-xl font-black">
            {p0.price.toFixed(2)}€
          </span>
          <a
            href="#productos"
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-all cursor-pointer"
          >
            Ver producto
          </a>
        </div>
      </div>

      {/* Dots */}
      <div className="relative z-10 flex gap-2 mt-6">
        {ITEMS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="rounded-full transition-all duration-300 cursor-pointer"
            style={{
              width: i === dotIndex ? '24px' : '8px',
              height: '8px',
              background: i === dotIndex ? '#10b981' : 'rgba(255,255,255,0.2)',
            }}
            aria-label={`Produto ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
