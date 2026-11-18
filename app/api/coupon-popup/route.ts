import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getCouponPopup, saveCouponPopup } from '@/lib/coupons';
import { getSalesPage, storeArt } from '@/lib/sales-pages';

const storeOf = (req: NextRequest) => (req.nextUrl.searchParams.get('store') || 'kitoys').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'kitoys';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

// GET (publico): o que o pop-up de cupom precisa para aparecer na loja.
// Campanha com data de fim ja passada nao aparece.
export async function GET(req: NextRequest) {
  try {
    const store = storeOf(req);
    const c = await getCouponPopup(store);
    const ended = c.endsAt ? Date.parse(c.endsAt) < Date.now() : false;
    // Outra loja: nome, cor e a arte dela (imagem do pop-up quando não há uma própria).
    const page = store === 'kitoys' ? null : await getSalesPage(store).catch(() => null);
    const brand = page ? { storeTitle: page.title, neonPrimary: page.neonPrimary, fallbackImage: storeArt(page).hero } : {};
    // enabled = aparece agora; configuredEnabled = chave do painel (pode estar ligada com data ja vencida)
    return NextResponse.json({ ...c, ...brand, enabled: c.enabled && !ended, configuredEnabled: c.enabled, ended }, { headers: NO_STORE });
  } catch (err) {
    console.error('[GET /api/coupon-popup]', err);
    return NextResponse.json({ enabled: false }, { headers: NO_STORE });
  }
}

// POST (admin): salva campanha + cupom (Admin → Editar loja → Pop-up de cupom).
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const saved = await saveCouponPopup(body ?? {}, storeOf(req));
    return NextResponse.json(saved, { headers: NO_STORE });
  } catch (err: any) {
    console.error('[POST /api/coupon-popup]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao salvar o cupom.' }, { status: 500 });
  }
}
