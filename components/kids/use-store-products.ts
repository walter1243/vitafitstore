'use client';
import { useEffect, useState } from 'react';
import { type DbProduct } from '@/lib/store-product';

// Uma unica busca de produtos pra pagina inteira: varios componentes podem
// chamar o hook (faixas, cards de setor, personalizador) e todos dividem a
// mesma requisicao. Recarrega quando a aba volta ao foco, pra refletir
// edicoes do admin.
let cache: DbProduct[] | null = null;
let inflight: Promise<DbProduct[]> | null = null;
const listeners = new Set<(p: DbProduct[]) => void>();

function load(force = false): Promise<DbProduct[]> {
  if (inflight) return inflight;
  if (cache && !force) return Promise.resolve(cache);
  inflight = fetch('/api/products', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (Array.isArray(data)) {
        cache = data as DbProduct[];
        listeners.forEach((fn) => fn(cache!));
      }
      return cache ?? [];
    })
    .catch(() => cache ?? [])
    .finally(() => { inflight = null; });
  return inflight;
}

export function useStoreProducts() {
  const [products, setProducts] = useState<DbProduct[]>(cache ?? []);
  const [loaded, setLoaded] = useState(Boolean(cache));

  useEffect(() => {
    let alive = true;
    const onData = (p: DbProduct[]) => { if (alive) { setProducts(p); setLoaded(true); } };
    listeners.add(onData);
    load().then((p) => { if (alive) { setProducts(p); setLoaded(true); } });
    const onVisible = () => { if (document.visibilityState === 'visible') void load(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      listeners.delete(onData);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return { products, loaded };
}
