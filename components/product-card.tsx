"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Star, ShoppingCart, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useCart } from '@/lib/cart-context'
import { type Product } from '@/lib/products'

interface ProductCardProps {
  product: Product
  onViewDetails: (product: Product) => void
}

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const { addItem } = useCart()
  const [imageError, setImageError] = useState(false)

  const getBadgeVariant = (badge?: string) => {
    switch (badge) {
      case 'mas-vendido':
        return 'default'
      case 'oferta':
        return 'destructive'
      case 'nuevo':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getBadgeText = (badge?: string) => {
    switch (badge) {
      case 'mas-vendido':
        return 'Más vendido'
      case 'oferta':
        return 'Oferta'
      case 'nuevo':
        return 'Nuevo'
      default:
        return ''
    }
  }

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      {/* Badge */}
      {product.badge && (
        <div className="absolute left-3 top-3 z-10">
          <Badge variant={getBadgeVariant(product.badge)} className="font-semibold">
            {getBadgeText(product.badge)}
          </Badge>
        </div>
      )}

      <CardContent className="p-0">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {!imageError ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                  <span className="text-2xl font-bold text-primary">
                    {product.name.charAt(0)}
                  </span>
                </div>
                <p className="px-4 text-sm font-medium text-muted-foreground">{product.name}</p>
              </div>
            </div>
          )}
          
          {/* Quick View Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewDetails(product)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Ver detalles
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">
            {product.category === 'salud' ? 'Salud y Bienestar' : 'Fitness'}
          </p>

          {/* Title */}
          <h3 className="mb-1 line-clamp-1 text-lg font-semibold text-foreground">
            {product.name}
          </h3>

          {/* Short Description */}
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {product.shortDescription}
          </p>

          {/* Rating */}
          <div className="mb-3 flex items-center gap-2">
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
            <span className="text-sm font-medium text-foreground">{product.rating}</span>
            <span className="text-sm text-muted-foreground">({product.reviews})</span>
          </div>

          {/* Price and Button */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xl font-bold text-foreground">
                {product.price.toFixed(2)}€
              </p>
              {product.originalPrice && (
                <p className="text-sm text-muted-foreground line-through">
                  {product.originalPrice.toFixed(2)}€
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => addItem(product)}
              className="gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Añadir</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
