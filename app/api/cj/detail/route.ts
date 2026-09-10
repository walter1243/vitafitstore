import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getCjProductDetail, CJ_USD_TO_EUR } from '@/lib/cj-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const pid = req.nextUrl.searchParams.get('pid') ?? '';
  const margin = Number(req.nextUrl.searchParams.get('margin') ?? 40);

  if (!pid.trim()) {
    return NextResponse.json({ ok: false, error: 'pid é obrigatório.' }, { status: 400 });
  }

  try {
    const detail = await getCjProductDetail(pid.trim());
    const priceEur = detail.priceUsd * CJ_USD_TO_EUR;

    return NextResponse.json({
      ok: true,
      product: {
        name: detail.name,
        description: detail.description,
        price: priceEur,
        image: detail.image,
        images: detail.images,
        stock: 99,
        url: `https://cjdropshipping.com/product/product-p-${detail.pid}.html`,
        source: 'CJ Dropshipping',
        suggestedPrice: priceEur * (1 + margin / 100),
      },
    });
  } catch (err: any) {
    console.error('[GET /api/cj/detail]', err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'Erro ao buscar detalhes do produto.' }, { status: 500 });
  }
}
