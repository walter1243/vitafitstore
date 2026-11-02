import { NextRequest, NextResponse } from 'next/server';

// GET ?lat=&lon= → { zip, city, street, number } a partir da localizacao do
// cliente ("Usar mi ubicación" no frete e no endereco do checkout). Usa o geocodificador do OpenStreetMap
// (Nominatim), que pede um User-Agent identificando o site.
export async function GET(req: NextRequest) {
  // ?q=endereco → { lat, lon } (mapa dos pontos de recogida no checkout).
  const q = String(req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 200);
  if (q) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=es,pt,fr&q=${encodeURIComponent(q)}`;
      const r = await fetch(url, { headers: { 'User-Agent': 'Kitoys3D/1.0 (https://www.kitoys3d.com)' }, next: { revalidate: 86400 } });
      const d = r.ok ? await r.json() : [];
      const hit = Array.isArray(d) ? d[0] : null;
      if (!hit) return NextResponse.json({ error: 'No encontrado.' }, { status: 404 });
      return NextResponse.json({ lat: Number(hit.lat), lon: Number(hit.lon) });
    } catch {
      return NextResponse.json({ error: 'No pudimos ubicar la dirección.' }, { status: 502 });
    }
  }
  const lat = Number(req.nextUrl.searchParams.get('lat'));
  const lon = Number(req.nextUrl.searchParams.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'Ubicación inválida.' }, { status: 400 });
  }
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=es&lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Kitoys3D/1.0 (https://www.kitoys3d.com)' }, cache: 'no-store' });
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json();
    const a = d?.address ?? {};
    const zip = String(a.postcode ?? '').replace(/\D/g, '').slice(0, 5);
    if (zip.length !== 5) return NextResponse.json({ error: 'No encontramos tu código postal.' }, { status: 404 });
    return NextResponse.json({
      zip,
      city: a.city || a.town || a.village || a.municipality || '',
      street: a.road || a.pedestrian || a.footway || a.square || '',
      number: String(a.house_number ?? '').slice(0, 10),
      country: String(a.country_code ?? '').toUpperCase(),
    });
  } catch {
    return NextResponse.json({ error: 'No pudimos obtener tu ubicación.' }, { status: 502 });
  }
}
