"use client"

import { Heart } from 'lucide-react'
import { getIcon } from '@/lib/icon-map'
import { ScrollReveal } from '@/components/scroll-reveal'
import { DEFAULT_ABOUT, type AboutContent } from '@/lib/site-content-defaults'

export function AboutSection({ data }: { data?: AboutContent }) {
  const content = data?.features?.length ? data : DEFAULT_ABOUT

  return (
    <section id="nosotros" className="relative overflow-hidden border-t border-white/10 bg-[#060f1e] py-16">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(14,165,233,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Content */}
          <ScrollReveal>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              {content.title}{' '}
              <span className="text-sky-400">{content.highlight}</span>?
            </h2>
            <p className="mb-6 text-white/60">
              {content.paragraph1}
            </p>
            <p className="mb-8 text-white/60">
              {content.paragraph2}
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              {content.features.map((feature, index) => {
                const Icon = getIcon(feature.icon)
                return (
                  <div key={index} className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10">
                      <Icon className="h-6 w-6 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-white">{feature.title}</h3>
                      <p className="text-sm text-white/55">{feature.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollReveal>

          {/* Visual */}
          <ScrollReveal delay={120}>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-cyan-500/5 p-6 sm:p-8">
              <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-10 shadow-xl backdrop-blur-sm">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sky-500">
                  {(() => { const Icon = getIcon('flame'); return <Icon className="h-8 w-8 text-white" /> })()}
                </div>
                <p className="mb-6 text-center text-white/60">
                  {content.tagline}
                </p>
                <div className="grid w-full grid-cols-3 gap-4 text-center">
                  {content.stats.map((stat) => (
                    <div key={stat.label}>
                      <p className="text-2xl font-bold text-sky-400">{stat.value}</p>
                      <p className="text-xs text-white/50">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges — same card, normal flow (no absolute positioning to avoid layout glitches) */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="glass-frost flex items-center gap-2 rounded-xl p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500/15">
                    <Heart className="h-4 w-4 text-sky-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{content.ratingValue}</p>
                    <p className="truncate text-xs text-white/50">{content.ratingLabel}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center rounded-xl bg-sky-500 p-3 text-center text-white">
                  <div>
                    <p className="text-sm font-bold leading-tight">{content.originBadgeTitle}</p>
                    <p className="text-xs leading-tight opacity-80">{content.originBadgeSubtitle}</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
