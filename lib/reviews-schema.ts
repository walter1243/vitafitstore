import { sql } from '@/lib/db';

// Tabela de avaliacoes. `source`:
//  - 'order'  → cliente real pelo link do pedido (Compra verificada)
//  - 'manual' → depoimento real recebido fora do site (WhatsApp, Instagram,
//               feira...) e cadastrado no painel; `source_note` diz de onde veio.
export async function ensureReviewsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS product_reviews (
      id             SERIAL PRIMARY KEY,
      product_id     INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      order_id       INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      customer_name  TEXT NOT NULL,
      rating         INTEGER NOT NULL,
      comment        TEXT,
      photo_url      TEXT,
      status         TEXT NOT NULL DEFAULT 'pending',
      created_at     TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS product_reviews_order_id_key ON product_reviews (order_id) WHERE order_id IS NOT NULL`;
  await sql`ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'order'`;
  await sql`ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS country TEXT`;
  await sql`ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS language TEXT`;
  await sql`ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS source_note TEXT`;
}

export const REVIEW_COUNTRIES = ['ES', 'PT', 'FR', 'IT', 'DE', 'GB', 'NL', 'BE', 'BR', 'AR', 'MX', 'US'] as const;
export const REVIEW_LANGUAGES = ['es', 'ca', 'pt', 'en', 'fr', 'it', 'de'] as const;

// Quantos depoimentos aparecem antes do "Ver más" (computador; no celular, a metade).
export async function getReviewsVisible() {
  await sql`CREATE TABLE IF NOT EXISTS review_settings (id INTEGER PRIMARY KEY, visible INTEGER NOT NULL DEFAULT 10)`;
  const [row] = await sql`SELECT visible FROM review_settings WHERE id = 1`;
  return row ? Number(row.visible) : 10;
}
export async function setReviewsVisible(n: number) {
  const v = Math.max(1, Math.min(50, Math.round(n)));
  await sql`CREATE TABLE IF NOT EXISTS review_settings (id INTEGER PRIMARY KEY, visible INTEGER NOT NULL DEFAULT 10)`;
  await sql`INSERT INTO review_settings (id, visible) VALUES (1, ${v}) ON CONFLICT (id) DO UPDATE SET visible = ${v}`;
  return v;
}
