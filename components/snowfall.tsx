'use client'

import { useEffect, useState } from 'react'

type Flake = {
  left: number
  size: number
  duration: number
  delay: number
  drift: number
  opacity: number
}

// Purely decorative Christmas-season snow overlay. Flakes are generated
// client-side only (after mount) — randomizing during SSR would produce a
// different layout than the client's first paint and trigger a hydration
// mismatch, since this is non-interactive chrome with no real data behind it.
export function Snowfall({ count = 40 }: { count?: number }) {
  const [flakes, setFlakes] = useState<Flake[]>([])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    setFlakes(
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        size: 4 + Math.random() * 7,
        duration: 9 + Math.random() * 10,
        delay: -Math.random() * 18,
        drift: 20 + Math.random() * 40,
        opacity: 0.35 + Math.random() * 0.5,
      }))
    )
  }, [count])

  if (!flakes.length) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {flakes.map((f, i) => (
        <span
          key={i}
          className="absolute top-[-5%] block rounded-full bg-white"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            filter: 'blur(0.3px)',
            boxShadow: '0 0 6px rgba(255,255,255,0.6)',
            animation: `snow-fall ${f.duration}s linear ${f.delay}s infinite`,
            // @ts-expect-error -- custom property read by the keyframes below
            '--drift': `${f.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
