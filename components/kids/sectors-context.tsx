'use client';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DEFAULT_SECTORS,
  collectionForCategory as matchCollection,
  enabledCollections,
  type Sector,
  type SiteCollection,
} from '@/lib/sectors-shared';

type Ctx = {
  sectors: Sector[];
  collections: SiteCollection[];
  getCollection: (slug: string) => SiteCollection | undefined;
  getSector: (id: number) => Sector | undefined;
  collectionForCategory: (category?: string) => SiteCollection | undefined;
};

const SectorsContext = createContext<Sector[] | null>(null);

// As paginas da vitrine carregam os setores no servidor e passam aqui —
// assim tudo ja vem pronto, sem esperar a API no navegador.
export function SectorsProvider({ sectors, children }: { sectors: Sector[]; children: ReactNode }) {
  return <SectorsContext.Provider value={sectors}>{children}</SectorsContext.Provider>;
}

const CACHE_KEY = 'kitoys_sectors_cache';

export function useSectors(): Ctx {
  const fromPage = useContext(SectorsContext);
  const [fetched, setFetched] = useState<Sector[] | null>(null);

  // Fora de um SectorsProvider (ex: pagina legal), busca na API.
  useEffect(() => {
    if (fromPage) return;
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) setFetched(JSON.parse(cached));
    } catch {}
    fetch('/api/sectors', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!Array.isArray(data)) return;
        setFetched(data);
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
      })
      .catch(() => {});
  }, [fromPage]);

  const sectors = fromPage ?? fetched ?? DEFAULT_SECTORS;

  return useMemo(() => {
    const collections = enabledCollections(sectors);
    return {
      sectors,
      collections,
      getCollection: (slug: string) => collections.find((c) => c.slug === slug),
      getSector: (id: number) => sectors.find((s) => s.id === id),
      collectionForCategory: (category?: string) => matchCollection(collections, category),
    };
  }, [sectors]);
}
