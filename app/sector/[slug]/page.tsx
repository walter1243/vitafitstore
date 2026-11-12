import type { Metadata } from 'next'
import { ProductLayoutProvider } from '@/components/product-layout'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { UpsellPopup } from '@/components/upsell-popup'
import { WhatsAppFloating } from '@/components/whatsapp-floating'
import { CollectionSpotlight } from '@/components/kids/collection-spotlight'
import { SectorBand } from '@/components/kids/sector-band'
import { SectorsProvider } from '@/components/kids/sectors-context'
import { getSectors } from '@/lib/sectors'
import { collectionForProduct, enabledCollections } from '@/lib/sectors-shared'
import { getStoreProductsServer } from '@/lib/products-db'
import { toStoreProduct } from '@/lib/store-product'
import { cookies, headers } from 'next/headers'
import { COUNTRY_COOKIE, countrySurcharge, viewerCountry } from '@/lib/country-price'
import type { Product } from '@/lib/products'
import { getSiteContent } from '@/lib/site-content'
import { KidsHowItsMade } from '@/components/kids/kids-how-its-made'

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

  // Só as coleções que têm produto: coleção vazia some e volta sozinha quando
  // ganhar um produto (Admin → Produtos). Os produtos já vêm no HTML.
  const [ck, hd] = await Promise.all([cookies(), headers()])
  const surcharge = await countrySurcharge(viewerCountry(ck.get(COUNTRY_COOKIE)?.value, hd.get('x-vercel-ip-country'))).catch(() => 0)
  const all = await getStoreProductsServer(surcharge)
  const cols = enabledCollections(sectors)
  const byCol = new Map<string, Product[]>()
  for (const p of all) {
    const c = collectionForProduct(cols, p)
    if (c) byCol.set(c.slug, [...(byCol.get(c.slug) ?? []), toStoreProduct(p)])
  }
  const shown = sector.collections.filter((c) => (byCol.get(c.slug)?.length ?? 0) > 0)

  return (
    <SectorsProvider sectors={sectors}>
    <ProductLayoutProvider layout={content.secoes.layout}>
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="kids flex-1">
          <SectorBand sector={sector} first asTitle />
          {shown.map((c, i) => (
            <CollectionSpotlight key={c.slug} slug={c.slug} products={byCol.get(c.slug)} priority={i === 0} />
          ))}
          {shown.length === 0 && (
            <p className="px-4 pb-24 text-center text-lg text-[#565a78]">Muy pronto habrá colecciones en esta sección.</p>
          )}
          <KidsHowItsMade />
        </main>
        <Footer content={content.rodape} logo={content.cabecalho.logoImage} />
        <WhatsAppFloating />
        <CartSidebar />
        <UpsellPopup />
      </div>
    </ProductLayoutProvider>
    </SectorsProvider>
  )
}
