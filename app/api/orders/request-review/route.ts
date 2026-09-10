import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { generateCustomerAccessToken } from '@/lib/customer-access';
import { sendReviewRequestWhatsApp } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { order_id } = await req.json();
    const orderId = Number(order_id);
    if (!orderId) {
      return NextResponse.json({ error: 'order_id inválido' }, { status: 400 });
    }

    const [order] = await sql`
      SELECT o.id, o.customer_name, o.customer_phone, o.customer_email,
             COALESCE(p.name, 'tu producto') AS product_name
      FROM orders o
      LEFT JOIN products p ON p.id = o.product_id
      WHERE o.id = ${orderId}
    `;
    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }
    if (!order.customer_phone) {
      return NextResponse.json({ error: 'Este pedido não tem telefone do cliente cadastrado.' }, { status: 400 });
    }

    const [settings] = await sql`SELECT whatsapp_review_template FROM store_settings WHERE id = 1`.catch(() => [null]);

    const { accessUrl } = await generateCustomerAccessToken({
      orderId,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
    });
    const reviewUrl = accessUrl.replace('/acesso?token=', '/resena/');

    const sent = await sendReviewRequestWhatsApp({
      phone: order.customer_phone,
      name: order.customer_name ?? 'Cliente',
      productName: order.product_name,
      reviewUrl,
      customTemplate: settings?.whatsapp_review_template ?? undefined,
    });

    await sql`UPDATE orders SET status = 'delivered' WHERE id = ${orderId}`;

    return NextResponse.json({
      success: true,
      sent,
      reviewUrl,
      message: sent ? 'Mensagem enviada pelo WhatsApp.' : 'Pedido marcado como entregue, mas o WhatsApp não está configurado — copie o link manualmente.',
    });
  } catch (err: any) {
    console.error('[POST /api/orders/request-review]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao solicitar avaliação.' }, { status: 500 });
  }
}
