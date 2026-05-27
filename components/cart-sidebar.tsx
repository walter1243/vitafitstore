"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag, Truck, X, ShieldCheck, Lock } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useCart } from '@/lib/cart-context'

const FREE_SHIPPING = 50

export function CartSidebar() {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeItem, totalPrice } = useCart()
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

  const hasFreeShipping = totalPrice >= FREE_SHIPPING
  const shipping = hasFreeShipping ? 0 : 4.99
  const total = totalPrice + shipping
  const remaining = FREE_SHIPPING - totalPrice
  const progress = Math.min(100, (totalPrice / FREE_SHIPPING) * 100)

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent
        className="flex w-full flex-col p-0"
        style={{
          background: '#0a0f0a',
          borderLeft: '1px solid rgba(16,185,129,0.15)',
          maxWidth: 420,
        }}
      >
        {/* ── Header ─────────────────────────────────── */}
        <SheetHeader
          className="px-5 pt-5 pb-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(16,185,129,0.1)' }}
        >
          <SheetTitle className="flex items-center justify-between m-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-bold text-base">Tu Carrito</span>
              {items.length > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold text-emerald-400"
                  style={{
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                >
                  {items.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <X className="h-4 w-4" />
            </button>
          </SheetTitle>
        </SheetHeader>

        {/* ── Empty state ─────────────────────────────── */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.15)',
              }}
            >
              <ShoppingBag className="h-9 w-9 text-emerald-700" />
            </div>
            <div>
              <p className="font-bold text-white text-lg">Carrito vacío</p>
              <p className="text-sm text-gray-600 mt-1">Añade productos para empezar</p>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="px-6 py-3 rounded-xl font-semibold text-sm text-white cursor-pointer transition-all"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              Explorar productos
            </button>
          </div>
        ) : (
          <>
            {/* ── Shipping progress ──────────────────────── */}
            <div
              className="px-5 py-3 shrink-0"
              style={{ borderBottom: '1px solid rgba(16,185,129,0.08)' }}
            >
              {hasFreeShipping ? (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                >
                  <Truck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-sm font-semibold text-emerald-400">¡Envío gratis en tu pedido!</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-gray-600" />
                      <span className="text-xs text-gray-500">
                        Añade {remaining.toFixed(2)}€ para envío gratis
                      </span>
                    </div>
                    <span className="text-xs text-emerald-500 font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, #10b981, #34d399)',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Items ─────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.map((item) => (
                (() => {
                  const isKitProduct = item.product.name.startsWith('Kit ')
                  return (
                <div
                  key={item.product.id}
                  className="flex gap-3 p-3 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(16,185,129,0.08)',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    className="relative w-[68px] h-[68px] shrink-0 rounded-xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    {!imageErrors[item.product.id] ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        onError={() => setImageErrors(p => ({ ...p, [item.product.id]: true }))}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-2xl font-bold text-emerald-700">
                          {item.product.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-sm line-clamp-1 leading-tight">
                          {item.product.name}
                        </h4>
                        {item.product.shortDescription && (
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-500">
                            {item.product.shortDescription}
                          </p>
                        )}
                        {isKitProduct && (
                          <p className="mt-1 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                            Preço consolidado do kit
                          </p>
                        )}
                        <p className="text-emerald-400 text-sm font-bold mt-0.5">
                          {item.product.price.toFixed(2)}€
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity control */}
                      <div
                        className="flex items-center rounded-lg overflow-hidden"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                        title={isKitProduct ? 'Quantidade de kits' : 'Quantidade de unidades'}
                      >
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold text-white select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="font-bold text-white text-sm">
                        {(item.product.price * item.quantity).toFixed(2)}€
                      </p>
                    </div>
                  </div>
                </div>
                  )
                })()
              ))}
            </div>

            {/* ── Footer: totais + botão checkout ──────────── */}
            <div
              className="px-5 pb-5 pt-4 space-y-3 shrink-0"
              style={{ borderTop: '1px solid rgba(16,185,129,0.1)' }}
            >
              {/* Totals */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-white">{totalPrice.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Envío</span>
                  <span className={hasFreeShipping ? 'text-emerald-400 font-semibold' : 'text-white'}>
                    {hasFreeShipping ? 'Gratis' : `${shipping.toFixed(2)}€`}
                  </span>
                </div>
                <div
                  className="flex justify-between pt-2.5"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="font-bold text-white">Total</span>
                  <span className="text-xl font-black text-emerald-400">{total.toFixed(2)}€</span>
                </div>
              </div>

              {/* Checkout button */}
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-white text-sm cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.28)',
                }}
              >
                <Lock className="h-4 w-4" />
                Finalizar Compra · {total.toFixed(2)}€
              </Link>

              <button
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3 rounded-xl text-sm text-gray-500 hover:text-white transition-colors cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                Seguir comprando
              </button>

              {/* Trust line */}
              <div className="flex items-center justify-center gap-3 text-gray-700 text-[10px]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Pago seguro
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> SSL 256-bit
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" /> Envío gratis +50€
                </span>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
