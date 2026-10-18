'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { COLLECTIONS, collectionForCategory } from '@/lib/collections';
import { toStoreProduct, type DbProduct } from '@/lib/store-product';
import { CollectionSpotlight } from './collection-spotlight';
import { KidsProductCard } from './kids-product-card';
import { useStoreProducts } from './use-store-products';

// Ordem dos destaques: claro → escuro → claro (corte seco entre eles).
const SPOTLIGHT_ORDER = ['rompecabezas', 'lamparas', 'para-pintar'];
const NEW_COUNT = 8;

// Home da vitrine infantil: um destaque de tela cheia por colecao (estilo
// Apple — ver collection-spotlight.tsx) e, quando houver produtos
// cadastrados no admin, as novidades logo abaixo.
export function KidsStorefront() {
  const { products } = useStoreProducts();

  const countBySlug = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      const c = collectionForCategory(p.category);
      if (c) map[c.slug] = (map[c.slug] ?? 0) + 1;
    }
    return map;
  }, [products]);

  const latest: DbProduct[] = products.slice(0, NEW_COUNT);
  const order = SPOTLIGHT_ORDER.filter((slug) => COLLECTIONS.some((c) => c.slug === slug));

  return (
    <>
      <div id="colecciones" className="scroll-mt-24">
        {order.map((slug, i) => (
          <CollectionSpotlight key={slug} slug={slug} count={countBySlug[slug]} first={i === 0} priority={i === 0} headingLevel={i === 0 ? 'h1' : 'h2'} />
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
                return <KidsProductCard key={p.id} product={toStoreProduct(p)} soft={c?.color.soft ?? '#F2F4FA'} tag={c?.shortName} />;
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
