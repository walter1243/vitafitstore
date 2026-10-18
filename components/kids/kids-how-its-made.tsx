import Image from 'next/image';
import { Package, PenTool, Printer } from 'lucide-react';
import { Star, Wave } from './kid-shapes';

const STEPS = [
  { icon: PenTool, title: 'Lo diseñamos', desc: 'Cada juguete empieza como un dibujo en 3D.', color: 'var(--k-blue)' },
  { icon: Printer, title: 'Lo imprimimos', desc: 'La impresora lo construye capa a capa.', color: 'var(--k-orange)' },
  { icon: Package, title: '¡Llega a casa!', desc: 'Lo empaquetamos con cariño y te lo enviamos.', color: 'var(--k-green)' },
];

// "Nuestro taller": foto real da crianca brincando com uma peca impressa,
// numa moldura de brinquedo, e os 3 passos em bolinhas coloridas.
export function KidsHowItsMade() {
  return (
    <section id="como-se-hace" className="scroll-mt-28">
      <Wave color="#FFF6D6" />
      <div className="bg-[#FFF6D6] px-4 pb-20 pt-6">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div className="relative">
            <Star color="#FFC93C" className="animate-kid-float absolute -left-3 -top-5 z-10 w-14" />
            <Star color="#FF7A88" className="animate-kid-float-slow absolute -bottom-4 right-6 z-10 w-10" />
            <div className="-rotate-2 overflow-hidden rounded-[36px] border-[6px] border-[var(--k-ink)] bg-white shadow-[0_10px_0_rgba(31,35,64,0.15)]">
              <div className="relative aspect-[1024/559]">
                <Image
                  src="/images/taller-nina-impresora-3d.jpg"
                  alt="Niña sonriendo mientras juega con un estegosaurio impreso en 3D, junto a nuestra impresora 3D"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="font-kids text-lg font-bold text-[var(--k-green)]">Nuestro taller</p>
            <h2 className="text-4xl font-extrabold text-[var(--k-ink)] sm:text-5xl">¡De la impresora a tus manos!</h2>
            <ol className="mt-8 space-y-5">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <li key={s.title} className="flex items-center gap-4">
                    <span
                      className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-[var(--k-ink)] text-white"
                      style={{ background: s.color }}
                    >
                      <Icon className="h-7 w-7" aria-hidden="true" />
                      <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-[var(--k-ink)] bg-white font-kids text-sm font-extrabold text-[var(--k-ink)]">
                        {i + 1}
                      </span>
                    </span>
                    <span>
                      <span className="block font-kids text-2xl font-bold text-[var(--k-ink)]">{s.title}</span>
                      <span className="block text-base font-semibold text-[#4a4f72]">{s.desc}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
