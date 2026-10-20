'use client';
import { useMemo } from 'react';
import { toStoreProduct } from '@/lib/store-product';
import { CollectionSpotlight } from './collection-spotlight';
import { Home } from 'lucide-react';
import { ProductCarousel } from './product-carousel';
import { SectorBand } from './sector-band';
import { useSectors } from './sectors-context';
import { useStoreProducts } from './use-store-products';
import { ACCENTS, dots } from './palette';

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

      {/* Produtos fora das colecoes infantis (decoracao, casa...): vitrine
          pros pais, que sao quem compra — aumenta o ticket e baixa o CAC. */}
      {loose.length > 0 && (
        <section id="productos" className="relative scroll-mt-24 bg-[#BFF0DA] px-4 py-20 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0 opacity-60" style={dots('#6EE7B7')} aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#1E1B4B] bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#1E1B4B]">
                <Home className="h-3.5 w-3.5" aria-hidden="true" /> Para papás y mamás
              </span>
              <h2 className="mt-3 text-4xl font-bold text-[#1E1B4B] sm:text-5xl">También para tu hogar</h2>
              <p className="mt-2 max-w-2xl text-lg text-[#1E1B4B]/80">
                Mientras los peques juegan, date un capricho: decoración y detalles para casa impresos en 3D en nuestro taller.
              </p>
            </div>
            <div className="rounded-[36px] border-[3px] border-[#1E1B4B] bg-white/70 p-5 shadow-[8px_8px_0_#1E1B4B] sm:p-8">
              <ProductCarousel products={loose.map(toStoreProduct)} accent={ACCENTS.mint} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
