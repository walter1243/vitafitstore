import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { validateCustomerAccessToken } from '@/lib/customer-access'
import { ReviewForm } from '@/components/review-form'

export const dynamic = 'force-dynamic'

function reasonToMessage(reason?: string) {
  switch (reason) {
    case 'token_expired':
      return 'Este enlace ha caducado.'
    case 'token_inactive':
      return 'Este enlace ya no está activo.'
    default:
      return 'No pudimos encontrar este enlace de valoración.'
  }
}

export default async function ResenaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const validation = await validateCustomerAccessToken(token)

  if (!validation.valid || !validation.order.productId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-orange-600" />
          <p className="mb-4 text-sm text-slate-600">
            {validation.valid ? 'No se pudo identificar el producto de este pedido.' : reasonToMessage(validation.reason)}
          </p>
          <Link href="/" className="text-sm font-semibold text-orange-700 hover:text-orange-800">
            Volver a la tienda
          </Link>
        </div>
      </main>
    )
  }

  return (
    <ReviewForm
      token={token}
      productName={validation.order.productName}
      customerName={validation.order.customerName ?? ''}
    />
  )
}
