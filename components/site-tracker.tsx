'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getCookieConsent } from '@/components/cookie-consent'
import { currentVariant } from '@/lib/ab-test'

export const ADD_TO_CART_EVENT = 'kitoys:add-to-cart'
export const PURCHASE_EVENT = 'kitoys:purchase'
export const PAYMENT_START_EVENT = 'kitoys:payment-start'

// Origem da visita (fica a mesma até fechar a aba): utm_source do anúncio, o site
// de onde veio (google, instagram, whatsapp…) ou "directo".
function visitSource(): string {
  try {
    const saved = sessionStorage.getItem('kt_src')
    if (saved) return saved
    const q = new URLSearchParams(location.search)
    let src = q.get('utm_source') || q.get('ref') || ''
    if (!src && q.get('gclid')) src = 'google ads'
    if (!src && q.get('fbclid')) src = 'facebook/instagram'
    if (!src && document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '')
      if (host && host !== location.hostname.replace(/^www\./, '')) {
        src = /google\./.test(host) ? 'google' : /instagram/.test(host) ? 'instagram' : /facebook|fb\.com/.test(host) ? 'facebook'
          : /whatsapp|wa\.me/.test(host) ? 'whatsapp' : /tiktok/.test(host) ? 'tiktok' : /bing\./.test(host) ? 'bing' : host
      }
    }
    src = (src || 'directo').toLowerCase().slice(0, 40)
    sessionStorage.setItem('kt_src', src)
    return src
  } catch {
    return 'directo'
  }
}

// Estatisticas proprias da loja (Admin → Dashboard): visitas, cliques em
// produtos e "adicionar ao carrinho". Nao usa cookies nem guarda nada no
// aparelho — ver app/api/track/route.ts.
export function send(data: { type: string; path: string; productId?: number; meta?: string }) {
  try {
    // Quem recusou no aviso de cookies conta como visita, mas sem localizacao.
    const body = JSON.stringify({ ...data, noGeo: getCookieConsent() === 'rejected', variant: currentVariant(), source: visitSource() })
    if (navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))) return
    fetch('/api/track', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {})
  } catch {}
}

const skip = (path: string) => path.startsWith('/admin') || path.startsWith('/acesso') || path.startsWith('/preview')

export function SiteTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname || skip(pathname)) return
    send({ type: 'page_view', path: pathname })
  }, [pathname])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || skip(location.pathname)) return
      const id = a.pathname.match(/^\/producto\/(\d+)/)?.[1]
      if (id && a.origin === location.origin) send({ type: 'product_click', path: location.pathname, productId: Number(id) })
    }
    function onAdd(e: Event) {
      const id = Number((e as CustomEvent).detail?.productId)
      if (id) send({ type: 'add_to_cart', path: location.pathname, productId: id })
    }
    const onBuy = () => send({ type: 'purchase', path: location.pathname })
    const onPay = (e: Event) => send({ type: 'payment_start', path: location.pathname, meta: String((e as CustomEvent).detail?.method ?? '') })
    document.addEventListener('click', onClick, true)
    window.addEventListener(ADD_TO_CART_EVENT, onAdd)
    window.addEventListener(PURCHASE_EVENT, onBuy)
    window.addEventListener(PAYMENT_START_EVENT, onPay)
    return () => {
      window.removeEventListener(PAYMENT_START_EVENT, onPay)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener(ADD_TO_CART_EVENT, onAdd)
      window.removeEventListener(PURCHASE_EVENT, onBuy)
    }
  }, [])

  return null
}
