'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import HeroVideo from '@/components/hero-video'
import { TrustBadges } from '@/components/trust-badges'
import ProductCarousels from '@/components/product-carousels'
import PinScrollSection from '@/components/pin-scroll-section'
import { AboutSection } from '@/components/about-section'
import { Newsletter } from '@/components/newsletter'
import { Footer } from '@/components/footer'
import type { SiteContent } from '@/lib/site-content-defaults'

// Preview-only surface: the admin panel posts unpublished draft content into
// this window via postMessage so an editor can see changes before publishing.
// Never linked publicly and excluded from robots — see app/robots.ts.

export default function PreviewPage() {
  const [content, setContent] = useState<SiteContent | null>(null)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type !== 'STORE_PREVIEW_CONTENT') return
      setContent(e.data.content as SiteContent)
    }
    window.addEventListener('message', onMessage)
    // Tell the parent we're ready to receive content (in case it already loaded).
    window.parent?.postMessage({ type: 'STORE_PREVIEW_READY' }, '*')
    return () => window.removeEventListener('message', onMessage)
  }, [])

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060f1e] text-sm text-white/50">
        Carregando prévia...
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-[100] bg-amber-500 py-1.5 text-center text-xs font-semibold text-black">
        Prévia — estas alterações ainda não foram publicadas
      </div>
      <Header />
      <main className="flex-1">
        <HeroVideo content={content.hero} />
        <TrustBadges data={content.trustBadges} />
        <section id="productos">
          <ProductCarousels />
        </section>
        <PinScrollSection data={content.destaques} />
        <AboutSection data={content.about} />
        <Newsletter data={content.newsletter} />
      </main>
      <Footer content={content.footer} />
    </div>
  )
}
