'use client';
import { useMemo } from 'react';
import { toStoreProduct } from '@/lib/store-product';
import { CollectionSpotlight } from './collection-spotlight';
import { HomeExtras } from './hogar-sections';
import { SectorBand } from './sector-band';
import { useSectors } from './sectors-context';
import { useStoreProducts } from './use-store-products';

// Home organizada por setores (Admin → Setores e coleções): cada setor abre
// com a sua faixa e depois vem um destaque de tela cheia por colecao — a
// brincadeira em cima e, embaixo, o cartao com os produtos dela (pela
// categoria cadastrada em Admin → Produtos). Produtos sem colecao vao pro fim.
export function KidsStorefront() {
  const { products } = useStoreProducts();
  const { sectors, collectionForCategory } = useSectors();

  const { bySlug, loose } = useMemo(() => {
    const bySlug: Record<string, ReturnType<typeof toStoreProduct>[]> = {};
    const loose: typeof products = [];
    for (const p of products) {
      const c = collectionForCategory(p.category);
      if (c) (bySlug[c.slug] ??= []).push(toStoreProduct(p));
      else loose.push(p);
    }
    return { bySlug, loose };
  }, [products, collectionForCategory]);

  const visible = sectors.filter((s) => s.collections.length > 0);

  return (
    <>
      <div id="colecciones" className="scroll-mt-24">
        {visible.map((sector, si) => (
          <div key={sector.id || sector.slug}>
            <SectorBand sector={sector} first={si === 0} />
            {sector.collections.map((c, ci) => (
              <CollectionSpotlight key={c.slug} slug={c.slug} products={bySlug[c.slug]} priority={si === 0 && ci === 0} />
            ))}
          </div>
        ))}
      </div>

      {/* Produtos fora das colecoes (decoracao, casa...): vitrine pros pais,
          que sao quem compra — aumenta o ticket e baixa o CAC. */}
      {loose.length > 0 && <HomeExtras products={loose.map(toStoreProduct)} />}
    </>
  );
}
