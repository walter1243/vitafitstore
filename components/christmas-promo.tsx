'use client'

import { useEffect, useState } from 'react'
import { Gift, Snowflake } from 'lucide-react'

function getNextChristmas() {
  const now = new Date()
  const year = now.getMonth() === 11 && now.getDate() > 25 ? now.getFullYear() + 1 : now.getFullYear()
  return new Date(year, 11, 25, 0, 0, 0)
}

function getCountdown() {
  const diff = getNextChristmas().getTime() - Date.now()
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  const hours = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24))
  const minutes = Math.max(0, Math.floor((diff / (1000 * 60)) % 60))
  return { days, hours, minutes }
}

// A real countdown to Dec 25 (computed from the visitor's own clock) plus a
// gift-focused CTA — seasonal promo content, not fabricated urgency.
export function ChristmasPromo() {
  const [time, setTime] = useState(getCountdown())

  useEffect(() => {
    const id = setInterval(() => setTime(getCountdown()), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#7a1225] via-[#9c1c2e] to-[#0f5132] py-14 sm:py-16">
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <Snowflake className="absolute -top-6 left-[8%] h-24 w-24 rotate-12 text-white" />
        <Snowflake className="absolute bottom-0 right-[10%] h-32 w-32 -rotate-12 text-white" />
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <Gift className="h-7 w-7 text-[#f6c453]" />
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
          Llega la Navidad 🎄
        </h2>
        <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">
          Encuentra el regalo perfecto para esta Navidad. Edición especial de temporada con envío cuidado para que llegue a tiempo.
        </p>

        <div className="mt-8 flex items-center gap-3 sm:gap-4">
          {[
            { label: 'días', value: time.days },
            { label: 'horas', value: time.hours },
            { label: 'min', value: time.minutes },
          ].map((unit) => (
            <div
              key={unit.label}
              className="flex min-w-[72px] flex-col items-center rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm sm:min-w-[88px]"
            >
              <span className="text-2xl font-bold text-white sm:text-3xl tabular-nums">{unit.value}</span>
              <span className="text-[11px] uppercase tracking-wide text-white/70">{unit.label}</span>
            </div>
          ))}
        </div>

        <a
          href="#productos"
          className="mt-8 rounded-full bg-[#f6c453] px-8 py-3 text-sm font-semibold text-[#5c1a1a] transition-all duration-300 hover:bg-[#f3b730] hover:shadow-lg hover:shadow-black/20"
        >
          Ver regalos de Navidad
        </a>
      </div>
    </section>
  )
}
