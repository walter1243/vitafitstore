'use client';
import { useMemo } from 'react';
import { toStoreProduct } from '@/lib/store-product';
import { CollectionSpotlight } from './collection-spotlight';
import { ThemedExtras } from '@/components/themes/themed-sections';
import { SectorBand } from './sector-band';
import { SectorCards } from './sector-cards';
import { useSectors } from './sectors-context';
import { useStoreProducts } from './use-store-products';

// Home organizada por setores (Admin → Setores e coleções): cada setor abre
// com a sua faixa e depois vem um destaque de tela cheia por colecao — a
// brincadeira em cima e, embaixo, o cartao com os produtos dela (pela
// categoria cadastrada em Admin → Produtos). Produtos sem colecao vao pro fim.
export function KidsStorefront() {
  const { products } = useStoreProducts();
  const { sectors, collectionForProduct } = useSectors();

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

  // Setores novos (Casa, Chaveiros, Pet...) so aparecem quando tiverem produto;
  // o Infantil aparece sempre (as brincadeiras funcionam sem produto).
  const visible = sectors
    .map((s) => (s.style === 'infantil' ? s : { ...s, collections: s.collections.filter((c) => (bySlug[c.slug]?.length ?? 0) > 0) }))
    .filter((s) => s.collections.length > 0);

  return (
    <>
      {/* Abertura: um card por setor (Infantil, Hogar...), cada um no seu visual. */}
      <SectorCards
        sectors={visible}
        homeImages={loose.map((p) => p.image).filter((s): s is string => Boolean(s))}
        sectorImages={Object.fromEntries(visible.map((s) => [s.slug, s.collections.flatMap((c) => (bySlug[c.slug] ?? []).map((p) => p.mainImage ?? p.image))]))}
      />

      <div>
        {visible.map((sector, si) => (
          // O 1o setor ja e apresentado pelos cards — entra direto nas colecoes.
          <div key={sector.id || sector.slug} id={si === 0 ? `setor-${sector.slug}` : undefined} className="scroll-mt-24">
            {si > 0 && <SectorBand sector={sector} />}
            {sector.collections.map((c, ci) => (
              <CollectionSpotlight key={c.slug} slug={c.slug} products={bySlug[c.slug]} priority={si === 0 && ci === 0} />
            ))}
          </div>
        ))}
      </div>

      {/* Produtos fora das colecoes (decoracao, casa...): vitrine pros pais,
          que sao quem compra — aumenta o ticket e baixa o CAC. */}
      {loose.length > 0 && <ThemedExtras products={loose.map(toStoreProduct)} />}
    </>
  );
}
