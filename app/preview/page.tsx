'use client'

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { KidsStorefront } from '@/components/kids/kids-storefront'
import { KidsHowItsMade } from '@/components/kids/kids-how-its-made'

// "Prévia da loja" do admin (iframe em components/configuracoes/ContentEditor):
// mostra a mesma vitrine da pagina inicial (app/page.tsx). Setores, colecoes,
// produtos e contatos vem do que esta salvo no admin.
// Nunca linkada publicamente e fora do robots — ver app/robots.ts.
export default function PreviewPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="sticky top-0 z-[100] bg-amber-500 py-1.5 text-center text-xs font-semibold text-black">
        Prévia da loja
      </div>
      <Header />
      <main className="kids flex-1">
        <KidsStorefront />
        <KidsHowItsMade />
      </main>
      <Footer />
    </div>
  )
}
