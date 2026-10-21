"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag, Truck, X, ShieldCheck, Lock, Gift } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useCart } from '@/lib/cart-context'
import { FREE_SHIPPING_FROM as FREE_SHIPPING, resolveShipping } from '@/lib/checkout-pricing'

// Carrinho no visual infantil da vitrine (classe .kids: Baloo 2 + Nunito,
// tons pastel). A logica — quantidades, remover, frete gratis, link pro
// checkout — e a mesma de antes.
export function CartSidebar() {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeItem, totalPrice, lineTotal } = useCart()
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

  const hasFreeShipping = totalPrice >= FREE_SHIPPING
  // Mesma regra do checkout: maior frete entre os produtos (ou a tabela padrao).
  const shipping = resolveShipping(totalPrice, 'ES', items.map((i) => i.product.shippingCost))
  const total = totalPrice + shipping
  const remaining = FREE_SHIPPING - totalPrice
  const progress = Math.min(100, (totalPrice / FREE_SHIPPING) * 100)

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent
        showCloseButton={false}
        className="kids flex w-full flex-col bg-white p-0"
        style={{ maxWidth: 420 }}
      >
        {/* ── Header ─────────────────────────────────── */}
        <SheetHeader className="shrink-0 bg-[#FFF4E0] px-5 pb-4 pt-5">
          <SheetTitle className="m-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFC93C]">
                <ShoppingBag className="h-5 w-5 text-[#23263f]" />
              </div>
              <span className="font-kids text-2xl font-bold text-[#23263f]">Tu carrito</span>
              {items.length > 0 && (
                <span className="rounded-full bg-[#c2410c] px-2.5 py-0.5 text-xs font-extrabold text-white">
                  {items.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              aria-label="Cerrar carrito"
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-[#23263f] transition-colors hover:bg-[#FFE8C2]"
            >
              <X className="h-5 w-5" />
            </button>
          </SheetTitle>
        </SheetHeader>

        {/* ── Empty state ─────────────────────────────── */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#F1E8FF]">
              <Gift className="h-11 w-11 text-[#6D28D9]" strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-kids text-2xl font-bold text-[#23263f]">¡Tu carrito está vacío!</p>
              <p className="mt-1 text-base text-[#565a78]">Elige un juguete o una lámpara para empezar.</p>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="min-h-12 cursor-pointer rounded-2xl bg-[#c2410c] px-7 text-base font-extrabold text-white transition-colors hover:bg-[#9a3412]"
            >
              Ver juguetes
            </button>
          </div>
        ) : (
          <>
            {/* ── Shipping progress ──────────────────────── */}
            <div className="shrink-0 px-5 py-4">
              {hasFreeShipping ? (
                <div className="flex items-center gap-2 rounded-2xl bg-[#EAF6EF] px-4 py-3">
                  <Truck className="h-5 w-5 shrink-0 text-[#15803d]" />
                  <span className="text-sm font-extrabold text-[#15803d]">¡Tu envío es gratis!</span>
                </div>
              ) : (
                <div className="space-y-2 rounded-2xl bg-[#F2F4FA] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-[#565a78]" />
                      <span className="text-sm font-semibold text-[#23263f]">
                        Te faltan {remaining.toFixed(2)}€ para el envío gratis
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #FF8A00, #F2384A, #8B3FD9)' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Items ─────────────────────────────────── */}
            <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-4">
              {items.map((item) => (
                (() => {
                  const isKitProduct = item.product.name.startsWith('Kit ')
                  return (
                <div
                  key={item.product.id}
                  className="flex gap-3 rounded-3xl bg-[#FFF8EF] p-3"
                >
                  {/* Thumbnail */}
                  <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-2xl bg-white">
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
                        <span className="font-kids text-2xl font-bold text-[#c2410c]">
                          {item.product.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="line-clamp-2 text-sm font-extrabold leading-tight text-[#23263f]">
                          {item.product.name}
                        </h4>
                        {(item.selectedColor || item.selectedSize || item.customText) ? (
                          <p className="mt-0.5 text-xs font-semibold text-[#565a78]">
                            {[item.customText && `Nombre: «${item.customText}»`, item.selectedColor && `Color: ${item.selectedColor}`, item.selectedSize && `Talla: ${item.selectedSize}`].filter(Boolean).join(' · ')}
                          </p>
                        ) : null}
                        {isKitProduct && (
                          <p className="mt-1 inline-flex rounded-full bg-[#FFE8C2] px-2 py-0.5 text-[10px] font-bold text-[#9a3412]">
                            Preço consolidado do kit
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id, { color: item.selectedColor, size: item.selectedSize, text: item.customText })}
                        aria-label={`Quitar ${item.product.name}`}
                        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-[#565a78] transition-colors hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      {/* Quantity control */}
                      <div
                        className="flex items-center gap-1 rounded-full bg-white p-1"
                        title={isKitProduct ? 'Quantidade de kits' : 'Quantidade de unidades'}
                      >
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, { color: item.selectedColor, size: item.selectedSize, text: item.customText })}
                          aria-label="Quitar uno"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#F2F4FA] text-[#23263f] transition-colors hover:bg-[#E6E9F3]"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 select-none text-center text-base font-extrabold text-[#23263f]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, { color: item.selectedColor, size: item.selectedSize, text: item.customText })}
                          aria-label="Añadir uno"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#FFC93C] text-[#23263f] transition-colors hover:bg-[#FFB800]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-base font-extrabold text-[#23263f]">
                        {lineTotal(item).toFixed(2)}€
                      </p>
                    </div>
                  </div>
                </div>
                  )
                })()
              ))}
            </div>

            {/* ── Footer: totais + botão checkout ──────────── */}
            <div className="shrink-0 space-y-3 rounded-t-[28px] bg-[#F2F4FA] px-5 pb-5 pt-5">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#565a78]">Subtotal</span>
                  <span className="font-semibold text-[#23263f]">{totalPrice.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#565a78]">Envío</span>
                  <span className={hasFreeShipping ? 'font-extrabold text-[#15803d]' : 'font-semibold text-[#23263f]'}>
                    {hasFreeShipping ? 'Gratis' : `${shipping.toFixed(2)}€`}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-2">
                  <span className="font-kids text-xl font-bold text-[#23263f]">Total</span>
                  <span className="font-kids text-3xl font-bold text-[#23263f]">{total.toFixed(2)}€</span>
                </div>
              </div>

              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#c2410c] text-base font-extrabold text-white transition-colors hover:bg-[#9a3412]"
              >
                <Lock className="h-4 w-4" />
                Finalizar compra · {total.toFixed(2)}€
              </Link>

              <button
                onClick={() => setIsCartOpen(false)}
                className="min-h-12 w-full cursor-pointer rounded-2xl bg-white text-sm font-bold text-[#23263f] transition-colors hover:bg-[#FFF4E0]"
              >
                Seguir comprando
              </button>

              <div className="flex items-center justify-center gap-3 text-[11px] font-semibold text-[#565a78]">
                <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Pago seguro</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Envío gratis +50€</span>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
