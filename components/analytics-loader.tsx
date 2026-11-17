'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getConsentPrefs, COOKIE_CONSENT_EVENT, type ConsentPrefs } from './cookie-consent'

const GA_ID = 'G-7HYXPMV30R'
// Pixel da Meta da Kitoys 3D. O campo "Meta Pixel ID" do painel (Editar loja)
// tem prioridade; este e o padrao quando o campo esta vazio.
const DEFAULT_PIXEL_ID = '1495587405798171'

// Eventos padrao da Meta, so quando o Pixel ja carregou (= visitante aceitou
// cookies de marketing). Sem consentimento, nada sai daqui.
function pixel(event: string, data?: Record<string, unknown>) {
  if (!window.__pixelLoaded || typeof window.fbq !== 'function') return
  data ? window.fbq('track', event, data) : window.fbq('track', event)
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: any
    __gaLoaded?: boolean
    __pixelLoaded?: boolean
  }
}

// Google Consent Mode v2 (obrigatório para tráfego europeu): tudo negado por padrão e
// liberado só na categoria que o visitante aceitou.
function consentState(p: ConsentPrefs) {
  return {
    analytics_storage: p.analytics ? 'granted' : 'denied',
    ad_storage: p.marketing ? 'granted' : 'denied',
    ad_user_data: p.marketing ? 'granted' : 'denied',
    ad_personalization: p.marketing ? 'granted' : 'denied',
  }
}

function injectGA(p: ConsentPrefs) {
  if (window.__gaLoaded) { window.gtag?.('consent', 'update', consentState(p)); return }
  window.__gaLoaded = true

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)

  window.dataLayer = window.dataLayer || []
  // gtag precisa receber o objeto "arguments" original
  window.gtag = function gtag() { window.dataLayer!.push(arguments) } as any
  window.gtag!('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 })
  window.gtag!('consent', 'update', consentState(p))
  window.gtag!('js', new Date())
  window.gtag!('config', GA_ID, { page_path: window.location.pathname })
}

function injectMetaPixel(pixelId: string) {
  if (window.__pixelLoaded) return
  window.__pixelLoaded = true

  ;(function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return
    const n: any = (f.fbq = function (...args: unknown[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args)
    })
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    const t = b.createElement(e) as HTMLScriptElement
    t.async = true
    t.src = v
    const s = b.getElementsByTagName(e)[0]
    s.parentNode?.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')

  // Limited Data Use — extra safety net for EU traffic even with consent.
  window.fbq('dataProcessingOptions', ['LDU'], 0, 0)
  window.fbq('init', pixelId)
  window.fbq('track', 'PageView')
}

// GDPR: nothing here fires until the visitor has explicitly accepted via the
// cookie banner — never on page load. See components/cookie-consent.tsx.
export function AnalyticsLoader() {
  const [pixelId, setPixelId] = useState('')
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    fetch('/api/store-settings', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPixelId(String(d?.metaPixelId || '').trim() || DEFAULT_PIXEL_ID))
      .catch(() => setPixelId(DEFAULT_PIXEL_ID))
  }, [])

  // Navegacao dentro do site (sem recarregar): PageView de novo. O primeiro
  // PageView sai no init do Pixel. Painel/admin nao conta.
  useEffect(() => {
    if (!pathname) return
    if (lastPath.current !== null && lastPath.current !== pathname && !pathname.startsWith('/admin')) pixel('PageView')
    lastPath.current = pathname
    if (pathname.startsWith('/checkout')) pixel('InitiateCheckout', { currency: 'EUR' })
  }, [pathname])

  // Carrinho, pagamento e compra (eventos disparados pela loja).
  useEffect(() => {
    const onAdd = (e: Event) => {
      const d = (e as CustomEvent).detail ?? {}
      pixel('AddToCart', { content_ids: [String(d.productId ?? '')], content_name: d.name, content_type: 'product', value: Number(d.value) || 0, currency: 'EUR' })
    }
    const onPay = () => pixel('AddPaymentInfo', { currency: 'EUR' })
    const onBuy = (e: Event) => {
      const v = Number((e as CustomEvent).detail?.value) || 0
      pixel('Purchase', { value: Math.round(v * 100) / 100, currency: 'EUR' })
    }
    window.addEventListener('kitoys:add-to-cart', onAdd)
    window.addEventListener('kitoys:payment-start', onPay)
    window.addEventListener('kitoys:purchase', onBuy)
    return () => {
      window.removeEventListener('kitoys:add-to-cart', onAdd)
      window.removeEventListener('kitoys:payment-start', onPay)
      window.removeEventListener('kitoys:purchase', onBuy)
    }
  }, [])

  useEffect(() => {
    function apply() {
      const p = getConsentPrefs()
      if (!p) return
      if (p.analytics) injectGA(p)
      else if (window.__gaLoaded) window.gtag?.('consent', 'update', consentState(p))
      if (p.marketing && pixelId) injectMetaPixel(pixelId)
    }
    apply()
    window.addEventListener(COOKIE_CONSENT_EVENT, apply)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, apply)
  }, [pixelId])

  return null
}
