// Caixa de envio. Cada produto tem peso e medidas (Admin → Produtos →
// "Caixa de envio"); o pedido vira UMA caixa: o maior comprimento/largura,
// as alturas somadas (empilhadas) e os pesos somados. Sem banco: serve pro
// servidor e pro navegador.

export type Parcel = { weight: number; length: number; width: number; height: number };

// Padrao pra produto sem medidas cadastradas (caixa pequena).
export const DEFAULT_PARCEL: Parcel = { weight: 0.3, length: 20, width: 15, height: 10 };

const num = (v: unknown, min: number, max: number, def: number) => {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.min(max, Math.max(min, n)) : def;
};

export function parseParcel(raw: unknown): Parcel {
  let o: any = {};
  if (typeof raw === 'string' && raw.trim()) { try { o = JSON.parse(raw); } catch { o = {}; } }
  else if (raw && typeof raw === 'object') o = raw;
  return {
    weight: num(o.weight, 0.01, 70, DEFAULT_PARCEL.weight),
    length: num(o.length, 1, 200, DEFAULT_PARCEL.length),
    width: num(o.width, 1, 200, DEFAULT_PARCEL.width),
    height: num(o.height, 1, 200, DEFAULT_PARCEL.height),
  };
}

// Junta os itens do pedido numa caixa so.
export function combineParcels(lines: { parcel: unknown; quantity: number }[]): Parcel {
  if (lines.length === 0) return DEFAULT_PARCEL;
  let weight = 0, length = 0, width = 0, height = 0;
  for (const l of lines) {
    const p = parseParcel(l.parcel);
    const q = Math.max(1, Math.floor(l.quantity || 1));
    weight += p.weight * q;
    length = Math.max(length, p.length);
    width = Math.max(width, p.width);
    height += p.height * q;
  }
  // Muita coisa empilhada: reparte a altura em camadas lado a lado.
  while (height > 60 && width < 60) { height = Math.ceil(height / 2); width = Math.min(200, width * 2); }
  return { weight: Math.round(weight * 100) / 100, length: Math.round(length), width: Math.round(width), height: Math.min(200, Math.round(height)) };
}
