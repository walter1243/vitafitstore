'use client';
import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { COLLECTIONS, collectionForCategory, type Collection } from '@/lib/collections';
import { toStoreProduct, type DbProduct } from '@/lib/store-product';
import { KidsProductCard } from './kids-product-card';
import { useStoreProducts } from './use-store-products';
import { Cube } from './kid-shapes';

const OTHER = { main: '#1E88FF', soft: '#E6F3FF' };
const SHELF_SIZE = 4;

function coverOf(items: DbProduct[]) {
  const cover = items.find((p) => p.isCategoryCover && p.image) ?? items.find((p) => p.image);
  return cover?.image;
}

// Caixa de brinquedo de cada colecao: fundo na cor da colecao com confete,
// icone num selo branco, titulo grande e a foto de capa numa moldura torta.
function CollectionCard({ collection, items }: { collection: Collection; items: DbProduct[] }) {
  const cover = coverOf(items);
  const Icon = collection.icon;
  return (
    <Link
      href={`/coleccion/${collection.slug}`}
      className="kid-card kid-confetti group relative flex min-h-[300px] cursor-pointer flex-col overflow-hidden rounded-[36px] border-4 border-[var(--k-ink)] p-6 sm:min-h-[360px] sm:p-8"
      style={{ backgroundColor: collection.color.main }}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-[var(--k-ink)] bg-white">
        <Icon className="h-8 w-8" style={{ color: collection.color.main }} aria-hidden="true" />
      </span>
      <h3 className="mt-4 max-w-[62%] text-4xl font-extrabold text-white sm:text-5xl" style={{ textShadow: '0 4px 0 rgba(31,35,64,0.35)' }}>
        {collection.shortName}
      </h3>
      <p className="mt-2 max-w-[60%] text-base font-bold text-white sm:text-lg">{collection.tagline}</p>

      <span className="kid-btn mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 font-kids text-lg font-bold text-[var(--k-ink)]">
        ¡Ver todo! <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </span>

      <div className="absolute bottom-6 right-5 h-32 w-32 rotate-6 overflow-hidden rounded-[26px] border-4 border-[var(--k-ink)] bg-white transition-transform duration-300 group-hover:rotate-0 sm:h-44 sm:w-44">
        {cover ? (
          <Image src={cover} alt="" fill sizes="180px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ background: collection.color.soft }}>
            <Cube top="#FFE08A" left="#FFC93C" right="#E0A800" className="w-2/3" />
          </div>
        )}
      </div>
    </Link>
  );
}

function SectionTitle({ eyebrow, title, color }: { eyebrow: string; title: string; color: string }) {
  return (
    <div>
      <p className="font-kids text-lg font-bold" style={{ color }}>{eyebrow}</p>
      <h2 className="text-4xl font-extrabold text-[var(--k-ink)] sm:text-5xl">{title}</h2>
    </div>
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
    <div className="bg-white">
      <section id="colecciones" className="scroll-mt-28 px-4 pb-8 pt-4 sm:pt-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <SectionTitle eyebrow="¡Hola, peques!" title="¿A qué jugamos hoy?" color="var(--k-red)" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {COLLECTIONS.map((c) => (
              <CollectionCard key={c.slug} collection={c} items={byCollection.get(c.slug) ?? []} />
            ))}
          </div>
        </div>
      </section>

      <div id="productos" className="scroll-mt-28">
        {COLLECTIONS.map((c) => {
          const items = byCollection.get(c.slug) ?? [];
          if (!items.length) return null;
          return (
            <section key={c.slug} className="px-4 py-12">
              <div className="mx-auto max-w-7xl">
                <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                  <SectionTitle eyebrow={c.tagline} title={c.name} color={c.color.main} />
                  {items.length > SHELF_SIZE && (
                    <Link href={`/coleccion/${c.slug}`} className="kid-btn inline-flex min-h-12 items-center gap-2 rounded-full px-6 font-kids text-lg font-bold text-white" style={{ background: c.color.main }}>
                      Ver las {items.length} <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                  {items.slice(0, SHELF_SIZE).map((p) => (
                    <KidsProductCard key={p.id} product={toStoreProduct(p)} color={c.color.main} soft={c.color.soft} />
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        {others.length > 0 && (
          <section className="px-4 py-12">
            <div className="mx-auto max-w-7xl">
              <div className="mb-7">
                <SectionTitle eyebrow="Recién salidas de la impresora" title="Más creaciones" color={OTHER.main} />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {others.map((p) => (
                  <KidsProductCard key={p.id} product={toStoreProduct(p)} color={OTHER.main} soft={OTHER.soft} />
                ))}
              </div>
            </div>
          </section>
        )}

        {loaded && products.length === 0 && (
          <p className="px-4 py-12 text-center font-kids text-2xl font-bold text-[var(--k-ink)]">
            ¡Estamos imprimiendo nuevas creaciones! Vuelve muy pronto.
          </p>
        )}
      </div>
    </div>
  );
}
