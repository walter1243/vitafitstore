// Formas decorativas da vitrine infantil. O cubo isometrico repete o cubo
// colorido do logo Kitoys 3D — vira o "bloco de montar" do site.

type CubeProps = { top: string; left: string; right: string; className?: string; style?: React.CSSProperties };

export function Cube({ top, left, right, className, style }: CubeProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true">
      <path d="M50 6 L92 28 L50 50 L8 28 Z" fill={top} stroke="#1f2340" strokeWidth="4" strokeLinejoin="round" />
      <path d="M8 28 L50 50 L50 96 L8 74 Z" fill={left} stroke="#1f2340" strokeWidth="4" strokeLinejoin="round" />
      <path d="M92 28 L50 50 L50 96 L92 74 Z" fill={right} stroke="#1f2340" strokeWidth="4" strokeLinejoin="round" />
      <path d="M22 26 L50 12" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export function Cloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 90" className={className} style={style} aria-hidden="true">
      <path
        d="M30 80 a28 28 0 0 1 6-55 a38 38 0 0 1 70-10 a30 30 0 0 1 50 20 a24 24 0 0 1 16 45 z"
        fill="#fff"
      />
    </svg>
  );
}

export function Star({ color, className, style }: { color: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <path
        d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z"
        fill={color}
        stroke="#1f2340"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Onda de transicao entre secoes (a cor e a da secao de BAIXO).
export function Wave({ color, className }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 1440 70" preserveAspectRatio="none" className={`block h-10 w-full sm:h-16 ${className ?? ''}`} aria-hidden="true">
      <path d="M0 40 C 180 0 360 0 540 30 S 900 70 1080 40 S 1320 0 1440 30 V70 H0z" fill={color} />
    </svg>
  );
}
