import { type SectorStyle } from '@/lib/sectors-shared';

// Visual de cada setor (site "coringa": mudou o setor, muda a cara do site).
// Paletas e fontes da skill ui-ux-pro-max:
//  - hogar:    minimalista quente — areia/creme, Quicksand + Caveat de acento
//  - llaveros: "playful indigo + energetic orange" — Fredoka
//  - mascotas: "coffee brown + warm gold" — Varela Round, foco nas fotos
// O Infantil tem componentes proprios (colorido em blocos) e nao usa isto.
export type SectorTheme = {
  key: Exclude<SectorStyle, 'infantil'>;
  bg: string;        // fundo da faixa do setor
  bgAlt: string;     // fundo das colecoes
  surface: string;   // fundo das fotos/cards
  ink: string;       // texto principal (contraste >= 4.5:1 sobre bg/bgAlt)
  muted: string;     // texto secundario (tambem >= 4.5:1)
  accent: string;    // detalhe (frase manuscrita, selos)
  cta: string;
  ctaHover: string;
  ctaText: string;
  heading: string;   // fonte dos titulos
  kickerFont: string;
  kicker: string;    // frase pequena acima do nome do setor
  radius: string;    // arredondado dos cards
};

export const SECTOR_THEMES: Record<SectorTheme['key'], SectorTheme> = {
  hogar: {
    key: 'hogar',
    bg: '#f3ece2', bgAlt: '#fbf8f3', surface: '#ece3d6',
    ink: '#2b2620', muted: '#5f574e', accent: '#8a6a3a',
    cta: '#2b2620', ctaHover: '#4a4238', ctaText: '#ffffff',
    heading: "'Quicksand', 'Nunito', system-ui, sans-serif",
    kickerFont: "'Caveat', cursive",
    kicker: 'hecho para tu casa',
    radius: '22px',
  },
  llaveros: {
    key: 'llaveros',
    bg: '#E0E7FF', bgAlt: '#EEF2FF', surface: '#ffffff',
    ink: '#1E1B4B', muted: '#3F3D6B', accent: '#4F46E5',
    cta: '#EA580C', ctaHover: '#C2410C', ctaText: '#ffffff',
    heading: "'Fredoka', 'Nunito', system-ui, sans-serif",
    kickerFont: "'Fredoka', 'Nunito', system-ui, sans-serif",
    kicker: 'con tu nombre',
    radius: '28px',
  },
  navidad: {
    key: 'navidad',
    bg: '#14532D', bgAlt: '#166534', surface: '#F0FDF4',
    ink: '#FFFBEB', muted: '#D1FAE5', accent: '#FCA5A5',
    cta: '#DC2626', ctaHover: '#B91C1C', ctaText: '#ffffff',
    heading: "'Quicksand', 'Nunito', system-ui, sans-serif",
    kickerFont: "'Caveat', cursive",
    kicker: 'feliz navidad',
    radius: '24px',
  },
  mascotas: {
    key: 'mascotas',
    bg: '#FEF3C7', bgAlt: '#FFF7ED', surface: '#FDE68A',
    ink: '#451A03', muted: '#6B2F0A', accent: '#B45309',
    cta: '#78350F', ctaHover: '#5B2A0B', ctaText: '#ffffff',
    heading: "'Varela Round', 'Nunito', system-ui, sans-serif",
    kickerFont: "'Caveat', cursive",
    kicker: 'para los peludos de la casa',
    radius: '26px',
  },
};

export function themeFor(style?: SectorStyle): SectorTheme | null {
  if (!style || style === 'infantil') return null;
  return SECTOR_THEMES[style];
}
