// Packlink PRO (envios na Espanha). So no servidor: usa a chave da Vercel
// (KEYAPI_PACKLINKPROENVIOS) — nunca vai pro navegador.
import { type Parcel } from '@/lib/parcel';

const API = 'https://api.packlink.com/v1';
// Origem: o taller em Elche (Alicante).
export const FROM_ZIP = process.env.PACKLINK_FROM_ZIP || '03203';
export const FROM_COUNTRY = 'ES';

export type ShipOption = {
  serviceId: string;
  carrier: string;
  service: string;
  price: number;          // EUR com impostos
  type: 'home' | 'pickup'; // entrega em casa ou recolher num ponto
  logo?: string;
};

const key = () => process.env.KEYAPI_PACKLINKPROENVIOS || process.env.PACKLINK_API_KEY || '';
export const packlinkReady = () => Boolean(key());

// Cache curto (mesma caixa + mesmo CP = mesma resposta).
const cache = new Map<string, { at: number; data: ShipOption[] }>();
const TTL = 10 * 60 * 1000;

function priceOf(s: any): number {
  const p = s?.price ?? {};
  const v = p.total_price ?? p.totalPrice ?? s?.total_price ?? s?.base_price ?? p.base_price;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

export async function packlinkServices(toZip: string, parcel: Parcel, toCountry = 'ES'): Promise<ShipOption[]> {
  const k = key();
  if (!k) throw new Error('Packlink no configurado.');
  const zip = String(toZip || '').replace(/\s+/g, '').slice(0, 10);
  const id = `${toCountry}|${zip}|${parcel.weight}|${parcel.length}x${parcel.width}x${parcel.height}`;
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const q = new URLSearchParams({
    'from[country]': FROM_COUNTRY,
    'from[zip]': FROM_ZIP,
    'to[country]': toCountry,
    'to[zip]': zip,
    'packages[0][weight]': String(parcel.weight),
    'packages[0][length]': String(parcel.length),
    'packages[0][width]': String(parcel.width),
    'packages[0][height]': String(parcel.height),
    source: 'PRO',
  });
  const res = await fetch(`${API}/services?${q}`, { headers: { Authorization: k, Accept: 'application/json' }, cache: 'no-store' });
  if (!res.ok) throw new Error(`Packlink respondió ${res.status}`);
  const raw = await res.json();
  const list: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.services) ? raw.services : [];
  const data: ShipOption[] = list
    .map((s) => ({
      serviceId: String(s.id ?? s.service_id ?? ''),
      carrier: String(s.carrier_name ?? s.carrier ?? ''),
      service: String(s.name ?? s.service_name ?? ''),
      price: priceOf(s),
      type: (s.delivery_to_parcelshop === true || s.deliveryToParcelshop === true ? 'pickup' : 'home') as ShipOption['type'],
      logo: s.logo_url ?? s.carrier_logo ?? undefined,
    }))
    .filter((s) => s.serviceId && Number.isFinite(s.price) && s.price > 0);
  cache.set(id, { at: Date.now(), data });
  return data;
}

// Mais barato de cada tipo (casa / ponto).
export function cheapestByType(opts: ShipOption[]) {
  const best = (t: ShipOption['type']) => opts.filter((o) => o.type === t).sort((a, b) => a.price - b.price)[0] ?? null;
  return { home: best('home'), pickup: best('pickup') };
}

// hours: dia da semana em ingles (monday...) → "08:30-20:30"; sem o dia = fechado.
export type DropPoint = { id: string; name: string; address: string; city: string; zip: string; lat: number | null; lng: number | null; carrier: string; hours: Record<string, string> };

export async function packlinkDropoffs(serviceId: string, zip: string, country = 'ES'): Promise<DropPoint[]> {
  const k = key();
  if (!k) throw new Error('Packlink no configurado.');
  const res = await fetch(`${API}/dropoffs/${encodeURIComponent(serviceId)}/${country}/${encodeURIComponent(zip)}`, {
    headers: { Authorization: k, Accept: 'application/json' }, cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Packlink respondió ${res.status}`);
  const raw = await res.json();
  const list: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.dropoffs) ? raw.dropoffs : [];
  const num = (v: unknown) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : null);
  return list.slice(0, 40).map((p) => {
    const ot = p.opening_times?.opening_times ?? p.opening_times ?? {};
    const hours: Record<string, string> = {};
    if (ot && typeof ot === 'object') for (const [d, t] of Object.entries(ot)) if (typeof t === 'string' && t.trim()) hours[d.toLowerCase()] = t.trim().slice(0, 40);
    return {
      id: String(p.id ?? p.code ?? ''),
      name: String(p.commerce_name ?? p.name ?? 'Punto de recogida'),
      address: String(p.address ?? p.street ?? ''),
      city: String(p.city ?? ''),
      zip: String(p.zip ?? p.postal_code ?? ''),
      lat: num(p.lat ?? p.latitude),
      lng: num(p.long ?? p.lng ?? p.longitude),
      carrier: String(p.carrier ?? ''),
      hours,
    };
  }).filter((p) => p.id);
}
