'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { AppleHome } from '@/components/apple-home'
import { DEFAULT_SITE_CONTENT, type SiteContent } from '@/lib/site-content-defaults'

// "Prévia da loja" do admin (iframe em components/configuracoes/ContentEditor):
// mostra a mesma home de app/page.tsx com o rascunho do editor (ainda não
// publicado), que chega por postMessage. Setores, produtos e contatos vem do
// que está salvo no admin. Nunca linkada publicamente e fora do robots.
export default function PreviewPage() {
  const [content, setContent] = useState<SiteContent | null>(null)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === 'STORE_PREVIEW_CONTENT' && e.data.content) setContent({ ...DEFAULT_SITE_CONTENT, ...e.data.content })
    }
    window.addEventListener('message', onMessage)
    window.parent?.postMessage({ type: 'STORE_PREVIEW_READY' }, window.location.origin)
    // aberta fora do admin: mostra o que está publicado
    const t = setTimeout(() => {
      setContent((c) => c ?? null)
      fetch('/api/site-content', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setContent((c) => c ?? d) })
        .catch(() => {})
    }, 800)
    return () => { window.removeEventListener('message', onMessage); clearTimeout(t) }
  }, [])

  const c = content ?? DEFAULT_SITE_CONTENT
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f7]">
      <div className="sticky top-0 z-[100] bg-amber-500 py-1.5 text-center text-xs font-semibold text-black">
        Prévia da loja (com as alterações ainda não publicadas)
      </div>
      <Header topbar={c.topbar} />
      <main className="flex-1">
        <AppleHome content={c} />
      </main>
      <Footer content={c.rodape} />
    </div>
  )
}
