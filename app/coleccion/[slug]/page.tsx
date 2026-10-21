import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { UpsellPopup } from '@/components/upsell-popup'
import { WhatsAppFloating } from '@/components/whatsapp-floating'
import { CollectionCatalog } from '@/components/kids/collection-catalog'
import { CollectionSpotlight } from '@/components/kids/collection-spotlight'
import { SectorsProvider } from '@/components/kids/sectors-context'
import { getSectors } from '@/lib/sectors'
import { enabledCollections } from '@/lib/sectors-shared'
import { getSiteContent } from '@/lib/site-content'
import { KidsHowItsMade } from '@/components/kids/kids-how-its-made'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const collection = enabledCollections(await getSectors()).find((c) => c.slug === slug)
  if (!collection) return { title: 'Colección no encontrada' }
  return {
    title: collection.name,
    description: collection.description || collection.tagline,
    alternates: { canonical: `/coleccion/${collection.slug}` },
  }
}

// Pagina de uma colecao (Admin → Setores e coleções): o destaque de tela
// cheia dela no topo e todos os produtos das categorias vinculadas.
export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params
  const [sectors, content] = await Promise.all([getSectors(), getSiteContent()])
  const collection = enabledCollections(sectors).find((c) => c.slug === slug)
  if (!collection) notFound()

  return (
    <SectorsProvider sectors={sectors}>
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="kids flex-1">
          <CollectionSpotlight slug={collection.slug} first priority hideProducts headingLevel="h1" primaryHref="#productos" primaryLabel="Ver productos" />
          <div id="productos" className="scroll-mt-24">
            <CollectionCatalog slug={collection.slug} />
          </div>
          <KidsHowItsMade />
        </main>
        <Footer content={content.footer} />
        <WhatsAppFloating />
        <CartSidebar />
        <UpsellPopup />
      </div>
    </SectorsProvider>
  )
}
