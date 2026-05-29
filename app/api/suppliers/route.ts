import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS suppliers (
      id                     SERIAL PRIMARY KEY,
      name                   TEXT NOT NULL,
      base_url               TEXT NOT NULL,
      api_key                TEXT,
      active                 BOOLEAN NOT NULL DEFAULT TRUE,
      scraper_url_template   TEXT,
      scraper_stock_selector TEXT,
      created_at             TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS scraper_url_template   TEXT`
  await sql`ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS scraper_stock_selector TEXT`
  await sql`ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS shopify_domain         TEXT`
  await sql`ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS shopify_access_token   TEXT`
  await sql`ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS order_method           TEXT DEFAULT 'email'`
  await sql`ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_email          TEXT`
  await sql`ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_whatsapp       TEXT`
}

export async function GET() {
  try {
    await ensureTable()
    const suppliers = await sql`
      SELECT id, name, base_url, api_key, active,
             scraper_url_template, scraper_stock_selector,
             shopify_domain, order_method, contact_email, contact_whatsapp,
             created_at
      FROM suppliers
      ORDER BY id
    `
    return NextResponse.json(suppliers)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable()
    const { name, baseUrl, apiKey, shopifyDomain, shopifyAccessToken, orderMethod, contactEmail, contactWhatsapp } = await req.json()
    if (!name || !baseUrl) {
      return NextResponse.json({ error: 'name e baseUrl são obrigatórios' }, { status: 400 })
    }
    const [row] = await sql`
      INSERT INTO suppliers (name, base_url, api_key, shopify_domain, shopify_access_token, order_method, contact_email, contact_whatsapp)
      VALUES (${name}, ${baseUrl}, ${apiKey ?? null}, ${shopifyDomain ?? null}, ${shopifyAccessToken ?? null}, ${orderMethod ?? 'email'}, ${contactEmail ?? null}, ${contactWhatsapp ?? null})
      RETURNING id, name, base_url, api_key, active, shopify_domain, order_method, contact_email, contact_whatsapp
    `
    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const {
      id, name, baseUrl, apiKey, active,
      scraperUrlTemplate, scraperStockSelector,
      shopifyDomain, shopifyAccessToken, orderMethod, contactEmail, contactWhatsapp,
    } = await req.json()
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const [row] = await sql`
      UPDATE suppliers
      SET
        name                   = COALESCE(${name ?? null}, name),
        base_url               = COALESCE(${baseUrl ?? null}, base_url),
        api_key                = COALESCE(${apiKey ?? null}, api_key),
        active                 = COALESCE(${active ?? null}, active),
        scraper_url_template   = COALESCE(${scraperUrlTemplate ?? null}, scraper_url_template),
        scraper_stock_selector = COALESCE(${scraperStockSelector ?? null}, scraper_stock_selector),
        shopify_domain         = COALESCE(${shopifyDomain ?? null}, shopify_domain),
        shopify_access_token   = COALESCE(${shopifyAccessToken ?? null}, shopify_access_token),
        order_method           = COALESCE(${orderMethod ?? null}, order_method),
        contact_email          = COALESCE(${contactEmail ?? null}, contact_email),
        contact_whatsapp       = COALESCE(${contactWhatsapp ?? null}, contact_whatsapp)
      WHERE id = ${id}
      RETURNING id, name, base_url, api_key, active,
                scraper_url_template, scraper_stock_selector,
                shopify_domain, order_method, contact_email, contact_whatsapp
    `
    return NextResponse.json(row)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    await sql`DELETE FROM suppliers WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
