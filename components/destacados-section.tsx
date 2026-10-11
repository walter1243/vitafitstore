import { getIcon } from '@/lib/icon-map'
import { DEFAULT_DESTAQUES, type DestaquesContent } from '@/lib/site-content-defaults'

// This content has had a working admin editor (Admin → Editar loja →
// Destacados) since early in the project, described there as "the 4
// differentiator cards right below the products" — but nothing ever
// rendered it on the storefront, so every edit silently went nowhere.
export function DestacadosSection({ data }: { data?: DestaquesContent }) {
  const content = { ...DEFAULT_DESTAQUES, ...data }
  if (!content.features.length) return null

  return (
    <section className="px-4 py-14 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">{content.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
            {content.title} <span className="text-orange-600">{content.highlight}</span>
          </h2>
          <p className="mt-3 text-sm text-slate-500 sm:text-base">{content.subtitle}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {content.features.map((f, idx) => {
            const Icon = getIcon(f.icon)
            return (
              <div
                key={idx}
                className="rounded-2xl border border-stone-200/70 bg-white p-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)]"
              >
                <span className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-orange-50">
                  {f.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.imageUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <Icon className="h-11 w-11 text-orange-600" />
                  )}
                </span>
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
