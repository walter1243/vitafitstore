import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS automation_settings (
      id                   INTEGER PRIMARY KEY DEFAULT 1,
      automation_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
      whatsapp_provider    TEXT    DEFAULT 'zapi',
      whatsapp_url         TEXT,
      whatsapp_token       TEXT,
      sendgrid_key         TEXT,
      notify_email         TEXT,
      notify_whatsapp      BOOLEAN NOT NULL DEFAULT TRUE,
      notify_email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at           TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`INSERT INTO automation_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`
}

export async function GET() {
  try {
    await ensureTable()
    const [row] = await sql`SELECT * FROM automation_settings WHERE id = 1`
    return NextResponse.json(row ?? {})
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable()
    const {
      automationEnabled,
      whatsappProvider,
      whatsappUrl,
      whatsappToken,
      sendgridKey,
      notifyEmail,
      notifyWhatsapp,
      notifyEmailEnabled,
    } = await req.json()

    const [row] = await sql`
      UPDATE automation_settings
      SET
        automation_enabled   = COALESCE(${automationEnabled ?? null}, automation_enabled),
        whatsapp_provider    = COALESCE(${whatsappProvider ?? null}, whatsapp_provider),
        whatsapp_url         = COALESCE(${whatsappUrl ?? null}, whatsapp_url),
        whatsapp_token       = COALESCE(${whatsappToken ?? null}, whatsapp_token),
        sendgrid_key         = COALESCE(${sendgridKey ?? null}, sendgrid_key),
        notify_email         = COALESCE(${notifyEmail ?? null}, notify_email),
        notify_whatsapp      = COALESCE(${notifyWhatsapp ?? null}, notify_whatsapp),
        notify_email_enabled = COALESCE(${notifyEmailEnabled ?? null}, notify_email_enabled),
        updated_at           = NOW()
      WHERE id = 1
      RETURNING *
    `
    return NextResponse.json(row)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
