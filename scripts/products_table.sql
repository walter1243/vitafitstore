-- Criação/alteração da tabela products para suportar todos os campos necessários
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC,
    category TEXT,
    image TEXT,
    additional_images JSONB NOT NULL DEFAULT '[]'::jsonb,
    stock INTEGER,
    video TEXT,
    position INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Caso a tabela já exista, adicione as colunas que faltam:
ALTER TABLE products ADD COLUMN IF NOT EXISTS video TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS additional_images JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS position INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Kits por produto (produto principal + complementos)
CREATE TABLE IF NOT EXISTS product_kits (
    id SERIAL PRIMARY KEY,
    base_product_id INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_kit_items (
    id SERIAL PRIMARY KEY,
    kit_id INTEGER NOT NULL REFERENCES product_kits(id) ON DELETE CASCADE,
    related_product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (kit_id, related_product_id)
);
