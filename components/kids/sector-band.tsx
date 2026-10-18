import Link from 'next/link';
import { PILL } from './pill';
import { type Sector } from '@/lib/sectors-shared';

// Abertura de um setor na home: nome grande, a frase do setor e uma pilula
// pra pagina dele. Fundo branco — separa um setor do outro com corte seco.
export function SectorBand({ sector, first, asTitle }: { sector: Sector; first?: boolean; asTitle?: boolean }) {
  const Heading = asTitle ? 'h1' : 'h2';
  return (
    <section
      id={`setor-${sector.slug}`}
      className={`scroll-mt-24 bg-white px-4 text-center ${first ? 'pb-14 pt-36 sm:pt-40' : 'py-16 sm:py-20'}`}
    >
      <Heading className="text-4xl font-bold text-[#23263f] sm:text-6xl">{sector.name}</Heading>
      {sector.tagline && <p className="mx-auto mt-3 max-w-2xl text-lg text-[#565a78] sm:text-xl">{sector.tagline}</p>}
      {!asTitle && (
        <div className="mt-6 flex justify-center">
          <Link href={`/sector/${sector.slug}`} className={`${PILL} border-2 border-[#23263f] text-[#23263f] hover:bg-[#23263f]/5`}>
            Ver {sector.name.toLowerCase()}
          </Link>
        </div>
      )}
    </section>
  );
}
