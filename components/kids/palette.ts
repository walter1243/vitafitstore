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

// Cor escolhida no Admin (Setores e coleções → Cor de fundo). Os valores
// padrao do cadastro nao contam como escolha: ai fica a paleta acima.
const DEFAULT_BG = ['#F5F5F7', '#07080F'];
export function customBg(c?: { bgColor?: string } | null) {
  const hex = String(c?.bgColor || '').toUpperCase();
  return /^#[0-9A-F]{6}$/.test(hex) && !DEFAULT_BG.includes(hex) ? hex : null;
}
const mixHex = (hex: string, to: number, amount: number) => {
  const n = parseInt(hex.slice(1), 16);
  const m = (c: number) => Math.round(c + (to - c) * amount).toString(16).padStart(2, '0');
  return `#${m((n >> 16) & 255)}${m((n >> 8) & 255)}${m(n & 255)}`;
};
export function isDarkColor(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum < 0.55;
}
// Acento dos cards derivado da cor da colecao.
export function accentFromColor(hex: string): Accent {
  return { block: mixHex(hex, 255, 0.55), deep: mixHex(hex, 0, 0.45), tint: mixHex(hex, 255, 0.8), dot: mixHex(hex, 255, 0.3) };
}

// Fundo de bolinhas (confete) por cima de uma cor.
export const dots = (color: string) => ({
  backgroundImage: `radial-gradient(${color} 2px, transparent 2.5px)`,
  backgroundSize: '22px 22px',
});
