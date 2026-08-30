'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Lock, Truck, RotateCcw, Minus, Plus, ShoppingCart, Check, Play } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { type Product } from '@/lib/products'
import { TrustpilotWidget } from '@/components/trustpilot-widget'

export function ProductPageView({ product }: { product: Product }) {
  const { addItem } = useCart()
  const galleryImages = [product.mainImage ?? product.image, ...(product.additionalImages ?? [])].filter(Boolean) as string[]
  const [activeImage, setActiveImage] = useState(galleryImages[0])
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  function handleAdd() {
    for (let i = 0; i < quantity; i++) addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-white/45">
        <Link href="/" className="hover:text-white">Inicio</Link>
        <ChevronRight size={12} />
        <Link href="/#productos" className="hover:text-white">Productos</Link>
        {product.categoryLabel && (
          <>
            <ChevronRight size={12} />
            <span className="text-white/60">{product.categoryLabel}</span>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <Image src={activeImage} alt={product.name} fill className="object-cover" priority />
          </div>
          {galleryImages.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    activeImage === img ? 'border-emerald-400' : 'border-white/10 hover:border-white/25'
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
              {product.videoUrl && (
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-white/10 bg-white/5">
                  <Play size={18} className="text-white/60" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.categoryLabel && (
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-400">{product.categoryLabel}</p>
          )}
          <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl" style={{ fontFamily: 'var(--font-heading)' }}>
            {product.name}
          </h1>

          <div className="mt-3">
            <TrustpilotWidget />
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-4xl font-black text-white">{product.price.toFixed(2)}€</span>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm font-medium text-white/60">Cantidad</span>
            <div className="flex items-center rounded-xl border border-white/10 bg-white/5">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Reducir cantidad"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-base font-bold text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Aumentar cantidad"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs font-medium text-emerald-400">{product.stock} disponibles</span>
          </div>

          <button
            onClick={handleAdd}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all sm:w-auto sm:px-10 ${
              added ? 'bg-emerald-500 text-white' : 'bg-emerald-500 text-white hover:bg-emerald-400'
            }`}
          >
            {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            {added ? '¡Añadido al carrito!' : 'Añadir al carrito'}
          </button>

          {/* Trust strip */}
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            {[
              { icon: <Lock className="h-4 w-4 text-emerald-400" />, label: 'Pago seguro' },
              { icon: <Truck className="h-4 w-4 text-emerald-400" />, label: 'Envío gratis +50€' },
              { icon: <RotateCcw className="h-4 w-4 text-emerald-400" />, label: '30 días' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                {item.icon}
                <span className="text-[11px] font-medium text-white/55">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full description */}
      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-white">Descripción</h2>
          <div
            className="prose prose-invert prose-sm max-w-none prose-p:text-white/65 prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
        <div>
          <h2 className="mb-4 text-lg font-bold text-white">Beneficios</h2>
          <div className="space-y-2">
            {product.benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-white/75">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                  <Check className="h-3 w-3 text-emerald-400" />
                </div>
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
