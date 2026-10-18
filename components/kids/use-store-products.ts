'use client';
import { useEffect, useState } from 'react';
import { type DbProduct } from '@/lib/store-product';

// Uma unica busca de produtos pra vitrine infantil (home ou pagina de
// colecao) — recarrega quando a aba volta ao foco, pra refletir edicoes do
// admin sem o polling de 15s de cada secao que a vitrine antiga fazia.
export function useStoreProducts() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as DbProduct[];
        if (!cancelled && Array.isArray(data)) setProducts(data);
      } catch {
        // sem rede: mantem o que ja tinha
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };
    void load();
    const onVisible = () => { if (document.visibilityState === 'visible') void load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return { products, loaded };
}
