"use client"

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { X, ShoppingCart, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCart } from '@/lib/cart-context'

type KitApiItem = {
  productId: number
  quantity: number
  name: string
  price: number
  image?: string
  description?: string
  category?: string
  stock?: number
}

type KitApi = {
  id: number
  baseProductId: number
  baseProductName: string
  baseProductPrice: number
  finalPrice: number
  items: KitApiItem[]
}

export function UpsellPopup() {
  const { showUpsell, setShowUpsell, upsellProducts, addItem, removeItem, lastAddedProduct, setIsCartOpen } = useCart()
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})
  const [kit, setKit] = useState<KitApi | null>(null)
  const [kitLoading, setKitLoading] = useState(false)
  const [selectedKitItems, setSelectedKitItems] = useState<Record<number, boolean>>({})

  const handleClose = () => {
    setShowUpsell(false)
    setIsCartOpen(true)
  }

  const handleAddUpsell = (product: typeof upsellProducts[0]) => {
    addItem(product)
  }

  const handleImageError = (productId: number) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }))
  }

  useEffect(() => {
    if (!showUpsell || !lastAddedProduct?.id) return

    const ctrl = new AbortController()
    const loadKit = async () => {
      try {
        setKitLoading(true)
        const res = await fetch(`/api/product-kits?baseProductId=${lastAddedProduct.id}`, {
          cache: 'no-store',
          signal: ctrl.signal,
        })
        const data = await res.json()
        if (!res.ok) {
          setKit(null)
          return
        }
        setKit(data?.kit ?? null)
      } catch {
        setKit(null)
      } finally {
        setKitLoading(false)
      }
    }

    loadKit()
    return () => ctrl.abort()
  }, [lastAddedProduct?.id, showUpsell])

  useEffect(() => {
    if (!kit?.items?.length) {
      setSelectedKitItems({})
      return
    }
    const initial = Object.fromEntries(kit.items.map(item => [item.productId, true]))
    setSelectedKitItems(initial)
  }, [kit])

  const displayProducts = useMemo(() => {
    if (kit?.items?.length) {
      return kit.items.map(item => ({
        id: item.productId,
        name: item.name,
        shortDescription: item.quantity > 1 ? `${item.quantity} unidades` : '1 unidade',
        price: item.price,
        image: item.image || '/images/placeholder-product.svg',
        category: item.category || 'Suplementos',
        description: item.description || '',
        stock: item.stock ?? 999,
      }))
    }
    return upsellProducts
  }, [kit, upsellProducts])

  const hasKit = Boolean(kit?.items?.length)

  const selectedKitRows = useMemo(() => {
    if (!kit?.items?.length) return [] as KitApiItem[]
    return kit.items.filter(item => selectedKitItems[item.productId])
  }, [kit, selectedKitItems])

  const dynamicKitPrice = useMemo(() => {
    if (!kit) return 0
    const selectedTotal = selectedKitRows.reduce(
      (sum, item) => sum + Number(item.price || 0) * Math.max(1, Number(item.quantity || 1)),
      0,
    )
    return Number((Number(kit.baseProductPrice || 0) + selectedTotal).toFixed(2))
  }, [kit, selectedKitRows])

  const toggleKitItem = (productId: number) => {
    setSelectedKitItems(prev => ({ ...prev, [productId]: !prev[productId] }))
  }

  const handleAddFullKit = () => {
    if (!kit || !lastAddedProduct) return

    const signature = selectedKitRows
      .map(item => `${item.productId}:${item.quantity}`)
      .sort()
      .join('|')

    const hash = signature
      .split('')
      .reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) | 0, 7)

    const kitProduct = {
      ...lastAddedProduct,
      id: Math.abs((lastAddedProduct.id * 100000) + hash),
      name: `Kit ${lastAddedProduct.name}`,
      shortDescription: selectedKitRows.length
        ? selectedKitRows.map(item => `${item.quantity}x ${item.name}`).join(' + ')
        : 'Produto sem adicionais',
      price: dynamicKitPrice,
      category: 'fitness',
    }

    // Remove o item base que abriu o popup e adiciona apenas o total consolidado do kit.
    removeItem(lastAddedProduct.id)
    addItem(kitProduct as any)
    setShowUpsell(false)
    setIsCartOpen(true)
  }

  if (!lastAddedProduct) return null

  return (
    <Dialog open={showUpsell} onOpenChange={setShowUpsell}>
      <DialogContent className="max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Check className="h-5 w-5 text-primary" />
            ¡Añadido al carrito!
          </DialogTitle>
        </DialogHeader>

        {/* Added Product */}
        <div className="flex items-center gap-4 rounded-lg bg-primary/5 p-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-muted">
            {!imageErrors[lastAddedProduct.id] ? (
              <Image
                src={lastAddedProduct.image}
                alt={lastAddedProduct.name}
                fill
                className="object-cover"
                onError={() => handleImageError(lastAddedProduct.id)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                <span className="text-lg font-bold text-primary">
                  {lastAddedProduct.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground">{lastAddedProduct.name}</p>
            <p className="text-sm text-muted-foreground">{lastAddedProduct.price.toFixed(2)}€</p>
          </div>
        </div>

        {/* Upsell Section */}
        <div className="mt-4">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              {hasKit ? 'Leve o kit completo' : '¡Completa tu entrenamiento!'}
            </h3>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            {hasKit
              ? `Preço final do kit (com produto principal): ${dynamicKitPrice.toFixed(2)}€`
              : 'Clientes que compraron este produto também añadieron:'}
          </p>
          {hasKit && (
            <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              Remova itens com o botão X e o total do kit será recalculado automaticamente.
              <div className="mt-1 font-medium text-foreground">
                Itens selecionados: {selectedKitRows.length} de {kit?.items.length ?? 0}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {kitLoading && (
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Carregando sugestões do kit...
              </div>
            )}
            {displayProducts.map((product) => (
              <div
                key={product.id}
                className={`flex items-center gap-4 rounded-lg border p-3 transition-colors ${hasKit && !selectedKitItems[product.id] ? 'border-dashed border-border/60 bg-muted/20 opacity-60' : 'border-border hover:bg-muted/50'}`}
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {!imageErrors[product.id] ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(product.id)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                      <span className="text-sm font-bold text-primary">
                        {product.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.shortDescription}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{product.price.toFixed(2)}€</p>
                  {hasKit ? (
                    <Button
                      size="sm"
                      variant={selectedKitItems[product.id] ? 'destructive' : 'outline'}
                      onClick={() => toggleKitItem(product.id)}
                      className="mt-1"
                    >
                      {selectedKitItems[product.id] ? 'X remover' : 'Incluir'}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddUpsell(product as any)}
                      className="mt-1"
                    >
                      Añadir
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasKit && (
            <Button onClick={handleAddFullKit} className="mt-4 w-full">
              Añadir kit completo - {dynamicKitPrice.toFixed(2)}€
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Ver carrito
          </Button>
          <Button onClick={() => setShowUpsell(false)} className="flex-1">
            Seguir comprando
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
