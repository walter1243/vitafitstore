"use client"

import { getIcon } from '@/lib/icon-map'
import { ScrollReveal } from '@/components/scroll-reveal'
import { DEFAULT_TRUST_BADGES, type TrustBadgesContent } from '@/lib/site-content-defaults'

export function TrustBadges({ data }: { data?: TrustBadgesContent }) {
  const badges = data?.badges?.length ? data.badges : DEFAULT_TRUST_BADGES.badges

  return (
    <section
      className="relative py-6 border-b border-white/8"
      style={{ background: '#060f1e' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {badges.map((badge, i) => {
            const Icon = getIcon(badge.icon)
            return (
              <ScrollReveal key={i} delay={i * 80}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20">
                    <Icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{badge.title}</p>
                    <p className="text-xs text-white/45">{badge.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
