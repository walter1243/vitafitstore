-- ============================================================
-- VitaFit Store — Schema completo para Neon PostgreSQL
-- Execute este arquivo inteiro no SQL Editor do painel Neon
-- ============================================================

-- ── Tabela: products ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  category    TEXT,
  image       TEXT,        -- base64 ou URL da imagem principal
  video       TEXT,        -- URL do vídeo (YouTube, MP4, etc.)
  stock       INTEGER     DEFAULT 0,
  created_at  TIMESTAMP   DEFAULT NOW()
);

-- Adiciona colunas que podem estar faltando (idempotente)
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category    TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image       TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS video       TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock       INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at  TIMESTAMP DEFAULT NOW();

-- ── Tabela: orders ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                 SERIAL PRIMARY KEY,
  customer_name      TEXT,
  product_id         INTEGER REFERENCES products(id) ON DELETE SET NULL,
  total_amount       NUMERIC(10,2) DEFAULT 0,
  status             TEXT DEFAULT 'pending',  -- pending | shipped | delivered
  tracking_code      TEXT DEFAULT '',
  stripe_payment_id  TEXT,
  created_at         TIMESTAMP DEFAULT NOW()
);

-- Adiciona colunas que podem estar faltando (idempotente)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount      NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status            TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code     TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at        TIMESTAMP DEFAULT NOW();
