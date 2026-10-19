'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export const ADD_TO_CART_EVENT = 'kitoys:add-to-cart'

// Estatisticas proprias da loja (Admin → Dashboard): visitas, cliques em
// produtos e "adicionar ao carrinho". Nao usa cookies nem guarda nada no
// aparelho — ver app/api/track/route.ts.
function send(data: { type: string; path: string; productId?: number }) {
  try {
    const body = JSON.stringify(data)
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
    document.addEventListener('click', onClick, true)
    window.addEventListener(ADD_TO_CART_EVENT, onAdd)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener(ADD_TO_CART_EVENT, onAdd)
    }
  }, [])

  return null
}
