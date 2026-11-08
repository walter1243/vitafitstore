// Teste A/B do jeito de mostrar os produtos na home (Editar loja → Seções → "Teste A/B").
// Cada visitante cai numa versão ao acaso e fica nela; os eventos do site
// (cliques, carrinho, compra) levam a versão para comparar no painel.
export type LayoutVariant = 'grid' | 'carousel';
const KEY = 'kt_ab_layout';
const ACTIVE = 'kt_ab_active';

export function assignLayoutVariant(): LayoutVariant {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'grid' || v === 'carousel') return v;
    const pick: LayoutVariant = Math.random() < 0.5 ? 'grid' : 'carousel';
    localStorage.setItem(KEY, pick);
    return pick;
  } catch {
    return 'carousel';
  }
}

// O teste está ligado? (a home avisa; desligado, os eventos param de levar a versão)
export function setAbActive(on: boolean) {
  try { if (on) localStorage.setItem(ACTIVE, '1'); else localStorage.removeItem(ACTIVE); } catch {}
}

export function currentVariant(): LayoutVariant | null {
  try {
    if (localStorage.getItem(ACTIVE) !== '1') return null;
    const v = localStorage.getItem(KEY);
    return v === 'grid' || v === 'carousel' ? v : null;
  } catch {
    return null;
  }
}
