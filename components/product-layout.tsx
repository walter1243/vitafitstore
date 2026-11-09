'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { assignLayoutVariant, setAbActive, type LayoutVariant } from '@/lib/ab-test'
import type { SecoesContent } from '@/lib/site-content-defaults'

// Jeito de mostrar os produtos na loja INTEIRA (home, setores, coleções e busca):
// Admin → Editar loja → Seções de produtos → Carrossel | Grade | Teste A/B.
// No teste A/B o visitante vê a mesma versão em todas as páginas.
type Setting = SecoesContent['layout']

const Ctx = createContext<Setting | null>(null)

export function ProductLayoutProvider({ layout, children }: { layout: Setting; children: ReactNode }) {
  return <Ctx.Provider value={layout}>{children}</Ctx.Provider>
}

let fetched: Promise<Setting> | null = null
function loadSetting(): Promise<Setting> {
  fetched ??= fetch('/api/site-content', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => (d?.secoes?.layout === 'grid' || d?.secoes?.layout === 'ab' ? d.secoes.layout : 'carousel') as Setting)
    .catch(() => 'carousel' as Setting)
  return fetched
}

export function useProductLayout(): LayoutVariant {
  const fromPage = useContext(Ctx)
  const [setting, setSetting] = useState<Setting>(fromPage ?? 'carousel')
  const [variant, setVariant] = useState<LayoutVariant | null>(null)

  useEffect(() => {
    if (fromPage) { setSetting(fromPage); return }
    let alive = true
    loadSetting().then((s) => { if (alive) setSetting(s) })
    return () => { alive = false }
  }, [fromPage])

  useEffect(() => {
    if (setting === 'ab') { setVariant(assignLayoutVariant()); setAbActive(true) }
  }, [setting])

  return setting === 'ab' ? (variant ?? 'carousel') : setting
}

/** Classe da lista de produtos: grade (2 no celular, 3 no computador) ou fileira que desliza. */
export const productListClass = (layout: LayoutVariant) => (layout === 'grid' ? 'products-grid' : 'products-row')
