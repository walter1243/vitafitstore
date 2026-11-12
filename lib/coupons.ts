import { sql } from '@/lib/db';

// Cupons de desconto (ex.: BIENVENIDOS15 do pop-up de boas-vindas).
// A imagem do pop-up sozinha nao da desconto: o que vale e o cupom
// cadastrado aqui, conferido no servidor no orcamento (quote) e de novo
// na hora de criar o pagamento (create-intent).
//
// Regras por cupom: porcentagem, ativo/inativo, so na 1a compra (conferido
// pelo e-mail do pedido), pedido minimo e data real de fim (opcional).
// O desconto vale so sobre os produtos, nunca sobre o frete.

export const DEFAULT_COUPON = 'BIENVENIDOS15';
export const DEFAULT_POPUP_IMAGE = '/images/cupom-bienvenidos15.webp';

export type CouponPopupConfig = {
  enabled: boolean;
  code: string;
  percent: number;
  firstPurchaseOnly: boolean;
  minSubtotal: number;
  endsAt: string | null; // ISO; null = sem data de fim
  delaySec: number;
  reshowDays: number; // 0 = nunca mostra de novo depois de fechar/copiar
  imageDesktop: string;
  imageMobile: string;
};

export const normalizeCode = (v: unknown) => String(v ?? '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30);

let ready: Promise<void> | null = null;
export function ensureCoupons() {
  ready ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS coupons (
        code TEXT PRIMARY KEY,
        percent NUMERIC NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        first_purchase_only BOOLEAN NOT NULL DEFAULT TRUE,
        min_subtotal NUMERIC NOT NULL DEFAULT 0,
        ends_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS coupon_popup (
        id INT PRIMARY KEY,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        code TEXT NOT NULL,
        delay_sec INT NOT NULL DEFAULT 3,
        reshow_days INT NOT NULL DEFAULT 0,
        image_desktop TEXT,
        image_mobile TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    // Pedido guarda o cupom usado e quanto foi descontado.
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC`;
    await sql`
      INSERT INTO coupons (code, percent, active, first_purchase_only)
      VALUES (${DEFAULT_COUPON}, 15, TRUE, TRUE)
      ON CONFLICT (code) DO NOTHING
    `;
    await sql`
      INSERT INTO coupon_popup (id, enabled, code, image_mobile)
      VALUES (1, TRUE, ${DEFAULT_COUPON}, ${DEFAULT_POPUP_IMAGE})
      ON CONFLICT (id) DO NOTHING
    `;
  })().catch((e) => { ready = null; throw e; });
  return ready;
}

export async function getCouponPopup(): Promise<CouponPopupConfig> {
  await ensureCoupons();
  const [r] = (await sql`
    SELECT p.enabled, p.code, p.delay_sec, p.reshow_days, p.image_desktop, p.image_mobile,
           c.percent, c.active, c.first_purchase_only, c.min_subtotal, c.ends_at
    FROM coupon_popup p LEFT JOIN coupons c ON c.code = p.code
    WHERE p.id = 1
  `) as any[];
  return {
    enabled: Boolean(r?.enabled) && Boolean(r?.active),
    code: String(r?.code ?? DEFAULT_COUPON),
    percent: Number(r?.percent ?? 15),
    firstPurchaseOnly: r?.first_purchase_only !== false,
    minSubtotal: Number(r?.min_subtotal ?? 0),
    endsAt: r?.ends_at ? new Date(r.ends_at).toISOString() : null,
    delaySec: Number(r?.delay_sec ?? 3),
    reshowDays: Number(r?.reshow_days ?? 0),
    imageDesktop: String(r?.image_desktop ?? ''),
    imageMobile: String(r?.image_mobile ?? '') || DEFAULT_POPUP_IMAGE,
  };
}

export async function saveCouponPopup(input: Partial<CouponPopupConfig>) {
  await ensureCoupons();
  const current = await getCouponPopup();
  const code = normalizeCode(input.code) || current.code;
  const percent = Math.min(90, Math.max(1, Math.round(Number(input.percent ?? current.percent) || 15)));
  const enabled = Boolean(input.enabled ?? current.enabled);
  const firstPurchaseOnly = Boolean(input.firstPurchaseOnly ?? current.firstPurchaseOnly);
  const minSubtotal = Math.max(0, Number(input.minSubtotal ?? current.minSubtotal) || 0);
  const endsRaw = input.endsAt === undefined ? current.endsAt : input.endsAt;
  const endsAt = endsRaw && !Number.isNaN(Date.parse(endsRaw)) ? new Date(endsRaw).toISOString() : null;
  const delaySec = Math.min(60, Math.max(0, Math.round(Number(input.delaySec ?? current.delaySec) || 0)));
  const reshowDays = Math.min(365, Math.max(0, Math.round(Number(input.reshowDays ?? current.reshowDays) || 0)));
  const imageDesktop = String(input.imageDesktop ?? current.imageDesktop).trim();
  const imageMobile = String(input.imageMobile ?? current.imageMobile).trim() || DEFAULT_POPUP_IMAGE;

  // Trocou o codigo: o antigo deixa de valer (so existe um cupom de campanha).
  if (code !== current.code) await sql`UPDATE coupons SET active = FALSE WHERE code = ${current.code}`;
  await sql`
    INSERT INTO coupons (code, percent, active, first_purchase_only, min_subtotal, ends_at)
    VALUES (${code}, ${percent}, ${enabled}, ${firstPurchaseOnly}, ${minSubtotal}, ${endsAt})
    ON CONFLICT (code) DO UPDATE SET
      percent = EXCLUDED.percent, active = EXCLUDED.active,
      first_purchase_only = EXCLUDED.first_purchase_only,
      min_subtotal = EXCLUDED.min_subtotal, ends_at = EXCLUDED.ends_at
  `;
  await sql`
    UPDATE coupon_popup SET enabled = ${enabled}, code = ${code}, delay_sec = ${delaySec},
      reshow_days = ${reshowDays}, image_desktop = ${imageDesktop || null}, image_mobile = ${imageMobile},
      updated_at = NOW()
    WHERE id = 1
  `;
  return getCouponPopup();
}

export type CouponCheck =
  | { ok: true; code: string; percent: number; discount: number }
  | { ok: false; code: string; error: string; reason: 'invalid' | 'expired' | 'min' | 'used' };

// Confere o cupom para este subtotal. Com e-mail, confere tambem a regra
// "so na primeira compra" (qualquer pedido anterior com esse e-mail).
export async function checkCoupon(rawCode: unknown, subtotal: number, email?: string | null): Promise<CouponCheck> {
  const code = normalizeCode(rawCode);
  await ensureCoupons();
  const [c] = (await sql`SELECT * FROM coupons WHERE code = ${code} LIMIT 1`) as any[];
  if (!c || !c.active) return { ok: false, code, reason: 'invalid', error: 'Este cupón no es válido.' };
  if (c.ends_at && new Date(c.ends_at).getTime() < Date.now()) {
    return { ok: false, code, reason: 'expired', error: 'Este cupón ya ha caducado.' };
  }
  const min = Number(c.min_subtotal ?? 0);
  if (min > 0 && subtotal < min) {
    return { ok: false, code, reason: 'min', error: `Este cupón es válido a partir de €${min.toFixed(2)}.` };
  }
  const mail = String(email ?? '').trim().toLowerCase();
  if (c.first_purchase_only && mail) {
    const prev = (await sql`SELECT 1 FROM orders WHERE LOWER(TRIM(customer_email)) = ${mail} LIMIT 1`) as any[];
    if (prev.length > 0) return { ok: false, code, reason: 'used', error: 'Este cupón es solo para la primera compra.' };
  }
  const percent = Number(c.percent);
  const discount = Math.round(subtotal * percent) / 100;
  return { ok: true, code, percent, discount: Math.min(subtotal, Number(discount.toFixed(2))) };
}
