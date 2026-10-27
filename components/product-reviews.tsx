'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, MoreVertical, Star, StarHalf, ThumbsUp } from 'lucide-react'

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
  helpful?: number
}

const BLUE = '#3483FA'

// Bandeira do pais como imagem (o Windows nao desenha emoji de bandeira).
function Flag({ cc }: { cc?: string | null }) {
  if (!cc || !/^[A-Z]{2}$/.test(cc)) return null
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`https://flagcdn.com/w20/${cc.toLowerCase()}.png`} alt={cc} width={16} height={12} className="ml-1 inline-block h-3 w-4 rounded-[2px] align-[-1px] object-cover" loading="lazy" />
}

// "Hace 3 días", "Hace 2 meses", "Hace más de 1 año".
function ago(date: string) {
  const d = new Date(`${date}T12:00:00`)
  const days = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000))
  if (days >= 365) return days >= 730 ? `Hace más de ${Math.floor(days / 365)} años` : 'Hace más de 1 año'
  if (days >= 30) { const m = Math.floor(days / 30); return `Hace ${m} ${m === 1 ? 'mes' : 'meses'}` }
  if (days >= 7) { const w = Math.floor(days / 7); return `Hace ${w} ${w === 1 ? 'semana' : 'semanas'}` }
  if (days >= 1) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`
  return 'Hoy'
}

const fmt = (n: number) => n.toLocaleString('es-ES')

function Stars({ value, size = 16, color = BLUE }: { value: number; size?: number; color?: string }) {
  return (
    <span className="inline-flex" aria-label={`${value.toFixed(1)} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const full = value >= n - 0.25
        const half = !full && value >= n - 0.75
        return half ? (
          <span key={n} className="relative inline-block" style={{ width: size, height: size }}>
            <Star style={{ width: size, height: size, color }} className="absolute inset-0" strokeWidth={1.6} />
            <StarHalf style={{ width: size, height: size, color, fill: color }} className="absolute inset-0" strokeWidth={1.6} />
          </span>
        ) : (
          <Star key={n} style={{ width: size, height: size, color, fill: full ? color : 'transparent' }} strokeWidth={1.6} />
        )
      })}
    </span>
  )
}

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
      <span className="font-semibold text-slate-800">{data.average.toFixed(1)}</span>
      <Stars value={data.average} size={15} />
      <span className="underline-offset-2 hover:underline">({fmt(data.count)})</span>
    </a>
  )
}

