import { Header } from '@/components/header'
import HeroVideo from '../components/hero-video'
import { TrustBadges } from '@/components/trust-badges'
import ProductCarousels from '../components/product-carousels'
import PinScrollSection from '../components/pin-scroll-section'
import { Newsletter } from '@/components/newsletter'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { UpsellPopup } from '@/components/upsell-popup'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <HeroVideo />
          <TrustBadges />
          <section id="productos">
            <ProductCarousels />
          </section>
          <PinScrollSection />
          <Newsletter />
        </main>
        <Footer />
        <CartSidebar />
        <UpsellPopup />
    </div>
  )
}
