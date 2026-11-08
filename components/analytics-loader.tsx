'use client'

import { useEffect, useState } from 'react'
import { getConsentPrefs, COOKIE_CONSENT_EVENT, type ConsentPrefs } from './cookie-consent'

const GA_ID = 'G-7HYXPMV30R'

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

  useEffect(() => {
    fetch('/api/store-settings', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.metaPixelId) setPixelId(d.metaPixelId) })
      .catch(() => {})
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
