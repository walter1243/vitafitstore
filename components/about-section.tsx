"use client"

import { MessageCircle } from 'lucide-react'
import { getIcon } from '@/lib/icon-map'
import { ScrollReveal } from '@/components/scroll-reveal'
import { DEFAULT_ABOUT, type AboutContent } from '@/lib/site-content-defaults'

export function AboutSection({ data }: { data?: AboutContent }) {
  const content = data?.features?.length ? data : DEFAULT_ABOUT

  return (
    <section id="nosotros" className="relative overflow-hidden bg-white py-16">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Content */}
          <ScrollReveal>
            <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              {content.title}{' '}
              <span className="text-orange-700">{content.highlight}</span>?
            </h2>
            <p className="mb-6 text-slate-600">
              {content.paragraph1}
            </p>
            <p className="mb-8 text-slate-600">
              {content.paragraph2}
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              {content.features.map((feature, index) => {
                const Icon = getIcon(feature.icon)
                return (
                  <div key={index} className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-orange-50">
                      <Icon className="h-6 w-6 text-orange-700" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-slate-900">{feature.title}</h3>
                      <p className="text-sm text-slate-500">{feature.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollReveal>

          {/* Visual */}
          <ScrollReveal delay={120}>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-orange-50 to-amber-50/40 p-6 sm:p-8">
              <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-10 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-700">
                  {(() => { const Icon = getIcon('flame'); return <Icon className="h-8 w-8 text-white" /> })()}
                </div>
                <p className="mb-6 text-center text-slate-600">
                  {content.tagline}
                </p>
                <div className="grid w-full grid-cols-3 gap-4 text-center">
                  {content.stats.map((stat) => (
                    <div key={stat.label}>
                      <p className="text-xl font-bold text-orange-700">{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges — same card, normal flow (no absolute positioning to avoid layout glitches) */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50">
                    <MessageCircle className="h-4 w-4 text-orange-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{content.ratingValue}</p>
                    <p className="truncate text-xs text-slate-500">{content.ratingLabel}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center rounded-xl bg-orange-700 p-3 text-center text-white">
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

      {/* Section transition — wave divider into the next section */}
      <svg
        className="absolute bottom-0 left-0 w-full text-[#FAF8F5]"
        style={{ height: '60px' }}
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path fill="currentColor" d="M0,24 C240,50 480,10 720,32 C960,54 1200,4 1440,28 L1440,60 L0,60 Z" />
      </svg>
    </section>
  )
}
