'use client'

import { Tr, UI } from '@/components/language-switcher'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Aviso de cookies no padrão europeu (RGPD + LSSI-CE / guia da AEPD):
// - nada de análise ou publicidade antes do consentimento;
// - "Rechazar todo" com o mesmo peso de "Aceptar todo", e "Configurar" por categoria;
// - a escolha vale 6 meses e depois o aviso volta a aparecer;
// - dá para mudar a qualquer momento ("Configurar cookies" no rodapé e na política).

export const COOKIE_CONSENT_KEY = 'cookie_consent'          // compatibilidade: 'accepted' | 'rejected' | 'custom'
const PREFS_KEY = 'cookie_consent_v2'                        // escolha por categoria + data
export const COOKIE_CONSENT_EVENT = 'cookieConsentChanged'
const OPEN_EVENT = 'cookieConsentOpen'
const CONSENT_VERSION = 2
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 182               // ~6 meses

export type ConsentValue = 'accepted' | 'rejected' | 'custom'
export type ConsentPrefs = { analytics: boolean; marketing: boolean }

function readPrefs(): (ConsentPrefs & { date: number; v: number }) | null {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (p?.v !== CONSENT_VERSION || typeof p.date !== 'number' || Date.now() - p.date > MAX_AGE_MS) return null
    return { analytics: !!p.analytics, marketing: !!p.marketing, date: p.date, v: p.v }
  } catch {
    return null
  }
}

/** Escolha por categoria; null = ainda não escolheu (ou a escolha venceu). */
export function getConsentPrefs(): ConsentPrefs | null {
  const p = readPrefs()
  return p ? { analytics: p.analytics, marketing: p.marketing } : null
}

/** Resumo (para quem só precisa saber se aceitou tudo/recusou tudo). */
export function getCookieConsent(): ConsentValue | null {
  const p = getConsentPrefs()
  if (!p) return null
  if (p.analytics && p.marketing) return 'accepted'
  if (!p.analytics && !p.marketing) return 'rejected'
  return 'custom'
}

export function setConsentPrefs(prefs: ConsentPrefs) {
  const summary: ConsentValue = prefs.analytics && prefs.marketing ? 'accepted' : !prefs.analytics && !prefs.marketing ? 'rejected' : 'custom'
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ ...prefs, date: Date.now(), v: CONSENT_VERSION }))
    window.localStorage.setItem(COOKIE_CONSENT_KEY, summary)
  } catch {
    // sem localStorage (modo privado): vale só nesta página
  }
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: prefs }))
}

/** Compatibilidade com o código antigo. */
export function setCookieConsent(value: 'accepted' | 'rejected') {
  setConsentPrefs({ analytics: value === 'accepted', marketing: value === 'accepted' })
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

// Apaga as cookies de análise/publicidade deste site (retirada do consentimento).
function clearCookies(re: RegExp) {
  const host = location.hostname.replace(/^www\./, '')
  document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => re.test(n)).forEach((n) => {
    for (const domain of ['', `; domain=${host}`, `; domain=.${host}`]) document.cookie = `${n}=; path=/; max-age=0${domain}`
  })
}

// Política de cookies: reabre o aviso pra mudar a escolha.
export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className="mt-3 cursor-pointer rounded-xl border border-orange-700 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-50"
    >
      Cambiar mis preferencias
    </button>
  )
}

function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] disabled:cursor-not-allowed ${checked ? 'bg-[#0071e3]' : 'bg-slate-300'} ${disabled ? 'opacity-60' : ''}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all duration-200 ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

