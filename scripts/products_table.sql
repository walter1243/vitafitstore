-- Criação/alteração da tabela products para suportar todos os campos necessários
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC,
    category TEXT,
    image TEXT,
    stock INTEGER,
    video TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Caso a tabela já exista, adicione as colunas que faltam:
ALTER TABLE products ADD COLUMN IF NOT EXISTS video TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
