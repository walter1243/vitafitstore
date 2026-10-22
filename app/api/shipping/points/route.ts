import { NextRequest, NextResponse } from 'next/server';
import { packlinkDropoffs } from '@/lib/packlink';

export const dynamic = 'force-dynamic';

// GET ?service=ID&zip=03203 → puntos de recogida cercanos (Packlink).
export async function GET(req: NextRequest) {
  const service = String(req.nextUrl.searchParams.get('service') ?? '').slice(0, 40);
  const zip = String(req.nextUrl.searchParams.get('zip') ?? '').replace(/\D/g, '').slice(0, 5);
  if (!service || zip.length !== 5) return NextResponse.json({ error: 'Datos no válidos.' }, { status: 400 });
  try {
    return NextResponse.json({ points: await packlinkDropoffs(service, zip) });
  } catch (err: any) {
    console.error('[GET /api/shipping/points]', err);
    return NextResponse.json({ points: [], error: 'No se pudieron cargar los puntos.' });
  }
}
