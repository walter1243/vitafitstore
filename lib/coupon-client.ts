'use client';

// Memoria do cupom no navegador do cliente.
//  - PENDING: cupom "guardado" ao copiar ou clicar em "¡Compra ahora!" no
//    pop-up → o checkout ja abre com ele aplicado. Fechou no X = nada guardado.
//  - SEEN: o pop-up ja apareceu e foi fechado/copiado (nao insiste).
//  - USED: comprou com cupom → o pop-up de boas-vindas nao aparece mais.
// O servidor confere tudo de novo (lib/coupons.ts); isto aqui e so conforto.
const PENDING = 'kt_coupon';
const SEEN = 'kt_coupon_seen';
const USED = 'kt_coupon_used';

const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} };
const del = (k: string) => { try { localStorage.removeItem(k); } catch {} };

export const COUPON_CHANGE_EVENT = 'kitoys:coupon';

export function getPendingCoupon(): string {
  return (get(PENDING) ?? '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30);
}
export function savePendingCoupon(code: string) {
  set(PENDING, code);
  try { window.dispatchEvent(new Event(COUPON_CHANGE_EVENT)); } catch {}
}
export function clearPendingCoupon() {
  del(PENDING);
  try { window.dispatchEvent(new Event(COUPON_CHANGE_EVENT)); } catch {}
}

export function markPopupSeen(code: string) {
  set(SEEN, JSON.stringify({ code, at: Date.now() }));
}

// Chamado quando o pagamento termina: se havia cupom, ele foi usado.
export function markCouponUsedIfPending() {
  const code = getPendingCoupon();
  if (!code) return;
  set(USED, code);
  del(PENDING);
}

// Pode mostrar o pop-up? Nao se: ja usou a oferta, ja tem o cupom guardado,
// ou ja viu esta campanha (e o admin nao pediu para mostrar de novo depois de X dias).
export function canShowPopup(code: string, reshowDays: number): boolean {
  if (get(USED)) return false;
  if (getPendingCoupon()) return false;
  const raw = get(SEEN);
  if (!raw) return true;
  try {
    const seen = JSON.parse(raw) as { code?: string; at?: number };
    if (seen.code !== code) return true; // campanha nova
    if (reshowDays > 0 && Date.now() - Number(seen.at ?? 0) > reshowDays * 86400000) return true;
    return false;
  } catch {
    return false;
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
