'use client';
import Image from 'next/image';
import Link from 'next/link';
import { type Product } from '@/lib/products';
import { type Sector, type SiteCollection } from '@/lib/sectors-shared';
import { CollectionPlayButton } from './collection-play';
import { ACCENTS } from './palette';
import { ProductCarousel } from './product-carousel';

// Visual "Casa / Hogar" (ui-ux-pro-max: minimalista quente — areia, creme,
// tinta marrom-escura, Caveat so no acento manuscrito). Usado quando o setor
// esta com Visual = Casa / Hogar no Admin → Setores e coleções.

const PILL_DARK = 'inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-[#2b2620] px-7 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#4a4238]';
const PILL_LINE = 'inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-[#2b2620]/40 px-7 text-[15px] font-semibold text-[#2b2620] transition-colors duration-200 hover:border-[#2b2620] hover:bg-[#2b2620]/5';

export function HomeSectorBand({ sector, first, asTitle }: { sector: Sector; first?: boolean; asTitle?: boolean }) {
  const Heading = asTitle ? 'h1' : 'h2';
  return (
    <section
      id={`setor-${sector.slug}`}
      className={`hogar scroll-mt-24 bg-[#f3ece2] px-4 text-center ${first ? 'pb-16 pt-36 sm:pt-40' : 'py-20 sm:py-24'}`}
    >
      <p className="font-script text-3xl text-[#8a6a3a] sm:text-4xl">hecho para tu casa</p>
      <Heading className="mt-1 text-4xl text-[#2b2620] sm:text-6xl">{sector.name}</Heading>
      {sector.tagline && <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-[#5f574e]">{sector.tagline}</p>}
      {!asTitle && (
        <div className="mt-8 flex justify-center">
          <Link href={`/sector/${sector.slug}`} className={PILL_LINE}>Ver {sector.name.toLowerCase()}</Link>
        </div>
      )}
    </section>
  );
}

export function HomeCollection({ collection, products, primaryHref, primaryLabel, headingLevel = 'h2', priority, first }: {
  collection: SiteCollection;
  products?: Product[];
  primaryHref?: string;
  primaryLabel?: string;
  headingLevel?: 'h1' | 'h2';
  priority?: boolean;
  first?: boolean;
}) {
  const Heading = headingLevel;
  const image = collection.photoUrl || collection.imageUrl;
  return (
    <section className={`hogar bg-[#fbf8f3] px-4 pb-20 sm:px-6 lg:px-8 ${first ? 'pt-36 sm:pt-40' : 'pt-20 sm:pt-24'}`}>
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div data-reveal className="order-2 text-center lg:order-1 lg:text-left">
          <p className="font-script text-3xl text-[#8a6a3a]">{collection.shortName}</p>
          <Heading className="mt-1 text-4xl text-[#2b2620] sm:text-5xl">{collection.name}</Heading>
          {collection.tagline && <p className="mt-4 text-lg leading-relaxed text-[#5f574e]">{collection.tagline}</p>}
          {collection.description && <p className="mt-3 max-w-lg text-base leading-relaxed text-[#5f574e] lg:max-w-none">{collection.description}</p>}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
            <Link href={primaryHref ?? `/coleccion/${collection.slug}`} className={PILL_DARK}>
              {primaryLabel ?? 'Ver colección'}
            </Link>
            {collection.interactive !== 'none' && <CollectionPlayButton slug={collection.slug} appearance="pill" />}
          </div>
        </div>
        {image && (
          <div data-reveal className="relative order-1 aspect-[4/5] w-full overflow-hidden rounded-[32px] bg-[#ece3d6] lg:order-2">
            <Image src={image} alt={collection.name} fill priority={priority} sizes="(min-width: 1024px) 50vw, 92vw" className="object-cover" />
          </div>
        )}
      </div>

      {products && products.length > 0 && (
        <div data-reveal className="mx-auto mt-16 max-w-6xl">
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-[#2b2620]/10 pb-4">
            <h3 className="text-2xl text-[#2b2620]">Elige el tuyo</h3>
            <Link href={`/coleccion/${collection.slug}`} className="text-sm font-semibold text-[#2b2620] underline decoration-[#2b2620]/30 underline-offset-4 hover:decoration-[#2b2620]">
              {products.length} {products.length === 1 ? 'producto' : 'productos'}
            </Link>
          </div>
          <ProductCarousel products={products} accent={ACCENTS.mint} variant="hogar" />
        </div>
      )}
    </section>
  );
}

// Produtos que nao estao em nenhuma colecao (decoracao, casa...): vitrine
// pros pais, no mesmo visual Casa / Hogar.
export function HomeExtras({ products }: { products: Product[] }) {
  return (
    <section id="productos" className="hogar scroll-mt-24 bg-[#f3ece2] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="font-script text-3xl text-[#8a6a3a] sm:text-4xl">para papás y mamás</p>
          <h2 className="mt-1 text-4xl text-[#2b2620] sm:text-5xl">También para tu hogar</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-[#5f574e]">
            Mientras los peques juegan, date un capricho: decoración y detalles para casa impresos en 3D en nuestro taller.
          </p>
        </div>
        <ProductCarousel products={products} accent={ACCENTS.mint} variant="hogar" />
      </div>
    </section>
  );
}
