'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { type Product } from '@/lib/products'
import { type DbProduct, toStoreProduct } from '@/lib/store-product'

// Real-inventory showcase — deliberately replaces the old "about us" stats
// block right before the footer with 4 actual products instead of fabricated
// numbers, so the last thing a visitor sees before the footer is something
// they can buy.
export function FeaturedProductsGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [addedId, setAddedId] = useState<number | null>(null)
  const { addItem } = useCart()

  useEffect(() => {
    let cancelled = false
    fetch('/api/products', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: DbProduct[]) => {
        if (cancelled || !Array.isArray(data)) return
        setProducts(data.slice(0, 4).map(toStoreProduct))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  function handleAdd(e: React.MouseEvent, product: Product) {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1800)
  }

  if (!products.length) return null

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-orange-700">
            Colección invierno
          </p>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Los más elegidos
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/producto/${product.id}-${product.slug}`}
              className="group block overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)]"
            >
              <div className="relative aspect-square overflow-hidden bg-slate-50">
                <Image
                  src={product.mainImage ?? product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="mb-1 line-clamp-1 text-sm font-bold text-slate-900">{product.name}</h3>
                <div className="mb-3 flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-slate-900">{product.price.toFixed(2)}€</span>
                  {product.originalPrice && (
                    <span className="text-xs text-slate-400 line-through">{product.originalPrice.toFixed(2)}€</span>
                  )}
                </div>
                <button
                  onClick={(e) => handleAdd(e, product)}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all duration-300 cursor-pointer ${
                    addedId === product.id
                      ? 'bg-orange-700 text-white'
                      : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-700 hover:text-white hover:border-orange-700'
                  }`}
                >
                  {addedId === product.id ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                  {addedId === product.id ? '¡Añadido!' : 'Comprar ahora'}
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
