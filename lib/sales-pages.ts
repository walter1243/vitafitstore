import { sql } from '@/lib/db';

// Páginas de venda configuráveis (Admin → Páginas de venda).
// Cada página é uma landing temática montada em cima de produtos que já
// existem na loja — pensada para campanhas de Instagram que pegam carona em
// hypes e sazonalidades (ex.: lançamento de jogo, Natal, Black Friday).
// A primeira é a VICE CITY STORE, com a cara de cidade neon dos anos 80.
//
// Só montamos a landing e escolhemos os produtos: o preço, o carrinho, a
// personalização e o checkout continuam sendo os mesmos da loja. Nada aqui
// cria desconto nem muda preço — é só vitrine com tema.

export type SalesPageTheme = 'vice-city';

export const SALES_PAGE_THEMES: { value: SalesPageTheme; label: string }[] = [
  { value: 'vice-city', label: 'Vice City (neon anos 80)' },
];

export type SalesPageConfig = {
  slug: string;
  title: string;
  theme: SalesPageTheme;
  enabled: boolean;
  eyebrow: string;
  heading: string;
  subtitle: string;
  ctaLabel: string;
  badge: string;
  heroImage: string;
  heroVideo: string;
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
  eyebrow: 'EDICIÓN LIMITADA',
  heading: 'VICE CITY STORE',
  subtitle: 'Llaveros y piezas 3D con alma retro de los 80. Luz de neón, palmeras y actitud de ciudad — impresos en nuestro taller en España.',
  ctaLabel: 'Comprar ahora',
  badge: 'NUEVO DROP',
  heroImage: '',
  heroVideo: '',
  countdownTo: null,
  countdownLabel: 'El drop termina en',
  coverProductId: null,
  coverTagline: 'La pieza que enciende la colección',
  productIds: [],
  featureTitle: 'El llavero que brilla',
  featureText: 'Contornos de neón, acabado premium y ese brillo inconfundible. El protagonista de la portada, listo para colgar en tus llaves o en la mochila.',
  neonPrimary: '#ff2d9b',
  neonSecondary: '#00e5ff',
  footerNote: 'Impreso en 3D en España · Envío con seguimiento · Edición de campaña',
};

export const normalizeSlug = (v: unknown) =>
  String(v ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);

const clampColor = (v: unknown, fallback: string) => {
  const s = String(v ?? '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : fallback;
};

const toIntList = (v: unknown): number[] => {
  if (!Array.isArray(v)) return [];
  const out: number[] = [];
  for (const item of v) {
    const n = Number(item);
    if (Number.isInteger(n) && n > 0 && !out.includes(n)) out.push(n);
  }
  return out.slice(0, 60);
};

let ready: Promise<void> | null = null;
export function ensureSalesPages() {
  ready ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS sales_pages (
        slug TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        theme TEXT NOT NULL DEFAULT 'vice-city',
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        position INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    // Semeia a VICE CITY STORE já desligada de produtos (o admin escolhe).
    await sql`
      INSERT INTO sales_pages (slug, title, theme, enabled, data, position)
      VALUES ('vice-city', ${DEFAULT_SALES_PAGE.title}, 'vice-city', FALSE, ${JSON.stringify(DEFAULT_SALES_PAGE)}::jsonb, 0)
      ON CONFLICT (slug) DO NOTHING
    `;
  })().catch((e) => { ready = null; throw e; });
  return ready;
}

