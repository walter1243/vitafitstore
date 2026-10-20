'use client';
import Link from 'next/link';
import { type Sector } from '@/lib/sectors-shared';
import { dots } from './palette';

type Card = { key: string; name: string; tagline: string; href: string; images: string[]; count: string; hogar: boolean };

// Abertura da home: um card por setor (Infantil, Hogar e os proximos criados
// no Admin → Setores e coleções), cada um no visual do proprio setor. Clicar
// leva pra parte daquele setor na pagina. Os produtos de casa sem setor
// proprio entram como o card "Hogar".
export function SectorCards({ sectors, homeImages }: { sectors: Sector[]; homeImages: string[] }) {
  const cards: Card[] = sectors.map((s) => ({
    key: s.slug,
    name: s.name,
    tagline: s.tagline,
    href: s.style === 'hogar' ? '/hogar' : `#setor-${s.slug}`,
    images: s.collections.map((c) => c.imageUrl || c.photoUrl).filter(Boolean).slice(0, 3),
    count: `${s.collections.length} ${s.collections.length === 1 ? 'colección' : 'colecciones'}`,
    hogar: s.style === 'hogar',
  }));
  if (homeImages.length > 0 && !sectors.some((s) => s.style === 'hogar')) {
    cards.push({
      key: 'hogar',
      name: 'Hogar',
      tagline: 'Decoración y detalles para tu casa',
      href: '/hogar',
      images: homeImages.slice(0, 3),
      count: `${homeImages.length} ${homeImages.length === 1 ? 'producto' : 'productos'}`,
      hogar: true,
    });
  }
  if (cards.length === 0) return null;

  return (
    <section id="colecciones" className="relative scroll-mt-24 overflow-hidden bg-[#FFF8EF] px-4 pb-16 pt-36 sm:px-6 sm:pt-40 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={dots('#FFD9A8')} aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-[#1E1B4B] sm:text-6xl">Elige tu mundo</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-[#1E1B4B]/80 sm:text-xl">Juguetes, lámparas y detalles para casa impresos en 3D en nuestro taller.</p>
        </div>
        <ul className={`grid gap-6 ${cards.length === 1 ? 'mx-auto max-w-md' : cards.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {cards.map((c) => (
            <li key={c.key}>{c.hogar ? <HogarCard c={c} /> : <KidsCard c={c} />}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function KidsCard({ c }: { c: Card }) {
  return (
    <Link
      href={c.href}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[32px] border-[3px] border-[#1E1B4B] bg-[#FFD84D] p-5 shadow-[6px_6px_0_#1E1B4B] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[9px_9px_0_#1E1B4B] motion-reduce:hover:translate-y-0 sm:p-6"
    >
      <span className="pointer-events-none absolute inset-0 opacity-50" style={dots('#FFB800')} aria-hidden="true" />
      <span className="relative grid grid-cols-3 gap-2">
        {c.images.map((src) => (
          <span key={src} className="aspect-square overflow-hidden rounded-2xl border-2 border-[#1E1B4B] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-contain p-1.5" />
          </span>
        ))}
      </span>
      <span className="relative mt-5 font-kids text-4xl font-bold text-[#1E1B4B]">{c.name}</span>
      {c.tagline && <span className="relative mt-1 text-base font-semibold text-[#1E1B4B]/80">{c.tagline}</span>}
      <span className="relative mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="text-sm font-bold text-[#1E1B4B]/70">{c.count}</span>
        <span className="inline-flex min-h-11 items-center rounded-full bg-[#1E1B4B] px-5 text-sm font-extrabold text-white transition-colors duration-200 group-hover:bg-[#363a5c]">
          Ver {c.name.toLowerCase()}
        </span>
      </span>
    </Link>
  );
}

function HogarCard({ c }: { c: Card }) {
  return (
    <Link
      href={c.href}
      className="hogar group flex h-full cursor-pointer flex-col rounded-[32px] bg-[#f3ece2] p-5 transition-colors duration-300 hover:bg-[#ece3d6] sm:p-6"
    >
      <span className="grid grid-cols-3 gap-2">
        {c.images.map((src) => (
          <span key={src} className="aspect-square overflow-hidden rounded-2xl bg-[#e2d6c4]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
          </span>
        ))}
      </span>
      <span className="mt-5 font-script text-2xl text-[#8a6a3a]">para tu casa</span>
      <span className="text-4xl font-semibold text-[#2b2620]">{c.name}</span>
      {c.tagline && <span className="mt-1 text-base text-[#5f574e]">{c.tagline}</span>}
      <span className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="text-sm font-semibold text-[#5f574e]">{c.count}</span>
        <span className="inline-flex min-h-11 items-center rounded-full bg-[#2b2620] px-5 text-sm font-semibold text-white transition-colors duration-200 group-hover:bg-[#4a4238]">
          Ver {c.name.toLowerCase()}
        </span>
      </span>
    </Link>
  );
}
