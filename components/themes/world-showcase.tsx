'use client';
import Image from 'next/image';
import { Gift, Heart, Leaf, Lock, PawPrint, PenLine, Printer, ShieldCheck, Sparkles, Sun, Truck, type LucideIcon } from 'lucide-react';
import { type SectorStyle } from '@/lib/sectors-shared';
import { themeFor, type SectorTheme } from './sector-themes';

// Vitrine de cada mundo (Casa, Chaveiros, Pet) — ui-ux-pro-max "Bento Grid
// Showcase": fotos reais de uso em destaque + blocos curtos de beneficio,
// "como funciona" em 3 passos (personalizaveis) e a faixa de confianca.
// Sem avaliacoes inventadas: so o que a loja realmente oferece.

type Tile = { Icon: LucideIcon; title: string; text: string };
type Shot = { src: string; alt: string; caption: string };
type Showcase = {
  kicker: string;
  title: string;
  intro: string;
  shots: Shot[];
  tiles: Tile[];
  steps?: { title: string; text: string }[];
};

const SHOWCASE: Record<SectorTheme['key'], Showcase> = {
  hogar: {
    kicker: 'así queda en casa',
    title: 'Bonito y útil, todos los días',
    intro: 'Piezas pensadas para vivir en tu salón, tu estantería o tu mesa: combinan con todo y se notan sin hacer ruido.',
    shots: [
      { src: '/images/sectors/hogar-1.jpg', alt: 'Jarrón impreso en 3D con margaritas sobre una estantería', caption: 'En la estantería, con flores frescas del jardín' },
      { src: '/images/sectors/hogar-2.jpg', alt: 'Jarrón impreso en 3D sobre una mesa de centro con otros detalles', caption: 'Sobre la mesa, junto a tus cosas de siempre' },
    ],
    tiles: [
      { Icon: Sun, title: 'Juega con la luz', text: 'El relieve en espiral cambia con la luz del día.' },
      { Icon: Leaf, title: 'Flores, ramas o solo', text: 'Con un ramo, con ramas secas o como pieza decorativa.' },
      { Icon: Heart, title: 'Tonos que combinan', text: 'Colores neutros que encajan en cualquier rincón.' },
    ],
  },
  llaveros: {
    kicker: 'hecho para ti',
    title: 'Un llavero que es solo tuyo',
    intro: 'Eliges el modelo, escribes el nombre y lo ves al momento. Nosotros lo imprimimos en 3D y te lo enviamos.',
    shots: [
      { src: '/images/sectors/llaveros-1.jpg', alt: 'Llavero personalizado impreso en 3D en la mano', caption: 'Siempre a mano, con tus llaves' },
      { src: '/images/sectors/llaveros.jpg', alt: 'Colección de llaveros impresos en 3D', caption: 'Modelos para todos los gustos' },
    ],
    tiles: [
      { Icon: Gift, title: 'El regalo perfecto', text: 'Con el nombre de quien lo recibe: cumpleaños, fin de curso, detalles.' },
      { Icon: Sparkles, title: 'Ligero y resistente', text: 'Para mochilas, llaves y bolsos del día a día.' },
      { Icon: PenLine, title: 'Lo ves antes de pedirlo', text: 'Escribe el nombre y mira cómo queda en el modelo.' },
    ],
    steps: [
      { title: 'Elige el modelo', text: 'Mira los llaveros de la colección y quédate con tu favorito.' },
      { title: 'Escribe el nombre', text: 'Lo ves al momento en el llavero, tal cual lo imprimiremos.' },
      { title: 'Lo imprimimos y enviamos', text: 'Sale de nuestro taller de Elche directo a tu casa.' },
    ],
  },
  mascotas: {
    kicker: 'para los peludos de la casa',
    title: 'Hechos para su día a día',
    intro: 'Comederos, paseos y detalles impresos en 3D, pensados para que tu mascota (y tú) estéis más cómodos.',
    shots: [
      { src: '/images/sectors/mascotas-1.jpg', alt: 'Perro comiendo de un comedero doble impreso en 3D', caption: 'A la hora de comer' },
      { src: '/images/sectors/mascotas-2.jpg', alt: 'Dispensador de bolsas con forma de hueso y pala para paseos impresos en 3D', caption: 'Listos para el paseo' },
    ],
    tiles: [
      { Icon: PawPrint, title: 'Con su nombre', text: 'Personaliza las piezas con el nombre de tu mascota.' },
      { Icon: Sparkles, title: 'Fáciles de limpiar', text: 'Superficies lisas, pensadas para el uso diario.' },
      { Icon: Heart, title: 'Colores alegres', text: 'Para que sus cosas se encuentren a la primera.' },
    ],
    steps: [
      { title: 'Elige la pieza', text: 'Comedero, placa, accesorio de paseo…' },
      { title: 'Escribe su nombre', text: 'Míralo al momento en la pieza antes de pedirla.' },
      { title: 'Lo recibe en casa', text: 'Lo imprimimos en Elche y te lo enviamos con seguimiento.' },
    ],
  },
};

