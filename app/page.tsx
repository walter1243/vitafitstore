import { CartProvider } from '@/lib/cart-context'
import { Header } from '@/components/header'
import HeroVideo from '../components/hero-video'
import { TrustBadges } from '@/components/trust-badges'
import { ProductGrid } from '@/components/product-grid'
import { AboutSection } from '@/components/about-section'
import { Newsletter } from '@/components/newsletter'
import { Footer } from '@/components/footer'
import { CartSidebar } from '@/components/cart-sidebar'
import { UpsellPopup } from '@/components/upsell-popup'
import HotProductsCarousel from "../components/hot-products-carousel";
import PinScrollSection from "../components/pin-scroll-section";

export default function HomePage() {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <HeroVideo />
          <HotProductsCarousel />
          <PinScrollSection />
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
  );
}
