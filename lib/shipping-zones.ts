// Paises para onde a loja envia (Admin → Envio por país).
// mode 'packlink': frete calculado pela Packlink (Espanha e onde ela vende);
//   se a Packlink nao responder, usa os precos dos Correos abaixo.
// mode 'correos': tabela fixa dos Correos (envio manual), so a domicilio:
//   price_light ate 2 kg (Paquete Internacional Light) e price_heavy acima.
// free_over: frete gratis a partir desse subtotal (vazio = nunca).
// embed_on: liga/desliga o frete embutido do país (a % fica guardada mesmo desligado).
// embed_pct: % do frete (preco ate 2 kg) embutido no preco dos produtos
//   pra quem e desse pais (lib/country-price.ts). Espanha: 0.
import { sql } from '@/lib/db';

export type ZoneMode = 'packlink' | 'correos';
export type ShippingZone = {
  code: string;
  name: string;
  mode: ZoneMode;
  priceLight: number;
  priceHeavy: number;
  freeOver: number | null;
  embedPct: number;
  embedOn: boolean;
  enabled: boolean;
  position: number;
};

export const LIGHT_MAX_KG = 2;

const SEED: Omit<ShippingZone, 'position' | 'embedOn'>[] = [
  { code: 'ES', name: 'España', mode: 'packlink', priceLight: 6, priceHeavy: 9, freeOver: 50, embedPct: 0, enabled: true },
  { code: 'PT', name: 'Portugal', mode: 'packlink', priceLight: 7, priceHeavy: 32, freeOver: null, embedPct: 60, enabled: true },
  { code: 'FR', name: 'Francia', mode: 'packlink', priceLight: 10, priceHeavy: 32, freeOver: null, embedPct: 60, enabled: true },
  { code: 'DE', name: 'Alemania', mode: 'packlink', priceLight: 10, priceHeavy: 32, freeOver: null, embedPct: 60, enabled: true },
  { code: 'IT', name: 'Italia', mode: 'packlink', priceLight: 10, priceHeavy: 32, freeOver: null, embedPct: 60, enabled: true },
  { code: 'BE', name: 'Bélgica', mode: 'packlink', priceLight: 10, priceHeavy: 32, freeOver: null, embedPct: 60, enabled: true },
  { code: 'AT', name: 'Austria', mode: 'packlink', priceLight: 10, priceHeavy: 32, freeOver: null, embedPct: 60, enabled: true },
  { code: 'NL', name: 'Países Bajos', mode: 'correos', priceLight: 15, priceHeavy: 32, freeOver: null, embedPct: 60, enabled: true },
  { code: 'IE', name: 'Irlanda', mode: 'correos', priceLight: 15, priceHeavy: 32, freeOver: null, embedPct: 60, enabled: true },
  { code: 'GB', name: 'Reino Unido', mode: 'correos', priceLight: 20, priceHeavy: 35, freeOver: null, embedPct: 60, enabled: true },
  { code: 'CH', name: 'Suiza', mode: 'packlink', priceLight: 12, priceHeavy: 35, freeOver: null, embedPct: 60, enabled: true },
  { code: 'US', name: 'Estados Unidos', mode: 'correos', priceLight: 22, priceHeavy: 35, freeOver: null, embedPct: 60, enabled: true },
  { code: 'BR', name: 'Brasil', mode: 'packlink', priceLight: 14, priceHeavy: 40, freeOver: null, embedPct: 60, enabled: true },
];

let ready: Promise<void> | null = null;
export function ensureZonesTable() {
  ready ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS shipping_zones (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mode TEXT NOT NULL DEFAULT 'correos',
        price_light NUMERIC(10,2) NOT NULL DEFAULT 0,
        price_heavy NUMERIC(10,2) NOT NULL DEFAULT 0,
        free_over NUMERIC(10,2),
        embed_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        position INT NOT NULL DEFAULT 0
      )`;
    // Frete embutido (novo): 60% fora da Espanha; nos paises da Packlink o
    // preco de referencia passa a ser perto do que ela cobra.
    const col = await sql`SELECT 1 FROM information_schema.columns WHERE table_name = 'shipping_zones' AND column_name = 'embed_pct'`;
    if ((col as any[]).length === 0) {
      await sql`ALTER TABLE shipping_zones ADD COLUMN IF NOT EXISTS embed_pct NUMERIC(5,2) NOT NULL DEFAULT 0`;
      await sql`UPDATE shipping_zones SET embed_pct = 60 WHERE code <> 'ES'`;
      for (const z of SEED) {
        if (z.mode === 'packlink' && z.code !== 'ES') await sql`UPDATE shipping_zones SET price_light = ${z.priceLight} WHERE code = ${z.code} AND mode = 'packlink' AND price_light IN (15, 20, 25)`;
      }
    }
    // Caixa "Embutir no preço" por país. Ao criar a coluna: Espanha desligada (frete real,
    // preço normal) e os outros países continuam como estavam.
    const onCol = await sql`SELECT 1 FROM information_schema.columns WHERE table_name = 'shipping_zones' AND column_name = 'embed_on'`;
    if ((onCol as any[]).length === 0) {
      await sql`ALTER TABLE shipping_zones ADD COLUMN IF NOT EXISTS embed_on BOOLEAN NOT NULL DEFAULT TRUE`;
      await sql`UPDATE shipping_zones SET embed_on = FALSE WHERE code = 'ES'`;
    }
    // Uma vez só (nov/2026): todos os países voltam ao preço real, sem frete embutido.
    // As % ficam guardadas; para testar de novo, marque "Embutir no preço" no admin.
    await sql`CREATE TABLE IF NOT EXISTS app_migrations (name TEXT PRIMARY KEY, done_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    const done = await sql`INSERT INTO app_migrations (name) VALUES ('embed_off_all_2026_11') ON CONFLICT (name) DO NOTHING RETURNING name`;
    if ((done as any[]).length > 0) await sql`UPDATE shipping_zones SET embed_on = FALSE`;
    const rows = await sql`SELECT COUNT(*)::int AS n FROM shipping_zones`;
    if (Number((rows as any[])[0]?.n ?? 0) === 0) {
      let i = 0;
      for (const z of SEED) {
        await sql`INSERT INTO shipping_zones (code, name, mode, price_light, price_heavy, free_over, embed_pct, embed_on, enabled, position)
          VALUES (${z.code}, ${z.name}, ${z.mode}, ${z.priceLight}, ${z.priceHeavy}, ${z.freeOver}, ${z.embedPct}, ${z.code !== 'ES'}, ${z.enabled}, ${i++})
          ON CONFLICT (code) DO NOTHING`;
      }
    }
  })().catch((e) => { ready = null; throw e; });
  return ready;
}

