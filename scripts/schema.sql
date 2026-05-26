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
  position    INTEGER,
  stock       INTEGER     DEFAULT 0,
  created_at  TIMESTAMP   DEFAULT NOW()
);

-- Adiciona colunas que podem estar faltando (idempotente)
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category    TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image       TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS video       TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS position    INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock       INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at  TIMESTAMP DEFAULT NOW();

-- Preenche posição para produtos antigos
WITH ranked_products AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC, id DESC) AS rn
  FROM products
)
UPDATE products p
SET position = rp.rn
FROM ranked_products rp
WHERE p.id = rp.id AND p.position IS NULL;

-- ── Tabela: categories ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  position   INTEGER NOT NULL DEFAULT 999,
  enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  banner_type TEXT DEFAULT 'image',
  banner_url TEXT,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE categories ADD COLUMN IF NOT EXISTS banner_type TEXT DEFAULT 'image';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- ── Tabela: orders ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                 SERIAL PRIMARY KEY,
  customer_name      TEXT,
  customer_email     TEXT,
  customer_phone     TEXT,
  address_line       TEXT,
  postal_code        TEXT,
  city               TEXT,
  country            TEXT,
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
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email    TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone    TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_line      TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS postal_code       TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS city              TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS country           TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at        TIMESTAMP DEFAULT NOW();

-- ── Tabela: store_settings ──────────────────────────────────
CREATE TABLE IF NOT EXISTS store_settings (
  id          INTEGER PRIMARY KEY,
  store_name  TEXT NOT NULL DEFAULT 'VitaFit Store',
  logo_url    TEXT,
  theme_color TEXT NOT NULL DEFAULT '#10b981',
  instagram   TEXT,
  facebook    TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO store_settings (id, store_name, theme_color)
VALUES (1, 'VitaFit Store', '#10b981')
ON CONFLICT (id) DO NOTHING;

-- ── Tabela: home_blocks (fase 2) ───────────────────────────
CREATE TABLE IF NOT EXISTS home_blocks (
  block_key TEXT PRIMARY KEY,
  label     TEXT NOT NULL,
  position  INTEGER NOT NULL,
  enabled   BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO home_blocks (block_key, label, position, enabled) VALUES
('hero', 'Hero Vídeo', 1, TRUE),
('trust', 'Selos de Confiança', 2, TRUE),
('products', 'Produtos', 3, TRUE),
('pin', 'Sessão Pin', 4, TRUE),
('newsletter', 'Newsletter', 5, TRUE)
ON CONFLICT (block_key) DO NOTHING;
