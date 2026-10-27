import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validateCustomerAccessToken } from '@/lib/customer-access';
import { ensureReviewsTable, getReviewsVisible } from '@/lib/reviews-schema';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ensureTable = ensureReviewsTable;

// Public: approved reviews for a product, plus the aggregate rating —
// used on the product page. Only ever returns reviews an admin approved.
export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const productId = Number(req.nextUrl.searchParams.get('productId'));
    if (!productId) {
      return NextResponse.json({ error: 'productId é obrigatório.' }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, customer_name AS "customerName", rating, comment, photo_url AS "photoUrl",
             source, country, language, source_note AS "sourceNote",
             TO_CHAR(created_at, 'YYYY-MM-DD') AS date
      FROM product_reviews
      WHERE product_id = ${productId} AND status = 'approved'
      ORDER BY created_at DESC
    `;

    const count = rows.length;
    const average = count > 0 ? rows.reduce((s: number, r: any) => s + Number(r.rating), 0) / count : 0;

    return NextResponse.json({
      reviews: rows,
      count,
      average: Math.round(average * 10) / 10,
      // quantos mostrar antes do "Ver más" (Admin → Avaliações)
      visible: await getReviewsVisible(),
    }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } });
  } catch (err: any) {
    console.error('[GET /api/reviews]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao buscar avaliações.' }, { status: 500 });
  }
}

// Public but token-gated: only someone holding the per-order access token
// (sent to the real customer via WhatsApp after delivery) can submit a
// review, and only once per order — this is what makes it a genuine
// verified review instead of an open free-for-all form.
export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const body = await req.json();
    const token = String(body?.token ?? '').trim();
    const rating = Number(body?.rating);
    const comment = String(body?.comment ?? '').trim();
    const photoUrl = typeof body?.photoUrl === 'string' ? body.photoUrl.trim() : '';
    const displayName = String(body?.displayName ?? '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'A avaliação deve ser de 1 a 5 estrelas.' }, { status: 400 });
    }

    const validation = await validateCustomerAccessToken(token);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Link inválido o caducado.' }, { status: 401 });
    }
    if (!validation.order.productId) {
      return NextResponse.json({ error: 'No se pudo identificar el producto de este pedido.' }, { status: 400 });
    }

    const [existing] = await sql`SELECT id FROM product_reviews WHERE order_id = ${validation.order.orderId} LIMIT 1`;
    if (existing) {
      return NextResponse.json({ error: 'Ya enviaste una valoración para este pedido.' }, { status: 409 });
    }

    const [review] = await sql`
      INSERT INTO product_reviews (product_id, order_id, customer_name, rating, comment, photo_url, status)
      VALUES (
        ${validation.order.productId},
        ${validation.order.orderId},
        ${displayName || validation.order.customerName || 'Cliente'},
        ${rating},
        ${comment || null},
        ${photoUrl || null},
        'pending'
      )
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: review.id });
  } catch (err: any) {
    console.error('[POST /api/reviews]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao enviar avaliação.' }, { status: 500 });
  }
}
