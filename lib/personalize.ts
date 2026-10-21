// Personalizacao com nome (chaveiros, placas de pet...). Fica no produto
// (coluna `personalize`, JSON) e e configurada no Admin → Produtos. Sem
// import de banco: serve pro servidor e pro navegador.

export type PersonalizeFont = 'redonda' | 'manuscrita' | 'bloque' | 'negrita';
export type PersonalizeShape = 'llavero' | 'chapa';

export type Personalize = {
  enabled: boolean;
  // Rotulo do campo pro cliente. Ex: "Nombre", "Nombre de tu mascota".
  label: string;
  maxLength: number;
  // Foto do modelo SEM nome (o nome e desenhado por cima). Vazio = desenho
  // padrao do formato escolhido.
  previewImage: string;
  // Posicao/tamanho do nome sobre a foto, em % da largura/altura dela.
  x: number;
  y: number;
  size: number;
  color: string;
  font: PersonalizeFont;
  shape: PersonalizeShape;
  // Inclinacao do nome em graus (nomes em superficie inclinada).
  rotate: number;
  // Foto que ja vem com um nome (ex: BUDDY): uma mancha da cor da peca
  // cobre o nome antigo e o do cliente aparece em cima.
  cover: boolean;
  coverColor: string;
  coverW: number; // % da largura da foto
  coverH: number; // % da altura da foto
  // Perspectiva (nome numa peca inclinada): inclinar as letras (graus) e
  // achatar/esticar na vertical (%). Relevo = sombra de filamento 3D.
  skew: number;
  squash: number;
  relief: boolean;
};

export const PERSONALIZE_FONTS: { key: PersonalizeFont; label: string; css: string }[] = [
  { key: 'redonda', label: 'Redonda', css: "'Baloo 2', 'Nunito', sans-serif" },
  { key: 'manuscrita', label: 'Manuscrita', css: "'Caveat', cursive" },
  { key: 'bloque', label: 'Bloco', css: "'Fredoka', 'Nunito', sans-serif" },
  { key: 'negrita', label: 'Negrita', css: "'Arial Black', 'Arial', 'Helvetica', sans-serif" },
];

export const DEFAULT_PERSONALIZE: Personalize = {
  enabled: false,
  label: 'Nombre',
  maxLength: 12,
  previewImage: '',
  x: 50,
  y: 55,
  size: 14,
  color: '#1E1B4B',
  font: 'redonda',
  shape: 'llavero',
  rotate: 0,
  cover: false,
  coverColor: '#F97316',
  coverW: 40,
  coverH: 14,
  skew: 0,
  squash: 100,
  relief: true,
};

const clamp = (n: unknown, min: number, max: number, def: number) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def;
};

export function parsePersonalize(raw: unknown): Personalize {
  let o: Record<string, unknown> = {};
  if (typeof raw === 'string' && raw.trim()) {
    try { o = JSON.parse(raw); } catch { o = {}; }
  } else if (raw && typeof raw === 'object') {
    o = raw as Record<string, unknown>;
  }
  const d = DEFAULT_PERSONALIZE;
  return {
    enabled: o.enabled === true,
    label: String(o.label ?? d.label).trim().slice(0, 40) || d.label,
    maxLength: Math.round(clamp(o.maxLength, 2, 30, d.maxLength)),
    previewImage: String(o.previewImage ?? '').trim().slice(0, 1000),
    x: clamp(o.x, 0, 100, d.x),
    y: clamp(o.y, 0, 100, d.y),
    size: clamp(o.size, 3, 40, d.size),
    color: /^#[0-9a-fA-F]{6}$/.test(String(o.color)) ? String(o.color) : d.color,
    font: (['redonda', 'manuscrita', 'bloque', 'negrita'] as const).includes(o.font as PersonalizeFont) ? (o.font as PersonalizeFont) : d.font,
    shape: o.shape === 'chapa' ? 'chapa' : 'llavero',
    rotate: clamp(o.rotate, -90, 90, 0),
    cover: o.cover === true,
    coverColor: /^#[0-9a-fA-F]{6}$/.test(String(o.coverColor)) ? String(o.coverColor) : d.coverColor,
    coverW: clamp(o.coverW, 2, 100, d.coverW),
    coverH: clamp(o.coverH, 2, 100, d.coverH),
    skew: clamp(o.skew, -45, 45, 0),
    squash: clamp(o.squash, 40, 160, 100),
    relief: o.relief !== false,
  };
}

// Limpa o texto que o cliente digitou (letras, numeros, espaco e alguns
// simbolos simples; sem emoji — a impressora nao faz).
export function cleanCustomText(raw: unknown, max = 30) {
  return String(raw ?? '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{N} .,'&+\-!?♥]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export const fontCss = (f: PersonalizeFont) => PERSONALIZE_FONTS.find((x) => x.key === f)?.css ?? PERSONALIZE_FONTS[0].css;
