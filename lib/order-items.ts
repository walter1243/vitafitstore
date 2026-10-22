import { cleanCustomText } from '@/lib/personalize';

// Itens do pedido no metadata do pagamento (Stripe). Cada valor do metadata
// aceita no maximo 500 caracteres — com os nomes personalizados a lista pode
// passar disso, entao ela vai dividida em items_0, items_1, ...

// `total`: valor da linha calculado no servidor (create-intent), pra o pedido
// mostrar exatamente o que foi cobrado.
export type OrderItem = { productId: number; quantity: number; color?: string; size?: string; text?: string; note?: string; total?: number };

const CHUNK = 490;

export function cleanItems(raw: unknown): OrderItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((i: any) => ({
      productId: Number(i?.productId),
      quantity: Math.max(1, Math.min(1000, Math.floor(Number(i?.quantity) || 1))),
      color: i?.color ? String(i.color).slice(0, 60) : undefined,
      size: i?.size ? String(i.size).slice(0, 40) : undefined,
      text: i?.text ? cleanCustomText(i.text) || undefined : undefined,
      note: i?.note ? String(i.note).replace(/[<>]/g, '').slice(0, 300) || undefined : undefined,
      total: Number.isFinite(Number(i?.total)) && i?.total !== undefined ? Math.round(Number(i.total) * 100) / 100 : undefined,
    }))
    .filter((i) => Number.isFinite(i.productId) && i.productId > 0);
}

export function packItems(items: OrderItem[]): Record<string, string> {
  const json = JSON.stringify(items);
  const out: Record<string, string> = {};
  for (let i = 0, n = 0; i < json.length; i += CHUNK, n++) out[`items_${n}`] = json.slice(i, i + CHUNK);
  return out;
}

export function unpackItems(meta: Record<string, string | undefined>): OrderItem[] {
  // Pedidos antigos: tudo em `items`.
  let json = '';
  for (let n = 0; meta[`items_${n}`] !== undefined; n++) json += meta[`items_${n}`];
  if (!json) json = meta.items ?? '[]';
  try { return cleanItems(JSON.parse(json)); } catch { return []; }
}
