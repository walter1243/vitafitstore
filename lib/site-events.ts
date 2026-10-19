import { sql } from '@/lib/db';

// Estatisticas proprias da loja (visitas, produtos vistos/clicados,
// adicionados ao carrinho). Sem cookies: o "visitante" e um hash diario de
// IP + navegador, que muda todo dia e nao identifica ninguem.

export const EVENT_TYPES = ['page_view', 'product_click', 'add_to_cart'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

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
  })().catch((e) => { ready = null; throw e; });
  return ready;
}
