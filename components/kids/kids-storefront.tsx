'use client';
import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Printer, Sparkles, type LucideIcon } from 'lucide-react';
import { COLLECTIONS, collectionForCategory, type Collection } from '@/lib/collections';
import { toStoreProduct, type DbProduct } from '@/lib/store-product';
import { type Product } from '@/lib/products';
import { KidsProductCard } from './kids-product-card';
import { useStoreProducts } from './use-store-products';

const OTHER_COLOR = { main: '#0EA5E9', soft: '#E0F2FE', deep: '#0369A1' };
const SHELF_SIZE = 4;

function coverOf(items: DbProduct[]) {
  const cover = items.find((p) => p.isCategoryCover && p.image) ?? items.find((p) => p.image);
  return cover?.image;
}

function CollectionCard({ collection, items }: { collection: Collection; items: DbProduct[] }) {
  const cover = coverOf(items);
  const Icon = collection.icon;
  return (
    <Link
      href={`/coleccion/${collection.slug}`}
      className="kids-pop group relative flex min-h-[320px] flex-col overflow-hidden rounded-[36px] p-6 sm:min-h-[380px] sm:p-8"
      style={{ background: collection.color.deep }}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/15" />
      <div className="pointer-events-none absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-black/10" />

      <div className="relative z-10 max-w-[60%]">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 sm:h-20 sm:w-20">
          <Icon className="h-9 w-9 text-white sm:h-11 sm:w-11" aria-hidden="true" />
        </span>
        <h3 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">{collection.name}</h3>
        <p className="mt-2 text-base font-bold text-white">{collection.tagline}</p>
      </div>

      <div className="relative z-10 mt-auto flex flex-col items-start gap-2 pt-6">
        {items.length > 0 && (
          <span className="text-sm font-bold text-white">
            {items.length} {items.length === 1 ? 'creación' : 'creaciones'}
          </span>
        )}
        <span className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-extrabold" style={{ color: collection.color.deep }}>
          Ver colección <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>

      {cover && (
        <div className="absolute bottom-6 right-5 h-28 w-28 rotate-6 overflow-hidden rounded-[28px] border-[5px] border-white shadow-xl transition-transform duration-500 group-hover:rotate-0 group-hover:scale-105 sm:h-48 sm:w-48">
          <Image src={cover} alt={collection.name} fill sizes="200px" className="object-cover" />
        </div>
      )}
    </Link>
  );
}

function Shelf({ id, title, icon: Icon, subtitle, color, products, href, total }: {
  id: string;
  title: string;
  icon: LucideIcon;
  subtitle: string;
  color: Collection['color'];
  products: Product[];
  href?: string;
  total: number;
}) {
  return (
    <section id={id} className="scroll-mt-32 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: color.soft, color: color.deep }}>
              <Icon className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-widest" style={{ color: color.deep }}>{subtitle}</p>
              <h2 className="text-3xl font-bold text-[#1e2a4a] sm:text-4xl">{title}</h2>
            </div>
          </div>
          {href && total > products.length && (
            <Link href={href} className="flex min-h-11 items-center gap-1.5 rounded-full px-5 text-sm font-extrabold text-white transition-opacity duration-200 hover:opacity-90" style={{ background: color.deep }}>
              Ver las {total} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {products.map((p) => (
            <KidsProductCard key={p.id} product={p} color={color} />
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
    <div className="bg-white">
      <section id="colecciones" className="scroll-mt-32 pb-6 pt-6 sm:pt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <p className="text-sm font-extrabold uppercase tracking-widest text-[#1D4ED8]">Nuestras colecciones</p>
            <h2 className="mt-1 text-3xl font-bold text-[#1e2a4a] sm:text-5xl">¿A qué jugamos hoy?</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {COLLECTIONS.map((c) => (
              <CollectionCard key={c.slug} collection={c} items={byCollection.get(c.slug) ?? []} />
            ))}
          </div>
        </div>
      </section>

      <div id="productos">
        {COLLECTIONS.map((c) => {
          const items = byCollection.get(c.slug) ?? [];
          if (!items.length) return null;
          return (
            <Shelf
              key={c.slug}
              id={`shelf-${c.slug}`}
              title={c.name}
              icon={c.icon}
              subtitle={c.tagline}
              color={c.color}
              products={items.slice(0, SHELF_SIZE).map(toStoreProduct)}
              href={`/coleccion/${c.slug}`}
              total={items.length}
            />
          );
        })}

        {others.length > 0 && (
          <Shelf
            id="otras-creaciones"
            title="Más creaciones"
            icon={Sparkles}
            subtitle="Recién salidas de la impresora"
            color={OTHER_COLOR}
            products={others.map(toStoreProduct)}
            total={others.length}
          />
        )}

        {loaded && products.length === 0 && (
          <p className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-12 text-center text-slate-600">
            <Printer className="h-10 w-10 text-[#2563EB]" aria-hidden="true" />
            Estamos imprimiendo nuevas creaciones. ¡Vuelve muy pronto!
          </p>
        )}
      </div>
    </div>
  );
}
