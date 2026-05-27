import type { ReactNode } from 'react'
import { Header } from '@/components/header'
import HeroVideo from '../components/hero-video'
import { TrustBadges } from '@/components/trust-badges'
import ProductCarousels from '../components/product-carousels'
import PinScrollSection from '../components/pin-scroll-section'
import { Newsletter } from '@/components/newsletter'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { UpsellPopup } from '@/components/upsell-popup'
import { sql } from '@/lib/db'

type HomeBlock = {
  key: 'hero' | 'trust' | 'products' | 'pin' | 'newsletter'
  label: string
  position: number
  enabled: boolean
}

const DEFAULT_BLOCKS: HomeBlock[] = [
  { key: 'hero', label: 'Hero Vídeo', position: 1, enabled: true },
  { key: 'trust', label: 'Selos de Confiança', position: 2, enabled: true },
  { key: 'products', label: 'Produtos', position: 3, enabled: true },
  { key: 'pin', label: 'Sessão Pin', position: 4, enabled: true },
  { key: 'newsletter', label: 'Newsletter', position: 5, enabled: true },
]

async function getHomeBlocks(): Promise<HomeBlock[]> {
  try {
    const rows = await sql`
      SELECT block_key AS key, label, position, enabled
      FROM home_blocks
      ORDER BY position ASC
    `
    if (!rows?.length) return DEFAULT_BLOCKS
    return rows as HomeBlock[]
  } catch {
    return DEFAULT_BLOCKS
  }
}

export default async function HomePage() {
  const blocks = await getHomeBlocks()

  const map: Record<HomeBlock['key'], ReactNode> = {
    hero: <HeroVideo />,
    trust: <TrustBadges />,
    products: (
      <section id="productos">
        <ProductCarousels />
      </section>
    ),
    pin: <PinScrollSection />,
    newsletter: <Newsletter />,
  }

  const visibleBlocks = blocks.filter(b => b.enabled)

  return (
    <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {visibleBlocks.map(block => (
            <div key={block.key}>{map[block.key]}</div>
          ))}
        </main>
        <Footer />
        <CartSidebar />
        <UpsellPopup />
    </div>
  )
}
