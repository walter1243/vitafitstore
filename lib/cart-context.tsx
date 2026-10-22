"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type Product, type CartItem } from './products'
import { lineTotalFor, minQtyFor, packOf, stepFor, unitPriceFor } from './personalize'

// text = nome personalizado (chaveiro / pet): cada nome e uma linha propria.
type Variant = { color?: string; size?: string; text?: string; note?: string }

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, variant?: Variant, quantity?: number) => void
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
  lineTotal: (item: CartItem) => number
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
    (item.selectedSize ?? '') === (variant?.size ?? '') &&
    (item.customText ?? '') === (variant?.text ?? '') &&
    (item.customNote ?? '') === (variant?.note ?? '')

  const addItem = useCallback((product: Product, variant?: Variant, quantity = 1) => {
    // Pack: sempre packs inteiros (o "+ Anadir" dos cards poe 1 pack).
    const step = stepFor(product.personalize)
    const qty = step > 1 ? Math.max(step, Math.ceil(quantity / step) * step) : Math.max(1, Math.floor(quantity))
    setItems(prev => {
      const existing = prev.find(item => sameLine(item, product.id, variant))
      if (existing) {
        return prev.map(item =>
          sameLine(item, product.id, variant)
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      }
      return [...prev, { product, quantity: qty, selectedColor: variant?.color, selectedSize: variant?.size, customText: variant?.text || undefined, customNote: variant?.note || undefined }]
    })

    setLastAddedProduct(product)
    // Estatistica "adicionado ao carrinho" (components/site-tracker.tsx).
    window.dispatchEvent(new CustomEvent('kitoys:add-to-cart', { detail: { productId: product.id } }))

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

  // Pack: a quantidade anda de N em N (+1 vira +N) e nunca fica abaixo do minimo.
  const packQty = (item: CartItem, wanted: number) => {
    const step = stepFor(item.product.personalize)
    let q = wanted
    if (step > 1 && wanted % step !== 0) q = wanted > item.quantity ? item.quantity + step : item.quantity - step
    return Math.max(q, minQtyFor(item.product.personalize))
  }

  const updateQuantity = useCallback((productId: number, quantity: number, variant?: Variant) => {
    if (quantity <= 0) {
      removeItem(productId, variant)
      return
    }
    // Pedido minimo (ex: 5 chaveiros): nao deixa baixar dele (a lixeira remove).
    setItems(prev =>
      prev.map(item =>
        sameLine(item, productId, variant) ? { ...item, quantity: packQty(item, quantity) } : item
      )
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  // Preco com promocao por quantidade (ex: 5 chaveiros) somando todas as linhas do produto.
  const qtyOf = (id: number) => items.reduce((n, it) => n + (it.product.id === id ? it.quantity : 0), 0)
  const lineTotal = (item: CartItem) => packOf(item.product.personalize)
    ? lineTotalFor(item.product.price, item.product.personalize, item.quantity)
    : unitPriceFor(item.product.price, item.product.personalize, qtyOf(item.product.id)) * item.quantity
  const totalPrice = items.reduce((sum, item) => sum + lineTotal(item), 0)

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
        lastAddedProduct,
        lineTotal
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
