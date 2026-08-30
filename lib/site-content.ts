import { sql } from '@/lib/db';
import {
  DEFAULT_SITE_CONTENT,
  SITE_CONTENT_SECTIONS,
  type SiteContent,
} from '@/lib/site-content-defaults';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS site_content (
      section TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    await ensureTable();
    const rows = await sql`SELECT section, data FROM site_content`;

    const result: SiteContent = { ...DEFAULT_SITE_CONTENT };
    for (const row of rows as { section: string; data: unknown }[]) {
      if ((SITE_CONTENT_SECTIONS as string[]).includes(row.section)) {
        (result as any)[row.section] = {
          ...(DEFAULT_SITE_CONTENT as any)[row.section],
          ...(row.data as object),
        };
      }
    }
    return result;
  } catch (err) {
    console.error('[getSiteContent]', err);
    return DEFAULT_SITE_CONTENT;
  }
}

export async function saveSiteSection(section: keyof SiteContent, data: unknown) {
  if (!SITE_CONTENT_SECTIONS.includes(section)) {
    throw new Error(`Seção de conteúdo desconhecida: ${String(section)}`);
  }
  await ensureTable();
  await sql`
    INSERT INTO site_content (section, data, updated_at)
    VALUES (${section}, ${JSON.stringify(data)}::jsonb, NOW())
    ON CONFLICT (section) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
  `;
}
