'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'

// Tela "Verificando que eres humano" com o Cloudflare Turnstile ao entrar na loja.
// - Só funciona com NEXT_PUBLIC_TURNSTILE_SITE_KEY (+ TURNSTILE_SECRET_KEY no servidor).
// - Uma verificação por visita: vale até fechar o navegador (cookie de sessão kt_hv).
// - Buscadores (Google, Bing…) e redes sociais passam direto, para não prejudicar o SEO.
// - Admin, cópia da loja do editor e API não passam por aqui.
// - O token é confirmado no servidor (app/api/human-check). Se o Cloudflare cair, a loja abre.

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
const SESSION_FLAG = 'kt_hv_ok'
const BOT_UA = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|twitterbot|linkedinbot|pinterest|lighthouse|google-inspectiontool|chrome-lighthouse|headless|vercel/i
const SKIP_PATHS = ['/admin', '/preview', '/api']

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void; remove: (id?: string) => void }
    __turnstileLoading?: Promise<void>
  }
}

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (window.__turnstileLoading) return window.__turnstileLoading
  window.__turnstileLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('turnstile'))
    document.head.appendChild(s)
  })
  return window.__turnstileLoading
}

function langCode(): string {
  const l = (document.documentElement.lang || navigator.language || 'es').toLowerCase()
  return l.startsWith('pt') ? 'pt' : l.startsWith('fr') ? 'fr' : l.startsWith('en') ? 'en' : 'es'
}

export function HumanCheck() {
  const pathname = usePathname() || '/'
  const skip = !SITE_KEY || SKIP_PATHS.some((p) => pathname.startsWith(p))
  // começa visível (sem piscar a loja antes da verificação) e some na hora se já verificou
  const [state, setState] = useState<'hidden' | 'checking' | 'challenge' | 'error' | 'done'>(skip ? 'hidden' : 'checking')
  const boxRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  const finish = useCallback(() => {
    try { sessionStorage.setItem(SESSION_FLAG, '1') } catch {}
    setState('done')
    setTimeout(() => setState('hidden'), 350)
  }, [])

  const renderWidget = useCallback(async () => {
    setState('challenge')
    try {
      await loadTurnstile()
      if (!boxRef.current || !window.turnstile) throw new Error('turnstile')
      if (widgetId.current) window.turnstile.remove(widgetId.current)
      widgetId.current = window.turnstile.render(boxRef.current, {
        sitekey: SITE_KEY,
        theme: 'light',
        language: langCode(),
        action: 'entrada',
        callback: async (token: string) => {
          try {
            const r = await fetch('/api/human-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
            if (r.ok) finish()
            else { setState('error'); window.turnstile?.reset(widgetId.current ?? undefined) }
          } catch {
            finish() // sem conexão com o servidor: não trava a compra
          }
        },
        'error-callback': () => setState('error'),
        'expired-callback': () => window.turnstile?.reset(widgetId.current ?? undefined),
      })
    } catch {
      setState('error')
    }
  }, [finish])

  useEffect(() => {
    if (skip) { setState('hidden'); return }
    if (BOT_UA.test(navigator.userAgent)) { setState('hidden'); return }
    try { if (sessionStorage.getItem(SESSION_FLAG) === '1') { setState('hidden'); return } } catch {}
    let alive = true
    fetch('/api/human-check', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { verified: false, enabled: true }))
      .then((d) => {
        if (!alive) return
        if (d?.verified || d?.enabled === false) finish()
        else void renderWidget()
      })
      .catch(() => { if (alive) void renderWidget() })
    return () => { alive = false }
  }, [skip, finish, renderWidget])

  // trava a rolagem enquanto verifica
  useEffect(() => {
    if (state === 'hidden') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [state])

  if (state === 'hidden') return null

  return (
    <div
      className={`fixed inset-0 z-[400] flex items-center justify-center bg-[#f5f5f7] px-4 transition-opacity duration-300 motion-reduce:transition-none ${state === 'done' ? 'opacity-0' : 'opacity-100'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hc-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-[0_12px_40px_rgba(0,0,0,0.08)] sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-kitoys-3d.png" alt="Kitoys 3D" className="mx-auto h-14 w-auto object-contain" />
        <h1 id="hc-title" className="mt-5 text-lg font-bold text-[#1d1d1f]">Verificando que eres humano</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-[#6e6e73]">
          Comprobamos la seguridad de tu conexión antes de entrar en la tienda. Solo tarda unos segundos.
        </p>
        <div className="mt-5 flex min-h-[70px] items-center justify-center">
          <div ref={boxRef} />
          {state === 'checking' && (
            <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#0071e3]/20 border-t-[#0071e3] motion-reduce:animate-none" aria-label="Comprobando" />
          )}
        </div>
        {state === 'error' && (
          <div className="mt-3 space-y-2" aria-live="polite">
            <p className="text-sm text-[#b42318]">No hemos podido completar la verificación.</p>
            <button type="button" onClick={() => void renderWidget()} className="min-h-11 cursor-pointer rounded-full bg-[#0071e3] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0062c4]">
              Reintentar
            </button>
          </div>
        )}
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[#86868b]">
          <ShieldCheck className="h-4 w-4 text-[#f38020]" aria-hidden="true" />
          Protegido por Cloudflare ·{' '}
          <a href="https://www.cloudflare.com/es-es/privacypolicy/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Privacidad</a>
        </p>
      </div>
    </div>
  )
}
