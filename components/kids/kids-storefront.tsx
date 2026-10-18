'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { softOf } from '@/lib/sectors-shared';
import { toStoreProduct } from '@/lib/store-product';
import { CollectionSpotlight } from './collection-spotlight';
import { KidsProductCard } from './kids-product-card';
import { SectorBand } from './sector-band';
import { useSectors } from './sectors-context';
import { useStoreProducts } from './use-store-products';

const NEW_COUNT = 8;

// Home organizada por setores (Admin → Setores e coleções): cada setor abre
// com a sua faixa e depois vem um destaque de tela cheia por colecao.
// Novidades (ultimos produtos cadastrados) no fim, quando houver.
export function KidsStorefront() {
  const { products } = useStoreProducts();
  const { sectors, collectionForCategory } = useSectors();

  const countBySlug = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      const c = collectionForCategory(p.category);
      if (c) map[c.slug] = (map[c.slug] ?? 0) + 1;
    }
    return map;
  }, [products, collectionForCategory]);

  const visible = sectors.filter((s) => s.collections.length > 0);
  const latest = products.slice(0, NEW_COUNT);

  return (
    <>
      <div id="colecciones" className="scroll-mt-24">
        {visible.map((sector, si) => (
          <div key={sector.id || sector.slug}>
            <SectorBand sector={sector} first={si === 0} />
            {sector.collections.map((c, ci) => (
              <CollectionSpotlight key={c.slug} slug={c.slug} count={countBySlug[c.slug]} priority={si === 0 && ci === 0} />
            ))}
          </div>
        ))}
      </div>

      {latest.length > 0 && (
        <section id="productos" className="scroll-mt-24 bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              <h2 className="text-4xl font-bold text-[var(--k-ink)] sm:text-5xl">Novedades</h2>
              <p className="mt-2 text-lg text-[var(--k-muted)]">Recién salidas de nuestra impresora</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
              {latest.map((p) => {
                const c = collectionForCategory(p.category);
                return <KidsProductCard key={p.id} product={toStoreProduct(p)} soft={softOf(c)} tag={c?.shortName} />;
              })}
            </div>
            {products.length > NEW_COUNT && (
              <div className="mt-10 flex justify-center">
                <Link href="/#colecciones" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#23263f] px-7 text-base font-bold text-white transition-colors hover:bg-[#363a5c]">
                  Ver todas las colecciones
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
