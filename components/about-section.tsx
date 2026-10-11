import { getIcon } from '@/lib/icon-map'
import { DEFAULT_ABOUT, type AboutContent } from '@/lib/site-content-defaults'

// Like Destacados and the gift banner, this content had a complete admin
// editor (Admin → Editar loja → Sobre a loja) but nowhere to render — the
// old "Nosotros" page section it used to feed was removed earlier, and
// nothing replaced it. This gives it a real home again.
export function AboutSection({ data }: { data?: AboutContent }) {
  const content = { ...DEFAULT_ABOUT, ...data }

  return (
    <section className="bg-white px-4 py-14 sm:py-16">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
            {content.title} <span className="text-orange-600">{content.highlight}</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">{content.paragraph1}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{content.paragraph2}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
              {content.originBadgeTitle}
            </span>
            <span className="text-xs text-slate-500">{content.originBadgeSubtitle}</span>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-4">
            {content.features.map((f, idx) => {
              const Icon = getIcon(f.icon)
              return (
                <div key={idx} className="rounded-xl border border-stone-200/70 bg-stone-50/60 p-4">
                  <Icon className="h-5 w-5 text-orange-600" />
                  <h3 className="mt-2 text-sm font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{f.desc}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl border border-stone-200/70 bg-stone-50/60 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">{content.ratingValue}</p>
              <p className="text-xs text-slate-500">{content.ratingLabel}</p>
            </div>
            <p className="max-w-[55%] text-right text-xs font-medium italic text-slate-500">"{content.tagline}"</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {content.stats.map((s, idx) => (
              <div key={idx} className="rounded-xl border border-stone-200/70 py-3">
                <p className="text-base font-bold text-slate-900">{s.value}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
