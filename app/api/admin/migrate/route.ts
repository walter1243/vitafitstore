import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST() {
  try {
    const migrations: { name: string; ok: boolean; error?: string }[] = [];

    async function run(name: string, fn: () => Promise<any>) {
      try {
        await fn();
        migrations.push({ name, ok: true });
      } catch (err: any) {
        migrations.push({ name, ok: false, error: err?.message });
      }
    }

    // products
    await run('products.additional_images', () => sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS additional_images JSONB NOT NULL DEFAULT '[]'::jsonb
    `);
    await run('products.video', () => sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS video TEXT
    `);
    await run('products.position', () => sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS position INTEGER
    `);
    await run('products.stock', () => sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0
    `);
    await run('products.created_at', () => sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()
    `);

    // categories
    await run('categories.banner_type', () => sql`
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS banner_type TEXT DEFAULT 'image'
    `);
    await run('categories.banner_url', () => sql`
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS banner_url TEXT
    `);
    await run('categories.logo_url', () => sql`
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS logo_url TEXT
    `);

    // orders
    await run('orders.total_amount', () => sql`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) DEFAULT 0
    `);
    await run('orders.status', () => sql`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
    `);
    await run('orders.tracking_code', () => sql`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code TEXT DEFAULT ''
    `);
    await run('orders.stripe_payment_id', () => sql`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT
    `);
    await run('orders.customer_email', () => sql`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT
    `);
    await run('orders.customer_phone', () => sql`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT
    `);
    await run('orders.address_line', () => sql`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_line TEXT
    `);
    await run('orders.postal_code', () => sql`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS postal_code TEXT
    `);
    await run('orders.city', () => sql`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS city TEXT
    `);
    await run('orders.country', () => sql`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS country TEXT
    `);

    // customer_access_tokens
    await run('customer_access_tokens.create', () => sql`
      CREATE TABLE IF NOT EXISTS customer_access_tokens (
        id            SERIAL PRIMARY KEY,
        order_id      INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
        token_hash    TEXT NOT NULL UNIQUE,
        channel_phone TEXT,
        channel_email TEXT,
        status        TEXT NOT NULL DEFAULT 'active',
        created_at    TIMESTAMP DEFAULT NOW(),
        expires_at    TIMESTAMP NOT NULL,
        used_at       TIMESTAMP
      )
    `);

    const failed = migrations.filter(m => !m.ok);
    return NextResponse.json({
      ok: failed.length === 0,
      applied: migrations.length,
      results: migrations,
      ...(failed.length > 0 && { errors: failed }),
    });
  } catch (err: any) {
    console.error('[POST /api/admin/migrate]', err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'Migration failed' }, { status: 500 });
  }
}
