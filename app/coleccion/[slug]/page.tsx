import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { UpsellPopup } from '@/components/upsell-popup'
import { WhatsAppFloating } from '@/components/whatsapp-floating'
import { CollectionCatalog } from '@/components/kids/collection-catalog'
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
  const Icon = collection.icon

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="kids flex-1">
        <section className="px-4 pt-32 sm:px-6 sm:pt-36 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-[32px] px-6 py-10 sm:px-10 sm:py-12" style={{ background: collection.color.soft }}>
            <nav aria-label="Ruta" className="mb-6 text-sm font-semibold text-[var(--k-muted)]">
              <Link href="/" className="hover:underline">Inicio</Link>
              <span className="mx-2">/</span>
              <span className="text-[var(--k-ink)]">{collection.shortName}</span>
            </nav>
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white">
                <Icon className="h-10 w-10" style={{ color: collection.color.main }} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-4xl font-bold text-[var(--k-ink)] sm:text-5xl">{collection.name}</h1>
                <p className="mt-2 max-w-2xl text-lg leading-relaxed text-[var(--k-muted)]">{collection.description}</p>
              </div>
            </div>
          </div>
        </section>

        <CollectionCatalog slug={collection.slug} />
      </main>
      <Footer content={content.footer} />
      <WhatsAppFloating />
      <CartSidebar />
      <UpsellPopup />
    </div>
  )
}
