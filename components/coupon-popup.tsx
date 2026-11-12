'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, Check, Copy, Gift, ShoppingCart, Tag, X } from 'lucide-react'
import { send } from '@/components/site-tracker'
import { canShowPopup, copyText, markPopupSeen, savePendingCoupon } from '@/lib/coupon-client'

// Pop-up de boas-vindas com cupom (Admin → Editar loja → Pop-up de cupom).
//  - aparece X segundos (padrao 3) depois de entrar na loja, uma vez;
//  - "Copiar" copia o codigo e ja deixa o cupom guardado para o checkout;
//  - "¡Compra ahora!" copia, guarda e leva aos produtos;
//  - fechar no X = sem cupom; nao aparece de novo (salvo regra do admin);
//  - quem ja comprou com o cupom nunca mais ve.
// Cada acao vira estatistica no painel (site_events: coupon_*).

type Cfg = {
  enabled: boolean
  code: string
  percent: number
  firstPurchaseOnly: boolean
  minSubtotal: number
  endsAt: string | null
  delaySec: number
  reshowDays: number
  imageDesktop: string
  imageMobile: string
}

const SKIP = ['/admin', '/checkout', '/acesso', '/preview', '/pedido', '/resena', '/legal']
const skipped = (p: string | null) => !p || SKIP.some((s) => p.startsWith(s))

function track(type: 'coupon_view' | 'coupon_copy' | 'coupon_buy' | 'coupon_close', code: string) {
  send({ type, path: location.pathname, meta: code.toLowerCase() })
}

function rules(c: Cfg) {
  const parts: string[] = []
  if (c.firstPurchaseOnly) parts.push('Válido solo en tu primera compra')
  if (c.minSubtotal > 0) parts.push(`a partir de €${c.minSubtotal.toFixed(2)}`)
  if (c.endsAt) parts.push(`hasta el ${new Date(c.endsAt).toLocaleDateString('es-ES')}`)
  parts.push('no aplica al envío')
  const s = parts.join(', ')
  return s.charAt(0).toUpperCase() + s.slice(1) + '.'
}

