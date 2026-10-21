'use client';
import { useState } from 'react';

// Enfeites minimalistas do mundo Navidad (ui-ux-pro-max: decoracao discreta,
// foco nos produtos). Tudo `pointer-events-none` menos os 3 objetos
// interativos; quem usa "reduzir movimento" ve tudo parado.
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
            {/* rena */}
            <path d="M8 26c4-6 14-8 22-6l6-6 2 2-4 5c3 1 5 3 5 5l-3 1-2-2-3 6h-3l1-6c-5 1-10 1-14-1l-3 7H9l2-8c-2 0-3 1-4 1z" />
            <path d="M33 13l-3-6M36 14l1-7M33 8l-4 1M37 8l3-2" stroke="#FFFBEB" strokeOpacity="0.85" strokeWidth="1.5" fill="none" />
          </g>
        ))}
        {/* redeas */}
        <path d="M130 24 C150 30 160 30 176 26" stroke="#FFFBEB" strokeOpacity="0.6" strokeWidth="1.2" fill="none" />
        {/* treno + Papai Noel */}
        <path d="M176 20h38c4 0 6 3 5 6l-3 8h-36c-6 0-8-4-8-8z" fill="#DC2626" fillOpacity="0.95" />
        <path d="M172 38h48c3 0 5-2 6-4" stroke="#FFFBEB" strokeWidth="2" fill="none" />
        <circle cx="200" cy="14" r="6" />
        <path d="M194 12l6-9 7 8z" fill="#DC2626" fillOpacity="0.95" />
        <circle cx="207" cy="3" r="2" />
      </svg>
    </div>
  );
}

// Os 3 objetos de Natal (jarrón, arvore, boneco). Passar o mouse/clicar na
// arvore acende a estrela; clicar no boneco faz ele balancar e cair neve.
export function NavidadObjects({ className = '' }: { className?: string }) {
  const [star, setStar] = useState(false);
  const [snow, setSnow] = useState(0);

  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <span className="relative block h-20 w-16 sm:h-24 sm:w-20" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${P}navidad-jarron.png`} alt="" className="h-full w-full object-contain" draggable={false} />
      </span>

      <button
        type="button"
        aria-label="Encender la estrella"
        onMouseEnter={() => setStar(true)}
        onMouseLeave={() => setStar(false)}
        onClick={() => setStar((v) => !v)}
        className="relative block h-24 w-20 cursor-pointer sm:h-28 sm:w-24"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${P}navidad-arbol.png`} alt="" className="h-full w-full object-contain" draggable={false} />
        <span className={`nv-star pointer-events-none absolute ${star ? 'nv-on' : ''}`} style={{ left: '50%', top: '18.5%' }} />
      </button>

      <button
        type="button"
        aria-label="Hacer nevar"
        onClick={() => setSnow((n) => n + 1)}
        className="relative block h-20 w-16 cursor-pointer sm:h-24 sm:w-20"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={snow} src={`${P}navidad-muneco.png`} alt="" className={`h-full w-full object-contain ${snow ? 'nv-wiggle' : ''}`} draggable={false} />
        {snow > 0 && (
          <span key={`s${snow}`} className="pointer-events-none absolute -inset-x-6 -top-4 bottom-0" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="nv-flake absolute text-white" style={{ left: `${8 + i * 10}%`, animationDelay: `${(i % 4) * 0.12}s`, fontSize: `${10 + (i % 3) * 4}px` }}>❄</span>
            ))}
          </span>
        )}
      </button>
    </div>
  );
}
