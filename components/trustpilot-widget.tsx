'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    Trustpilot?: { loadFromElement: (el: HTMLElement, force?: boolean) => void }
  }
}

// Renders nothing unless a real Trustpilot Business Unit ID is configured
// in the admin (Editar loja > Confiança e Avaliações) — we don't fabricate
// social proof, so no ID means no badge at all.
export function TrustpilotWidget({ templateId = '5419b6ffb0d04a076446a9af' }: { templateId?: string }) {
  const [businessId, setBusinessId] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/store-settings', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        setBusinessId(String(data?.trustpilotBusinessId || '').trim())
      } catch {
        // no widget if settings can't be read
      }
    })()
  }, [])

  useEffect(() => {
    if (businessId && ref.current && window.Trustpilot) {
      window.Trustpilot.loadFromElement(ref.current, true)
    }
  }, [businessId])

  if (!businessId) return null

  const reviewHref = typeof window !== 'undefined'
    ? `https://www.trustpilot.com/review/${window.location.hostname}`
    : 'https://www.trustpilot.com'

  return (
    <>
      <Script
        src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="afterInteractive"
        onLoad={() => { if (ref.current) window.Trustpilot?.loadFromElement(ref.current, true) }}
      />
      <div
        ref={ref}
        className="trustpilot-widget"
        data-locale="es-ES"
        data-template-id={templateId}
        data-businessunit-id={businessId}
        data-style-height="24px"
        data-style-width="100%"
        data-theme="dark"
      >
        <a href={reviewHref} target="_blank" rel="noopener noreferrer">Trustpilot</a>
      </div>
    </>
  )
}
