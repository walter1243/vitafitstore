import { type SiteCollection } from '@/lib/sectors-shared';

// Paleta infantil (ui-ux-pro-max: "Vibrant & Block-based" + indigo brincalhao
// com laranja de destaque). Cada colecao ganha um "acento": `block` e o fundo
// colorido do cartao de produtos, `deep` a cor forte (sombra em bloco dos
// cards, selos) e `tint` o fundo pastel da foto. Texto sempre em tinta escura
// (#1E1B4B) sobre esses fundos — contraste acima de 4.5:1.
export type Accent = { block: string; deep: string; tint: string; dot: string };

export const ACCENTS = {
  sky:    { block: '#BFE0FF', deep: '#1D4ED8', tint: '#E3F1FF', dot: '#93C5FD' },
  grape:  { block: '#DCD2FF', deep: '#6D28D9', tint: '#F0EBFF', dot: '#C4B5FD' },
  sun:    { block: '#FFE08A', deep: '#C2410C', tint: '#FFF4CC', dot: '#FCD34D' },
  mint:   { block: '#BFF0DA', deep: '#047857', tint: '#E3FAF0', dot: '#6EE7B7' },
  bubble: { block: '#FFD1E6', deep: '#BE185D', tint: '#FFEAF3', dot: '#F9A8D4' },
} satisfies Record<string, Accent>;

const BY_GAME: Record<string, Accent> = {
  rompecabezas: ACCENTS.sky,
  encender: ACCENTS.grape,
  colorear: ACCENTS.sun,
};
const ROTATION = [ACCENTS.mint, ACCENTS.bubble, ACCENTS.sky, ACCENTS.sun, ACCENTS.grape];

export function accentFor(c?: Pick<SiteCollection, 'slug' | 'interactive'> | null): Accent {
  if (!c) return ACCENTS.mint;
  if (BY_GAME[c.interactive]) return BY_GAME[c.interactive];
  let h = 0;
  for (const ch of c.slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return ROTATION[h % ROTATION.length];
}

// Fundo de bolinhas (confete) por cima de uma cor.
export const dots = (color: string) => ({
  backgroundImage: `radial-gradient(${color} 2px, transparent 2.5px)`,
  backgroundSize: '22px 22px',
});