export function CouponPopup() {
  const pathname = usePathname()
  const router = useRouter()
  const [cfg, setCfg] = useState<Cfg | null>(null)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const scheduled = useRef(false)
  const closeBtn = useRef<HTMLButtonElement>(null)

  // Agenda uma vez por carregamento, so em paginas da loja.
  useEffect(() => {
    if (scheduled.current || skipped(pathname)) return
    scheduled.current = true
    let timer: ReturnType<typeof setTimeout> | undefined
    let alive = true
    fetch('/api/coupon-popup', { cache: 'no-store' })
      .then((r) => r.json())
      .then((c: Cfg) => {
        if (!alive || !c?.enabled || !c.code || !canShowPopup(c.code, Number(c.reshowDays) || 0)) return
        setCfg(c)
        timer = setTimeout(() => {
          if (skipped(location.pathname) || !canShowPopup(c.code, Number(c.reshowDays) || 0)) return
          setOpen(true)
          track('coupon_view', c.code)
        }, Math.max(0, Number(c.delaySec ?? 3)) * 1000)
      })
      .catch(() => {})
    return () => { alive = false; if (timer) clearTimeout(timer) }
  }, [pathname])

  // Saiu para o checkout/admin com o pop-up aberto: some sem contar como "fechou".
  useEffect(() => { if (open && skipped(pathname)) setOpen(false) }, [open, pathname])

  const close = useCallback(() => {
    if (!cfg) return
    markPopupSeen(cfg.code)
    track('coupon_close', cfg.code)
    setOpen(false)
  }, [cfg])

  // Esc fecha; trava a rolagem da pagina por baixo.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtn.current?.focus()
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, close])

  if (!open || !cfg) return null

  async function copy() {
    if (!cfg) return
    await copyText(cfg.code)
    savePendingCoupon(cfg.code)
    markPopupSeen(cfg.code)
    if (!copied) track('coupon_copy', cfg.code)
    setCopied(true)
  }

  async function buy() {
    if (!cfg) return
    await copyText(cfg.code)
    savePendingCoupon(cfg.code)
    markPopupSeen(cfg.code)
    track('coupon_buy', cfg.code)
    setOpen(false)
    if (location.pathname === '/') {
      document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      router.push('/#productos')
    }
  }

  const codeBox = (
    <div className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 p-1.5 pl-3">
      <Tag size={16} className="shrink-0 text-orange-600" aria-hidden />
      <span className="min-w-0 flex-1 truncate font-mono text-base font-extrabold tracking-wide text-[#1d2b55] sm:text-lg">{cfg.code}</span>
      <button
        type="button"
        onClick={copy}
        className={`inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-white transition-colors ${copied ? 'bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}
      >
        {copied ? <><Check size={16} aria-hidden /> ¡Copiado!</> : <><Copy size={16} aria-hidden /> Copiar</>}
      </button>
    </div>
  )

  const ctaBtn = (
    <button
      type="button"
      onClick={buy}
      className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#1d3263] px-5 text-base font-extrabold text-white shadow-lg shadow-[#1d3263]/25 transition-colors hover:bg-[#15244a]"
    >
      <ShoppingCart size={18} aria-hidden /> ¡Compra ahora! <ArrowRight size={18} aria-hidden />
    </button>
  )

  const note = (
    <p className="text-center text-[11px] leading-snug text-slate-500">
      {copied ? <span className="font-semibold text-green-700">Listo: el descuento se aplica solo al pagar. </span> : 'Se aplica automáticamente al pagar. '}
      {rules(cfg)}
    </p>
  )

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-[#0b1020]/60 p-4 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Cupón de bienvenida: -${cfg.percent}% con el código ${cfg.code}`}
        className="relative w-full max-w-[400px] overflow-hidden rounded-[28px] bg-white shadow-2xl md:max-w-[880px] motion-safe:animate-in motion-safe:zoom-in-95"
      >
        <button
          ref={closeBtn}
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition-colors hover:bg-white"
        >
          <X size={20} aria-hidden />
        </button>

        {/* Celular: imagem vertical em cima, codigo e botao embaixo */}
        <div className="md:hidden">
          <button type="button" onClick={buy} className="block w-full cursor-pointer bg-[#fdf3e7]" aria-label="¡Compra ahora!">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cfg.imageMobile} alt="" className="mx-auto max-h-[56vh] w-full object-contain" />
          </button>
          <div className="space-y-2.5 p-4">
            {codeBox}
            {ctaBtn}
            {note}
          </div>
        </div>

        {/* Computador */}
        <div className="hidden md:block">
          {cfg.imageDesktop ? (
            // imagem horizontal propria + barra de acao embaixo
            <>
              <button type="button" onClick={buy} className="block w-full cursor-pointer bg-[#fdf3e7]" aria-label="¡Compra ahora!">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cfg.imageDesktop} alt="" className="max-h-[62vh] w-full object-contain" />
              </button>
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 p-5">
                {codeBox}
                <div className="w-64">{ctaBtn}</div>
                <div className="col-span-2">{note}</div>
              </div>
            </>
          ) : (
            // montagem: imagem de um lado, cupom do outro
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <button type="button" onClick={buy} className="block cursor-pointer bg-[#fdf3e7]" aria-label="¡Compra ahora!">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cfg.imageMobile} alt="" className="h-full max-h-[78vh] w-full object-cover object-top" />
              </button>
              <div className="flex flex-col justify-center gap-4 bg-gradient-to-b from-[#fff7ed] to-white p-8 lg:p-10">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">
                  <Gift size={14} aria-hidden /> Regalo de bienvenida
                </span>
                <div>
                  <p className="text-6xl font-black leading-none tracking-tight text-orange-500 lg:text-7xl">-{cfg.percent}%</p>
                  <p className="mt-2 text-2xl font-extrabold text-[#1d2b55]">
                    {cfg.firstPurchaseOnly ? 'en tu primera compra' : 'en tu compra'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Gracias por visitar Kitoys 3D. Usa este código y el descuento se aplica al pagar.</p>
                </div>
                {codeBox}
                {ctaBtn}
                {note}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
