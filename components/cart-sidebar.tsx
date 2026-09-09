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
        className="flex w-full flex-col p-0 bg-white"
        style={{
          borderLeft: '1px solid rgba(30,41,59,0.08)',
          maxWidth: 420,
        }}
      >
        {/* ── Header ─────────────────────────────────── */}
        <SheetHeader
          className="px-5 pt-5 pb-4 shrink-0 border-b border-slate-200"
        >
          <SheetTitle className="flex items-center justify-between m-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-700 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <span className="text-slate-900 font-bold text-base">Tu Carrito</span>
              {items.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200">
                  {items.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors cursor-pointer shrink-0 bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </SheetTitle>
        </SheetHeader>

        {/* ── Empty state ─────────────────────────────── */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-orange-50 border border-orange-100">
              <ShoppingBag className="h-9 w-9 text-orange-300" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">Carrito vacío</p>
              <p className="text-sm text-slate-500 mt-1">Añade productos para empezar</p>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="px-6 py-3 rounded-xl font-semibold text-sm text-white cursor-pointer transition-all"
              style={{ background: 'linear-gradient(135deg, #c2410c, #9a3412)' }}
            >
              Explorar productos
            </button>
          </div>
        ) : (
          <>
            {/* ── Shipping progress ──────────────────────── */}
            <div className="px-5 py-3 shrink-0 border-b border-slate-100">
              {hasFreeShipping ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-orange-50 border border-orange-200">
                  <Truck className="h-4 w-4 text-orange-700 shrink-0" />
                  <span className="text-sm font-semibold text-orange-700">¡Envío gratis en tu pedido!</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        Añade {remaining.toFixed(2)}€ para envío gratis
                      </span>
                    </div>
                    <span className="text-xs text-orange-700 font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, #c2410c, #ea580c)',
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
                  className="flex gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/60"
                >
                  {/* Thumbnail */}
                  <div className="relative w-[68px] h-[68px] shrink-0 rounded-xl overflow-hidden bg-white border border-slate-200">
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
                        <span className="text-2xl font-bold text-orange-300">
                          {item.product.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-900 text-sm line-clamp-1 leading-tight">
                          {item.product.name}
                        </h4>
                        {item.product.shortDescription && (
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                            {item.product.shortDescription}
                          </p>
                        )}
                        {isKitProduct && (
                          <p className="mt-1 inline-flex rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                            Preço consolidado do kit
                          </p>
                        )}
                        <p className="text-orange-700 text-sm font-bold mt-0.5">
                          {item.product.price.toFixed(2)}€
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors cursor-pointer bg-white border border-slate-200"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity control */}
                      <div
                        className="flex items-center rounded-lg overflow-hidden bg-white border border-slate-200"
                        title={isKitProduct ? 'Quantidade de kits' : 'Quantidade de unidades'}
                      >
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold text-slate-900 select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-orange-700 transition-colors cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="font-bold text-slate-900 text-sm">
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
            <div className="px-5 pb-5 pt-4 space-y-3 shrink-0 border-t border-slate-200">
              {/* Totals */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-900">{totalPrice.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Envío</span>
                  <span className={hasFreeShipping ? 'text-orange-700 font-semibold' : 'text-slate-900'}>
                    {hasFreeShipping ? 'Gratis' : `${shipping.toFixed(2)}€`}
                  </span>
                </div>
                <div className="flex justify-between pt-2.5 border-t border-slate-100">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="text-xl font-black text-orange-700">{total.toFixed(2)}€</span>
                </div>
              </div>

              {/* Checkout button */}
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-white text-sm cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #c2410c, #9a3412)',
                  boxShadow: '0 8px 24px rgba(194,65,12,0.25)',
                }}
              >
                <Lock className="h-4 w-4" />
                Finalizar Compra · {total.toFixed(2)}€
              </Link>

              <button
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3 rounded-xl text-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer bg-slate-50 border border-slate-200"
              >
                Seguir comprando
              </button>

              {/* Trust line */}
              <div className="flex items-center justify-center gap-3 text-slate-400 text-[10px]">
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
