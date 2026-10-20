import Link from 'next/link';
import { PILL } from './pill';
import { dots } from './palette';
import { ThemedSectorBand } from '@/components/themes/themed-sections';
import { themeFor } from '@/components/themes/sector-themes';
import { type Sector } from '@/lib/sectors-shared';

// Abertura de um setor na home: nome grande, a frase do setor e uma pilula
// pra pagina dele. Bloco amarelo-sol com confete (paleta infantil).
export function SectorBand({ sector, first, asTitle }: { sector: Sector; first?: boolean; asTitle?: boolean }) {
  // Setor com visual proprio (Casa, Chaveiros, Pet): faixa do tema dele.
  const theme = themeFor(sector.style);
  if (theme) return <ThemedSectorBand sector={sector} theme={theme} first={first} asTitle={asTitle} />;
  const Heading = asTitle ? 'h1' : 'h2';
  return (
    <section
      id={`setor-${sector.slug}`}
      className={`relative scroll-mt-24 overflow-hidden bg-[#FFD84D] px-4 text-center ${first ? 'pb-14 pt-36 sm:pt-40' : 'py-16 sm:py-20'}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-50" style={dots('#FFB800')} aria-hidden="true" />
      <Heading className="relative text-4xl font-bold text-[#1E1B4B] sm:text-6xl">{sector.name}</Heading>
      {sector.tagline && <p className="relative mx-auto mt-3 max-w-2xl text-lg font-semibold text-[#1E1B4B]/85 sm:text-xl">{sector.tagline}</p>}
      {!asTitle && (
        <div className="relative mt-6 flex justify-center">
          <Link href={`/sector/${sector.slug}`} className={`${PILL} border-[3px] border-[#1E1B4B] bg-white text-[#1E1B4B] shadow-[4px_4px_0_#1E1B4B] transition-colors duration-200 hover:bg-[#1E1B4B] hover:text-white`}>
            Ver {sector.name.toLowerCase()}
          </Link>
        </div>
      )}
    </section>
  );
}
