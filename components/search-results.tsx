'use client';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { KidsProductCard } from '@/components/kids/kids-product-card';
import { accentFor } from '@/components/kids/palette';
import { useSectors } from '@/components/kids/sectors-context';
import { useStoreProducts } from '@/components/kids/use-store-products';
import { ThemedProductCard } from '@/components/themes/themed-product-card';
import { themeFor } from '@/components/themes/sector-themes';
import { ProductSearch, useProductSearch } from '@/components/product-search';

// Pagina /buscar: todos os produtos que batem com a busca, cada card no
// visual do mundo do produto (Infantil, Casa, Chaveiros, Pet...).
export function SearchResults({ query }: { query: string }) {
  const results = useProductSearch(query);
  const { loaded } = useStoreProducts();
  const { getSector, collectionForProduct } = useSectors();

  return (
    <section className="px-4 pb-24 pt-36 sm:px-6 sm:pt-40 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-[#1E1B4B] sm:text-5xl">
          {query ? <>Resultados para «{query}»</> : 'Buscar productos'}
        </h1>
        <p className="mt-2 text-lg text-[#565a78]">
          {!loaded ? 'Buscando…' : `${results.length} ${results.length === 1 ? 'producto' : 'productos'}`}
        </p>
        <ProductSearch className="mt-6 max-w-xl" />

        {loaded && results.length === 0 ? (
          <div className="mt-12 rounded-[32px] bg-white p-10 text-center">
            <Search className="mx-auto h-10 w-10 text-[#c2410c]" aria-hidden="true" />
            <p className="mt-4 text-2xl font-bold text-[#1E1B4B]">No encontramos nada</p>
            <p className="mt-1 text-base text-[#565a78]">Prueba con otra palabra o explora los mundos.</p>
            <Link href="/#colecciones" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[#1E1B4B] px-6 font-bold text-white">Ver los mundos</Link>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {results.map(({ product }) => {
              const col = collectionForProduct(product);
              const theme = themeFor(col ? getSector(col.sectorId)?.style : undefined);
              return theme
                ? <ThemedProductCard key={product.id} product={product} theme={theme} />
                : <KidsProductCard key={product.id} product={product} accent={accentFor(col)} />;
            })}
          </div>
        )}
      </div>
    </section>
  );
}
