'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { AppleHome } from '@/components/apple-home'
import { DEFAULT_SITE_CONTENT, type Branding, type SiteContent } from '@/lib/site-content-defaults'

// Cópia da loja usada pelo admin (Editar loja). Mostra a mesma home de app/page.tsx com o
// rascunho do editor, que chega por postMessage a cada mudança.
// ?edit=1 = editor visual: passar o mouse marca cada parte (data-edit) e clicar avisa o admin
// qual parte abrir. No modo "Navegar" a loja funciona normalmente.
// Nunca linkada publicamente e fora do robots.
const EDIT_CSS = `
  [data-edit]{position:relative;cursor:pointer;border-radius:16px;transition:outline-color .15s}
  [data-edit]:hover{outline:2px dashed #16a34a;outline-offset:4px}
  [data-edit].edit-sel{outline:3px solid #16a34a;outline-offset:4px}
  [data-edit]:hover::after,[data-edit].edit-sel::after{content:attr(data-edit-label);position:absolute;left:10px;top:-14px;z-index:60;
    background:#16a34a;color:#fff;font:600 11px/1 -apple-system,Segoe UI,sans-serif;padding:5px 8px;border-radius:6px;pointer-events:none;white-space:nowrap}
  header[data-edit]::after,footer [data-edit]::after{top:4px}
`

export default function PreviewPage() {
  const [content, setContent] = useState<SiteContent | null>(null)
  const [branding, setBranding] = useState<Partial<Branding> | undefined>(undefined)
  const [edit, setEdit] = useState(false)
  const [mode, setMode] = useState<'edit' | 'browse'>('edit')

  useEffect(() => {
    setEdit(new URLSearchParams(window.location.search).get('edit') === '1')
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return
      const d = e.data
      if (d?.type === 'STORE_PREVIEW_CONTENT' && d.content) { setContent({ ...DEFAULT_SITE_CONTENT, ...d.content }); if (d.branding) setBranding(d.branding) }
      if (d?.type === 'STORE_PREVIEW_MODE') setMode(d.mode === 'browse' ? 'browse' : 'edit')
      if (d?.type === 'STORE_PREVIEW_SELECT') {
        document.querySelectorAll('.edit-sel').forEach((el) => el.classList.remove('edit-sel'))
        if (d.key) {
          const els = document.querySelectorAll(`[data-edit="${d.key}"]`)
          els.forEach((el) => el.classList.add('edit-sel'))
          els[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }
    window.addEventListener('message', onMessage)
    window.parent?.postMessage({ type: 'STORE_PREVIEW_READY' }, window.location.origin)
    // aberta fora do admin: mostra o que está publicado
    const t = setTimeout(() => {
      fetch('/api/site-content', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setContent((c) => c ?? d) })
        .catch(() => {})
    }, 800)
    return () => { window.removeEventListener('message', onMessage); clearTimeout(t) }
  }, [])

  // modo editar: o clique escolhe a parte (e não navega nem filtra)
  const editing = edit && mode === 'edit'
  useEffect(() => {
    if (!editing) return
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      const el = target?.closest?.('[data-edit]') as HTMLElement | null
      const itemEl = target?.closest?.('[data-edit-item]') as HTMLElement | null
      e.preventDefault()
      e.stopPropagation()
      if (!el) return
      // item clicado dentro da parte (story, seção, slide ou produto)
      const item = itemEl && (itemEl === el || el.contains(itemEl)) ? itemEl.dataset.editItem : undefined
      window.parent?.postMessage({ type: 'STORE_PREVIEW_PICK', key: el.dataset.edit, item, label: el.dataset.editLabel }, window.location.origin)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [editing])

  const c = content ?? DEFAULT_SITE_CONTENT
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f7]">
      {editing && <style>{EDIT_CSS}</style>}
      {!edit && (
        <div className="sticky top-0 z-[100] bg-amber-500 py-1.5 text-center text-xs font-semibold text-black">
          Prévia da loja (com as alterações ainda não publicadas)
        </div>
      )}
      <Header topbar={c.topbar} cabecalho={c.cabecalho} branding={branding} />
      <main className="flex-1">
        <AppleHome content={c} editing={editing} />
      </main>
      <div data-edit="rodape" data-edit-label="Rodapé">
        <Footer content={c.rodape} branding={branding} />
      </div>
    </div>
  )
}
