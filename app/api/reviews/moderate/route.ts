import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { ensureReviewsTable, getReviewsVisible, REVIEW_COUNTRIES, REVIEW_LANGUAGES, setReviewsVisible } from '@/lib/reviews-schema';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Admin-only: every review regardless of status, for the moderation queue.
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    await ensureReviewsTable();
    const rows = await sql`
      SELECT
        r.id, r.product_id AS "productId", r.customer_name AS "customerName",
        r.rating, r.comment, r.photo_url AS "photoUrl", r.status,
        r.source, r.country, r.language, r.source_note AS "sourceNote",
        TO_CHAR(r.created_at, 'YYYY-MM-DD HH24:MI') AS date,
        COALESCE(p.name, 'Produto removido') AS "productName"
      FROM product_reviews r
      LEFT JOIN products p ON p.id = r.product_id
      ORDER BY (r.status = 'pending') DESC, r.created_at DESC
    `;
    return NextResponse.json(rows, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } });
  } catch (err: any) {
    console.error('[GET /api/reviews/moderate]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao listar avaliações.' }, { status: 500 });
  }
}

// Admin-only: cadastra um depoimento REAL recebido fora do site (WhatsApp,
// Instagram, feira...). Exige a confirmacao de que e de um cliente real com
// permissao pra publicar; vai pro site com a origem, nunca como "Compra verificada".
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    await ensureReviewsTable();
    const b = await req.json();
    const productId = Number(b?.productId);
    const rating = Number(b?.rating);
    const name = String(b?.customerName ?? '').trim().slice(0, 60);
    const comment = String(b?.comment ?? '').trim().slice(0, 1500);
    const sourceNote = String(b?.sourceNote ?? '').trim().slice(0, 80);
    const country = REVIEW_COUNTRIES.includes(b?.country) ? b.country : null;
    const language = REVIEW_LANGUAGES.includes(b?.language) ? b.language : null;
    const photoUrl = typeof b?.photoUrl === 'string' && /^https?:\/\//.test(b.photoUrl) ? b.photoUrl.slice(0, 500) : null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b?.date ?? '')) ? String(b.date) : null;

    if (b?.confirmReal !== true) {
      return NextResponse.json({ error: 'Confirme que o depoimento é de um cliente real e que você tem permissão para publicá-lo.' }, { status: 400 });
    }
    if (!productId) return NextResponse.json({ error: 'Escolha o produto.' }, { status: 400 });
    if (!name) return NextResponse.json({ error: 'Informe o nome do cliente.' }, { status: 400 });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: 'Escolha de 1 a 5 estrelas.' }, { status: 400 });
    if (!comment) return NextResponse.json({ error: 'Escreva o depoimento.' }, { status: 400 });
    if (!sourceNote) return NextResponse.json({ error: 'Diga de onde veio o depoimento (ex: WhatsApp).' }, { status: 400 });

    const [row] = await sql`
      INSERT INTO product_reviews (product_id, customer_name, rating, comment, photo_url, status, source, country, language, source_note, created_at)
      VALUES (${productId}, ${name}, ${rating}, ${comment}, ${photoUrl}, 'approved', 'manual', ${country}, ${language}, ${sourceNote}, COALESCE(${date}::timestamp, NOW()))
      RETURNING id
    `;
    return NextResponse.json({ success: true, id: row.id });
  } catch (err: any) {
    console.error('[POST /api/reviews/moderate]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao salvar depoimento.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id, status } = await req.json();
    const reviewId = Number(id);
    if (!reviewId || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
    }
    await sql`UPDATE product_reviews SET status = ${status} WHERE id = ${reviewId}`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[PATCH /api/reviews/moderate]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao atualizar avaliação.' }, { status: 500 });
  }
}

// Ajuste: quantos depoimentos aparecem antes do "Ver más".
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    const b = await req.json().catch(() => ({}));
    if (b?.visible === undefined) return NextResponse.json({ visible: await getReviewsVisible() });
    const n = Number(b.visible);
    if (!Number.isFinite(n)) return NextResponse.json({ error: 'Número inválido.' }, { status: 400 });
    return NextResponse.json({ visible: await setReviewsVisible(n) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Erro ao salvar.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const id = Number(req.nextUrl.searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'id inválido.' }, { status: 400 });
    await sql`DELETE FROM product_reviews WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE /api/reviews/moderate]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao excluir.' }, { status: 500 });
  }
}
