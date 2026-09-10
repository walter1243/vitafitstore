import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { searchCjProducts, CJ_USD_TO_EUR } from '@/lib/cj-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const keyword = req.nextUrl.searchParams.get('keyword') ?? '';
  const page = Number(req.nextUrl.searchParams.get('page') ?? 1);
  const margin = Number(req.nextUrl.searchParams.get('margin') ?? 40);

  if (!keyword.trim()) {
    return NextResponse.json({ ok: false, error: 'Informe uma palavra-chave para buscar.' }, { status: 400 });
  }

  try {
    const results = await searchCjProducts({ keyword: keyword.trim(), page, size: 24 });
    const products = results.map((r) => {
      const priceEur = r.priceUsd * CJ_USD_TO_EUR;
      return {
        name: r.name,
        description: '',
        price: priceEur,
        image: r.image,
        images: [] as string[],
        stock: 99,
        url: `https://cjdropshipping.com/product/product-p-${r.pid}.html`,
        source: 'CJ Dropshipping',
        suggestedPrice: priceEur * (1 + margin / 100),
        cjPid: r.pid,
        cjCategory: r.categoryName,
      };
    });

    return NextResponse.json({ ok: true, source: 'CJ Dropshipping', products });
  } catch (err: any) {
    console.error('[GET /api/cj/search]', err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'Erro ao buscar produtos na CJ.' }, { status: 500 });
  }
}
