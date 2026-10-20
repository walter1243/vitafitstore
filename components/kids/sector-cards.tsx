'use client';
import Image from 'next/image';
import Link from 'next/link';
import { type Sector, type SectorStyle } from '@/lib/sectors-shared';
import { SECTOR_THEMES, themeFor, type SectorTheme } from '@/components/themes/sector-themes';
import { dots } from './palette';

// Imagem de capa de cada mundo. A "Imagem do setor" do Admin → Setores e
// coleções tem prioridade; sem ela, usa a arte padrao do visual.
const COVER: Record<SectorStyle, string> = {
  infantil: '/images/sectors/infantil.jpg',
  hogar: '/images/sectors/hogar.jpg',
  llaveros: '/images/sectors/llaveros.jpg',
  mascotas: '/images/sectors/mascotas.png',
};

type Card = { key: string; name: string; tagline: string; href: string; image: string; contain: boolean; theme: SectorTheme | null };

// Abertura da home: um card por mundo (Infantil, Hogar, Llaveros, Mascotas e
// os proximos setores do admin) com a imagem de capa, o nome e a frase —
// cada um no visual do proprio setor. Setor que ja aparece na home rola ate
// ele; os outros abrem a pagina do setor.
export function SectorCards({ sectors, onPage, extraHome }: { sectors: Sector[]; onPage: Set<string>; extraHome: boolean }) {
  const cards: Card[] = sectors.map((s) => ({
    key: s.slug,
    name: s.name,
    tagline: s.tagline,
    href: onPage.has(s.slug) ? `#setor-${s.slug}` : `/sector/${s.slug}`,
    image: s.imageUrl || COVER[s.style],
    contain: !s.imageUrl && s.style === 'mascotas',
    theme: themeFor(s.style),
  }));
  if (extraHome && !sectors.some((s) => s.style === 'hogar')) {
    cards.push({ key: 'mas', name: 'Hogar', tagline: 'Decoración y detalles para tu casa', href: '#productos', image: COVER.hogar, contain: false, theme: SECTOR_THEMES.hogar });
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
        <ul className={`grid gap-6 ${cards.length === 1 ? 'mx-auto max-w-md' : cards.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
          {cards.map((c, i) => (
            <li key={c.key}>{c.theme ? <ThemedCard c={c} t={c.theme} priority={i < 2} /> : <KidsCard c={c} priority={i < 2} />}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function KidsCard({ c, priority }: { c: Card; priority: boolean }) {
  return (
    <Link
      href={c.href}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[32px] border-[3px] border-[#1E1B4B] bg-[#FFD84D] p-4 shadow-[6px_6px_0_#1E1B4B] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[9px_9px_0_#1E1B4B] motion-reduce:hover:translate-y-0 sm:p-5"
    >
      <span className="relative block aspect-[16/10] overflow-hidden rounded-[22px] border-[3px] border-[#1E1B4B] bg-white">
        <Image src={c.image} alt={`Mundo ${c.name}`} fill priority={priority} sizes="(min-width: 640px) 50vw, 92vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none" />
      </span>
      <span className="mt-5 font-kids text-4xl font-bold text-[#1E1B4B]">{c.name}</span>
      {c.tagline && <span className="mt-1 text-base font-semibold text-[#1E1B4B]/80">{c.tagline}</span>}
      <span className="mt-auto flex justify-end pt-5">
        <span className="inline-flex min-h-11 items-center rounded-full bg-[#1E1B4B] px-5 text-sm font-extrabold text-white transition-colors duration-200 group-hover:bg-[#363a5c]">
          Ver {c.name.toLowerCase()}
        </span>
      </span>
    </Link>
  );
}

// Card do mundo no visual dele (Casa, Chaveiros, Pet...).
function ThemedCard({ c, t, priority }: { c: Card; t: SectorTheme; priority: boolean }) {
  return (
    <Link
      href={c.href}
      className="group flex h-full cursor-pointer flex-col p-4 transition-shadow duration-300 sm:p-5"
      style={{
        background: t.key === 'llaveros' ? `linear-gradient(160deg, #ffffff 0%, ${t.bg} 100%)` : t.bg,
        borderRadius: '32px',
        boxShadow: t.key === 'llaveros' ? '0 14px 36px rgba(79,70,229,0.16)' : undefined,
      }}
    >
      <span className="relative block aspect-[16/10] overflow-hidden" style={{ borderRadius: t.radius, background: c.contain ? t.surface : t.bgAlt }}>
        <Image
          src={c.image}
          alt={`Mundo ${c.name}`}
          fill
          priority={priority}
          sizes="(min-width: 640px) 50vw, 92vw"
          className={`${c.contain ? 'object-contain p-4' : 'object-cover'} transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none`}
        />
      </span>
      <span className="mt-5 text-2xl" style={{ fontFamily: t.kickerFont, color: t.accent }}>{t.kicker}</span>
      <span className="text-4xl font-semibold" style={{ fontFamily: t.heading, color: t.ink }}>{c.name}</span>
      {c.tagline && <span className="mt-1 text-base" style={{ color: t.muted }}>{c.tagline}</span>}
      <span className="mt-auto flex justify-end pt-5">
        <span className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold" style={{ background: t.cta, color: t.ctaText }}>
          Ver {c.name.toLowerCase()}
        </span>
      </span>
    </Link>
  );
}
