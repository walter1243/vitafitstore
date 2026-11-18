import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminSessionFromRequest } from '@/lib/admin-auth';
import { deleteProductModel, getProductModel, saveProductModel } from '@/lib/product-models';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

// GET ?productId= — público só recebe modelo publicado e validado; o admin vê o rascunho.
export async function GET(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get('productId'));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'productId inválido.' }, { status: 400, headers: NO_STORE });
  const isAdmin = Boolean(getAdminSessionFromRequest(req));
  const model = await getProductModel(id, !isAdmin);
  return NextResponse.json(model, { headers: NO_STORE });
}

// POST — cria/atualiza o modelo do produto (só o modelo: nada comercial muda).
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const saved = await saveProductModel(body ?? {});
    return NextResponse.json(saved, { headers: NO_STORE });
  } catch (err: any) {
    console.error('[POST /api/product-models]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao salvar o modelo 3D.' }, { status: 400, headers: NO_STORE });
  }
}

// DELETE ?productId= — desliga o modelo do produto (arquivos originais ficam guardados).
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const id = Number(req.nextUrl.searchParams.get('productId'));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'productId inválido.' }, { status: 400, headers: NO_STORE });
  try {
    await deleteProductModel(id);
    return NextResponse.json({ success: true }, { headers: NO_STORE });
  } catch (err: any) {
    console.error('[DELETE /api/product-models]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao remover o modelo 3D.' }, { status: 500, headers: NO_STORE });
  }
}
