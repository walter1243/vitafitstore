'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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

const OPEN_EVENT = 'cookieConsentOpen'

// Apaga as cookies de analise/publicidade deste site (retirada do consentimento).
function clearOptionalCookies() {
  const host = location.hostname.replace(/^www\./, '')
  document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => /^(_ga|_gid|_gat|_fbp|_fbc)/.test(n)).forEach((n) => {
    for (const domain of ['', `; domain=${host}`, `; domain=.${host}`]) document.cookie = `${n}=; path=/; max-age=0${domain}`
  })
}

// Politica de cookies: reabre o aviso pra mudar a escolha.
export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className="mt-3 cursor-pointer rounded-xl border border-orange-700 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-50"
    >
      Cambiar mis preferencias
    </button>
  )
}

// GDPR: no analytics/marketing cookie may fire before explicit consent, and
// "reject" must carry the same visual weight as "accept" — no dark patterns.
export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (getCookieConsent() === null) setVisible(true)
    const open = () => setVisible(true)
    window.addEventListener(OPEN_EVENT, open)
    return () => window.removeEventListener(OPEN_EVENT, open)
  }, [])

  function accept() {
    setCookieConsent('accepted')
    setVisible(false)
  }

  function reject() {
    const hadAccepted = getCookieConsent() === 'accepted'
    setCookieConsent('rejected')
    clearOptionalCookies()
    setVisible(false)
    // Os scripts de analise ja carregados so saem recarregando a pagina.
    if (hadAccepted) location.reload()
  }

  // O painel admin nao usa cookies de analise — o aviso so atrapalharia la.
  if (!visible || pathname?.startsWith('/admin')) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] p-3 sm:p-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <p className="flex-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
          Usamos cookies necesarias para que la tienda funcione y, si aceptas, cookies de análisis y publicidad de terceros.
          Puedes aceptarlas o rechazarlas, y cambiar de opinión cuando quieras. Más información en nuestra{' '}
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
