// Frete de um carrinho (servidor): caixa dos produtos → Packlink → opcoes
// "a domicilio" e "recoger en punto". Regras da loja por cima: gratis a
// partir de 50 € e "gratis desde N unidades" do produto.
import { sql } from '@/lib/db';
import { combineParcels } from '@/lib/parcel';
import { cheapestByType, packlinkServices, type ShipOption } from '@/lib/packlink';
import { lineTotalFor, parsePersonalize } from '@/lib/personalize';
import { FREE_SHIPPING_FROM } from '@/lib/checkout-pricing';

export type ShipMethod = 'home' | 'pickup';
export type ShippingQuote = {
  free: boolean;
  home: (ShipOption & { charged: number }) | null;
  pickup: (ShipOption & { charged: number }) | null;
  subtotal: number;
  error?: string;
};

export async function quoteShipping(items: { productId: number; quantity: number }[], zip: string, country = 'ES'): Promise<ShippingQuote> {
  const ids = [...new Set(items.map((i) => Number(i.productId)))].filter(Boolean);
  if (ids.length === 0) return { free: false, home: null, pickup: null, subtotal: 0 };
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS parcel TEXT`;
  const rows = await sql`SELECT id, price, personalize, parcel FROM products WHERE id = ANY(${ids})`;
  const byId = new Map<number, any>((rows as any[]).map((r) => [Number(r.id), r]));
  const qty = new Map<number, number>();
  for (const it of items) qty.set(Number(it.productId), (qty.get(Number(it.productId)) ?? 0) + Number(it.quantity || 0));

  let subtotal = 0;
  let freeByQty = items.length > 0;
  for (const [id, q] of qty) {
    const r = byId.get(id);
    if (!r) continue;
    subtotal += lineTotalFor(Number(r.price), r.personalize, q);
    const n = parsePersonalize(r.personalize).freeShipQty;
    if (!(n > 0 && q >= n)) freeByQty = false;
  }
  const free = subtotal >= FREE_SHIPPING_FROM || freeByQty;

  const parcel = combineParcels([...qty].map(([id, q]) => ({ parcel: byId.get(id)?.parcel, quantity: q })));
  try {
    const opts = await packlinkServices(zip, parcel, country);
    const { home, pickup } = cheapestByType(opts);
    const wrap = (o: ShipOption | null) => (o ? { ...o, charged: free ? 0 : o.price } : null);
    return { free, home: wrap(home), pickup: wrap(pickup), subtotal: Math.round(subtotal * 100) / 100 };
  } catch (e: any) {
    return { free, home: null, pickup: null, subtotal: Math.round(subtotal * 100) / 100, error: e?.message || 'Packlink no disponible' };
  }
}

// Frete cobrado no checkout pro metodo escolhido. Se a Packlink nao
// responder (ou pais fora da Espanha), cai na tabela antiga.
export async function chargeShipping(
  items: { productId: number; quantity: number }[],
  zip: string,
  country: string,
  method: ShipMethod,
  fallback: () => number,
) {
  const cleanZip = String(zip || '').replace(/\D/g, '').slice(0, 5);
  if (String(country || 'ES').toUpperCase() !== 'ES' || cleanZip.length !== 5) {
    return { shipping: fallback(), quote: null as ShippingQuote | null, chosen: null as (ShipOption & { charged: number }) | null, method };
  }
  const quote = await quoteShipping(items, cleanZip, 'ES');
  const chosen = (method === 'pickup' ? quote.pickup ?? quote.home : quote.home ?? quote.pickup) ?? null;
  const shipping = chosen ? chosen.charged : quote.free ? 0 : fallback();
  return { shipping: Math.round(shipping * 100) / 100, quote, chosen, method: (chosen?.type ?? method) as ShipMethod };
}