function rowToConfig(row: any): SalesPageConfig {
  const d = (row?.data ?? {}) as Partial<SalesPageConfig>;
  const base = DEFAULT_SALES_PAGE;
  return {
    slug: String(row.slug),
    title: String(row.title ?? d.title ?? base.title),
    theme: 'vice-city',
    enabled: Boolean(row.enabled),
    eyebrow: String(d.eyebrow ?? base.eyebrow),
    heading: String(d.heading ?? base.heading),
    subtitle: String(d.subtitle ?? base.subtitle),
    ctaLabel: String(d.ctaLabel ?? base.ctaLabel),
    badge: String(d.badge ?? base.badge),
    heroImage: String(d.heroImage ?? ''),
    heroVideo: String(d.heroVideo ?? ''),
    countdownTo: d.countdownTo && !Number.isNaN(Date.parse(String(d.countdownTo))) ? new Date(String(d.countdownTo)).toISOString() : null,
    countdownLabel: String(d.countdownLabel ?? base.countdownLabel),
    coverProductId: d.coverProductId != null && Number(d.coverProductId) > 0 ? Number(d.coverProductId) : null,
    coverTagline: String(d.coverTagline ?? base.coverTagline),
    productIds: toIntList(d.productIds),
    featureTitle: String(d.featureTitle ?? base.featureTitle),
    featureText: String(d.featureText ?? base.featureText),
    neonPrimary: clampColor(d.neonPrimary, base.neonPrimary),
    neonSecondary: clampColor(d.neonSecondary, base.neonSecondary),
    footerNote: String(d.footerNote ?? base.footerNote),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

export async function listSalesPages(): Promise<SalesPageConfig[]> {
  await ensureSalesPages();
  const rows = (await sql`SELECT slug, title, theme, enabled, data, updated_at FROM sales_pages ORDER BY position, created_at DESC`) as any[];
  return rows.map(rowToConfig);
}

export async function getSalesPage(slug: string): Promise<SalesPageConfig | null> {
  await ensureSalesPages();
  const [row] = (await sql`SELECT slug, title, theme, enabled, data, updated_at FROM sales_pages WHERE slug = ${normalizeSlug(slug)} LIMIT 1`) as any[];
  return row ? rowToConfig(row) : null;
}

export async function saveSalesPage(input: Partial<SalesPageConfig> & { originalSlug?: string }): Promise<SalesPageConfig> {
  await ensureSalesPages();
  const slug = normalizeSlug(input.slug) || normalizeSlug(input.title) || `pagina-${Date.now()}`;
  const originalSlug = input.originalSlug ? normalizeSlug(input.originalSlug) : slug;

  const title = String(input.title ?? DEFAULT_SALES_PAGE.title).trim().slice(0, 80) || DEFAULT_SALES_PAGE.title;
  const enabled = Boolean(input.enabled ?? true);

  const data: Omit<SalesPageConfig, 'slug' | 'updatedAt'> = {
    title,
    theme: 'vice-city',
    enabled,
    eyebrow: String(input.eyebrow ?? DEFAULT_SALES_PAGE.eyebrow).slice(0, 60),
    heading: String(input.heading ?? DEFAULT_SALES_PAGE.heading).slice(0, 80),
    subtitle: String(input.subtitle ?? DEFAULT_SALES_PAGE.subtitle).slice(0, 400),
    ctaLabel: String(input.ctaLabel ?? DEFAULT_SALES_PAGE.ctaLabel).slice(0, 40),
    badge: String(input.badge ?? DEFAULT_SALES_PAGE.badge).slice(0, 30),
    heroImage: String(input.heroImage ?? '').trim(),
    heroVideo: String(input.heroVideo ?? '').trim(),
    countdownTo: input.countdownTo && !Number.isNaN(Date.parse(String(input.countdownTo))) ? new Date(String(input.countdownTo)).toISOString() : null,
    countdownLabel: String(input.countdownLabel ?? DEFAULT_SALES_PAGE.countdownLabel).slice(0, 40),
    coverProductId: input.coverProductId != null && Number(input.coverProductId) > 0 ? Number(input.coverProductId) : null,
    coverTagline: String(input.coverTagline ?? DEFAULT_SALES_PAGE.coverTagline).slice(0, 80),
    productIds: toIntList(input.productIds),
    featureTitle: String(input.featureTitle ?? DEFAULT_SALES_PAGE.featureTitle).slice(0, 80),
    featureText: String(input.featureText ?? DEFAULT_SALES_PAGE.featureText).slice(0, 500),
    neonPrimary: clampColor(input.neonPrimary, DEFAULT_SALES_PAGE.neonPrimary),
    neonSecondary: clampColor(input.neonSecondary, DEFAULT_SALES_PAGE.neonSecondary),
    footerNote: String(input.footerNote ?? DEFAULT_SALES_PAGE.footerNote).slice(0, 200),
  };

  // Renomeou o slug: move a linha (mantém histórico/posição).
  if (originalSlug && originalSlug !== slug) {
    await sql`UPDATE sales_pages SET slug = ${slug} WHERE slug = ${originalSlug}`;
  }

  await sql`
    INSERT INTO sales_pages (slug, title, theme, enabled, data, updated_at)
    VALUES (${slug}, ${title}, 'vice-city', ${enabled}, ${JSON.stringify(data)}::jsonb, NOW())
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title, theme = EXCLUDED.theme, enabled = EXCLUDED.enabled,
      data = EXCLUDED.data, updated_at = NOW()
  `;

  const saved = await getSalesPage(slug);
  if (!saved) throw new Error('Não foi possível salvar a página de venda.');
  return saved;
}

export async function deleteSalesPage(slug: string) {
  await ensureSalesPages();
  await sql`DELETE FROM sales_pages WHERE slug = ${normalizeSlug(slug)}`;
}
