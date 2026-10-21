import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { UpsellPopup } from '@/components/upsell-popup'
import { WhatsAppFloating } from '@/components/whatsapp-floating'
import { SectorsProvider } from '@/components/kids/sectors-context'
import { SearchResults } from '@/components/search-results'
import { getSectors } from '@/lib/sectors'
import { getSiteContent } from '@/lib/site-content'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Buscar',
  robots: { index: false, follow: true },
}

type PageProps = { searchParams: Promise<{ q?: string }> }

// Resultados da busca do cabecalho (/buscar?q=...).
export default async function SearchPage({ searchParams }: PageProps) {
  const { q = '' } = await searchParams
  const [sectors, content] = await Promise.all([getSectors(), getSiteContent()])
  return (
    <SectorsProvider sectors={sectors}>
      <div className="flex min-h-screen flex-col bg-[#FFF8EF]">
        <Header />
        <main className="kids flex-1">
          <SearchResults query={q} />
        </main>
        <Footer content={content.footer} />
        <WhatsAppFloating />
        <CartSidebar />
        <UpsellPopup />
      </div>
    </SectorsProvider>
  )
}
