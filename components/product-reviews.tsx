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
}

const PAGE_SIZE = 5

export function ProductReviews({ productId }: { productId: number }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [average, setAverage] = useState(0)
  const [count, setCount] = useState(0)
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
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [productId])

  if (count === 0) return null

  const visible = showAll ? reviews : reviews.slice(0, PAGE_SIZE)

  return (
    <div className="mt-12 max-w-3xl">
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

      <div className={`space-y-4 ${showAll && reviews.length > PAGE_SIZE ? 'max-h-[600px] overflow-y-auto pr-2' : ''}`}>
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
                <p className="mt-1 text-sm font-semibold text-slate-900">{r.customerName}</p>
                {r.comment && <p className="mt-1 text-sm leading-relaxed text-slate-600">{r.comment}</p>}
                <p className="mt-1.5 text-[11px] font-medium text-emerald-700">Compra verificada</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!showAll && reviews.length > PAGE_SIZE && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 text-sm font-semibold text-orange-700 hover:text-orange-800"
        >
          Ver las {reviews.length} opiniones
        </button>
      )}
    </div>
  )
}
