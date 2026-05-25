"use client"

import { useState } from 'react'
import Image from 'next/image'
import { X, Minus, Plus, Trash2, ShoppingBag, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useCart } from '@/lib/cart-context'

const FREE_SHIPPING_THRESHOLD = 50

export function CartSidebar() {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeItem, totalPrice, clearCart } = useCart()
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - totalPrice
  const hasFreeShipping = totalPrice >= FREE_SHIPPING_THRESHOLD

  const handleImageError = (productId: number) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }))
  }

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="flex w-full flex-col bg-card sm:max-w-md">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Tu Carrito ({items.length})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Tu carrito está vacío</p>
              <p className="text-sm text-muted-foreground">
                Añade productos para empezar
              </p>
            </div>
            <Button onClick={() => setIsCartOpen(false)}>
              Explorar productos
            </Button>
          </div>
        ) : (
          <>
            {/* Free Shipping Progress */}
            <div className="border-b border-border py-4">
              {hasFreeShipping ? (
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3">
                  <Truck className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    ¡Envío gratis en tu pedido!
                  </span>
                </div>
              ) : (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Añade {remainingForFreeShipping.toFixed(2)}€ más para envío gratis
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.min(100, (totalPrice / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {!imageErrors[item.product.id] ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          onError={() => handleImageError(item.product.id)}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                          <span className="text-lg font-bold text-primary">
                            {item.product.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-foreground line-clamp-1">
                            {item.product.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {item.product.price.toFixed(2)}€
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-lg border border-border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="font-semibold text-foreground">
                          {(item.product.price * item.quantity).toFixed(2)}€
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="border-t border-border pt-4">
              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{totalPrice.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envío</span>
                  <span className={hasFreeShipping ? 'text-primary font-medium' : 'text-foreground'}>
                    {hasFreeShipping ? 'Gratis' : '4.99€'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold text-foreground">
                    {(totalPrice + (hasFreeShipping ? 0 : 4.99)).toFixed(2)}€
                  </span>
                </div>
              </div>

              <Button className="w-full" size="lg">
                Finalizar compra
              </Button>
              
              <Button
                variant="ghost"
                className="mt-2 w-full text-muted-foreground"
                onClick={() => setIsCartOpen(false)}
              >
                Seguir comprando
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
