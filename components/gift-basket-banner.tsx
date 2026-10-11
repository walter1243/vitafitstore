import Image from 'next/image'
import { Gift, Sparkles } from 'lucide-react'
import { DEFAULT_GIFT_BANNER, type GiftBannerContent } from '@/lib/site-content-defaults'

// Editorial promo card for the Christmas season — a real lifestyle photo
// (not a stock icon) paired with short, confident copy. Deliberately split
// 50/50 instead of a banner-ad strip, so it reads as a featured moment on
// the page rather than an interruption.
export function GiftBasketBanner({ data }: { data?: GiftBannerContent }) {
  const content = { ...DEFAULT_GIFT_BANNER, ...data }
  return (
    <section className="px-4 py-14 sm:py-16">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="relative h-[320px] sm:h-[420px] lg:h-auto">
            <Image
              src="/cesta-de-presente.jpg"
              alt="Mujer sonriendo al recibir una cesta de regalo de Navidad"
              fill
              className="object-cover object-[center_25%]"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>

          <div
            className="relative flex flex-col justify-center overflow-hidden px-6 py-10 sm:px-12 sm:py-14"
            style={{ background: 'linear-gradient(160deg, #143d2b 0%, #0b2518 100%)' }}
          >
            {/* Single scattered Christmas accent — cropped from the shared
               decoration sheet, kept to one per section so it reads as a
               deliberate touch rather than clutter. */}
            <Image
              src="/decor-gift-box.png"
              alt=""
              width={78}
              height={72}
              className="pointer-events-none absolute -right-3 -top-3 rotate-[14deg] opacity-90 sm:-right-2 sm:-top-2"
            />

            <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#f6c453]"
              style={{ background: 'rgba(246,196,83,0.12)' }}>
              <Sparkles className="h-3.5 w-3.5" /> {content.badgeText}
            </span>

            <h2
              className="max-w-sm text-3xl font-bold leading-tight text-white sm:text-4xl"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {content.heading}
            </h2>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75 sm:text-base">
              {content.description}
            </p>

            <a
              href="#productos"
              className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[#f6c453] px-7 py-3 text-sm font-semibold text-[#143d2b] transition-colors duration-200 hover:bg-[#f3b730] cursor-pointer"
            >
              <Gift className="h-4 w-4" />
              {content.ctaText}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
