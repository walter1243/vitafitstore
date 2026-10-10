'use client'

import { useEffect, useState } from 'react'

function getNextChristmas() {
  const now = new Date()
  const year = now.getMonth() === 11 && now.getDate() > 25 ? now.getFullYear() + 1 : now.getFullYear()
  return new Date(year, 11, 25, 0, 0, 0)
}

function getCountdown() {
  const diff = getNextChristmas().getTime() - Date.now()
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  const hours = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24))
  return { days, hours, isPast: diff <= 0 }
}

// A thin, discreet strip — not a full section. Shows only while Christmas
// hasn't passed yet (a real countdown to Dec 25, computed from the
// visitor's own clock) and renders nothing once the date is gone.
export function ChristmasPromo() {
  const [time, setTime] = useState<{ days: number; hours: number; isPast: boolean } | null>(null)

  useEffect(() => {
    setTime(getCountdown())
    const id = setInterval(() => setTime(getCountdown()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!time || time.isPast) return null

  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm"
      style={{ background: 'linear-gradient(90deg, #7a1225, #0f5132)' }}
    >
      <span>🎄 Faltan</span>
      <span className="font-bold tabular-nums">{time.days}d {time.hours}h</span>
      <span>para Navidad</span>
    </div>
  )
}
