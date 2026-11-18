import { sql } from '@/lib/db';
import {
  DEFAULT_SALES_PAGE,
  RESERVED_SLUGS,
  clampLogoHeight,
  clampHeroLogo,
  normalizeSlug,
  type SalesPageConfig,
} from '@/lib/sales-pages-shared';

// Lojas próprias (multi-loja) — Admin → Lojas. Cada loja tem nome, logo, link
// curto (/<slug>, o que vai no Instagram), página de vendas temática e catálogo
// próprio (products.store_slug). Carrinho, checkout Stripe e login do painel
// são os mesmos da Kitoys. Parte segura para o navegador: lib/sales-pages-shared.ts.

export * from '@/lib/sales-pages-shared';

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
    // A VICE CITY STORE já vem criada (em rascunho até ter produtos).
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
    logoImage: String(d.logoImage ?? ''),
    iconImage: String(d.iconImage ?? ''),
    logoHeight: clampLogoHeight(d.logoHeight ?? 72),
    heroLogoSize: clampHeroLogo(d.heroLogoSize ?? 0),
    whatsappEnabled: d.whatsappEnabled !== false,
    whatsappNumber: String(d.whatsappNumber ?? '').replace(/[^\d+ ]/g, '').slice(0, 20),
    instagram: String(d.instagram ?? '').trim().slice(0, 120),
    eyebrow: String(d.eyebrow ?? base.eyebrow),
    heading: String(d.heading ?? base.heading),
    subtitle: String(d.subtitle ?? base.subtitle),
    ctaLabel: String(d.ctaLabel ?? base.ctaLabel),
    badge: String(d.badge ?? base.badge),
    heroImage: String(d.heroImage ?? ''),
    heroVideo: String(d.heroVideo ?? ''),
    backgroundImage: String(d.backgroundImage ?? ''),
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
  const s = normalizeSlug(slug);
  if (!s || RESERVED_SLUGS.has(s)) return null;
  await ensureSalesPages();
  const [row] = (await sql`SELECT slug, title, theme, enabled, data, updated_at FROM sales_pages WHERE slug = ${s} LIMIT 1`) as any[];
  return row ? rowToConfig(row) : null;
}

export async function saveSalesPage(input: Partial<SalesPageConfig> & { originalSlug?: string }): Promise<SalesPageConfig> {
  await ensureSalesPages();
  const slug = normalizeSlug(input.slug) || normalizeSlug(input.title) || `loja-${Date.now()}`;
  if (RESERVED_SLUGS.has(slug)) {
    throw new Error(`O endereço "/${slug}" já é usado pelo site. Escolha outro (ex.: ${slug}-store).`);
  }
  const originalSlug = input.originalSlug ? normalizeSlug(input.originalSlug) : slug;

  const title = String(input.title ?? DEFAULT_SALES_PAGE.title).trim().slice(0, 80) || DEFAULT_SALES_PAGE.title;
  const enabled = Boolean(input.enabled ?? true);

  const data: Omit<SalesPageConfig, 'slug' | 'updatedAt'> = {
    title,
    theme: 'vice-city',
    enabled,
    logoImage: String(input.logoImage ?? '').trim(),
    iconImage: String(input.iconImage ?? '').trim(),
    logoHeight: clampLogoHeight(input.logoHeight ?? 72),
    heroLogoSize: clampHeroLogo(input.heroLogoSize ?? 0),
    whatsappEnabled: input.whatsappEnabled !== false,
    whatsappNumber: String(input.whatsappNumber ?? '').replace(/[^\d+ ]/g, '').slice(0, 20),
    instagram: String(input.instagram ?? '').trim().slice(0, 120),
    eyebrow: String(input.eyebrow ?? DEFAULT_SALES_PAGE.eyebrow).slice(0, 60),
    heading: String(input.heading ?? DEFAULT_SALES_PAGE.heading).slice(0, 80),
    subtitle: String(input.subtitle ?? DEFAULT_SALES_PAGE.subtitle).slice(0, 400),
    ctaLabel: String(input.ctaLabel ?? DEFAULT_SALES_PAGE.ctaLabel).slice(0, 40),
    badge: String(input.badge ?? DEFAULT_SALES_PAGE.badge).slice(0, 30),
    heroImage: String(input.heroImage ?? '').trim(),
    heroVideo: String(input.heroVideo ?? '').trim(),
    backgroundImage: String(input.backgroundImage ?? '').trim(),
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

  // Mudou o endereço: a loja, os produtos e os pedidos dela vão junto.
  if (originalSlug && originalSlug !== slug) {
    const [taken] = (await sql`SELECT 1 FROM sales_pages WHERE slug = ${slug} LIMIT 1`) as any[];
    if (taken) throw new Error(`Já existe uma loja em "/${slug}".`);
    await sql`UPDATE sales_pages SET slug = ${slug} WHERE slug = ${originalSlug}`;
    await sql`UPDATE products SET store_slug = ${slug} WHERE store_slug = ${originalSlug}`;
    await sql`UPDATE orders SET store_slug = ${slug} WHERE store_slug = ${originalSlug}`.catch(() => {});
  }

  await sql`
    INSERT INTO sales_pages (slug, title, theme, enabled, data, updated_at)
    VALUES (${slug}, ${title}, 'vice-city', ${enabled}, ${JSON.stringify(data)}::jsonb, NOW())
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title, theme = EXCLUDED.theme, enabled = EXCLUDED.enabled,
      data = EXCLUDED.data, updated_at = NOW()
  `;

  const saved = await getSalesPage(slug);
  if (!saved) throw new Error('Não foi possível salvar a loja.');
  return saved;
}

export async function deleteSalesPage(slug: string) {
  await ensureSalesPages();
  await sql`DELETE FROM sales_pages WHERE slug = ${normalizeSlug(slug)}`;
}
