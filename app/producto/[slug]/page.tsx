import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { UpsellPopup } from '@/components/upsell-popup'
import { WhatsAppFloating } from '@/components/whatsapp-floating'
import { ProductPageView } from '@/components/product-page-view'
import { getProductById } from '@/lib/get-product'
import { getSiteContent } from '@/lib/site-content'

export const dynamic = 'force-dynamic'

function parseId(slug: string): number | null {
  const match = slug.match(/^(\d+)/)
  return match ? Number(match[1]) : null
}

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const id = parseId(slug)
  const product = id ? await getProductById(id) : null
  if (!product) return { title: 'Producto no encontrado' }

  return {
    title: `${product.name} | Comprar online`,
    description: product.shortDescription,
    alternates: { canonical: `/producto/${product.id}-${product.slug}` },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const id = parseId(slug)
  const product = id ? await getProductById(id) : null

  if (!product) notFound()

  const content = await getSiteContent()

  return (
    <div className="flex min-h-screen flex-col bg-[#0f1117]">
      <Header />
      <main className="flex-1">
        <ProductPageView product={product} />
      </main>
      <Footer content={content.footer} />
      <WhatsAppFloating />
      <CartSidebar />
      <UpsellPopup />
    </div>
  )
}
