'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { COLLECTIONS, type Collection } from '@/lib/collections';
import { type DbProduct } from '@/lib/store-product';

type Tile = { image?: string; collection: Collection };

// Mosaico 2x2 com fotos REAIS dos produtos das colecoes (como as vitrines
// de lojas de brinquedo). Faltando foto, o quadro mostra a colecao em
// pastel com o icone — nunca imagem inventada.
function tilesFor(byCollection: Map<string, DbProduct[]>): Tile[] {
  const tiles: Tile[] = [];
  for (let round = 0; round < 2; round++) {
    for (const c of COLLECTIONS) {
      const p = (byCollection.get(c.slug) ?? []).filter((x) => x.image)[round];
      tiles.push({ image: p?.image, collection: c });
    }
  }
  return tiles;
}

export function KidsHero({ byCollection }: { byCollection: Map<string, DbProduct[]> }) {
  const tiles = tilesFor(byCollection);
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

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {tiles.map((t, i) => {
            const Icon = t.collection.icon;
            return (
              <Link
                key={i}
                href={`/coleccion/${t.collection.slug}`}
                className={`relative aspect-square cursor-pointer overflow-hidden rounded-3xl transition-transform duration-300 hover:-translate-y-1 ${i % 2 === 1 ? 'translate-y-4' : ''}`}
                style={{ background: t.collection.color.soft }}
              >
                {t.image ? (
                  <Image src={t.image} alt={t.collection.shortName} fill sizes="(min-width: 1024px) 22vw, 45vw" className="object-cover" />
                ) : (
                  <span className="flex h-full w-full flex-col items-center justify-center gap-2">
                    <Icon className="h-12 w-12" style={{ color: t.collection.color.main }} strokeWidth={1.75} aria-hidden="true" />
                    <span className="font-kids text-lg font-bold" style={{ color: t.collection.color.main }}>{t.collection.shortName}</span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
