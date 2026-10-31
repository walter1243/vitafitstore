'use client';
import { useState } from 'react';

// Enfeites minimalistas do mundo Navidad (ui-ux-pro-max: decoracao discreta,
// foco nos produtos). Quem usa "reduzir movimento" ve tudo parado.
const P = '/images/worlds/';

// Neve caindo ao fundo (CSS, duas camadas em velocidades diferentes).
export function NavidadSnow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="nv-snow nv-snow-a absolute inset-0" />
      <div className="nv-snow nv-snow-b absolute inset-0" />
    </div>
  );
}

// Papai Noel com as renas cruzando o topo de tempos em tempos (silhueta).
export function NavidadSleigh() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-6 h-16 overflow-hidden" aria-hidden="true">
      <svg className="nv-sleigh absolute h-10 w-56" viewBox="0 0 280 50" fill="#FFFBEB" fillOpacity="0.85">
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${i * 44} ${i % 2 ? 4 : 0})`}>
            <path d="M8 26c4-6 14-8 22-6l6-6 2 2-4 5c3 1 5 3 5 5l-3 1-2-2-3 6h-3l1-6c-5 1-10 1-14-1l-3 7H9l2-8c-2 0-3 1-4 1z" />
            <path d="M33 13l-3-6M36 14l1-7M33 8l-4 1M37 8l3-2" stroke="#FFFBEB" strokeOpacity="0.85" strokeWidth="1.5" fill="none" />
          </g>
        ))}
        <path d="M130 24 C150 30 160 30 176 26" stroke="#FFFBEB" strokeOpacity="0.6" strokeWidth="1.2" fill="none" />
        <path d="M176 20h38c4 0 6 3 5 6l-3 8h-36c-6 0-8-4-8-8z" fill="#DC2626" fillOpacity="0.95" />
        <path d="M172 38h48c3 0 5-2 6-4" stroke="#FFFBEB" strokeWidth="2" fill="none" />
        <circle cx="200" cy="14" r="6" />
        <path d="M194 12l6-9 7 8z" fill="#DC2626" fillOpacity="0.95" />
        <circle cx="207" cy="3" r="2" />
      </svg>
    </div>
  );
}

// Jarron: passar o mouse / tocar = os ramos entram no vaso.
export function NavidadVase({ className = '' }: { className?: string }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      aria-label="Poner las ramas en el jarrón"
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      onClick={() => setOn((v) => !v)}
      className={`pointer-events-auto block cursor-pointer ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${P}navidad-jarron-vaso.png`} alt="" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${P}navidad-ramas.png`} alt="" className={`nv-branches absolute inset-0 h-full w-full object-contain ${on ? 'nv-on' : ''}`} draggable={false} />
    </button>
  );
}

// Arvore: passar o mouse / tocar = a estrela acende.
export function NavidadTree({ className = '' }: { className?: string }) {
  const [star, setStar] = useState(false);
  return (
    <button
      type="button"
      aria-label="Encender la estrella"
      onMouseEnter={() => setStar(true)}
      onMouseLeave={() => setStar(false)}
      onClick={() => setStar((v) => !v)}
      className={`pointer-events-auto block cursor-pointer ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${P}navidad-arbol.png`} alt="" className="h-full w-full object-contain" draggable={false} />
      <span className={`nv-star pointer-events-none absolute ${star ? 'nv-on' : ''}`} style={{ left: '50%', top: '18.5%' }} />
    </button>
  );
}

// Boneco: clicar = balanca e cai neve.
export function NavidadSnowman({ className = '' }: { className?: string }) {
  const [snow, setSnow] = useState(0);
  return (
    <button
      type="button"
      aria-label="Hacer nevar"
      onClick={() => setSnow((n) => n + 1)}
      className={`pointer-events-auto block cursor-pointer ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={snow} src={`${P}navidad-muneco.png`} alt="" className={`h-full w-full object-contain ${snow ? 'nv-wiggle' : ''}`} draggable={false} />
      {snow > 0 && (
        <span key={`s${snow}`} className="pointer-events-none absolute -inset-x-6 -top-4 bottom-0" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="nv-flake absolute text-white" style={{ left: `${4 + i * 9}%`, animationDelay: `${(i % 4) * 0.12}s`, fontSize: `${11 + (i % 3) * 4}px` }}>❄</span>
          ))}
        </span>
      )}
    </button>
  );
}

// Os 3 espalhados pela secao. Celular: arvore no alto a direita, jarron
// embaixo a esquerda, boneco embaixo a direita (a secao reserva espaco).
// Telas largas: grandes, nas margens, fora dos produtos.
// `wide`: so mostra nas laterais quando ha espaco de sobra (2xl).
export function NavidadSides({ mobile = true, wide = false }: { mobile?: boolean; wide?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {mobile && (
        <div className="xl:hidden">
          <NavidadTree className="absolute right-2 top-28 h-28 w-24 sm:right-6 sm:top-32 sm:h-36 sm:w-28" />
          <NavidadVase className="absolute bottom-3 left-2 h-28 w-24 sm:left-6 sm:h-32 sm:w-28" />
          <NavidadSnowman className="absolute bottom-3 right-3 h-24 w-20 sm:right-8 sm:h-28 sm:w-24" />
        </div>
      )}
      <div className={`hidden ${wide ? '2xl:block' : 'xl:block'}`}>
        <NavidadVase className="nv-float absolute bottom-8 left-[max(8px,calc(50%-46rem))] h-64 w-52" />
        <NavidadTree className="absolute right-[max(8px,calc(50%-46rem))] top-24 h-64 w-52" />
        <NavidadSnowman className="absolute bottom-10 right-[max(8px,calc(50%-44rem))] h-44 w-36" />
      </div>
    </div>
  );
}
