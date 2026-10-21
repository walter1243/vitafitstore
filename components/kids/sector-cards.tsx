'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';
import { type Sector, type SectorStyle } from '@/lib/sectors-shared';
import { SECTOR_THEMES, themeFor, type SectorTheme } from '@/components/themes/sector-themes';
import { parseWorldContent } from '@/lib/world-content';
import { dots } from './palette';
import { HAS_WORLD_ART, WorldArt } from './world-art';

// Abertura da home: os mundos (Infantil, Hogar, Llaveros, Mascotas e os
// proximos setores do admin) como OBJETOS soltos, sem card: a ilustracao de
// cada um + o nome. Passar o mouse (ou segurar com o dedo no celular) toca
// a animacao; clicar/tocar abre aquele mundo embaixo (funcionam como abas).

type World = { key: string; name: string; tagline: string; style: SectorStyle; theme: SectorTheme | null; cover: string };

const KIDS_INK = '#1E1B4B';

export function SectorCards({ sectors, active, onSelect, extraHome }: { sectors: Sector[]; active: string; onSelect: (slug: string) => void; extraHome: boolean }) {
  const worlds: World[] = sectors.map((s) => ({
    key: s.slug,
    name: s.name,
    tagline: s.tagline,
    style: s.style,
    theme: themeFor(s.style),
    cover: parseWorldContent(s.content, s.style).cover.url || s.imageUrl,
  }));
  if (extraHome && !sectors.some((s) => s.style === 'hogar')) {
    worlds.push({ key: 'mas', name: 'Hogar', tagline: 'Decoración y detalles para tu casa', style: 'hogar', theme: SECTOR_THEMES.hogar, cover: '' });
  }
  if (worlds.length === 0) return null;

  return (
    <section id="colecciones" className="relative scroll-mt-24 overflow-hidden bg-[#FFF8EF] px-4 pb-14 pt-36 sm:px-6 sm:pt-40 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={dots('#FFD9A8')} aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#1E1B4B] sm:text-6xl">Elige tu mundo</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-[#1E1B4B]/80 sm:text-xl">Juguetes, llaveros, cosas para tu mascota y para casa, impresos en 3D en nuestro taller.</p>
        </div>
        <ul role="tablist" aria-label="Mundos" className={`grid gap-x-4 gap-y-8 ${worlds.length <= 2 ? 'mx-auto max-w-xl grid-cols-2' : worlds.length === 3 ? 'grid-cols-3' : worlds.length >= 5 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 lg:grid-cols-4'}`}>
          {worlds.map((w) => (
            <li key={w.key} role="presentation">
              <WorldItem w={w} selected={active === w.key} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function WorldItem({ w, selected, onSelect }: { w: World; selected: boolean; onSelect: (k: string) => void }) {
  const [hover, setHover] = useState(false);
  const [go, setGo] = useState(0);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = () => { setHover((h) => { if (!h) setGo((n) => n + 1); return true; }); };
  const stop = () => setHover(false);
  // Navidad tem texto claro no tema (fundo verde); na home (fundo creme) usa verde escuro.
  const ink = w.style === 'navidad' ? '#14532D' : w.theme?.ink ?? KIDS_INK;
  const accent = w.style === 'navidad' ? '#DC2626' : w.theme?.accent ?? '#c2410c';
  const art = HAS_WORLD_ART(w.style);

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={() => onSelect(w.key)}
      // computador: passar o mouse
      onMouseEnter={start}
      onMouseLeave={stop}
      // celular: segurar o dedo no objeto
      onTouchStart={() => { hold.current = setTimeout(start, 120); }}
      onTouchEnd={() => { if (hold.current) clearTimeout(hold.current); setTimeout(stop, 1200); }}
      onTouchCancel={() => { if (hold.current) clearTimeout(hold.current); stop(); }}
      onContextMenu={(e) => e.preventDefault()}
      className="group flex w-full cursor-pointer select-none flex-col items-center text-center outline-none [-webkit-touch-callout:none] focus-visible:rounded-3xl focus-visible:ring-4 focus-visible:ring-[#1E1B4B]/30"
    >
      <span className="relative block w-full max-w-[260px]">
        {/* sombra no "chao" */}
        <span
          className={`absolute bottom-[6%] left-1/2 h-[8%] -translate-x-1/2 rounded-[50%] bg-black/10 blur-md transition-all duration-500 ${hover || selected ? 'w-[55%] opacity-60' : 'w-[65%] opacity-100'}`}
          aria-hidden="true"
        />
        {art ? (
          <WorldArt style={w.style} on={hover || selected} go={hover ? go : 0} alt={`Mundo ${w.name}`} />
        ) : w.cover ? (
          <span className="relative block aspect-square w-full">
            <Image src={w.cover} alt={`Mundo ${w.name}`} fill sizes="260px" className="object-contain" />
          </span>
        ) : null}
      </span>
      <span className="mt-1 text-2xl font-bold sm:text-3xl" style={{ color: ink, fontFamily: w.theme?.heading ?? "'Baloo 2', 'Nunito', sans-serif" }}>
        {w.name}
      </span>
      {w.tagline && <span className="mt-0.5 max-w-[240px] text-sm leading-snug" style={{ color: w.style === 'navidad' ? '#166534' : w.theme?.muted ?? '#3F3D6B' }}>{w.tagline}</span>}
      {/* marca do mundo aberto */}
      <span className="mt-3 h-1.5 rounded-full transition-all duration-300" style={{ width: selected ? 48 : 0, background: accent }} aria-hidden="true" />
    </button>
  );
}
