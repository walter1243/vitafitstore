import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { UpsellPopup } from '@/components/upsell-popup'
import { WhatsAppFloating } from '@/components/whatsapp-floating'
import { KidsHero } from '@/components/kids/kids-hero'
import { KidsStorefront } from '@/components/kids/kids-storefront'
import { KidsHowItsMade } from '@/components/kids/kids-how-its-made'
import { getSiteContent } from '@/lib/site-content'

// Without this, Next.js statically generates the homepage at build time
// (a raw `sql` query doesn't trip its automatic dynamic-rendering
// detection the way `fetch()` does) and serves that same snapshot to
// every visitor afterward — publishing content-editor changes updates the
// database but never reaches the live page until the next deploy.
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Vitrine infantil: hero com blocos de montar → colecoes → prateleiras →
// "Nuestro taller". So o conteudo da pagina fica dentro de .kids — carrinho,
// popup e checkout mantem o visual de antes.
export default async function HomePage() {
  const content = await getSiteContent()

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="kids flex-1">
        <KidsHero />
        <KidsStorefront />
        <KidsHowItsMade />
      </main>
      <Footer content={content.footer} />
      <WhatsAppFloating />
      <CartSidebar />
      <UpsellPopup />
    </div>
  )
}
