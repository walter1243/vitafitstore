import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS suppliers (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      base_url   TEXT NOT NULL,
      api_key    TEXT,
      active     BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
}

export async function GET() {
  try {
    await ensureTable()
    const suppliers = await sql`
      SELECT id, name, base_url, api_key, active, created_at
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
    const { name, baseUrl, apiKey } = await req.json()
    if (!name || !baseUrl) {
      return NextResponse.json({ error: 'name e baseUrl são obrigatórios' }, { status: 400 })
    }
    const [row] = await sql`
      INSERT INTO suppliers (name, base_url, api_key)
      VALUES (${name}, ${baseUrl}, ${apiKey ?? null})
      RETURNING id, name, base_url, api_key, active
    `
    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, name, baseUrl, apiKey, active } = await req.json()
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const [row] = await sql`
      UPDATE suppliers
      SET
        name     = COALESCE(${name ?? null}, name),
        base_url = COALESCE(${baseUrl ?? null}, base_url),
        api_key  = COALESCE(${apiKey ?? null}, api_key),
        active   = COALESCE(${active ?? null}, active)
      WHERE id = ${id}
      RETURNING id, name, base_url, api_key, active
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