const CATEGORIES: { key: 'necessary' | 'analytics' | 'marketing'; title: string; desc: string }[] = [
  { key: 'necessary', title: 'Necesarias', desc: 'Hacen que la tienda funcione: carrito, pago seguro, idioma, país de envío y verificación de seguridad. Siempre activas.' },
  { key: 'analytics', title: 'Análisis', desc: 'Google Analytics: nos dice cuántas personas visitan la tienda y qué páginas usan, para mejorarla.' },
  { key: 'marketing', title: 'Publicidad', desc: 'Meta (Facebook e Instagram): mide nuestros anuncios y muestra anuncios más relevantes.' },
]

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [configuring, setConfiguring] = useState(false)
  const [prefs, setPrefs] = useState<ConsentPrefs>({ analytics: false, marketing: false })
  const pathname = usePathname()

  useEffect(() => {
    if (getConsentPrefs() === null) setVisible(true)
    const open = () => {
      setPrefs(getConsentPrefs() ?? { analytics: false, marketing: false })
      setConfiguring(true)
      setVisible(true)
    }
    window.addEventListener(OPEN_EVENT, open)
    return () => window.removeEventListener(OPEN_EVENT, open)
  }, [])

  function save(next: ConsentPrefs) {
    const before = getConsentPrefs()
    setConsentPrefs(next)
    if (!next.analytics) clearCookies(/^(_ga|_gid|_gat)/)
    if (!next.marketing) clearCookies(/^(_fbp|_fbc)/)
    setVisible(false)
    setConfiguring(false)
    // scripts já carregados só saem recarregando a página
    if ((before?.analytics && !next.analytics) || (before?.marketing && !next.marketing)) location.reload()
  }

  // O painel admin e a cópia da loja do editor não usam cookies de análise.
  if (!visible || pathname?.startsWith('/admin') || pathname?.startsWith('/preview')) return null

  const btn = 'min-h-11 flex-1 cursor-pointer rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]'
  const ghost = `${btn} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`
  const solid = `${btn} bg-[#0071e3] text-white hover:bg-[#0062c4]`

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] p-3 sm:p-4" role="dialog" aria-modal="false" aria-labelledby="cookie-title">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:p-6">
        <h2 id="cookie-title" className="text-base font-bold text-slate-900 sm:text-lg">Tu privacidad</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 sm:text-sm">
          Usamos cookies necesarias para que la tienda funcione. Con tu permiso, también usamos cookies de análisis y de publicidad de terceros.
          Puedes aceptarlas, rechazarlas o elegir cuáles, y cambiar de opinión cuando quieras desde «Configurar cookies» al pie de la página.
          Más información en la{' '}
          <Link href="/legal/cookies" className="font-medium text-[#0071e3] underline hover:text-[#0062c4]">Política de Cookies</Link>
          {' '}y la{' '}
          <Link href="/legal/privacidad" className="font-medium text-[#0071e3] underline hover:text-[#0062c4]">Política de Privacidad</Link>.
        </p>

        {configuring && (
          <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200">
            {CATEGORIES.map((c) => {
              const checked = c.key === 'necessary' ? true : prefs[c.key]
              return (
                <li key={c.key} className="flex items-start gap-4 p-3 sm:p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{c.title}{c.key === 'necessary' && <span className="ml-2 text-xs font-medium text-slate-500">Siempre activas</span>}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-slate-600">{c.desc}</p>
                  </div>
                  <Switch
                    label={c.title}
                    checked={checked}
                    disabled={c.key === 'necessary'}
                    onChange={c.key === 'necessary' ? undefined : (v) => setPrefs((p) => ({ ...p, [c.key]: v }))}
                  />
                </li>
              )
            })}
          </ul>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {/* "Rechazar todo" com o mesmo peso visual de "Aceptar todo" (exigência da AEPD) */}
          <button type="button" onClick={() => save({ analytics: false, marketing: false })} className={solid}>
            <Tr t={UI.rechazarTodo} />
          </button>
          {configuring ? (
            <button type="button" onClick={() => save(prefs)} className={ghost}>
              <Tr t={UI.guardarPreferencias} />
            </button>
          ) : (
            <button type="button" onClick={() => { setPrefs(getConsentPrefs() ?? { analytics: false, marketing: false }); setConfiguring(true) }} className={ghost}>
              <Tr t={UI.configurar} />
            </button>
          )}
          <button type="button" onClick={() => save({ analytics: true, marketing: true })} className={solid}>
            <Tr t={UI.aceptar} />
          </button>
        </div>
      </div>
    </div>
  )
}
