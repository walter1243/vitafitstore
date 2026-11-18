'use client';

// Em qual loja o cliente está comprando (multi-loja). Prioridade: a loja dos
// produtos do carrinho; se o carrinho está vazio, a última loja visitada nesta
// aba (guardada pela página da loja). 'kitoys' = loja principal.
import { useEffect, useState } from 'react';
import { MAIN_STORE, type SalesPageConfig } from '@/lib/sales-pages-shared';

const KEY = 'kt_store';

export function rememberStore(slug: string) {
  try { sessionStorage.setItem(KEY, slug || MAIN_STORE); } catch {}
}

export function rememberedStore(): string {
  try { return sessionStorage.getItem(KEY) || MAIN_STORE; } catch { return MAIN_STORE; }
}

type StoreBrand = Pick<SalesPageConfig, 'slug' | 'title' | 'logoImage' | 'neonPrimary' | 'neonSecondary'>;

// Loja ativa + dados de marca dela (nome, logo, cores). null = Kitoys.
export function useActiveStore(cartStoreSlug?: string): { slug: string; brand: StoreBrand | null } {
  const [slug, setSlug] = useState(MAIN_STORE);
  const [brand, setBrand] = useState<StoreBrand | null>(null);

  useEffect(() => {
    setSlug(cartStoreSlug || rememberedStore());
  }, [cartStoreSlug]);

  useEffect(() => {
    if (slug === MAIN_STORE) { setBrand(null); return; }
    let alive = true;
    fetch(`/api/sales-pages?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setBrand(d && d.slug ? d : null); })
      .catch(() => { if (alive) setBrand(null); });
    return () => { alive = false; };
  }, [slug]);

  return { slug, brand };
}
