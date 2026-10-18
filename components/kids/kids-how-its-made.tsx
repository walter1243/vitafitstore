import Image from 'next/image';
import { Package, PenTool, Printer } from 'lucide-react';

const STEPS = [
  { icon: PenTool, title: 'Lo diseñamos', desc: 'Cada juego y cada lámpara empieza como un dibujo en 3D en el ordenador.', color: '#2563EB' },
  { icon: Printer, title: 'Lo imprimimos', desc: 'La impresora 3D lo construye capa a capa, como una torre de bloques muy fina.', color: '#C2410C' },
  { icon: Package, title: 'Llega a casa', desc: 'Lo revisamos, lo empaquetamos con cariño y te lo enviamos listo para disfrutar.', color: '#15803D' },
];

// "Nuestro taller": foto real da nossa impressora 3D com uma crianca
// brincando com uma peca recem-impressa, seguida dos 3 passos de como cada
// criacao e feita. Sem faixa de selos/garantias — pedido do usuario, a
// vitrine e infantil e fica mais leve sem eles.
export function KidsHowItsMade() {
  return (
    <section id="como-se-hace" className="scroll-mt-32 bg-[#EFF6FF] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <div className="relative">
            <div className="absolute -bottom-3 -right-3 h-full w-full rotate-2 rounded-[40px] bg-[#F97316] sm:-bottom-5 sm:-right-5" aria-hidden="true" />
            <figure className="relative overflow-hidden rounded-[36px] border-[6px] border-white bg-white shadow-[0_20px_50px_rgba(30,42,74,0.15)]">
              <div className="relative aspect-[1024/559]">
                <Image
                  src="/images/taller-nina-impresora-3d.jpg"
                  alt="Niña sonriendo mientras juega con un estegosaurio impreso en 3D, junto a nuestra impresora 3D"
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover"
                />
              </div>
            </figure>
          </div>

          <div>
            <p className="text-sm font-extrabold uppercase tracking-widest text-[#1D4ED8]">Nuestro taller</p>
            <h2 className="mt-2 text-4xl font-extrabold text-[#1e2a4a] sm:text-5xl">De la impresora a sus manos</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-700">
              Todo sale de nuestra impresora 3D: los dinosaurios, los puzzles y las lámparas se imprimen aquí,
              pieza a pieza, antes de viajar a tu casa.
            </p>
          </div>
        </div>

        <ol className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="flex gap-4 rounded-[28px] bg-white p-6 shadow-[0_6px_0_rgba(30,42,74,0.08)]">
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
                  style={{ background: s.color }}
                >
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-extrabold text-slate-500">Paso {i + 1}</span>
                  <span className="font-kids block text-2xl font-bold text-[#1e2a4a]">{s.title}</span>
                  <span className="mt-1 block text-base leading-relaxed text-slate-700">{s.desc}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
