import crypto from 'node:crypto'
import { sql } from '@/lib/db'

const TOKEN_TTL_DAYS = 30

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function getBaseUrl(): string {
  return process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

async function ensureTable() {
  await sql`
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
  `
}

export async function generateCustomerAccessToken(params: {
  orderId: number
  customerPhone?: string | null
  customerEmail?: string | null
}) {
  await ensureTable()

  const token = crypto.randomBytes(24).toString('hex')
  const tokenHash = hashToken(token)

  const [row] = await sql`
    INSERT INTO customer_access_tokens (
      order_id,
      token_hash,
      channel_phone,
      channel_email,
      expires_at
    )
    VALUES (
      ${params.orderId},
      ${tokenHash},
      ${params.customerPhone ?? null},
      ${params.customerEmail ?? null},
      NOW() + (${TOKEN_TTL_DAYS} * INTERVAL '1 day')
    )
    ON CONFLICT (order_id)
    DO UPDATE SET
      token_hash = EXCLUDED.token_hash,
      channel_phone = EXCLUDED.channel_phone,
      channel_email = EXCLUDED.channel_email,
      status = 'active',
      used_at = NULL,
      expires_at = EXCLUDED.expires_at
    RETURNING expires_at
  `

  const accessUrl = `${getBaseUrl()}/acesso?token=${token}`
  return {
    token,
    accessUrl,
    expiresAt: row?.expires_at,
  }
}

export async function validateCustomerAccessToken(token: string) {
  await ensureTable()

  const tokenHash = hashToken(token)
  const [row] = await sql`
    SELECT
      cat.order_id,
      cat.status,
      cat.expires_at,
      o.customer_name,
      o.customer_email,
      o.created_at,
      COALESCE(o.total_amount, 0)::FLOAT AS total_amount,
      COALESCE(p.name, 'Produto') AS product_name
    FROM customer_access_tokens cat
    JOIN orders o ON o.id = cat.order_id
    LEFT JOIN products p ON p.id = o.product_id
    WHERE cat.token_hash = ${tokenHash}
    LIMIT 1
  `

  if (!row) {
    return { valid: false as const, reason: 'token_not_found' as const }
  }

  if (row.status !== 'active') {
    return { valid: false as const, reason: 'token_inactive' as const }
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { valid: false as const, reason: 'token_expired' as const }
  }

  return {
    valid: true as const,
    order: {
      orderId: Number(row.order_id),
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      createdAt: row.created_at,
      totalAmount: Number(row.total_amount ?? 0),
      productName: row.product_name,
    },
  }
}
