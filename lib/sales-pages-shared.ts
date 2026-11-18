// Parte das lojas (multi-loja) que pode ir para o navegador: tipos, padrões e
// regras de endereço. O acesso ao banco fica em lib/sales-pages.ts.

export type SalesPageTheme = 'vice-city';

export const SALES_PAGE_THEMES: { value: SalesPageTheme; label: string }[] = [
  { value: 'vice-city', label: 'Vice City (neon anos 80)' },
];

export const MAIN_STORE = 'kitoys';

export type SalesPageConfig = {
  slug: string;
  title: string;
  theme: SalesPageTheme;
  enabled: boolean;
  logoImage: string; // logo do topo (com o nome)
  iconImage: string; // ícone quadrado: favicon + prévia do link (Instagram/WhatsApp)
  logoHeight: number; // altura do logo no topo, em px (Editar loja → Tamanho do logo)
  eyebrow: string;
  heading: string;
  subtitle: string;
  ctaLabel: string;
  badge: string;
  heroImage: string;
  heroVideo: string;
  // Foto de fundo da capa (e, desfocada, do resto da loja). Vazio = arte do tema.
  backgroundImage: string;
  countdownTo: string | null;
  countdownLabel: string;
  coverProductId: number | null;
  coverTagline: string;
  productIds: number[];
  featureTitle: string;
  featureText: string;
  neonPrimary: string;
  neonSecondary: string;
  footerNote: string;
  updatedAt?: string;
};

export const DEFAULT_SALES_PAGE: Omit<SalesPageConfig, 'slug'> = {
  title: 'Vice City Store',
  theme: 'vice-city',
  enabled: true,
  logoImage: '',
  iconImage: '',
  logoHeight: 56,
  eyebrow: 'EDICIÓN LIMITADA',
  heading: 'VICE CITY STORE',
  subtitle: 'Llaveros y piezas 3D con alma retro de los 80. Luz de neón, palmeras y actitud de ciudad — impresos en nuestro taller en España.',
  ctaLabel: 'Comprar ahora',
  badge: 'NUEVO DROP',
  heroImage: '',
  heroVideo: '',
  backgroundImage: '',
  countdownTo: null,
  countdownLabel: 'El drop termina en',
  coverProductId: null,
  coverTagline: 'La pieza que enciende la colección',
  productIds: [],
  featureTitle: 'El llavero que brilla',
  featureText: 'Contornos de neón, acabado premium y ese brillo inconfundible. El protagonista de la portada, listo para colgar en tus llaves o en la mochila.',
  neonPrimary: '#ff2d9b',
  neonSecondary: '#00e5ff',
  footerNote: 'Impreso en 3D en España · Envío con seguimiento · Pago 100% seguro',
};

export const normalizeSlug = (v: unknown) =>
  String(v ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);

// Endereços que já são páginas do site: uma loja não pode usar (o link curto
// /<slug> nunca abriria a loja).
export const RESERVED_SLUGS = new Set([
  MAIN_STORE, 'admin', 'api', 'acesso', 'buscar', 'checkout', 'coleccion', 'hogar', 'legal',
  'pedido', 'preview', 'producto', 'resena', 'sector', 'tienda', 'images', 'videos', 'icons',
  'robots', 'sitemap', 'favicon', 'manifest', '_next',
]);

// Link curto da loja (o que vai no Instagram): seusite.com/<slug>
export const storePath = (slug: string) => (!slug || slug === MAIN_STORE ? '/' : `/${slug}`);

// Arte padrão de cada tema (tratada em public/images/lojas/): foto da capa, versão
// minúscula para o fundo desfocado e prévia borrada (aparece enquanto carrega).
export const THEME_ART: Record<SalesPageTheme, { hero: string; ambient: string; blur: string }> = {
  'vice-city': {
    hero: '/images/lojas/vice-city-hero.webp',
    ambient: '/images/lojas/vice-city-ambient.webp',
    blur: 'data:image/webp;base64,UklGRpQAAABXRUJQVlA4IIgAAAAwBACdASoMABUAPtFWo0uoJKMhsAgBABoJZACdH8AC9WCOdtb1CE9S3nAA/ZaWEHSoRO93QLZU+CZO31N3qGbUdLc0yTZjf6wzwz+9ENb+aL/XyDNlahPu9ozfqOTvfiseYHcc+CV08vOZttCObwSssVHjR09rww5mS0FBW+L7aresKpxpKAAA',
  },
};

// Arte que a loja usa: a foto enviada no painel ou, sem foto, a do tema.
export function storeArt(cfg: Pick<SalesPageConfig, 'theme' | 'backgroundImage'>) {
  const theme = THEME_ART[cfg.theme] ?? THEME_ART['vice-city'];
  if (cfg.backgroundImage) return { hero: cfg.backgroundImage, ambient: cfg.backgroundImage, blur: '' };
  return theme;
}

// Ícone da aba (favicon) de cada tema — gerados em public/images/lojas/.
// Com ícone enviado no painel (Editar loja → Ícone da loja), o favicon é ele.
export const THEME_ICONS: Record<SalesPageTheme, { icon32: string; icon192: string; icon512: string; apple: string }> = {
  'vice-city': {
    icon32: '/images/lojas/vice-city-icon-32.png',
    icon192: '/images/lojas/vice-city-icon-192.png',
    icon512: '/images/lojas/vice-city-icon-512.png',
    apple: '/images/lojas/vice-city-apple-180.png',
  },
};

// Favicon (metadata do Next) das páginas da loja — substitui o da Kitoys.
export function storeIcons(cfg: Pick<SalesPageConfig, 'theme' | 'iconImage'>) {
  if (cfg.iconImage) return { icon: [{ url: cfg.iconImage }], shortcut: cfg.iconImage, apple: [{ url: cfg.iconImage }] };
  const t = THEME_ICONS[cfg.theme] ?? THEME_ICONS['vice-city'];
  return {
    icon: [
      { url: t.icon32, sizes: '32x32', type: 'image/png' },
      { url: t.icon192, sizes: '192x192', type: 'image/png' },
      { url: t.icon512, sizes: '512x512', type: 'image/png' },
    ],
    shortcut: t.icon32,
    apple: [{ url: t.apple, sizes: '180x180', type: 'image/png' }],
  };
}

// Um único endereço de favicon (para trocar o ícone no navegador, ex.: checkout).
export function storeFaviconHref(cfg: Pick<SalesPageConfig, 'theme' | 'iconImage'>) {
  return cfg.iconImage || (THEME_ICONS[cfg.theme] ?? THEME_ICONS['vice-city']).icon32;
}

// Políticas (envíos, devoluciones…) com o visual de cada loja:
// Kitoys → /legal/<doc>; outra loja → /<slug>/legal/<doc>.
export const storeLegalHref = (slug: string, doc: string) =>
  `${slug && slug !== MAIN_STORE ? `/${slug}` : ''}/legal/${doc}`;

// Tamanho do logo no topo (px) e a altura da barra que cabe ele.
export const LOGO_HEIGHT_MIN = 24;
export const LOGO_HEIGHT_MAX = 120;
export const clampLogoHeight = (v: unknown) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? Math.min(LOGO_HEIGHT_MAX, Math.max(LOGO_HEIGHT_MIN, n)) : 56;
};
// Barra de vidro: no mínimo 72px; cresce com o logo. +12px do espaço acima dela.
export const storeBarHeight = (cfg: { logoHeight?: number }) => Math.max(72, clampLogoHeight(cfg.logoHeight) + 16);
export const storeHeaderOffset = (cfg: { logoHeight?: number }) => storeBarHeight(cfg) + 12;
