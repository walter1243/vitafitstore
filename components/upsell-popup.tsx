"use client"

import { useState } from 'react'
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

export function UpsellPopup() {
  const { showUpsell, setShowUpsell, upsellProducts, addItem, lastAddedProduct, setIsCartOpen } = useCart()
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

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
              ¡Completa tu entrenamiento!
            </h3>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Clientes que compraron este producto también añadieron:
          </p>

          <div className="space-y-3">
            {upsellProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-4 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddUpsell(product)}
                    className="mt-1"
                  >
                    Añadir
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
