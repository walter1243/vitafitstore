// Frete de um carrinho (servidor), pelo pais (lib/shipping-zones):
// - Packlink (Espanha e onde ela vende): caixa dos produtos → opcoes
//   "a domicilio" e (so Espanha) "recoger en punto";
// - Correos (paises fora da Packlink, ou se ela falhar): preco fixo da
//   tabela pelo peso, so a domicilio.
// Regras da loja por cima: gratis a partir do valor do pais e (Espanha)
// "gratis desde N unidades" do produto.
import { sql } from '@/lib/db';
import { combineParcels } from '@/lib/parcel';
import { cheapestByType, packlinkServices, type ShipOption } from '@/lib/packlink';
import { lineTotalFor, packOf, parsePersonalize, sizedPrice, unitPriceFor } from '@/lib/personalize';
import { cleanPostal, correosPrice, getZone, LIGHT_MAX_KG } from '@/lib/shipping-zones';

export type ShipMethod = 'home' | 'pickup';
export type ShippingQuote = {
  free: boolean;
  home: (ShipOption & { charged: number }) | null;
  pickup: (ShipOption & { charged: number }) | null;
  subtotal: number;
  mode?: 'packlink' | 'correos';
  // pais fora da lista de envio
  unsupported?: boolean;
  error?: string;
};

export async function quoteShipping(items: { productId: number; quantity: number; size?: string }[], zip: string, country = 'ES'): Promise<ShippingQuote> {
  const ids = [...new Set(items.map((i) => Number(i.productId)))].filter(Boolean);
  if (ids.length === 0) return { free: false, home: null, pickup: null, subtotal: 0 };
  const code = String(country || 'ES').toUpperCase();
  const zone = await getZone(code);
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS parcel TEXT`;
  const rows = await sql`SELECT id, price, personalize, parcel FROM products WHERE id = ANY(${ids})`;
  const byId = new Map<number, any>((rows as any[]).map((r) => [Number(r.id), r]));
  const qty = new Map<number, number>();
  for (const it of items) qty.set(Number(it.productId), (qty.get(Number(it.productId)) ?? 0) + Number(it.quantity || 0));

  let subtotal = 0;
  let freeByQty = items.length > 0;
  for (const it of items) {
    const r = byId.get(Number(it.productId));
    if (!r) continue;
    const base = sizedPrice(Number(r.price), r.personalize, it.size);
    subtotal += packOf(r.personalize) ? lineTotalFor(base, r.personalize, Number(it.quantity || 0)) : unitPriceFor(base, r.personalize, qty.get(Number(it.productId)) ?? 0) * Number(it.quantity || 0);
  }
  for (const [id, q] of qty) {
    const r = byId.get(id);
    if (!r) continue;
    const n = parsePersonalize(r.personalize).freeShipQty;
    if (!(n > 0 && q >= n)) freeByQty = false;
  }
  subtotal = Math.round(subtotal * 100) / 100;
  if (!zone || !zone.enabled) return { free: false, home: null, pickup: null, subtotal, unsupported: true, error: 'Todavía no enviamos a este país.' };
  const free = (zone.freeOver != null && subtotal >= zone.freeOver) || (code === 'ES' && freeByQty);
  const wrap = (o: ShipOption | null) => (o ? { ...o, charged: free ? 0 : o.price } : null);

  const parcel = combineParcels([...qty].map(([id, q]) => ({ parcel: byId.get(id)?.parcel, quantity: q })));
  const correos = (): ShippingQuote => {
    const price = correosPrice(zone, parcel.weight);
    if (!(price > 0)) return { free, home: null, pickup: null, subtotal, mode: 'correos', error: 'Envío no disponible para este país.' };
    const home: ShipOption = {
      serviceId: `correos-${code}`,
      carrier: 'Correos',
      service: parcel.weight <= LIGHT_MAX_KG ? 'Paquete Internacional Light' : 'Paquete Internacional Estándar',
      price,
      type: 'home',
    };
    return { free, home: wrap(home), pickup: null, subtotal, mode: 'correos' };
  };
  if (zone.mode === 'correos') return correos();

  const z = cleanPostal(code, zip);
  if (!z || (code === 'ES' && z.length !== 5)) return code === 'ES' ? { free, home: null, pickup: null, subtotal, mode: 'packlink' } : correos();
  try {
    const opts = await packlinkServices(z, parcel, code);
    const { home, pickup } = cheapestByType(opts);
    // Fora da Espanha nao mostramos pontos de recogida.
    const pk = code === 'ES' ? pickup : null;
    const hm = home ?? (code === 'ES' ? null : pickup && { ...pickup, type: 'home' as const });
    if (!hm && !pk) return code === 'ES' ? { free, home: null, pickup: null, subtotal, mode: 'packlink', error: 'Packlink sin opciones' } : correos();
    return { free, home: wrap(hm), pickup: wrap(pk), subtotal, mode: 'packlink' };
  } catch (e: any) {
    if (code !== 'ES') return correos();
    return { free, home: null, pickup: null, subtotal, mode: 'packlink', error: e?.message || 'Packlink no disponible' };
  }
}

// Frete cobrado no checkout pro metodo escolhido. Espanha sem CP ou com a
// Packlink fora do ar: tabela antiga. Pais fora da lista: error.
export async function chargeShipping(
  items: { productId: number; quantity: number; size?: string }[],
  zip: string,
  country: string,
  method: ShipMethod,
  fallback: () => number,
) {
  const code = String(country || 'ES').toUpperCase();
  const cleanZip = cleanPostal(code, zip);
  if (code === 'ES' && cleanZip.length !== 5) {
    return { shipping: fallback(), quote: null as ShippingQuote | null, chosen: null as (ShipOption & { charged: number }) | null, method, error: '' };
  }
  const quote = await quoteShipping(items, cleanZip, code);
  if (quote.unsupported || (code !== 'ES' && !quote.home && !quote.pickup)) {
    return { shipping: 0, quote, chosen: null, method: 'home' as ShipMethod, error: quote.error || 'Todavía no enviamos a este país.' };
  }
  const chosen = (method === 'pickup' ? quote.pickup ?? quote.home : quote.home ?? quote.pickup) ?? null;
  const shipping = chosen ? chosen.charged : quote.free ? 0 : fallback();
  return { shipping: Math.round(shipping * 100) / 100, quote, chosen, method: (chosen?.type ?? method) as ShipMethod, error: '' };
}
