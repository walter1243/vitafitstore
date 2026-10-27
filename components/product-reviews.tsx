'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'

type Review = {
  id: number
  customerName: string
  rating: number
  comment: string | null
  photoUrl: string | null
  date: string
  source?: 'order' | 'manual'
  country?: string | null
  language?: string | null
  sourceNote?: string | null
}

// Bandeira do pais (codigo ISO de 2 letras → emoji).
const flag = (cc?: string | null) => cc && /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : ''


// Estrelas + numero de opinioes (embaixo do nome do produto); some sem opinioes.
export function ReviewSummary({ productId }: { productId: number }) {
  const [data, setData] = useState<{ average: number; count: number } | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch(`/api/reviews?productId=${productId}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setData({ average: d.average ?? 0, count: d.count ?? 0 }) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [productId])
  if (!data || data.count === 0) return null
  return (
    <a
      href="#opiniones"
      onClick={(e) => {
        const el = [...document.querySelectorAll<HTMLElement>('[data-opiniones]')].find((x) => x.offsetParent !== null)
        if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
      }}
      className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
    >
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={`h-4 w-4 ${data.average >= n - 0.5 ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
        ))}
      </span>
      <span className="font-semibold">{data.average.toFixed(1)}</span>
      <span className="underline-offset-2 hover:underline">({data.count} {data.count === 1 ? 'opinión' : 'opiniones'})</span>
    </a>
  )
}

// Lista de opinioes. `half`: celular (mostra a metade do numero ajustado no
// Admin → Avaliações); `className` posiciona (coluna do lado no computador,
// embaixo da descricao no celular).
export function ProductReviews({ productId, half = false, className = 'mt-12 max-w-3xl', anchor = true }: { productId: number; half?: boolean; className?: string; anchor?: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [average, setAverage] = useState(0)
  const [count, setCount] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/reviews?productId=${productId}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setReviews(data.reviews ?? [])
        setAverage(data.average ?? 0)
        setCount(data.count ?? 0)
        if (data.visible) setPerPage(Number(data.visible))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [productId])

  if (count === 0) return null

  const limit = half ? Math.max(1, Math.ceil(perPage / 2)) : perPage
  const visible = showAll ? reviews : reviews.slice(0, limit)

  return (
    <div id={anchor ? 'opiniones' : undefined} data-opiniones className={`${className} scroll-mt-24`}>
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-900">Opiniones de clientes</h2>
        <div className="flex items-center gap-1.5">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={`h-4 w-4 ${average >= n - 0.5 ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
            ))}
          </div>
          <span className="text-sm font-semibold text-slate-700">{average.toFixed(1)}</span>
          <span className="text-sm text-slate-400">({count} {count === 1 ? 'opinión' : 'opiniones'})</span>
        </div>
      </div>

      <div className="space-y-4">
        {visible.map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              {r.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-3.5 w-3.5 ${r.rating >= n ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">{r.date}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900">{r.customerName}{r.country && <span className="ml-1.5" title={r.country}>{flag(r.country)}</span>}</p>
                {r.comment && <p className="mt-1 text-sm leading-relaxed text-slate-600">{r.comment}</p>}
                {r.source === 'manual'
                  ? <p className="mt-1.5 text-[11px] font-medium text-slate-500">Opinión recibida {r.sourceNote ? `por ${r.sourceNote}` : 'fuera de la web'}</p>
                  : <p className="mt-1.5 text-[11px] font-medium text-emerald-700">Compra verificada</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {reviews.length > limit && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 w-full cursor-pointer rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-50"
        >
          {showAll ? 'Ver menos' : `Ver más opiniones (${reviews.length - limit})`}
        </button>
      )}
    </div>
  )
}
