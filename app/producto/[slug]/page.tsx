import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { UpsellPopup } from '@/components/upsell-popup'
import { WhatsAppFloating } from '@/components/whatsapp-floating'
import { ProductPageView } from '@/components/product-page-view'
import { getProductById } from '@/lib/get-product'
import { cookies, headers } from 'next/headers'
import { COUNTRY_COOKIE, countrySurcharge, viewerCountry } from '@/lib/country-price'
import { getSiteContent } from '@/lib/site-content'
import { getSectors } from '@/lib/sectors'
import { SectorsProvider } from '@/components/kids/sectors-context'
import { StoreFooter, StoreHeader } from '@/components/sales/store-chrome'
import { getSalesPage, MAIN_STORE, storePath } from '@/lib/sales-pages'

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

  // Produto de outra loja (multi-loja): título com o nome dela, não da Kitoys.
  const store = product.storeSlug && product.storeSlug !== MAIN_STORE ? await getSalesPage(product.storeSlug).catch(() => null) : null
  if (store) {
    return {
      title: { absolute: `${product.name} | ${store.title}` },
      description: product.shortDescription,
      alternates: { canonical: `/producto/${product.id}-${product.slug}` },
      icons: store.logoImage ? { icon: store.logoImage } : undefined,
      openGraph: { title: product.name, siteName: store.title, images: product.mainImage ? [product.mainImage] : undefined },
    }
  }

  return {
    title: `${product.name} | Comprar online`,
    description: product.shortDescription,
    alternates: { canonical: `/producto/${product.id}-${product.slug}` },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const id = parseId(slug)
  // Preco do pais de quem ve (fora da Espanha leva parte do frete).
  const [ck, hd] = await Promise.all([cookies(), headers()])
  const surcharge = await countrySurcharge(viewerCountry(ck.get(COUNTRY_COOKIE)?.value, hd.get('x-vercel-ip-country')))
  const product = id ? await getProductById(id, surcharge) : null

  if (!product) notFound()

  const [content, sectors] = await Promise.all([getSiteContent(), getSectors()])

  // Produto de outra loja (ex.: VICE CITY STORE): cabeçalho, rodapé e "Inicio"
  // dela — quem veio pelo link da loja não cai na Kitoys. Carrinho/checkout iguais.
  const store = product.storeSlug && product.storeSlug !== MAIN_STORE ? await getSalesPage(product.storeSlug).catch(() => null) : null
  if (store) {
    return (
      <SectorsProvider sectors={sectors}>
      <div data-kt-store={store.slug} className="flex min-h-screen flex-col bg-[#FAF8F5]" style={{ ['--hdr-h' as string]: '0px' }}>
        <StoreHeader store={store} />
        <main className="flex-1">
          <ProductPageView product={product} entrega={content.entrega} homeHref={storePath(store.slug)} homeLabel={store.title} />
        </main>
        <StoreFooter store={store} />
        <CartSidebar />
      </div>
      </SectorsProvider>
    )
  }

  return (
    <SectorsProvider sectors={sectors}>
    <div className="flex min-h-screen flex-col bg-[#FAF8F5]">
      <Header />
      <main className="flex-1">
        <ProductPageView product={product} entrega={content.entrega} />
      </main>
      <Footer content={content.rodape} logo={content.cabecalho.logoImage} />
      <WhatsAppFloating />
      <CartSidebar />
      <UpsellPopup />
    </div>
    </SectorsProvider>
  )
}
