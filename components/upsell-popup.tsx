"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, Check, ShoppingCart, Sparkles } from 'lucide-react'
import { useCart } from '@/lib/cart-context'

type KitItem = {
  productId: number
  quantity: number
  name: string
  price: number
  image: string
  description: string
  category: string
  stock: number
}

export function UpsellPopup() {
  const { showUpsell, setShowUpsell, addItem, lastAddedProduct, setIsCartOpen } = useCart()

  const [kitItems, setKitItems]     = useState<KitItem[]>([])
  const [loading, setLoading]       = useState(false)
  const [dismissed, setDismissed]   = useState<Set<number>>(new Set())
  const [added, setAdded]           = useState<Set<number>>(new Set())
  const [imgErrors, setImgErrors]   = useState<Set<number>>(new Set())

  // Fetch kit items whenever the popup opens for a product
  useEffect(() => {
    if (!showUpsell || !lastAddedProduct?.id) return
    setDismissed(new Set())
    setAdded(new Set())
    setKitItems([])

    const ctrl = new AbortController()
    setLoading(true)
    fetch(`/api/product-kits?baseProductId=${lastAddedProduct.id}`, {
      cache: 'no-store',
      signal: ctrl.signal,
    })
      .then(r => r.json())
      .then(data => {
        const items: KitItem[] = data?.kit?.items ?? []
        setKitItems(items)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    return () => ctrl.abort()
  }, [lastAddedProduct?.id, showUpsell])

  function dismiss(id: number) {
    setDismissed(prev => new Set([...prev, id]))
  }

  function handleAdd(item: KitItem) {
    addItem({
      id: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      mainImage: item.image,
      category: item.category === 'fitness' ? 'fitness' : 'salud',
      rating: 4.8,
      reviews: 0,
      stock: item.stock,
      benefits: [],
      description: item.description,
      shortDescription: item.description.replace(/<[^>]+>/g, '').slice(0, 80),
      ingredients: '',
      usage: '',
      emoji: '✨',
      gradient: 'from-emerald-400 to-green-600',
      slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    } as any)
    setAdded(prev => new Set([...prev, item.productId]))
  }

  function handleClose() {
    setShowUpsell(false)
    setIsCartOpen(true)
  }

  if (!showUpsell || !lastAddedProduct) return null

  const visible = kitItems.filter(i => !dismissed.has(i.productId))

  return (
    /* Overlay */
    <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowUpsell(false)}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0f1117] border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 flex flex-col max-h-[88dvh] sm:max-h-[85vh]">

        {/* Close */}
        <button
          onClick={() => setShowUpsell(false)}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
          aria-label="Cerrar"
        >
          <X size={14} />
        </button>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-3 sm:px-6 sm:pt-6"
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>

          {/* Added confirmation */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
              <Check size={16} className="text-white" />
            </div>
            <span className="font-semibold text-white text-sm">¡Añadido al carrito!</span>
          </div>

          {/* Product added */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-3 mb-5">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#090b10]">
              {lastAddedProduct.image && !imgErrors.has(-1) ? (
                <Image
                  src={lastAddedProduct.image}
                  alt={lastAddedProduct.name}
                  fill
                  className="object-contain p-1"
                  onError={() => setImgErrors(s => new Set([...s, -1]))}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl">
                  {lastAddedProduct.emoji ?? '✨'}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white leading-tight line-clamp-2">{lastAddedProduct.name}</p>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">{lastAddedProduct.price.toFixed(2)}€</p>
            </div>
          </div>

          {/* Kit suggestions */}
          {(loading || visible.length > 0) && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-emerald-400 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-400">
                  Completa tu pedido
                </p>
              </div>
              <p className="text-xs text-white/40 mb-3">
                Clientes que compraron esto también añadieron:
              </p>

              {loading && (
                <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-xs text-white/40">
                  <span className="h-3 w-3 rounded-full border border-white/30 border-t-white/70 animate-spin" />
                  Buscando sugerencias…
                </div>
              )}

              <div className="space-y-2">
                {visible.map(item => (
                  <div
                    key={item.productId}
                    className="relative flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-3 transition-colors hover:bg-white/6"
                  >
                    {/* X dismiss */}
                    <button
                      onClick={() => dismiss(item.productId)}
                      className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/40 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
                      aria-label="Dispensar sugerencia"
                    >
                      <X size={11} />
                    </button>

                    {/* Image */}
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#090b10]">
                      {item.image && !imgErrors.has(item.productId) ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-contain p-1"
                          onError={() => setImgErrors(s => new Set([...s, item.productId]))}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg">✨</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1 pr-5">
                      <p className="text-sm font-semibold text-white leading-tight line-clamp-1">{item.name}</p>
                      <p className="text-xs text-white/45 mt-0.5 line-clamp-1">
                        {item.description.replace(/<[^>]+>/g, '').slice(0, 60) || 'Suplemento premium'}
                      </p>
                    </div>

                    {/* Price + button */}
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <span className="text-sm font-bold text-white">{item.price.toFixed(2)}€</span>
                      <button
                        onClick={() => handleAdd(item)}
                        disabled={added.has(item.productId)}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                          added.has(item.productId)
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-emerald-600 text-white hover:bg-emerald-500'
                        }`}
                      >
                        {added.has(item.productId)
                          ? <><Check size={11} /> Añadido</>
                          : <><ShoppingCart size={11} /> Añadir</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer buttons */}
        <div className="shrink-0 border-t border-white/10 px-5 py-4 sm:px-6 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Ver carrito
          </button>
          <button
            onClick={() => setShowUpsell(false)}
            className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 py-3 text-sm font-bold text-white hover:from-emerald-500 hover:to-green-400 transition-all cursor-pointer"
          >
            Seguir comprando
          </button>
        </div>
      </div>
    </div>
  )
}
