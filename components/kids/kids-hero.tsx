'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { COLLECTIONS } from '@/lib/collections';
import { type DbProduct } from '@/lib/store-product';

// Um quadro por colecao, com a foto REAL de um produto dela (como nas
// vitrines de lojas de brinquedo). Sem produto com foto ainda, o quadro
// mostra a colecao em pastel com o icone — nunca imagem inventada.
function coverFor(items: DbProduct[] | undefined) {
  return items?.find((p) => p.isCategoryCover && p.image)?.image ?? items?.find((p) => p.image)?.image;
}

export function KidsHero({ byCollection }: { byCollection: Map<string, DbProduct[]> }) {
  return (
    <section className="px-4 pt-32 sm:px-6 sm:pt-36 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-8 overflow-hidden rounded-[32px] bg-[#FFF4E0] px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-2 lg:gap-12 lg:px-14">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-wider text-[var(--k-cta)]">Hecho en nuestro taller 3D</p>
          <h1 className="mt-3 text-4xl font-bold text-[var(--k-ink)] sm:text-5xl lg:text-6xl">
            Juguetes y lámparas impresos en 3D para peques curiosos
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--k-muted)]">
            Juegos para montar y compartir en familia, y lámparas con formas divertidas para su habitación.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/coleccion/juegos-3d"
              className="inline-flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[var(--k-cta)] px-7 text-base font-extrabold text-white transition-colors duration-200 hover:bg-[var(--k-cta-hover)]"
            >
              Ver juegos <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/coleccion/lamparas"
              className="inline-flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-[var(--k-ink)] bg-white px-7 text-base font-extrabold text-[var(--k-ink)] transition-colors duration-200 hover:bg-[#FFF9F0]"
            >
              Ver lámparas
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          {COLLECTIONS.map((c, i) => {
            const Icon = c.icon;
            const image = coverFor(byCollection.get(c.slug));
            return (
              <Link
                key={c.slug}
                href={`/coleccion/${c.slug}`}
                className={`group relative flex aspect-[3/4] cursor-pointer flex-col overflow-hidden rounded-3xl transition-transform duration-300 hover:-translate-y-1 ${i === 1 ? 'mt-8' : ''}`}
                style={{ background: c.color.soft }}
              >
                {image ? (
                  <Image src={image} alt={c.name} fill sizes="(min-width: 1024px) 22vw, 45vw" className="object-cover" />
                ) : (
                  <span className="flex flex-1 items-center justify-center">
                    <Icon className="h-20 w-20 sm:h-24 sm:w-24" style={{ color: c.color.main }} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                )}
                <span className="relative mx-3 mb-3 mt-auto flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                  <span className="font-kids text-lg font-bold text-[var(--k-ink)] sm:text-xl">{c.shortName}</span>
                  <ArrowRight className="h-5 w-5 text-[var(--k-ink)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
