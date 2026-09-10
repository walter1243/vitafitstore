"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type Product, type CartItem } from './products'

type Variant = { color?: string; size?: string }

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, variant?: Variant) => void
  removeItem: (productId: number, variant?: Variant) => void
  updateQuantity: (productId: number, quantity: number, variant?: Variant) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  showUpsell: boolean
  setShowUpsell: (show: boolean) => void
  lastAddedProduct: Product | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [showUpsell, setShowUpsell] = useState(false)
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null)

  // Two lines are "the same" only if product id AND color AND size all
  // match — otherwise a red heater and a black heater (or a size 40 vs 42)
  // would silently merge into one cart line and the wrong variant could
  // ship. Calls that never pass a variant (quick-add from grids/carousels)
  // naturally match only other variant-less lines of that same product.
  const sameLine = (item: CartItem, productId: number, variant?: Variant) =>
    item.product.id === productId &&
    (item.selectedColor ?? '') === (variant?.color ?? '') &&
    (item.selectedSize ?? '') === (variant?.size ?? '')

  const addItem = useCallback((product: Product, variant?: Variant) => {
    setItems(prev => {
      const existing = prev.find(item => sameLine(item, product.id, variant))
      if (existing) {
        return prev.map(item =>
          sameLine(item, product.id, variant)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1, selectedColor: variant?.color, selectedSize: variant?.size }]
    })

    setLastAddedProduct(product)

    // Show upsell popup when adding health products
    if (product.category === 'salud') {
      setShowUpsell(true)
    } else {
      setIsCartOpen(true)
    }
  }, [])

  const removeItem = useCallback((productId: number, variant?: Variant) => {
    setItems(prev => prev.filter(item => !sameLine(item, productId, variant)))
  }, [])

  const updateQuantity = useCallback((productId: number, quantity: number, variant?: Variant) => {
    if (quantity <= 0) {
      removeItem(productId, variant)
      return
    }
    setItems(prev =>
      prev.map(item =>
        sameLine(item, productId, variant) ? { ...item, quantity } : item
      )
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
        showUpsell,
        setShowUpsell,
        lastAddedProduct
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
