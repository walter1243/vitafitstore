'use client';
import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { COLLECTIONS, collectionForCategory, type Collection } from '@/lib/collections';
import { toStoreProduct, type DbProduct } from '@/lib/store-product';
import { KidsHero } from './kids-hero';
import { KidsProductCard } from './kids-product-card';
import { useStoreProducts } from './use-store-products';

const SHELF_SIZE = 4;

function coverOf(items: DbProduct[]) {
  const cover = items.find((p) => p.isCategoryCover && p.image) ?? items.find((p) => p.image);
  return cover?.image;
}

// "Compra por colección" — circulos com foto, como nas lojas de brinquedo.
function CollectionCircle({ collection, items }: { collection: Collection; items: DbProduct[] }) {
  const cover = coverOf(items);
  const Icon = collection.icon;
  return (
    <Link href={`/coleccion/${collection.slug}`} className="group flex cursor-pointer flex-col items-center text-center">
      <span
        className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full ring-4 ring-transparent transition-all duration-300 group-hover:ring-[var(--k-ink)] sm:h-44 sm:w-44"
        style={{ background: collection.color.soft }}
      >
        {cover ? (
          <Image src={cover} alt="" fill sizes="180px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <Icon className="h-14 w-14" style={{ color: collection.color.main }} strokeWidth={1.75} aria-hidden="true" />
        )}
      </span>
      <span className="mt-4 font-kids text-2xl font-bold text-[var(--k-ink)]">{collection.shortName}</span>
      <span className="text-sm text-[var(--k-muted)]">{collection.tagline}</span>
    </Link>
  );
}

function Shelf({ title, subtitle, href, total, products, soft }: {
  title: string;
  subtitle: string;
  href?: string;
  total: number;
  products: DbProduct[];
  soft: string;
}) {
  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--k-line)] pb-4">
          <div>
            <h2 className="text-3xl font-bold text-[var(--k-ink)] sm:text-4xl">{title}</h2>
            <p className="mt-1 text-base text-[var(--k-muted)]">{subtitle}</p>
          </div>
          {href && (
            <Link href={href} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-base font-extrabold text-[var(--k-cta)] hover:underline">
              Ver todo{total > products.length ? ` (${total})` : ''} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
          {products.map((p) => (
            <KidsProductCard key={p.id} product={toStoreProduct(p)} soft={soft} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function KidsStorefront() {
  const { products, loaded } = useStoreProducts();

  const { byCollection, others } = useMemo(() => {
    const map = new Map<string, DbProduct[]>(COLLECTIONS.map((c) => [c.slug, []]));
    const rest: DbProduct[] = [];
    for (const p of products) {
      const c = collectionForCategory(p.category);
      if (c) map.get(c.slug)!.push(p);
      else rest.push(p);
    }
    return { byCollection: map, others: rest };
  }, [products]);

  return (
    <>
      <KidsHero byCollection={byCollection} />

      <section id="colecciones" className="scroll-mt-28 px-4 pb-4 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold text-[var(--k-ink)] sm:text-4xl">Compra por colección</h2>
          <div className="mt-10 flex flex-wrap justify-center gap-10 sm:gap-20">
            {COLLECTIONS.map((c) => (
              <CollectionCircle key={c.slug} collection={c} items={byCollection.get(c.slug) ?? []} />
            ))}
          </div>
        </div>
      </section>

      <div id="productos" className="scroll-mt-28">
        {COLLECTIONS.map((c) => {
          const items = byCollection.get(c.slug) ?? [];
          if (!items.length) return null;
          return (
            <Shelf
              key={c.slug}
              title={c.name}
              subtitle={c.tagline}
              href={`/coleccion/${c.slug}`}
              total={items.length}
              products={items.slice(0, SHELF_SIZE)}
              soft={c.color.soft}
            />
          );
        })}
        {others.length > 0 && (
          <Shelf title="Más creaciones" subtitle="Recién salidas de la impresora" total={others.length} products={others} soft="#EEF4FB" />
        )}
        {loaded && products.length === 0 && (
          <p className="px-4 py-12 text-center text-lg text-[var(--k-muted)]">Estamos imprimiendo nuevas creaciones. ¡Vuelve muy pronto!</p>
        )}
      </div>
    </>
  );
}
