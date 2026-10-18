import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { UpsellPopup } from '@/components/upsell-popup'
import { WhatsAppFloating } from '@/components/whatsapp-floating'
import { CollectionCatalog } from '@/components/kids/collection-catalog'
import { Cloud, Cube, Wave } from '@/components/kids/kid-shapes'
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
        <section className="kid-confetti relative overflow-hidden pt-36 sm:pt-40" style={{ backgroundColor: collection.color.main }}>
          <Cloud className="pointer-events-none absolute -left-8 top-32 w-40 opacity-30" />
          <Cube top="#FFE08A" left="#FFC93C" right="#E0A800" className="animate-kid-float pointer-events-none absolute right-[6%] top-36 hidden w-28 md:block" />
          <div className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
            <nav aria-label="Ruta" className="mb-5 font-kids text-lg font-bold text-white/90">
              <Link href="/" className="hover:underline">Inicio</Link>
              <span className="mx-2">›</span>
              <span>{collection.shortName}</span>
            </nav>
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] border-4 border-[#1f2340] bg-white">
                <Icon className="h-12 w-12" style={{ color: collection.color.main }} aria-hidden="true" />
              </span>
              <div>
                <p className="font-kids text-xl font-bold text-white">{collection.tagline}</p>
                <h1 className="text-5xl font-extrabold text-white sm:text-6xl" style={{ textShadow: '0 4px 0 rgba(31,35,64,0.35)' }}>
                  {collection.name}
                </h1>
                <p className="mt-3 max-w-2xl text-lg font-semibold leading-relaxed text-white">{collection.description}</p>
              </div>
            </div>
          </div>
          <Wave color="#ffffff" />
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
