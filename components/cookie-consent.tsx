'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export const COOKIE_CONSENT_KEY = 'cookie_consent'
export const COOKIE_CONSENT_EVENT = 'cookieConsentChanged'

export type ConsentValue = 'accepted' | 'rejected'

export function setCookieConsent(value: ConsentValue) {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value)
  } catch {
    // localStorage unavailable (private mode, etc.) — consent just won't persist across visits
  }
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }))
}

export function getCookieConsent(): ConsentValue | null {
  try {
    const v = window.localStorage.getItem(COOKIE_CONSENT_KEY)
    return v === 'accepted' || v === 'rejected' ? v : null
  } catch {
    return null
  }
}

// GDPR: no analytics/marketing cookie may fire before explicit consent, and
// "reject" must carry the same visual weight as "accept" — no dark patterns.
export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (getCookieConsent() === null) setVisible(true)
  }, [])

  function accept() {
    setCookieConsent('accepted')
    setVisible(false)
  }

  function reject() {
    setCookieConsent('rejected')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] p-3 sm:p-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <p className="flex-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
          Utilizamos cookies propias y de terceros para analizar el tráfico y mejorar tu experiencia de compra.
          Puedes aceptar todas las cookies o rechazarlas. Más información en nuestra{' '}
          <Link href="/legal/cookies" className="font-medium text-orange-700 underline hover:text-orange-800">
            Política de Cookies
          </Link>.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={reject}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:flex-none"
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={accept}
            className="flex-1 rounded-xl bg-orange-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-800 sm:flex-none"
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  )
}
