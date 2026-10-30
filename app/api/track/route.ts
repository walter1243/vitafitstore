import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensureSiteEvents, EVENT_TYPES, geoFromHeaders, IGNORE_COOKIE, type EventType } from '@/lib/site-events';
import { getAdminSessionFromRequest } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|vercel/i;

// Recebe os eventos do site (components/site-tracker.tsx). Sempre responde
// 204 — estatistica nunca pode quebrar a loja.
export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get('user-agent') ?? '';
    if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204 });
    // Admin logado conferindo a loja nao conta como visita.
    if (getAdminSessionFromRequest(req) || req.cookies.get(IGNORE_COOKIE)) return new NextResponse(null, { status: 204 });
    const body = await req.json().catch(() => null);
    const type = body?.type as EventType;
    if (!EVENT_TYPES.includes(type)) return new NextResponse(null, { status: 204 });
    const path = String(body?.path ?? '').slice(0, 200);
    if (!path.startsWith('/') || path.startsWith('/admin') || path.startsWith('/api')) return new NextResponse(null, { status: 204 });
    // Produto: o id que abre a URL /producto/{id}-{slug} (ou o informado).
    const fromPath = path.match(/^\/producto\/(\d+)/)?.[1];
    const productId = Number(body?.productId ?? fromPath) || null;

    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || req.headers.get('x-real-ip') || '';
    const day = new Date().toISOString().slice(0, 10);
    const salt = process.env.ADMIN_SESSION_SECRET || process.env.DATABASE_URL || 'kitoys';
    const visitor = createHash('sha256').update(`${day}|${ip}|${ua}|${salt}`).digest('hex').slice(0, 20);

    await ensureSiteEvents();
    const geo = body?.noGeo ? { country: null, city: null, lat: null, lng: null } : geoFromHeaders(req.headers);
    await sql`
      INSERT INTO site_events (type, path, product_id, visitor, country, city, lat, lng)
      VALUES (${type}, ${path}, ${productId}, ${visitor}, ${geo.country}, ${geo.city}, ${geo.lat}, ${geo.lng})
    `;
  } catch (err) {
    console.error('[POST /api/track]', err);
  }
  return new NextResponse(null, { status: 204 });
}
