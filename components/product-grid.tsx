'use client';
import { useState, useRef, useEffect } from 'react';
import { ProductCard } from './product-card';
import { ProductModal } from './product-modal';
import { healthProducts, fitnessProducts, type Product } from '@/lib/products';

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`mb-10 transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="flex items-center gap-4 mb-3">
        <div className="w-1 h-10 bg-gradient-to-b from-emerald-500 to-green-400 rounded-full flex-shrink-0" />
        <h2
          className="text-3xl sm:text-4xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {title}
        </h2>
      </div>
      <p className="text-muted-foreground max-w-2xl pl-5">{sub}</p>
    </div>
  );
}

function AnimatedCard({ product, index, onViewDetails }: {
  product: Product;
  index: number;
  onViewDetails: (p: Product) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transitionDelay: `${index * 80}ms`,
      }}
    >
      <ProductCard product={product} onViewDetails={onViewDetails} />
    </div>
  );
}

export function ProductGrid() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <>
      {/* Health Section */}
      <section id="salud" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Salud y Bienestar"
            sub="Suplementos de alta calidad para cuidar tu cuerpo desde dentro. Fórmulas naturales, resultados reales."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {healthProducts.map((product, i) => (
              <AnimatedCard
                key={product.id}
                product={product}
                index={i}
                onViewDetails={setSelectedProduct}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Fitness Section */}
      <section id="fitness" className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Accesorios Fitness"
            sub="Equípate para alcanzar tus objetivos. Accesorios de calidad para entrenar en casa o en el gimnasio."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {fitnessProducts.map((product, i) => (
              <AnimatedCard
                key={product.id}
                product={product}
                index={i}
                onViewDetails={setSelectedProduct}
              />
            ))}
          </div>
        </div>
      </section>

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}
