import Image from 'next/image';
import { Package, PenTool, Printer } from 'lucide-react';

const STEPS = [
  { icon: PenTool, title: 'Lo diseñamos', desc: 'Cada juguete empieza como un dibujo en 3D.' },
  { icon: Printer, title: 'Lo imprimimos', desc: 'La impresora lo construye capa a capa.' },
  { icon: Package, title: 'Te lo enviamos', desc: 'Lo revisamos y lo empaquetamos con cariño.' },
];

// "Nuestro taller": foto real da crianca com uma peca recem-impressa e os
// tres passos de como cada criacao e feita.
export function KidsHowItsMade() {
  return (
    <section id="como-se-hace" className="scroll-mt-28 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-10 overflow-hidden rounded-[32px] bg-[#EAF6EF] p-6 sm:p-10 lg:grid-cols-2 lg:gap-14 lg:p-14">
        <div className="relative aspect-[1024/559] overflow-hidden rounded-3xl">
          <Image
            src="/images/taller-nina-impresora-3d.jpg"
            alt="Niña sonriendo mientras juega con un estegosaurio impreso en 3D, junto a nuestra impresora 3D"
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-sm font-extrabold uppercase tracking-wider text-[#15803d]">Nuestro taller</p>
          <h2 className="mt-2 text-3xl font-bold text-[var(--k-ink)] sm:text-4xl">De nuestra impresora a sus manos</h2>
          <ol className="mt-8 space-y-6">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.title} className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#15803d]">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-kids text-xl font-bold text-[var(--k-ink)]">{s.title}</span>
                    <span className="block text-base text-[var(--k-muted)]">{s.desc}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
