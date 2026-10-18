import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { UpsellPopup } from '@/components/upsell-popup'
import { WhatsAppFloating } from '@/components/whatsapp-floating'
import { CollectionCatalog } from '@/components/kids/collection-catalog'
import { CollectionSpotlight } from '@/components/kids/collection-spotlight'
import { getCollection } from '@/lib/collections'
import { getSiteContent } from '@/lib/site-content'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const collection = getCollection(slug)
  if (!collection) return { title: 'Colección no encontrada' }
  return {
    title: `${collection.name} para niños`,
    description: collection.description,
    alternates: { canonical: `/coleccion/${collection.slug}` },
  }
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params
  const collection = getCollection(slug)
  if (!collection) notFound()

  const content = await getSiteContent()

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="kids flex-1">
        <CollectionSpotlight slug={collection.slug} first priority headingLevel="h1" primaryHref="#productos" primaryLabel="Ver productos" />

        <div id="productos" className="scroll-mt-24">
        <CollectionCatalog slug={collection.slug} />
        </div>
      </main>
      <Footer content={content.footer} />
      <WhatsAppFloating />
      <CartSidebar />
      <UpsellPopup />
    </div>
  )
}
