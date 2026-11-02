'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { type Product } from '@/lib/products';
import { toStoreProduct } from '@/lib/store-product';
import { useCart } from '@/lib/cart-context';
import { cardPrice } from '@/lib/personalize';
import { useSectors } from '@/components/kids/sectors-context';
import { useStoreProducts } from '@/components/kids/use-store-products';

// Home no estilo da Apple: fundo claro, tipografia grande, muito respiro e os
// produtos em primeiro plano. A escolha de setor/colecao fica so no menu
// (Header → Colecciones); aqui cada setor e uma secao com os produtos dele.

const FONT = { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif' };
const INK = '#1d1d1f';
const MUTED = '#6e6e73';
const BLUE = '#0071e3';

function ProductTile({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const cp = cardPrice(product.price, product.personalize, product.sizes);
  const href = `/producto/${product.id}-${product.slug}`;
  // Com cor/tamanho/nome a escolha e na pagina do produto.
  const needsChoice = Boolean(product.personalize?.enabled || product.colorOptions?.length || product.sizes?.length);
  const img = product.mainImage ?? product.image;

  function add(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <Link href={href} className="group flex h-full flex-col rounded-[22px] bg-white p-4 transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" style={{ outlineColor: BLUE }}>
      <div className="relative aspect-square overflow-hidden rounded-[16px] bg-[#f5f5f7]">
        {img && <Image src={img} alt={product.name} fill sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-4">
        <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug" style={{ color: INK }}>{product.name}</h3>
        <p className="mt-1 text-[15px]" style={{ color: INK }}>
          {cp.main}
          {cp.sub && <span className="ml-1.5 text-[13px]" style={{ color: MUTED }}>{cp.sub}{cp.off ? ` · -${cp.off}%` : ''}</span>}
        </p>
        <div className="mt-auto pt-4">
          {needsChoice ? (
            <span className="inline-flex min-h-9 items-center rounded-full px-4 text-[14px] font-medium text-white transition-colors" style={{ background: BLUE }}>
              {product.personalize?.enabled ? 'Personalizar' : 'Elegir'}
            </span>
          ) : (
            <button type="button" onClick={add} className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-4 text-[14px] font-medium text-white transition-colors" style={{ background: added ? '#1d8a3a' : BLUE }} aria-label={`Añadir ${product.name} al carrito`}>
              {added && <Check className="h-4 w-4" aria-hidden="true" />}
              {added ? 'Añadido' : 'Comprar'}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

type Block = { key: string; title: string; tagline: string; href: string; products: Product[] };

export function AppleHome() {
  const { products } = useStoreProducts();
  const { sectors, collectionForProduct } = useSectors();

  const blocks: Block[] = useMemo(() => {
    const bySector: Record<string, Product[]> = {};
    const loose: Product[] = [];
    for (const p of products) {
      const c = collectionForProduct(p);
      const s = c ? sectors.find((x) => x.collections.some((y) => y.slug === c.slug)) : null;
      if (s) (bySector[s.slug] ??= []).push(toStoreProduct(p));
      else loose.push(toStoreProduct(p));
    }
    const list: Block[] = sectors
      .filter((s) => bySector[s.slug]?.length)
      .map((s) => ({ key: s.slug, title: s.name, tagline: s.tagline, href: `/sector/${s.slug}`, products: bySector[s.slug] }));
    if (loose.length) list.push({ key: 'mas', title: 'Más productos', tagline: 'Detalles impresos en 3D para tu casa', href: '/#mas', products: loose });
    return list;
  }, [products, sectors, collectionForProduct]);

  // Destaque da abertura: Navidad na temporada; senao o primeiro setor.
  const hero = blocks.find((b) => b.key === 'navidad') ?? blocks[0];
  const heroImgs = (hero?.products ?? []).map((p) => p.mainImage ?? p.image).filter(Boolean).slice(0, 3) as string[];

  return (
    <div style={FONT} className="bg-white antialiased [&_h1]:[font-family:inherit] [&_h2]:[font-family:inherit] [&_h3]:[font-family:inherit]">
      {/* Abertura */}
      <section className="px-4 pb-14 pt-36 text-center sm:px-6 sm:pt-40">
        <p className="text-[17px] font-semibold sm:text-[21px]" style={{ color: '#bf4800' }}>{hero?.key === 'navidad' ? 'Navidad' : 'Kitoys 3D'}</p>
        <h1 className="mx-auto mt-2 max-w-4xl text-[40px] font-semibold leading-[1.05] tracking-[-0.015em] sm:text-[64px]" style={{ color: INK }}>
          Regalos impresos en 3D.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[19px] leading-snug sm:text-[24px]" style={{ color: MUTED }}>
          Diseñados y fabricados en nuestro taller de Elche. Muchos, con el nombre que tú elijas.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {hero && (
            <a href={`#${hero.key}`} className="inline-flex min-h-11 items-center rounded-full px-6 text-[17px] font-medium text-white transition-opacity hover:opacity-90" style={{ background: BLUE }}>
              Comprar {hero.key === 'navidad' ? 'Navidad' : ''}
            </a>
          )}
          <a href="#productos" className="inline-flex min-h-11 items-center rounded-full border px-6 text-[17px] font-medium transition-colors hover:bg-[#0071e3]/5" style={{ borderColor: BLUE, color: BLUE }}>
            Ver todo
          </a>
        </div>

        {heroImgs.length > 0 && (
          <div className={`mx-auto mt-12 grid max-w-5xl gap-3 sm:gap-4 ${heroImgs.length >= 3 ? 'grid-cols-2 sm:grid-cols-[2fr_1fr] sm:grid-rows-2' : 'grid-cols-2'}`}>
            {heroImgs.map((src, i) => (
              <div key={src} className={`relative overflow-hidden rounded-[28px] bg-[#f5f5f7] ${heroImgs.length >= 3 && i === 0 ? 'col-span-2 aspect-[4/3] sm:col-span-1 sm:row-span-2 sm:aspect-auto' : 'aspect-square'}`}>
                <Image src={src} alt="" fill priority={i === 0} sizes="(min-width: 1024px) 640px, 100vw" className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Um bloco por setor (a escolha de colecao fica no menu) */}
      <div id="productos" className="scroll-mt-24">
        {blocks.map((b, i) => (
          <section key={b.key} id={b.key} className={`scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 ${i % 2 === 0 ? 'bg-[#f5f5f7]' : 'bg-white'}`}>
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 sm:mb-10">
                <div>
                  <h2 className="text-[32px] font-semibold leading-tight tracking-[-0.01em] sm:text-[48px]" style={{ color: INK }}>{b.title}</h2>
                  {b.tagline && <p className="mt-1 text-[17px] sm:text-[21px]" style={{ color: MUTED }}>{b.tagline}</p>}
                </div>
                {b.key !== 'mas' && (
                  <Link href={b.href} className="text-[17px] font-medium hover:underline" style={{ color: BLUE }}>Ver todo</Link>
                )}
              </div>
              {/* Carrossel: desliza pro lado (dedo, trackpad ou arrastando a barra) */}
              <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:gap-5 sm:px-6 [&::-webkit-scrollbar]:hidden">
                {b.products.map((p) => (
                  <li key={p.id} className={`w-[64vw] max-w-[260px] shrink-0 snap-start sm:w-[260px] ${i % 2 === 0 ? '' : '[&>a]:bg-[#f5f5f7] [&_.aspect-square]:bg-white'}`}>
                    <ProductTile product={p} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
        {blocks.length === 0 && <div className="h-64" aria-hidden="true" />}
      </div>
    </div>
  );
}
