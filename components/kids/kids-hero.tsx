import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { COLLECTIONS } from '@/lib/collections';

// Impressora 3D desenhada em SVG: o bico corre de um lado pro outro e a
// estrela vai "saindo" em camadas coloridas. A foto real da nossa impressora
// fica dentro do site, na secao "Como se hace" (kids-how-its-made.tsx).
function PrinterIllustration() {
  const layers = ['#FACC15', '#FB923C', '#F97316', '#EC4899', '#7C5CFF', '#2563EB'];
  return (
    <svg viewBox="0 0 320 300" className="h-auto w-full" role="img" aria-label="Ilustración de una impresora 3D imprimiendo una pieza de colores capa a capa">
      <rect x="40" y="30" width="240" height="230" rx="26" fill="#1e2a4a" />
      <rect x="58" y="48" width="204" height="194" rx="16" fill="#FFF7ED" />
      <rect x="58" y="70" width="204" height="10" fill="#FED7AA" />
      <g className="animate-kids-nozzle" style={{ transformOrigin: '160px 80px' }}>
        <rect x="136" y="62" width="48" height="26" rx="8" fill="#2563EB" />
        <path d="M150 88h20l-6 14h-8z" fill="#1e2a4a" />
        <circle cx="160" cy="106" r="3" fill="#F97316" className="animate-kids-glow" />
      </g>
      <g transform="translate(160 205)">
        {layers.map((c, i) => {
          const w = 104 - i * 14;
          return <rect key={c} x={-w / 2} y={-i * 13} width={w} height="11" rx="5.5" fill={c} />;
        })}
      </g>
      <rect x="78" y="218" width="164" height="12" rx="6" fill="#1e2a4a" opacity="0.85" />
      <circle cx="78" cy="276" r="12" fill="#22C55E" />
      <circle cx="242" cy="276" r="12" fill="#22C55E" />
    </svg>
  );
}

// Hero em blocos (design system "Vibrant & Block-based" do ui-ux-pro-max):
// ilustracao da impressora emoldurada por blocos de cor, e um botao por
// colecao. Botao principal em azul de
// confianca (#2563EB) — a crianca escolhe, quem compra e o pai/mae.
export function KidsHero() {
  return (
    <section className="relative overflow-hidden bg-[#FFF7ED] pt-36 sm:pt-40">
      <div className="kids-dots pointer-events-none absolute inset-0" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:px-8 lg:pb-24">
        <div className="text-center lg:text-left">
          <h1 className="text-[2.6rem] font-extrabold text-[#1e2a4a] sm:text-6xl lg:text-7xl">
            Juguetes y lámparas{' '}
            <span className="text-[#C2410C]">que nacen</span>{' '}
            <span className="relative inline-block text-[#5B3FD9]">
              capa a capa
              <svg viewBox="0 0 200 12" className="absolute -bottom-2 left-0 h-3 w-full" aria-hidden="true">
                <path d="M2 8 Q 50 0 100 6 T 198 4" fill="none" stroke="#FACC15" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-700 lg:mx-0">
            Juegos para montar y compartir, y lámparas con formas divertidas para la habitación de los peques.
            Elige una colección y descubre cada creación.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="#colecciones"
              className="kids-pop flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-7 text-base font-extrabold text-white"
            >
              Ver colecciones <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            {COLLECTIONS.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.slug}
                  href={`/coleccion/${c.slug}`}
                  className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-[3px] bg-white px-5 text-base font-extrabold transition-colors duration-200 hover:bg-slate-50"
                  style={{ borderColor: c.color.main, color: c.color.deep }}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" /> {c.shortName}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Ilustracao emoldurada por blocos de cor */}
        <div className="relative mx-auto w-full max-w-[460px]">
          <div className="absolute -right-3 -top-3 h-full w-full rotate-3 rounded-[40px] bg-[#7C5CFF] sm:-right-5 sm:-top-5" aria-hidden="true" />
          <div className="absolute -bottom-3 -left-3 h-full w-full -rotate-2 rounded-[40px] bg-[#FACC15] sm:-bottom-5 sm:-left-5" aria-hidden="true" />
          <div className="relative rounded-[36px] border-[6px] border-white bg-white p-6 shadow-[0_20px_50px_rgba(30,42,74,0.18)] sm:p-10">
            <PrinterIllustration />
          </div>

        </div>
      </div>

      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="relative block h-10 w-full sm:h-14" aria-hidden="true">
        <path d="M0 30 C 240 70 480 -10 720 30 S 1200 70 1440 30 V60 H0z" fill="#ffffff" />
      </svg>
    </section>
  );
}
