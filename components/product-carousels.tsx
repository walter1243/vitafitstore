'use client';
import { useState } from 'react';
import { ProductCarousel } from './product-carousel';
import { ProductModal } from './product-modal';
import { healthProducts, fitnessProducts, type Product } from '@/lib/products';

export default function ProductCarousels() {
  const [selected, setSelected] = useState<Product | null>(null);

  return (
    <>
      <ProductCarousel
        products={healthProducts}
        title="Suplementos & Cápsulas"
        subtitle="Nutrición premium para tu rendimiento"
        onViewDetails={setSelected}
      />
      <ProductCarousel
        products={fitnessProducts}
        title="Moda Fit"
        subtitle="Equipamiento de alta calidad"
        onViewDetails={setSelected}
      />
      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </>
  );
}
