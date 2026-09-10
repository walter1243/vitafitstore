'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Lock, Truck, RotateCcw, Minus, Plus, ShoppingCart, Check, Play, Ruler } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { type Product } from '@/lib/products'
import { TrustpilotWidget } from '@/components/trustpilot-widget'
import { SizeGuideModal } from '@/components/size-guide-modal'

export function ProductPageView({ product }: { product: Product }) {
  const { addItem } = useCart()
  const router = useRouter()
  const galleryImages = [product.mainImage ?? product.image, ...(product.additionalImages ?? [])].filter(Boolean) as string[]
  const [activeImage, setActiveImage] = useState(galleryImages[0])
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [selectedColor, setSelectedColor] = useState(product.colorOptions?.[0]?.label ?? '')
  const [selectedSize, setSelectedSize] = useState('')
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)

  const needsSize = Boolean(product.productType && product.productType !== 'estandar' && product.sizes?.length)
  const canBuy = !needsSize || Boolean(selectedSize)

  function selectColor(label: string, image: string) {
    setSelectedColor(label)
    setActiveImage(image)
  }

  const variant = {
    color: product.colorOptions?.length ? selectedColor : undefined,
    size: needsSize ? selectedSize : undefined,
  }

  function handleAdd() {
    if (!canBuy) return
    for (let i = 0; i < quantity; i++) addItem(product, variant)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  function handleBuyNow() {
    if (!canBuy) return
    for (let i = 0; i < quantity; i++) addItem(product, variant)
    router.push('/checkout')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-800">Inicio</Link>
        <ChevronRight size={12} />
        <Link href="/#productos" className="hover:text-slate-800">Productos</Link>
        {product.categoryLabel && (
          <>
            <ChevronRight size={12} />
            <span className="text-slate-700">{product.categoryLabel}</span>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <Image src={activeImage} alt={product.name} fill className="object-cover" priority />
          </div>
          {galleryImages.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    activeImage === img ? 'border-orange-600' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
              {product.videoUrl && (
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-slate-200 bg-slate-50">
                  <Play size={18} className="text-slate-400" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.categoryLabel && (
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-orange-700">{product.categoryLabel}</p>
          )}
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl" style={{ fontFamily: 'var(--font-heading)' }}>
            {product.name}
          </h1>

          <div className="mt-3">
            <TrustpilotWidget />
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-4xl font-black text-slate-900">{product.price.toFixed(2)}€</span>
          </div>

          {/* Color variants */}
          {product.colorOptions && product.colorOptions.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-slate-700">Color: <span className="font-semibold text-slate-900">{selectedColor}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.colorOptions.map(c => (
                  <button
                    key={c.label}
                    onClick={() => selectColor(c.label, c.image)}
                    className={`relative h-14 w-14 overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedColor === c.label ? 'border-orange-600' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    aria-label={c.label}
                  >
                    <Image src={c.image} alt={c.label} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          {needsSize && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Talla: <span className="font-semibold text-slate-900">{selectedSize || 'Elige'}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes!.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[3rem] rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                      selectedSize === size
                        ? 'border-orange-600 bg-orange-50 text-orange-700'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSizeGuideOpen(true)}
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-orange-700 hover:text-orange-800"
              >
                <Ruler size={13} /> Guía de tallas
              </button>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm font-medium text-slate-500">Cantidad</span>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                aria-label="Reducir cantidad"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-base font-bold text-slate-900">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                aria-label="Aumentar cantidad"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs font-medium text-orange-700">{product.stock} disponibles</span>
          </div>

          {needsSize && !selectedSize && (
            <p className="mt-4 text-xs font-medium text-red-500">Elige una talla para continuar.</p>
          )}

          <div className="mt-3 flex flex-col gap-2.5 sm:max-w-xs">
            <button
              onClick={handleBuyNow}
              disabled={!canBuy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Comprar ahora
            </button>
            <button
              onClick={handleAdd}
              disabled={!canBuy}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-700 bg-white px-6 py-3.5 text-sm font-semibold text-orange-700 transition-all hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              {added ? '¡Añadido al carrito!' : 'Añadir al carrito'}
            </button>
          </div>

          {sizeGuideOpen && product.productType && (
            <SizeGuideModal type={product.productType} onClose={() => setSizeGuideOpen(false)} />
          )}

          {/* Trust strip */}
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            {[
              { icon: <Lock className="h-4 w-4 text-orange-700" />, label: 'Pago seguro' },
              { icon: <Truck className="h-4 w-4 text-orange-700" />, label: 'Envío gratis +50€' },
              { icon: <RotateCcw className="h-4 w-4 text-orange-700" />, label: 'Devolución 14 días' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                {item.icon}
                <span className="text-[11px] font-medium text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full description */}
      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Descripción</h2>
          <div
            className="prose prose-sm max-w-none prose-p:text-slate-600 prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
        <div>
          <h2 className="mb-4 text-lg font-bold text-slate-900">Beneficios</h2>
          <div className="space-y-2">
            {product.benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-50">
                  <Check className="h-3 w-3 text-orange-700" />
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
