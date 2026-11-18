import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminSessionFromRequest } from '@/lib/admin-auth';
import { deleteSalesPage, getSalesPage, listSalesPages, saveSalesPage } from '@/lib/sales-pages';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

// GET: ?slug= traz uma página; sem slug, lista todas.
// Público só enxerga páginas ligadas; o admin vê tudo (para pré-visualizar).
export async function GET(req: NextRequest) {
  try {
    const isAdmin = Boolean(getAdminSessionFromRequest(req));
    const slug = req.nextUrl.searchParams.get('slug');
    if (slug) {
      const page = await getSalesPage(slug);
      if (!page || (!page.enabled && !isAdmin)) {
        return NextResponse.json({ error: 'Página não encontrada.' }, { status: 404, headers: NO_STORE });
      }
      return NextResponse.json(page, { headers: NO_STORE });
    }
    const pages = await listSalesPages();
    return NextResponse.json(isAdmin ? pages : pages.filter((p) => p.enabled), { headers: NO_STORE });
  } catch (err: any) {
    console.error('[GET /api/sales-pages]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao carregar páginas.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const saved = await saveSalesPage(body ?? {});
    return NextResponse.json(saved, { headers: NO_STORE });
  } catch (err: any) {
    console.error('[POST /api/sales-pages]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao salvar a página.' }, { status: 500, headers: NO_STORE });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    const slug = req.nextUrl.searchParams.get('slug');
    if (!slug) return NextResponse.json({ error: 'Slug inválido.' }, { status: 400, headers: NO_STORE });
    await deleteSalesPage(slug);
    return NextResponse.json({ success: true }, { headers: NO_STORE });
  } catch (err: any) {
    console.error('[DELETE /api/sales-pages]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao apagar a página.' }, { status: 500, headers: NO_STORE });
  }
}
