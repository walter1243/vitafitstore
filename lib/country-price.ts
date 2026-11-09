// Frete embutido no preco: parte do frete do pais (Admin → Envio por país,
// "% no produto") sobe pro preco de cada unidade vendida e sai do frete cobrado.
// Vale para a Espanha tambem. A loja nunca paga frete: o que vai no preco so
// desconta do frete real, e o frete cobrado nunca fica abaixo de 0.
//   acrescimo por unidade = arredonda pra cima(% × preco ate 2 kg)
//   frete cobrado = frete − acrescimo × unidades (nunca abaixo de 0)
// Um pack conta como 1 unidade.
import { getZone } from '@/lib/shipping-zones';
import { parsePersonalize } from '@/lib/personalize';

export const COUNTRY_COOKIE = 'kt_country';

export async function countrySurcharge(country: string | null | undefined): Promise<number> {
  const code = String(country || 'ES').toUpperCase();
  const zone = await getZone(code).catch(() => null);
  // caixa "Embutir no preço" desmarcada = preço normal e frete real
  if (!zone || !zone.enabled || !zone.embedOn || !(zone.embedPct > 0)) return 0;
  return Math.ceil((zone.embedPct / 100) * zone.priceLight);
}

// Mesmo produto com o acrescimo no preco, no pack e nos precos por tamanho.
export function withSurcharge<T extends { price: unknown; personalize?: unknown }>(row: T, s: number): T {
  if (!(s > 0)) return row;
  const raw = row.personalize;
  let pers: any = raw;
  if (raw) {
    const obj = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : { ...(raw as object) };
    if (obj && typeof obj === 'object') {
      const p = parsePersonalize(obj);
      if (Number(obj.packPrice) > 0) obj.packPrice = Math.round((Number(obj.packPrice) + s) * 100) / 100;
      if (obj.sizePrices && typeof obj.sizePrices === 'object') {
        obj.sizePrices = Object.fromEntries(Object.entries(p.sizePrices).map(([k, v]) => [k, v > 0 ? Math.round((v + s) * 100) / 100 : v]));
      }
      pers = typeof raw === 'string' ? JSON.stringify(obj) : obj;
    }
  }
  return { ...row, price: Math.round((Number(row.price) + s) * 100) / 100, personalize: pers };
}

// Unidades vendidas (pack = 1) pra descontar do frete.
export function saleUnits(items: { quantity: number; personalize?: unknown }[]) {
  return items.reduce((n, it) => {
    const p = parsePersonalize(it.personalize);
    const per = p.saleMode === 'pack' && p.packPrice > 0 && p.packQty > 0 ? p.packQty : 1;
    return n + Math.max(1, Math.round(Number(it.quantity || 0) / per));
  }, 0);
}

// Pais de quem esta vendo: o escolhido no checkout (cookie) ou o da
// localizacao (Vercel). Codigo de 2 letras; sem nada, Espanha.
export function viewerCountry(cookieValue: string | undefined | null, geoHeader: string | undefined | null) {
  const c = String(cookieValue || '').toUpperCase();
  if (/^[A-Z]{2}$/.test(c)) return c;
  const g = String(geoHeader || '').toUpperCase();
  return /^[A-Z]{2}$/.test(g) ? g : 'ES';
}
