'use client'

import { useEffect, useState } from 'react'
import { getCookieConsent, COOKIE_CONSENT_EVENT } from './cookie-consent'

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

function injectGA() {
  if (window.__gaLoaded) return
  window.__gaLoaded = true

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) { window.dataLayer!.push(args) }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { page_path: window.location.pathname })
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
      if (getCookieConsent() !== 'accepted') return
      injectGA()
      if (pixelId) injectMetaPixel(pixelId)
    }
    apply()
    window.addEventListener(COOKIE_CONSENT_EVENT, apply)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, apply)
  }, [pixelId])

  return null
}
