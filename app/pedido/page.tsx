import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { OrderStatusView } from '@/components/order-status-view'

export const metadata: Metadata = {
  title: 'Mi pedido',
  robots: { index: false },
}

export default function PedidoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F5]">
      <Header />
      <main className="flex-1 pt-44 pb-16 md:pt-36">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <Suspense>
            <OrderStatusView />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
