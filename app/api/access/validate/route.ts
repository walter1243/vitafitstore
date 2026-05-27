import { NextRequest, NextResponse } from 'next/server'
import { validateCustomerAccessToken } from '@/lib/customer-access'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    const normalizedToken = String(token ?? '').trim()

    if (!normalizedToken) {
      return NextResponse.json({ error: 'token é obrigatório.' }, { status: 400 })
    }

    const result = await validateCustomerAccessToken(normalizedToken)
    if (!result.valid) {
      return NextResponse.json({ valid: false, reason: result.reason }, { status: 401 })
    }

    return NextResponse.json({ valid: true, order: result.order })
  } catch (err: any) {
    console.error('[POST /api/access/validate]', err)
    return NextResponse.json({ error: err?.message ?? 'Erro interno.' }, { status: 500 })
  }
}
