'use client';
import { useMemo } from 'react';
import { toStoreProduct } from '@/lib/store-product';
import { CollectionSpotlight } from './collection-spotlight';
import { KidsProductCard } from './kids-product-card';
import { SectorBand } from './sector-band';
import { useSectors } from './sectors-context';
import { useStoreProducts } from './use-store-products';
import { dots } from './palette';

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

      {loose.length > 0 && (
        <section id="productos" className="relative scroll-mt-24 bg-[#BFF0DA] px-4 py-20 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0 opacity-60" style={dots('#6EE7B7')} aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              <h2 className="text-4xl font-bold text-[var(--k-ink)] sm:text-5xl">Más juguetes</h2>
              <p className="mt-2 text-lg text-[var(--k-muted)]">Recién salidos de nuestra impresora</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
              {loose.map((p) => (
                <KidsProductCard key={p.id} product={toStoreProduct(p)} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
