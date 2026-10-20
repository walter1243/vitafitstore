import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { UpsellPopup } from '@/components/upsell-popup'
import { WhatsAppFloating } from '@/components/whatsapp-floating'
import { SectorsProvider } from '@/components/kids/sectors-context'
import { HogarCatalog } from '@/components/hogar/hogar-catalog'
import { getSectors } from '@/lib/sectors'
import { getSiteContent } from '@/lib/site-content'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Hogar · Decoración impresa en 3D',
  description: 'Jarrones, decoración y detalles para casa impresos en 3D en nuestro taller de Elche. Catálogo Hogar de Kitoys 3D.',
  alternates: { canonical: '/hogar' },
}

// Catalogo "Hogar": pagina inteira no visual de casa (editorial/revista),
// separada da vitrine infantil. Cada categoria de casa vira uma "pagina" do
// catalogo — ver components/hogar/hogar-catalog.tsx.
export default async function HogarPage() {
  const [sectors, content] = await Promise.all([getSectors(), getSiteContent()])
  return (
    <SectorsProvider sectors={sectors}>
      <div className="flex min-h-screen flex-col bg-[#fbf8f3]">
        <Header />
        <main className="hogar-editorial flex-1">
          <HogarCatalog />
        </main>
        <Footer content={content.footer} />
        <WhatsAppFloating />
        <CartSidebar />
        <UpsellPopup />
      </div>
    </SectorsProvider>
  )
}
