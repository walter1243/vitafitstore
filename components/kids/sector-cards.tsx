'use client';
import Link from 'next/link';
import { type Sector } from '@/lib/sectors-shared';
import { SECTOR_THEMES, themeFor, type SectorTheme } from '@/components/themes/sector-themes';
import { dots } from './palette';

type Card = { key: string; name: string; tagline: string; href: string; images: string[]; count: string; theme: SectorTheme | null };

// Abertura da home: um card por setor (Infantil, Hogar, Llaveros, Mascotas e
// os proximos criados no Admin → Setores e coleções), cada um no visual do
// proprio setor. Clicar leva pra parte daquele setor na pagina. Produtos de
// casa sem setor proprio entram como o card "Hogar".
export function SectorCards({ sectors, homeImages, sectorImages }: { sectors: Sector[]; homeImages: string[]; sectorImages: Record<string, string[]> }) {
  const cards: Card[] = sectors.map((s) => {
    const fromCollections = s.collections.map((c) => c.imageUrl || c.photoUrl).filter(Boolean);
    const images = [s.imageUrl, ...fromCollections, ...(sectorImages[s.slug] ?? [])].filter(Boolean).slice(0, 3);
    return {
      key: s.slug,
      name: s.name,
      tagline: s.tagline,
      href: `#setor-${s.slug}`,
      images,
      count: `${s.collections.length} ${s.collections.length === 1 ? 'colección' : 'colecciones'}`,
      theme: themeFor(s.style),
    };
  });
  if (homeImages.length > 0 && !sectors.some((s) => s.style === 'hogar')) {
    cards.push({
      key: 'mas',
      name: 'Hogar',
      tagline: 'Decoración y detalles para tu casa',
      href: '#productos',
      images: homeImages.slice(0, 3),
      count: `${homeImages.length} ${homeImages.length === 1 ? 'producto' : 'productos'}`,
      theme: SECTOR_THEMES.hogar,
    });
  }
  if (cards.length === 0) return null;

  return (
    <section id="colecciones" className="relative scroll-mt-24 overflow-hidden bg-[#FFF8EF] px-4 pb-16 pt-36 sm:px-6 sm:pt-40 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={dots('#FFD9A8')} aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-[#1E1B4B] sm:text-6xl">Elige tu mundo</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-[#1E1B4B]/80 sm:text-xl">Juguetes, llaveros, cosas para tu mascota y para casa, impresos en 3D en nuestro taller.</p>
        </div>
        <ul className={`grid gap-6 ${cards.length === 1 ? 'mx-auto max-w-md' : cards.length === 2 ? 'sm:grid-cols-2' : cards.length === 4 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {cards.map((c) => (
            <li key={c.key}>{c.theme ? <ThemedCard c={c} t={c.theme} /> : <KidsCard c={c} />}</li>
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

// Card de setor no visual dele (Casa, Chaveiros, Pet...).
function ThemedCard({ c, t }: { c: Card; t: SectorTheme }) {
  const pet = t.key === 'mascotas';
  return (
    <Link
      href={c.href}
      className="group flex h-full cursor-pointer flex-col p-5 transition-shadow duration-300 sm:p-6"
      style={{
        background: t.key === 'llaveros' ? `linear-gradient(160deg, #ffffff 0%, ${t.bg} 100%)` : t.bg,
        borderRadius: '32px',
        boxShadow: t.key === 'llaveros' ? '0 14px 36px rgba(79,70,229,0.16)' : undefined,
      }}
    >
      <span className={`grid gap-2 ${pet && c.images.length > 0 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {c.images.slice(0, pet ? 2 : 3).map((src) => (
          <span key={src} className={`${pet ? 'aspect-[4/5]' : 'aspect-square'} overflow-hidden`} style={{ borderRadius: t.radius, background: t.surface }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className={`h-full w-full ${t.key === 'llaveros' ? 'object-contain p-2' : 'object-cover'} transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none`} />
          </span>
        ))}
      </span>
      <span className="mt-5 text-2xl" style={{ fontFamily: t.kickerFont, color: t.accent }}>{t.kicker}</span>
      <span className="text-4xl font-semibold" style={{ fontFamily: t.heading, color: t.ink }}>{c.name}</span>
      {c.tagline && <span className="mt-1 text-base" style={{ color: t.muted }}>{c.tagline}</span>}
      <span className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="text-sm font-semibold" style={{ color: t.muted }}>{c.count}</span>
        <span className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold" style={{ background: t.cta, color: t.ctaText }}>
          Ver {c.name.toLowerCase()}
        </span>
      </span>
    </Link>
  );
}
