'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

// Começo de cada visita (uma vez por aba, até fechar o navegador):
// - a página abre sempre no topo (o navegador não devolve a rolagem antiga);
// - se a visita começa no checkout (aba antiga, link salvo), vai para a tela inicial.
// Links de produto, coleção e setor continuam abrindo direto (anúncios e WhatsApp
// levam o cliente ao produto certo — mandar para a home faria perder a venda).
const FLAG = 'kt_entry'
const TO_HOME = ['/checkout']

export function EntryStart() {
  const pathname = usePathname() || '/'
  const router = useRouter()

  useEffect(() => {
    try {
      if (sessionStorage.getItem(FLAG)) return
      sessionStorage.setItem(FLAG, '1')
    } catch {
      return
    }
    if (pathname.startsWith('/admin') || pathname.startsWith('/preview')) return
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    if (!window.location.hash) window.scrollTo(0, 0)
    if (TO_HOME.some((p) => pathname.startsWith(p))) router.replace('/')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
