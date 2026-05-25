"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Star, ShoppingCart, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/lib/cart-context'
import { type Product, productReviews } from '@/lib/products'

interface ProductModalProps {
  product: Product | null
  onClose: () => void
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem } = useCart()
  const [imageError, setImageError] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const reviews = productReviews[product.id] || []
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 2)

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product)
    }
    setQuantity(1)
    onClose()
  }

  return (
    <Dialog open={!!product} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {!imageError ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
                    <span className="text-4xl font-bold text-primary">
                      {product.name.charAt(0)}
                    </span>
                  </div>
                  <p className="px-4 text-lg font-medium text-muted-foreground">{product.name}</p>
                </div>
              </div>
            )}
            
            {product.badge && (
              <Badge 
                className="absolute left-3 top-3"
                variant={product.badge === 'mas-vendido' ? 'default' : product.badge === 'oferta' ? 'destructive' : 'secondary'}
              >
                {product.badge === 'mas-vendido' ? 'Más vendido' : product.badge === 'oferta' ? 'Oferta' : 'Nuevo'}
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            {/* Category */}
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-primary">
              {product.category === 'salud' ? 'Salud y Bienestar' : 'Fitness'}
            </p>

            {/* Title */}
            <h2 className="mb-2 text-2xl font-bold text-foreground">{product.name}</h2>

            {/* Rating */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating)
                        ? 'fill-warning text-warning'
                        : 'text-muted'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{product.rating}</span>
              <span className="text-sm text-muted-foreground">({product.reviews} reseñas)</span>
            </div>

            {/* Price */}
            <div className="mb-4">
              <p className="text-3xl font-bold text-foreground">{product.price.toFixed(2)}€</p>
              {product.originalPrice && (
                <p className="text-sm text-muted-foreground line-through">
                  {product.originalPrice.toFixed(2)}€
                </p>
              )}
            </div>

            {/* Description */}
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            {/* Benefits */}
            <div className="mb-4">
              <h4 className="mb-2 font-semibold text-foreground">Beneficios:</h4>
              <ul className="grid grid-cols-2 gap-2">
                {product.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Stock */}
            <p className="mb-4 text-sm text-muted-foreground">
              <span className="font-medium text-primary">{product.stock}</span> unidades disponibles
            </p>

            {/* Quantity & Add to Cart */}
            <div className="mt-auto flex items-center gap-4">
              <div className="flex items-center rounded-lg border border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 p-0"
                >
                  -
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10 p-0"
                >
                  +
                </Button>
              </div>
              <Button onClick={handleAddToCart} className="flex-1 gap-2">
                <ShoppingCart className="h-4 w-4" />
                Añadir al carrito
              </Button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <>
            <Separator className="my-6" />
            
            <div>
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Opiniones de clientes ({reviews.length})
              </h3>
              
              <div className="space-y-4">
                {displayedReviews.map((review) => (
                  <div key={review.id} className="rounded-lg bg-muted/50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{review.author}</span>
                        {review.verified && (
                          <Badge variant="secondary" className="text-xs">
                            Compra verificada
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                    <div className="mb-2 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < review.rating ? 'fill-warning text-warning' : 'text-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>

              {reviews.length > 2 && (
                <Button
                  variant="ghost"
                  className="mt-4 w-full gap-2"
                  onClick={() => setShowAllReviews(!showAllReviews)}
                >
                  {showAllReviews ? (
                    <>
                      Ver menos
                      <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Ver todas las reseñas
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
