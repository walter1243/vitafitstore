'use client';
import Link from 'next/link';
import { COLLECTIONS } from '@/lib/collections';
import { CollectionImage, CollectionPlayButton } from './collection-play';

// Banner da home: texto + um quadro por colecao com a imagem dela (os
// brinquedos em branco ganhando cor / a lampada foguete) e o botao da
// brincadeira (pintar o foguete / acender a lampada).
export function KidsHero() {
  return (
    <section className="px-4 pt-32 sm:px-6 sm:pt-36 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-8 overflow-hidden rounded-[32px] bg-[#FFF4E0] px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1fr_1.1fr] lg:gap-12 lg:px-14">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-wider text-[var(--k-cta)]">Hecho en nuestro taller 3D</p>
          <h1 className="mt-3 text-4xl font-bold text-[var(--k-ink)] sm:text-5xl lg:text-6xl">
            Juguetes para pintar y lámparas para soñar
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--k-muted)]">
            Impresos en 3D en nuestro taller: juguetes que llegan en blanco para pintarlos a tu manera, y lámparas con formas divertidas para la habitación.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {COLLECTIONS.map((c, i) => (
              <Link
                key={c.slug}
                href={`/coleccion/${c.slug}`}
                className={
                  i === 0
                    ? 'inline-flex min-h-[52px] cursor-pointer items-center justify-center rounded-2xl bg-[var(--k-cta)] px-7 text-base font-extrabold text-white transition-colors duration-200 hover:bg-[var(--k-cta-hover)]'
                    : 'inline-flex min-h-[52px] cursor-pointer items-center justify-center rounded-2xl border-2 border-[var(--k-ink)] bg-white px-7 text-base font-extrabold text-[var(--k-ink)] transition-colors duration-200 hover:bg-[#FFF9F0]'
                }
              >
                Ver {c.shortName.toLowerCase()}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {COLLECTIONS.map((c, i) => (
            <div
              key={c.slug}
              className={`flex flex-col overflow-hidden rounded-3xl bg-white ${i === 1 ? 'sm:mt-10' : ''}`}
            >
              <Link
                href={`/coleccion/${c.slug}`}
                aria-label={`Ver ${c.name}`}
                className="relative block aspect-square cursor-pointer overflow-hidden"
                style={{ background: "#FFFFFF" }}
              >
                <CollectionImage collection={c} sizes="(min-width: 1024px) 25vw, 90vw" priority />
              </Link>
              <div className="flex flex-col gap-3 p-4">
                <Link href={`/coleccion/${c.slug}`} className="font-kids text-2xl font-bold text-[var(--k-ink)] hover:underline">
                  {c.name}
                </Link>
                <CollectionPlayButton collection={c} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
