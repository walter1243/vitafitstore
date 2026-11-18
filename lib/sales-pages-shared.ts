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
  logoImage: string;
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
