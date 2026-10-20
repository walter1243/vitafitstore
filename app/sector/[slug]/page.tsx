import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { UpsellPopup } from '@/components/upsell-popup'
import { WhatsAppFloating } from '@/components/whatsapp-floating'
import { CollectionSpotlight } from '@/components/kids/collection-spotlight'
import { SectorBand } from '@/components/kids/sector-band'
import { WorldShowcase } from '@/components/themes/world-showcase'
import { SectorsProvider } from '@/components/kids/sectors-context'
import { getSectors } from '@/lib/sectors'
import { getSiteContent } from '@/lib/site-content'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const sector = (await getSectors()).find((s) => s.slug === slug)
  if (!sector) return { title: 'Sección no encontrada' }
  return {
    title: sector.name,
    description: sector.tagline,
    alternates: { canonical: `/sector/${sector.slug}` },
  }
}

// Pagina de um setor: a faixa de abertura dele e um destaque de tela cheia
// por colecao do setor, na ordem do Admin → Setores e coleções.
export default async function SectorPage({ params }: PageProps) {
  const { slug } = await params
  const [sectors, content] = await Promise.all([getSectors(), getSiteContent()])
  const sector = sectors.find((s) => s.slug === slug)
  if (!sector) notFound()

  return (
    <SectorsProvider sectors={sectors}>
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="kids flex-1">
          <SectorBand sector={sector} first asTitle />
          {sector.collections.map((c, i) => (
            <CollectionSpotlight key={c.slug} slug={c.slug} priority={i === 0} />
          ))}
          <WorldShowcase style={sector.style} />
          {sector.collections.length === 0 && (
            <p className="px-4 pb-24 text-center text-lg text-[#565a78]">Muy pronto habrá colecciones en esta sección.</p>
          )}
        </main>
        <Footer content={content.footer} />
        <WhatsAppFloating />
        <CartSidebar />
        <UpsellPopup />
      </div>
    </SectorsProvider>
  )
}
