'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { rememberedStore } from '@/lib/store-context'
import { storePath } from '@/lib/sales-pages-shared'

// A loja sempre recomeça pela tela inicial, no topo, quando o navegador REABRE ou
// RESTAURA a última página (aba esquecida aberta, voltar ao app do navegador,
// recarregar depois de um tempo). Quem CLICA num link de produto (anúncio, WhatsApp,
// Google, Instagram) continua caindo direto no produto — mandar para a home faria
// perder a venda. Volta do pagamento (Bizum/banco) também não é mexida.
const LAST_SEEN = 'kt_last_seen'
const AWAY_MS = 15 * 60 * 1000 // 15 min fora = visita nova
// nunca mexe nestas (o checkout fica de fora: o cliente pode ter saído para aprovar o Bizum no banco)
const SKIP = ['/admin', '/preview', '/acesso', '/resena', '/pedido', '/checkout']

function navType(): string {
  try {
    const e = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    return e?.type ?? 'navigate'
  } catch {
    return 'navigate'
  }
}

function awayTooLong(): boolean {
  try {
    const last = Number(localStorage.getItem(LAST_SEEN) || 0)
    return !last || Date.now() - last > AWAY_MS
  } catch {
    return false
  }
}

function touch() {
  try { localStorage.setItem(LAST_SEEN, String(Date.now())) } catch {}
}

const isPaymentReturn = () => /[?&](confirmed|payment_intent|redirect_status)=/.test(location.search)

// Início da loja em que o cliente está (multi-loja): página de outra loja
// (data-kt-store, ex.: /vice-city) volta para ela; senão, a última loja da aba.
function storeHome(): string {
  const el = document.querySelector('[data-kt-store]')
  return storePath(el?.getAttribute('data-kt-store') || rememberedStore())
}

export function EntryStart() {
  const router = useRouter()

  useEffect(() => {
    const skipped = () => SKIP.some((p) => location.pathname.startsWith(p)) || isPaymentReturn()

    function restart() {
      if (skipped()) return
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
      const home = storeHome()
      if (location.pathname !== home) router.replace(home)
      window.scrollTo(0, 0)
    }

    // 1) abertura da página: link clicado (navigate) fica onde está; reabrir/recarregar depois de um tempo → início
    const type = navType()
    const away = awayTooLong()
    // checkout reaberto do nada (aba antiga, link salvo) e sem retorno de pagamento → início
    if (location.pathname.startsWith('/checkout') && !isPaymentReturn() && type !== 'navigate' && away) router.replace(storeHome())
    if (!skipped()) {
      if (type === 'navigate') {
        if (!location.hash) window.scrollTo(0, 0)
      } else if (away) {
        restart()
      }
    }
    touch()

    // 2) aba/app que volta do segundo plano (celular) depois de um tempo → início
    const onShow = (e: PageTransitionEvent) => { if (e.persisted && awayTooLong()) restart(); touch() }
    const onVisible = () => {
      if (document.visibilityState === 'visible') { if (awayTooLong()) restart(); touch() }
      else touch()
    }
    window.addEventListener('pageshow', onShow)
    document.addEventListener('visibilitychange', onVisible)
    const tick = setInterval(() => { if (document.visibilityState === 'visible') touch() }, 60_000)
    return () => {
      window.removeEventListener('pageshow', onShow)
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(tick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  return null
}
