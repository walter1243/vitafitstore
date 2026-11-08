import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Verificação "sou humano" do Cloudflare Turnstile na entrada da loja
// (components/human-check.tsx). O navegador resolve o desafio, manda o token aqui,
// o servidor confirma com o Cloudflare e grava um cookie assinado que vale até
// fechar o navegador. Precisa de NEXT_PUBLIC_TURNSTILE_SITE_KEY e TURNSTILE_SECRET_KEY.

export const dynamic = 'force-dynamic'

const COOKIE = 'kt_hv'
const MAX_AGE_MS = 12 * 60 * 60 * 1000 // mesmo com o navegador aberto, pede de novo depois de 12 h
const noStore = { 'Cache-Control': 'no-store' }

const secret = () => process.env.TURNSTILE_SECRET_KEY || ''
const sign = (v: string) => crypto.createHmac('sha256', secret()).update(v).digest('base64url')

function validCookie(req: NextRequest): boolean {
  const raw = req.cookies.get(COOKIE)?.value
  if (!raw || !secret()) return false
  const [ts, sig] = raw.split('.')
  if (!ts || !sig || Date.now() - Number(ts) > MAX_AGE_MS) return false
  const expected = sign(ts)
  return sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
}

export async function GET(req: NextRequest) {
  const enabled = Boolean(secret() && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  return NextResponse.json({ enabled, verified: !enabled || validCookie(req) }, { headers: noStore })
}

export async function POST(req: NextRequest) {
  // Sem a chave secreta configurada a verificação fica desligada (nunca trava a loja).
  if (!secret()) return NextResponse.json({ ok: true, skipped: true }, { headers: noStore })

  const body = await req.json().catch(() => ({} as any))
  const token = String(body?.token ?? '')
  if (!token || token.length > 2048) return NextResponse.json({ ok: false, error: 'token' }, { status: 400, headers: noStore })

  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
  let success = false
  let codes: string[] = []
  try {
    const form = new URLSearchParams({ secret: secret(), response: token })
    if (ip) form.set('remoteip', ip)
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form, cache: 'no-store' })
    const d = await r.json()
    success = Boolean(d?.success)
    codes = Array.isArray(d?.['error-codes']) ? d['error-codes'] : []
  } catch (err) {
    // Cloudflare fora do ar: deixa entrar em vez de perder a venda.
    console.error('[human-check] siteverify indisponível', err)
    success = true
  }

  if (!success) return NextResponse.json({ ok: false, error: codes.join(',') || 'invalid' }, { status: 403, headers: noStore })

  const ts = String(Date.now())
  const res = NextResponse.json({ ok: true }, { headers: noStore })
  // sem maxAge: cookie de sessão (some ao fechar o navegador → nova verificação na próxima visita)
  res.cookies.set(COOKIE, `${ts}.${sign(ts)}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' })
  return res
}
