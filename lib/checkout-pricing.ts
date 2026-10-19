type ShippingBand = {
  minSubtotal: number;
  maxSubtotal: number;
  shipping: number;
};

// Tabela padrao — vale para produtos SEM frete proprio cadastrado.
const SHIPPING_TABLE_ES: ShippingBand[] = [
  { minSubtotal: 0, maxSubtotal: 19.99, shipping: 5.9 },
  { minSubtotal: 20, maxSubtotal: 34.99, shipping: 4.9 },
  { minSubtotal: 35, maxSubtotal: 49.99, shipping: 3.9 },
  { minSubtotal: 50, maxSubtotal: Number.POSITIVE_INFINITY, shipping: 0 },
];

const DEFAULT_LOGISTIC_COST = 4.8;

export const FREE_SHIPPING_FROM = 50;

// Frete do pedido. Cada produto pode ter o seu frete (Admin → Produtos →
// "Frete (€)"); tudo vai num pacote so, entao o pedido paga o MAIOR frete
// entre os produtos do carrinho. Produto sem frete proprio usa a tabela
// padrao. A partir de FREE_SHIPPING_FROM o frete e gratis.
export function resolveShipping(subtotal: number, country?: string, itemShipping: Array<number | null | undefined> = []): number {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  if (safeSubtotal >= FREE_SHIPPING_FROM) return 0;
  const tableValue = tableShipping(safeSubtotal, country);
  if (itemShipping.length === 0) return tableValue;
  const perItem = itemShipping.map((v) => (v != null && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : tableValue));
  return Number(Math.max(...perItem).toFixed(2));
}

function tableShipping(safeSubtotal: number, country?: string): number {
  const normalizedCountry = String(country || 'ES').toUpperCase();

  // For now ES/PT use the same internal policy.
  const table = normalizedCountry === 'PT' || normalizedCountry === 'ES'
    ? SHIPPING_TABLE_ES
    : SHIPPING_TABLE_ES;

  const band = table.find(
    (row) => safeSubtotal >= row.minSubtotal && safeSubtotal <= row.maxSubtotal
  );

  return Number((band?.shipping ?? 0).toFixed(2));
}

export function calculateFreightShare(
  shippingCharged: number,
  logisticCost = DEFAULT_LOGISTIC_COST
): number {
  const share = Math.max(0, Number(logisticCost) - Number(shippingCharged));
  return Number(share.toFixed(2));
}
