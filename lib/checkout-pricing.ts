type ShippingBand = {
  minSubtotal: number;
  maxSubtotal: number;
  shipping: number;
};

// Internal-only shipping table. Keep this on the server side.
const SHIPPING_TABLE_ES: ShippingBand[] = [
  { minSubtotal: 0, maxSubtotal: 19.99, shipping: 5.9 },
  { minSubtotal: 20, maxSubtotal: 34.99, shipping: 4.9 },
  { minSubtotal: 35, maxSubtotal: 49.99, shipping: 3.9 },
  { minSubtotal: 50, maxSubtotal: Number.POSITIVE_INFINITY, shipping: 0 },
];

const DEFAULT_LOGISTIC_COST = 4.8;

export function resolveShipping(subtotal: number, country?: string): number {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
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
