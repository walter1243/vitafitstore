'use client';
import Link from 'next/link';
import { COLLECTIONS } from '@/lib/collections';
import { CollectionImage, CollectionPlayButton } from './collection-play';

// Banner da home: texto + um quadro por colecao com a imagem dela e o
// botao da brincadeira (montar o quebra-cabeca / pintar o foguete /
// acender a lampada).
export function KidsHero() {
  return (
    <section className="px-4 pt-32 sm:px-6 sm:pt-36 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-[#FFF4E0] px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
        <div className="max-w-3xl">
          <p className="text-sm font-extrabold uppercase tracking-wider text-[var(--k-cta)]">Hecho en nuestro taller 3D</p>
          <h1 className="mt-3 text-4xl font-bold text-[var(--k-ink)] sm:text-5xl lg:text-6xl">
            Rompecabezas, juguetes para pintar y lámparas para soñar
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--k-muted)]">
            Todo impreso en 3D en nuestro taller. Elige una colección y juega un poco antes de pedir.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {COLLECTIONS.map((c) => (
            <div
              key={c.slug}
              className="flex flex-col overflow-hidden rounded-3xl bg-white"
            >
              <Link
                href={`/coleccion/${c.slug}`}
                aria-label={`Ver ${c.name}`}
                className="relative block aspect-[4/3] cursor-pointer overflow-hidden"
                style={{ background: "#FFFFFF" }}
              >
                <CollectionImage collection={c} sizes="(min-width: 640px) 30vw, 90vw" priority />
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
