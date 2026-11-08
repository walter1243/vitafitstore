import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { UpsellPopup } from '@/components/upsell-popup'
import { WhatsAppFloating } from '@/components/whatsapp-floating'
import { AppleHome } from '@/components/apple-home'
import { MobileTabBar } from '@/components/mobile-tab-bar'
import { getSiteContent } from '@/lib/site-content'
import { getSectors } from '@/lib/sectors'
import { SectorsProvider } from '@/components/kids/sectors-context'
import { cookies, headers } from 'next/headers'
import { COUNTRY_COOKIE, countrySurcharge, viewerCountry } from '@/lib/country-price'
import { getStoreProductsServer } from '@/lib/products-db'

// Without this, Next.js statically generates the homepage at build time
// (a raw `sql` query doesn't trip its automatic dynamic-rendering
// detection the way `fetch()` does) and serves that same snapshot to
// every visitor afterward — publishing content-editor changes updates the
// database but never reaches the live page until the next deploy.
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Home em formato de app de loja (components/apple-home.tsx) + barra de
// baixo no celular. A escolha de colecao detalhada fica no menu.
export default async function HomePage() {
  // produtos já no HTML (aparecem na hora e o Google lê nome e preço), no preço do país de quem vê
  const [ck, hd] = await Promise.all([cookies(), headers()])
  const surcharge = await countrySurcharge(viewerCountry(ck.get(COUNTRY_COOKIE)?.value, hd.get('x-vercel-ip-country'))).catch(() => 0)
  const [content, sectors, products] = await Promise.all([getSiteContent(), getSectors(), getStoreProductsServer(surcharge)])

  return (
    <SectorsProvider sectors={sectors}>
    <div className="flex min-h-screen flex-col bg-[#f5f5f7] pb-[76px] md:pb-0">
      <Header />
      <main className="flex-1">
        <AppleHome content={content} initialProducts={products} />
      </main>
      <Footer content={content.rodape} logo={content.cabecalho.logoImage} />
      <WhatsAppFloating withTabBar />
      <MobileTabBar />
      <CartSidebar />
      <UpsellPopup />
    </div>
    </SectorsProvider>
  )
}
