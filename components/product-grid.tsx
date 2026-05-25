"use client"

import { useState } from 'react'
import { ProductCard } from './product-card'
import { ProductModal } from './product-modal'
import { healthProducts, fitnessProducts, type Product } from '@/lib/products'

export function ProductGrid() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  return (
    <>
      {/* Health Products Section */}
      <section id="salud" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
              Salud y Bienestar
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Suplementos de alta calidad para cuidar tu cuerpo desde dentro. 
              Fórmulas naturales, resultados reales.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {healthProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={setSelectedProduct}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Fitness Products Section */}
      <section id="fitness" className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
              Accesorios Fitness
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Equípate para alcanzar tus objetivos. Accesorios de calidad para 
              entrenar en casa o en el gimnasio.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {fitnessProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={setSelectedProduct}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  )
}