// Menu suspenso simples (Ordenar / Calificación).
function Dropdown<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const current = options.find(([v]) => v === value)
  const active = value !== options[0][0]
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm transition-colors ${active ? 'border-[#3483FA] text-[#3483FA]' : 'border-slate-300 text-slate-700 hover:border-slate-400'}`}
      >
        {active ? current?.[1] : label} <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <ul className="absolute left-0 top-full z-20 mt-1 min-w-[190px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg" role="listbox">
          {options.map(([v, l]) => (
            <li key={v}>
              <button
                type="button"
                role="option"
                aria-selected={v === value}
                onClick={() => { onChange(v); setOpen(false) }}
                className={`w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-slate-50 ${v === value ? 'font-semibold text-[#3483FA]' : 'text-slate-700'}`}
              >
                {l}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const VOTED_KEY = 'kitoys_review_votes'
const loadVotes = (): number[] => { try { return JSON.parse(localStorage.getItem(VOTED_KEY) || '[]') } catch { return [] } }
const saveVotes = (v: number[]) => { try { localStorage.setItem(VOTED_KEY, JSON.stringify(v)) } catch {} }

function ReviewItem({ r, voted, onVote }: { r: Review; voted: boolean; onVote: (id: number, on: boolean) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)
  const [menu, setMenu] = useState(false)
  const [reported, setReported] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    const el = textRef.current
    if (el) setClamped(el.scrollHeight > el.clientHeight + 2)
  }, [r.comment])

  async function report() {
    setMenu(false)
    setReported(true)
    fetch('/api/reviews/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, action: 'report' }) }).catch(() => {})
  }

  return (
    <article className="border-b border-slate-100 py-6 first:pt-2 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <Stars value={r.rating} size={15} />
        <span className="text-xs text-slate-500">{ago(r.date)}</span>
      </div>
      {r.comment && (
        <>
          <p ref={textRef} className={`mt-3 text-base leading-relaxed text-slate-800 ${expanded ? '' : 'line-clamp-3'}`}>{r.comment}</p>
          {(clamped || expanded) && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 cursor-pointer text-sm font-semibold" style={{ color: BLUE }}>
              {expanded ? 'Ver menos' : 'Ver más'}
            </button>
          )}
        </>
      )}
      {r.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.photoUrl} alt={`Foto de ${r.customerName}`} className="mt-3 h-24 w-24 rounded-xl object-cover" />
      )}
      <p className="mt-2 text-xs text-slate-500">
        {r.customerName}<Flag cc={r.country} /> ·{' '}
        {r.source === 'manual'
          ? <>Opinión recibida {r.sourceNote ? `por ${r.sourceNote}` : 'fuera de la web'}</>
          : <span className="font-medium text-emerald-700">Compra verificada</span>}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onVote(r.id, !voted)}
          aria-pressed={voted}
          className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm transition-colors ${voted ? 'border-[#3483FA] bg-[#3483FA]/10 text-[#3483FA]' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}
        >
          Útil <ThumbsUp className="h-4 w-4" aria-hidden="true" style={voted ? { fill: BLUE } : undefined} /> {fmt(r.helpful ?? 0)}
        </button>
        <div className="relative">
          <button type="button" onClick={() => setMenu((m) => !m)} aria-label="Más opciones" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <MoreVertical className="h-5 w-5" />
          </button>
          {menu && (
            <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <button type="button" onClick={report} disabled={reported} className="w-full cursor-pointer px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:text-slate-400">
                {reported ? 'Opinión reportada' : 'Reportar opinión'}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

type Sort = 'recent' | 'useful' | 'best' | 'worst'
type Filter = 'all' | '5' | '4' | '3' | '2' | '1'

// Opinioes do produto no estilo marketplace: media grande + barras por
// estrela, Ordenar / Calificación, lista com "Ver más", "Útil" e ⋮.
// `half`: celular (metade do numero do Admin → Avaliações).
export function ProductReviews({ productId, half = false, className = 'mt-12 max-w-3xl', anchor = true }: { productId: number; half?: boolean; className?: string; anchor?: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [average, setAverage] = useState(0)
  const [count, setCount] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [showAll, setShowAll] = useState(false)
  const [sort, setSort] = useState<Sort>('recent')
  const [filter, setFilter] = useState<Filter>('all')
  const [votes, setVotes] = useState<number[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setVotes(loadVotes())
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
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [productId])

  const dist = useMemo(() => [5, 4, 3, 2, 1].map((n) => reviews.filter((r) => r.rating === n).length), [reviews])
  const list = useMemo(() => {
    const l = filter === 'all' ? [...reviews] : reviews.filter((r) => r.rating === Number(filter))
    if (sort === 'useful') l.sort((a, b) => (b.helpful ?? 0) - (a.helpful ?? 0))
    else if (sort === 'best') l.sort((a, b) => b.rating - a.rating)
    else if (sort === 'worst') l.sort((a, b) => a.rating - b.rating)
    else l.sort((a, b) => b.date.localeCompare(a.date))
    return l
  }, [reviews, sort, filter])

  async function vote(id: number, on: boolean) {
    const next = on ? [...votes, id] : votes.filter((v) => v !== id)
    setVotes(next); saveVotes(next)
    setReviews((rs) => rs.map((r) => r.id === id ? { ...r, helpful: Math.max(0, (r.helpful ?? 0) + (on ? 1 : -1)) } : r))
    fetch('/api/reviews/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: on ? 'helpful' : 'unhelpful' }) }).catch(() => {})
  }


  // Sem opinioes ainda: a secao aparece com um aviso (nada de lista vazia).
  if (count === 0) {
    if (!loaded) return null
    return (
      <section id={anchor ? 'opiniones' : undefined} data-opiniones className={`${className} scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6`}>
        <h2 className="text-xl font-normal text-slate-900 sm:text-2xl" style={{ fontFamily: 'inherit' }}>Opiniones del producto</h2>
        <div className="mt-4 flex items-center gap-3">
          <Stars value={0} size={20} />
          <span className="text-sm text-slate-500">Este producto aún no tiene opiniones.</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">Después de tu compra te enviaremos un enlace para que cuentes qué te pareció.</p>
      </section>
    )
  }

  const limit = half ? Math.max(1, Math.ceil(perPage / 2)) : perPage
  const visible = showAll ? list : list.slice(0, limit)
  const withText = reviews.filter((r) => r.comment).length
  const max = Math.max(1, ...dist)

  return (
    <section id={anchor ? 'opiniones' : undefined} data-opiniones className={`${className} scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6`}>
      <h2 className="text-xl font-normal text-slate-900 sm:text-2xl" style={{ fontFamily: 'inherit' }}>Opiniones del producto</h2>

      {/* Resumo: media grande + barras por estrela */}
      <div className="mt-5 flex flex-wrap items-start gap-x-8 gap-y-5">
        <div className="flex items-center gap-3">
          <span className="text-5xl font-normal leading-none" style={{ color: BLUE }}>{average.toFixed(1)}</span>
          <span>
            <Stars value={average} size={20} />
            <span className="mt-1 block text-sm text-slate-500">{fmt(count)} {count === 1 ? 'valoración' : 'valoraciones'}</span>
          </span>
        </div>
        <ul className="min-w-[220px] flex-1 space-y-1.5" aria-label="Distribución de valoraciones">
          {[5, 4, 3, 2, 1].map((n, i) => (
            <li key={n}>
              <button
                type="button"
                onClick={() => { setFilter(filter === String(n) ? 'all' : (String(n) as Filter)); setShowAll(false) }}
                className="flex w-full cursor-pointer items-center gap-3"
                aria-label={`${n} estrellas: ${dist[i]}`}
              >
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <span className="block h-full rounded-full bg-slate-500" style={{ width: `${(dist[i] / max) * 100}%` }} />
                </span>
                <span className={`flex w-8 items-center gap-0.5 text-sm ${filter === String(n) ? 'font-semibold text-[#3483FA]' : 'text-slate-500'}`}>
                  {n} <Star className="h-3 w-3 fill-slate-300 text-slate-300" aria-hidden="true" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Ordenar / Calificación */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Dropdown<Sort> label="Ordenar" value={sort} onChange={(v) => { setSort(v); setShowAll(false) }} options={[['recent', 'Más recientes'], ['useful', 'Más útiles'], ['best', 'Mejor calificación'], ['worst', 'Peor calificación']]} />
        <Dropdown<Filter> label="Calificación" value={filter} onChange={(v) => { setFilter(v); setShowAll(false) }} options={[['all', 'Todas'], ['5', '5 estrellas'], ['4', '4 estrellas'], ['3', '3 estrellas'], ['2', '2 estrellas'], ['1', '1 estrella']]} />
      </div>

      <h3 className="mt-6 text-lg font-semibold text-slate-900" style={{ fontFamily: 'inherit' }}>Opiniones</h3>
      <p className="text-xs text-slate-500">{fmt(withText)} {withText === 1 ? 'comentario' : 'comentarios'}</p>

      <div className="mt-2">
        {visible.map((r) => <ReviewItem key={r.id} r={r} voted={votes.includes(r.id)} onVote={vote} />)}
        {list.length === 0 && <p className="py-6 text-sm text-slate-500">No hay opiniones con esta calificación.</p>}
      </div>

      {list.length > limit && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 cursor-pointer text-sm font-semibold"
          style={{ color: BLUE }}
        >
          {showAll ? 'Ver menos opiniones' : `Ver más opiniones (${list.length - limit})`}
        </button>
      )}
    </section>
  )
}
