import { CartProvider } from '@/lib/cart-context'
import { Header } from '@/components/header'
import { Hero } from '@/components/hero'
import { TrustBadges } from '@/components/trust-badges'
import { ProductGrid } from '@/components/product-grid'
import { AboutSection } from '@/components/about-section'
import { Newsletter } from '@/components/newsletter'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { UpsellPopup } from '@/components/upsell-popup'

export default function HomePage() {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Hero />
          <TrustBadges />
          <section id="productos">
            <ProductGrid />
          </section>
          <AboutSection />
          <Newsletter />
        </main>
        <Footer />
        <CartSidebar />
        <UpsellPopup />
      </div>
    </CartProvider>
  )
}
