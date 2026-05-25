"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type Product, type CartItem, fitnessProducts } from './products'

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  showUpsell: boolean
  setShowUpsell: (show: boolean) => void
  upsellProducts: Product[]
  lastAddedProduct: Product | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [showUpsell, setShowUpsell] = useState(false)
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null)

  const addItem = useCallback((product: Product) => {
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    
    setLastAddedProduct(product)
    
    // Show upsell popup when adding health products
    if (product.category === 'salud') {
      setShowUpsell(true)
    } else {
      setIsCartOpen(true)
    }
  }, [])

  const removeItem = useCallback((productId: number) => {
    setItems(prev => prev.filter(item => item.product.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  // Get random fitness products for upsell (excluding already in cart)
  const cartProductIds = items.map(item => item.product.id)
  const upsellProducts = fitnessProducts
    .filter(p => !cartProductIds.includes(p.id))
    .slice(0, 3)

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
        upsellProducts,
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