const TRUST: Tile[] = [
  { Icon: Printer, title: 'Impreso en Elche', text: 'Diseñado e impreso en nuestro taller.' },
  { Icon: Truck, title: 'Envío con seguimiento', text: 'Gratis a partir de 50 €.' },
  { Icon: ShieldCheck, title: 'Garantía de 3 años', text: 'Ante cualquier defecto de fabricación.' },
  { Icon: Lock, title: 'Pago seguro', text: 'Tarjeta, Apple Pay y Google Pay.' },
];

// Elementos decorativos de cada mundo (so enfeite, escondidos do leitor de tela).
function Decor({ t }: { t: SectorTheme }) {
  if (t.key === 'mascotas') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {[[6, 12, -20], [88, 8, 25], [92, 62, -10], [3, 70, 15], [50, 94, 30]].map(([x, y, r], i) => (
          <PawPrint key={i} className="absolute h-14 w-14" style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${r}deg)`, color: t.accent, opacity: 0.12 }} />
        ))}
      </div>
    );
  }
  if (t.key === 'llaveros') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span className="absolute -left-16 top-10 h-48 w-48 rounded-full border-[14px]" style={{ borderColor: `${t.accent}1f` }} />
        <span className="absolute -right-10 bottom-16 h-64 w-64 rounded-full border-[18px]" style={{ borderColor: `${t.cta}1f` }} />
        <span className="absolute right-[18%] top-6 h-20 w-20 rounded-full border-[8px]" style={{ borderColor: `${t.accent}26` }} />
      </div>
    );
  }
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <span className="absolute -left-24 top-20 h-72 w-72 rounded-[45%_55%_60%_40%/55%_45%_55%_45%]" style={{ background: `${t.surface}` }} />
      <span className="absolute -right-20 bottom-10 h-80 w-80 rounded-[60%_40%_45%_55%/45%_55%_45%_55%]" style={{ background: `${t.bg}` }} />
    </div>
  );
}

export function WorldShowcase({ style }: { style?: SectorStyle }) {
  const t = themeFor(style);
  if (!t) return null;
  const s = SHOWCASE[t.key];

  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24 lg:px-8" style={{ background: t.bgAlt, color: t.ink }}>
      <Decor t={t} />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-2xl sm:text-3xl" style={{ fontFamily: t.kickerFont, color: t.accent }}>{s.kicker}</p>
          <h2 className="mt-1 text-4xl font-semibold sm:text-5xl" style={{ fontFamily: t.heading }}>{s.title}</h2>
          <p className="mt-4 text-lg leading-relaxed" style={{ color: t.muted }}>{s.intro}</p>
        </div>

        {/* Bento: 2 fotos grandes + 3 blocos de beneficio */}
        <div className="grid gap-4 md:grid-cols-6 md:grid-rows-[repeat(2,minmax(0,1fr))]">
          {s.shots.map((shot, i) => (
            <figure
              key={shot.src}
              className={`group relative overflow-hidden ${i === 0 ? 'aspect-[4/5] md:col-span-3 md:row-span-2 md:aspect-auto' : 'aspect-[4/3] md:col-span-3'}`}
              style={{ borderRadius: t.radius, background: t.surface, minHeight: i === 0 ? 420 : undefined }}
            >
              <Image src={shot.src} alt={shot.alt} fill sizes="(min-width: 768px) 50vw, 92vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none" />
              <figcaption className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/90 px-4 py-2.5 text-sm font-semibold backdrop-blur" style={{ color: t.ink }}>
                {shot.caption}
              </figcaption>
            </figure>
          ))}
          <div className="grid gap-4 sm:grid-cols-3 md:col-span-3">
            {s.tiles.map(({ Icon, title, text }) => (
              <div key={title} className="flex flex-col p-5" style={{ borderRadius: t.radius, background: t.key === 'llaveros' ? '#ffffff' : t.bg, boxShadow: t.key === 'llaveros' ? '0 10px 28px rgba(79,70,229,0.10)' : undefined }}>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: t.cta, color: t.ctaText }}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-4 text-lg font-semibold leading-snug" style={{ fontFamily: t.heading }}>{title}</p>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: t.muted }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Como funciona (so nos personalizaveis) */}
        {s.steps && (
          <div className="mt-16">
            <h3 className="mb-8 text-center text-3xl font-semibold" style={{ fontFamily: t.heading }}>Así de fácil</h3>
            <ol className="grid gap-4 md:grid-cols-3">
              {s.steps.map((step, i) => (
                <li key={step.title} className="relative p-6" style={{ borderRadius: t.radius, background: t.key === 'llaveros' ? '#ffffff' : t.bg }}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold" style={{ background: t.accent, color: '#fff', fontFamily: t.heading }}>{i + 1}</span>
                  <p className="mt-4 text-xl font-semibold" style={{ fontFamily: t.heading }}>{step.title}</p>
                  <p className="mt-1 text-base leading-relaxed" style={{ color: t.muted }}>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Confianca */}
        <ul className="mt-16 grid gap-3 rounded-[28px] p-5 sm:grid-cols-2 lg:grid-cols-4" style={{ background: t.ink, color: '#ffffff' }}>
          {TRUST.map(({ Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3 p-2">
              <Icon className="mt-0.5 h-6 w-6 shrink-0" style={{ color: t.key === 'mascotas' ? '#FDE68A' : t.key === 'llaveros' ? '#FDBA74' : '#e8d3b0' }} aria-hidden="true" />
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="block text-sm text-white/75">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
