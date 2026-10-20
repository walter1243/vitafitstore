'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toStoreProduct } from '@/lib/store-product';
import { CollectionSpotlight } from './collection-spotlight';
import { ThemedExtras } from '@/components/themes/themed-sections';
import { WorldShowcase } from '@/components/themes/world-showcase';
import { SectorCards } from './sector-cards';
import { useSectors } from './sectors-context';
import { useStoreProducts } from './use-store-products';

// Home em "mundos" (Admin → Setores e coleções): os cards de cima funcionam
// como abas — o mundo escolhido (Infantil, Hogar, Llaveros, Mascotas...)
// e o unico que aparece embaixo, com as colecoes e os produtos dele.
// O endereco guarda a escolha (#mundo-hogar), pra dar pra compartilhar.
export const EXTRA = 'mas';

export function KidsStorefront() {
  const { products } = useStoreProducts();
  const { sectors, collectionForProduct } = useSectors();
  const contentRef = useRef<HTMLDivElement>(null);

  const { bySlug, loose } = useMemo(() => {
    const bySlug: Record<string, ReturnType<typeof toStoreProduct>[]> = {};
    const loose: typeof products = [];
    for (const p of products) {
      const c = collectionForProduct(p);
      if (c) (bySlug[c.slug] ??= []).push(toStoreProduct(p));
      else loose.push(p);
    }
    return { bySlug, loose };
  }, [products, collectionForProduct]);

  const worlds = sectors.filter((s) => s.collections.length > 0);
  const [selected, setSelected] = useState('');

  // Mundo vindo do endereco (#mundo-hogar) ou do menu.
  useEffect(() => {
    const read = () => {
      const m = window.location.hash.match(/^#mundo-(.+)$/);
      if (m) setSelected(decodeURIComponent(m[1]));
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  const current = worlds.find((s) => s.slug === selected) ?? (selected === EXTRA ? null : worlds[0]);
  const active = current?.slug ?? (selected === EXTRA ? EXTRA : '');

  function choose(slug: string) {
    setSelected(slug);
    history.replaceState(null, '', `#mundo-${slug}`);
    // Desce ate o conteudo do mundo escolhido.
    requestAnimationFrame(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  // Produtos sem colecao entram no mundo de casa (ou no card "Hogar" extra).
  const showExtras = loose.length > 0 && (active === EXTRA || current?.style === 'hogar');

  return (
    <>
      <SectorCards sectors={worlds} active={active} onSelect={choose} extraHome={loose.length > 0} />

      <div ref={contentRef} id="mundo" className="scroll-mt-24">
        <div key={active} className="world-in">
          {current?.collections.map((c, ci) => (
            <CollectionSpotlight key={c.slug} slug={c.slug} products={bySlug[c.slug] ?? []} priority={ci === 0} />
          ))}
          {showExtras && <ThemedExtras products={loose.map(toStoreProduct)} />}
          {/* Fotos de uso, beneficios, passos e confianca do mundo (Casa, Chaveiros, Pet). */}
          <WorldShowcase style={active === EXTRA ? 'hogar' : current?.style} />
        </div>
      </div>
    </>
  );
}