const toZone = (r: any): ShippingZone => ({
  code: String(r.code),
  name: String(r.name),
  mode: r.mode === 'packlink' ? 'packlink' : 'correos',
  priceLight: Number(r.price_light),
  priceHeavy: Number(r.price_heavy),
  freeOver: r.free_over == null ? null : Number(r.free_over),
  embedPct: Number(r.embed_pct ?? 0),
  embedOn: r.embed_on == null ? r.code !== 'ES' : Boolean(r.embed_on),
  enabled: Boolean(r.enabled),
  position: Number(r.position),
});

export async function getZones(onlyEnabled = false): Promise<ShippingZone[]> {
  await ensureZonesTable();
  const rows = await sql`SELECT * FROM shipping_zones ORDER BY position, name`;
  return (rows as any[]).map(toZone).filter((z) => !onlyEnabled || z.enabled);
}

export async function getZone(code: string): Promise<ShippingZone | null> {
  await ensureZonesTable();
  const rows = await sql`SELECT * FROM shipping_zones WHERE code = ${String(code || '').toUpperCase().slice(0, 2)}`;
  const z = (rows as any[])[0];
  return z ? toZone(z) : null;
}

// Substitui a lista inteira (tela do admin).
export async function saveZones(list: unknown): Promise<ShippingZone[]> {
  await ensureZonesTable();
  if (!Array.isArray(list)) throw new Error('Lista inválida.');
  const money = (v: unknown) => { const n = Math.round(Number(v) * 100) / 100; return Number.isFinite(n) && n >= 0 && n < 10000 ? n : 0; };
  const seen = new Set<string>();
  const clean = list.slice(0, 120).map((z: any, i) => ({
    code: String(z?.code ?? '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2),
    name: String(z?.name ?? '').trim().slice(0, 60),
    mode: (z?.mode === 'packlink' ? 'packlink' : 'correos') as ZoneMode,
    priceLight: money(z?.priceLight),
    priceHeavy: money(z?.priceHeavy),
    freeOver: z?.freeOver === null || z?.freeOver === '' || z?.freeOver === undefined ? null : money(z.freeOver),
    embedPct: Math.min(100, Math.max(0, Math.round(Number(z?.embedPct) || 0))),
    embedOn: z?.embedOn === true,
    enabled: z?.enabled !== false,
    position: i,
  })).filter((z) => z.code.length === 2 && z.name && !seen.has(z.code) && seen.add(z.code));
  if (!clean.some((z) => z.code === 'ES')) throw new Error('A Espanha precisa ficar na lista.');
  await sql`DELETE FROM shipping_zones WHERE NOT (code = ANY(${clean.map((z) => z.code)}))`;
  for (const z of clean) {
    await sql`INSERT INTO shipping_zones (code, name, mode, price_light, price_heavy, free_over, embed_pct, embed_on, enabled, position)
      VALUES (${z.code}, ${z.name}, ${z.mode}, ${z.priceLight}, ${z.priceHeavy}, ${z.freeOver}, ${z.embedPct}, ${z.embedOn}, ${z.enabled}, ${z.position})
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, mode = EXCLUDED.mode, price_light = EXCLUDED.price_light,
        price_heavy = EXCLUDED.price_heavy, free_over = EXCLUDED.free_over, embed_pct = EXCLUDED.embed_pct, embed_on = EXCLUDED.embed_on, enabled = EXCLUDED.enabled, position = EXCLUDED.position`;
  }
  return getZones();
}

// Preco da tabela dos Correos pelo peso da caixa.
export const correosPrice = (z: ShippingZone, weightKg: number) => (weightKg <= LIGHT_MAX_KG ? z.priceLight : z.priceHeavy);

// CP: Espanha 5 digitos; outros paises letras/numeros (ate 10).
export function cleanPostal(country: string, zip: string) {
  return String(country).toUpperCase() === 'ES'
    ? String(zip || '').replace(/\D/g, '').slice(0, 5)
    : String(zip || '').toUpperCase().replace(/[^A-Z0-9 -]/g, '').trim().slice(0, 10);
}
