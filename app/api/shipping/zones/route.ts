import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getZones, saveZones } from '@/lib/shipping-zones';

export const dynamic = 'force-dynamic';

// GET → paises para onde a loja envia (lista do checkout).
// GET ?all=1 (admin) → todos, com os precos. PUT (admin) → salva a lista.
export async function GET(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get('all')) {
      const auth = await requireAdmin(req);
      if (!auth.ok) return auth.response;
      return NextResponse.json({ zones: await getZones() });
    }
    const zones = await getZones(true);
    return NextResponse.json({ countries: zones.map((z) => ({ code: z.code, name: z.name, mode: z.mode })) });
  } catch (err) {
    console.error('[GET /api/shipping/zones]', err);
    return NextResponse.json({ countries: [{ code: 'ES', name: 'España', mode: 'packlink' }] });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    return NextResponse.json({ zones: await saveZones(body?.zones) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Não foi possível salvar.' }, { status: 400 });
  }
}
