'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { type DbProduct, normalizeCategory, slugifyCategory, NO_IMAGE_PLACEHOLDER } from '@/lib/store-product'

gsap.registerPlugin(ScrollTrigger)

type CategoryMeta = {
  id: number
  name: string
  slug: string
  enabled?: boolean
  position?: number
}

type Spotlight = {
  key: string
  name: string
  anchorId: string
  count: number
  image: string
}

function toAnchor(raw: string) {
  const slug = slugifyCategory(raw)
  if (slug === 'salud') return '#salud'
  if (slug === 'fitness') return '#fitness'
  return `#cat-${slug}`
}

// Apple-style full-bleed spotlight, one section per real product category —
// see .claude/skills/apple-style-showcase for the pattern this follows.
// Deliberately built from live category + product data (name, first product
// photo, real product count) instead of fabricated marketing copy per card.
export function CategorySpotlight() {
  const [spotlights, setSpotlights] = useState<Spotlight[]>([])
  const sectionRefs = useRef<Array<HTMLElement | null>>([])

  useEffect(() => {
    let cancelled = false

    Promise.all([
      fetch('/api/categories', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
      fetch('/api/products', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
    ]).then(([cats, products]: [CategoryMeta[], DbProduct[]]) => {
      if (cancelled || !Array.isArray(cats) || !Array.isArray(products)) return

      const byCategory = new Map<string, DbProduct[]>()
      for (const p of products) {
        const key = normalizeCategory(p.category)
        if (!byCategory.has(key)) byCategory.set(key, [])
        byCategory.get(key)!.push(p)
      }

      const result: Spotlight[] = []
      for (const cat of cats) {
        if (cat.enabled === false) continue
        const key = normalizeCategory(cat.name)
        const items = byCategory.get(key) ?? []
        if (!items.length) continue
        const withImage = items.find((p) => p.image) ?? items[0]
        result.push({
          key,
          name: cat.name,
          anchorId: toAnchor(cat.slug || cat.name),
          count: items.length,
          image: withImage.image || NO_IMAGE_PLACEHOLDER,
        })
      }

      setSpotlights(result)
    }).catch(() => {})

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const sections = sectionRefs.current.filter(Boolean) as HTMLElement[]
    if (!sections.length) return
    const ctx = gsap.context(() => {
      sections.forEach((el) => {
        const content = el.querySelector('[data-spotlight-content]')
        if (!content) return
        gsap.set(content, { opacity: 0, y: 40 })
        ScrollTrigger.create({
          trigger: el,
          start: 'top 75%',
          once: true,
          onEnter: () => gsap.to(content, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }),
        })
      })
    })
    return () => ctx.revert()
  }, [spotlights])

  if (!spotlights.length) return null

  return (
    <div>
      {spotlights.map((s, idx) => {
        const dark = idx % 2 === 0
        return (
          <section
            key={s.key}
            ref={(el) => { sectionRefs.current[idx] = el }}
            className="relative flex min-h-[80vh] w-full items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0">
              <Image src={s.image} alt={s.name} fill priority={idx === 0} className="object-cover" />
              <div
                className="absolute inset-0"
                style={{
                  background: dark
                    ? 'linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.75) 100%)'
                    : 'linear-gradient(180deg, rgba(250,248,245,0.90) 0%, rgba(250,248,245,0.96) 100%)',
                }}
              />
            </div>

            <div
              data-spotlight-content
              className="relative z-10 flex flex-col items-center px-4 py-20 text-center"
            >
              <h2
                className={`text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl ${dark ? 'text-white' : 'text-slate-900'}`}
              >
                {s.name}
              </h2>
              <p className={`mt-4 text-sm sm:text-base ${dark ? 'text-white/70' : 'text-slate-600'}`}>
                {s.count} {s.count === 1 ? 'producto disponible' : 'productos disponibles'}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={s.anchorId}
                  className={`flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
                    dark ? 'bg-white text-slate-900 hover:bg-white/90' : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Ver productos
                </Link>
                <Link
                  href="#productos"
                  className={`rounded-full border px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
                    dark
                      ? 'border-white/40 text-white hover:bg-white/10'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Todo el catálogo
                </Link>
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
