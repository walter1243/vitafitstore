import { sql } from '@/lib/db';

// Estatisticas proprias da loja (visitas, produtos vistos/clicados,
// adicionados ao carrinho). Sem cookies: o "visitante" e um hash diario de
// IP + navegador, que muda todo dia e nao identifica ninguem.

export const EVENT_TYPES = ['page_view', 'product_click', 'add_to_cart'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

// Cookie gravado quando o admin abre o Dashboard: esse aparelho nunca mais
// conta nas estatisticas, mesmo depois de sair do painel.
export const IGNORE_COOKIE = 'kt_ignore';

// Pais, cidade e coordenadas aproximadas da requisicao (cabecalhos da Vercel).
// Coordenadas com 2 casas (~1 km): serve pro mapa, nao localiza ninguem.
export function geoFromHeaders(h: Headers) {
  const country = (h.get('x-vercel-ip-country') ?? '').toUpperCase().slice(0, 2) || null;
  let city: string | null = null;
  try { city = decodeURIComponent(h.get('x-vercel-ip-city') ?? '').slice(0, 80) || null; } catch { city = null; }
  const round = (v: string | null) => { const n = Number(v); return v && Number.isFinite(n) ? Math.round(n * 100) / 100 : null; };
  return { country, city, lat: round(h.get('x-vercel-ip-latitude')), lng: round(h.get('x-vercel-ip-longitude')) };
}

let ready: Promise<void> | null = null;
export function ensureSiteEvents() {
  ready ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS site_events (
        id BIGSERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        path TEXT,
        product_id INT,
        visitor TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS site_events_created_idx ON site_events (created_at)`;
    // Regiao aproximada (nivel de cidade) informada pela Vercel; o IP nao e guardado.
    await sql`ALTER TABLE site_events ADD COLUMN IF NOT EXISTS country TEXT`;
    await sql`ALTER TABLE site_events ADD COLUMN IF NOT EXISTS city TEXT`;
    await sql`ALTER TABLE site_events ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION`;
    await sql`ALTER TABLE site_events ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION`;
  })().catch((e) => { ready = null; throw e; });
  return ready;
}
