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
    <div className="kids flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden pt-36 sm:pt-40" style={{ background: collection.color.soft }}>
          <div className="kids-dots pointer-events-none absolute inset-0" />
          <div
            className="pointer-events-none absolute -right-16 -top-10 h-72 w-72 rounded-full opacity-30 blur-2xl"
            style={{ background: collection.color.main }}
          />
          <div className="relative mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
            <nav aria-label="Ruta" className="mb-6 text-sm font-bold text-slate-600">
              <Link href="/" className="hover:underline">Inicio</Link>
              <span className="mx-2">›</span>
              <span style={{ color: collection.color.deep }}>{collection.shortName}</span>
            </nav>
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <span
                className="animate-kids-bob flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] text-white shadow-[0_6px_0_rgba(30,42,74,0.15)]"
                style={{ background: collection.color.deep }}
              >
                <Icon className="h-12 w-12" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-extrabold uppercase tracking-widest" style={{ color: collection.color.deep }}>
                  {collection.tagline}
                </p>
                <h1 className="mt-1 text-4xl font-bold leading-tight text-[#1e2a4a] sm:text-5xl">{collection.name}</h1>
                <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-700">{collection.description}</p>
              </div>
            </div>
          </div>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="relative block h-10 w-full sm:h-14" aria-hidden="true">
            <path d="M0 30 C 240 70 480 -10 720 30 S 1200 70 1440 30 V60 H0z" fill="#ffffff" />
          </svg>
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
