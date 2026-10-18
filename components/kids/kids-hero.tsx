import Link from 'next/link';
import { Lamp, Puzzle } from 'lucide-react';
import { Cloud, Cube, Star, Wave } from './kid-shapes';

// Titulo com cada palavra numa cor do logo, igual as letras do "Kitoys".
const TITLE: { word: string; color: string }[] = [
  { word: 'Juguetes', color: 'var(--k-orange)' },
  { word: 'que', color: 'var(--k-blue)' },
  { word: 'salen', color: 'var(--k-red)' },
  { word: 'de', color: 'var(--k-green)' },
  { word: 'la', color: 'var(--k-purple)' },
  { word: 'impresora', color: 'var(--k-orange)' },
  { word: '3D', color: 'var(--k-blue)' },
];

// Torre de blocos de montar (o cubo do logo) — ilustracao do hero.
function BlockTower() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]" aria-hidden="true">
      <Cube top="#FFB347" left="#FF8A00" right="#E06A00" className="animate-kid-float absolute bottom-[4%] left-[14%] w-[38%]" />
      <Cube top="#6FB6FF" left="#1E88FF" right="#1468CC" className="animate-kid-float-slow absolute bottom-[4%] right-[10%] w-[38%]" />
      <Cube top="#FF7A88" left="#F2384A" right="#C21F31" className="animate-kid-float absolute bottom-[34%] left-[32%] w-[38%]" style={{ animationDelay: '0.6s' }} />
      <Cube top="#7EE29A" left="#22B14C" right="#178A39" className="animate-kid-float-slow absolute left-[2%] top-[14%] w-[22%]" style={{ ['--r' as string]: '-12deg' }} />
      <Cube top="#C79BFF" left="#8B3FD9" right="#6A2BB0" className="animate-kid-float absolute right-[4%] top-[6%] w-[26%]" style={{ ['--r' as string]: '10deg', animationDelay: '1.2s' }} />
      <Star color="#FFC93C" className="animate-kid-float absolute left-[46%] top-[2%] w-[12%]" />
      <Star color="#FF7A88" className="animate-kid-float-slow absolute bottom-[30%] right-[2%] w-[9%]" />
      <Star color="#6FB6FF" className="animate-kid-float-slow absolute bottom-[40%] left-[0%] w-[8%]" />
    </div>
  );
}

export function KidsHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#BFE3FF] via-[#DDF0FF] to-[#F3FAFF] pt-32 sm:pt-36">
      <Cloud className="pointer-events-none absolute left-[-40px] top-28 w-44 opacity-90 sm:w-56" />
      <Cloud className="pointer-events-none absolute right-[8%] top-24 hidden w-40 opacity-80 md:block" />
      <Cloud className="pointer-events-none absolute bottom-24 left-[38%] hidden w-32 opacity-70 lg:block" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-10 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:px-8 lg:pb-16">
        <div className="text-center lg:text-left">
          <h1 className="text-[2.75rem] font-extrabold sm:text-6xl lg:text-7xl">
            {TITLE.map((t, i) => (
              <span key={i} style={{ color: t.color, textShadow: '0 4px 0 rgba(31,35,64,0.18)' }}>
                {t.word}{i < TITLE.length - 1 ? ' ' : ''}
              </span>
            ))}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg font-semibold leading-relaxed text-[#3a3f63] sm:text-xl lg:mx-0">
            Juegos para montar y compartir, y lámparas divertidas para la habitación de los peques. ¡Elige tu colección!
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="/coleccion/juegos-3d"
              className="kid-btn flex min-h-[60px] items-center justify-center gap-2.5 rounded-full bg-[var(--k-orange)] px-8 font-kids text-xl font-bold text-white"
            >
              <Puzzle className="h-6 w-6" aria-hidden="true" /> Juegos 3D
            </Link>
            <Link
              href="/coleccion/lamparas"
              className="kid-btn flex min-h-[60px] items-center justify-center gap-2.5 rounded-full bg-[var(--k-purple)] px-8 font-kids text-xl font-bold text-white"
            >
              <Lamp className="h-6 w-6" aria-hidden="true" /> Lámparas
            </Link>
          </div>
        </div>

        <BlockTower />
      </div>

      <Wave color="#ffffff" />
    </section>
  );
}
