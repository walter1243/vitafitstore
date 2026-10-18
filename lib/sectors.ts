import { sql } from '@/lib/db';
import { DEFAULT_SECTORS, type Sector, type SiteCollection } from '@/lib/sectors-shared';

export async function ensureSectorTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS sectors (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      tagline TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL DEFAULT 999,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS site_collections (
      id SERIAL PRIMARY KEY,
      sector_id INTEGER NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL DEFAULT '',
      tagline TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      photo_url TEXT NOT NULL DEFAULT '',
      theme TEXT NOT NULL DEFAULT 'light',
      bg_color TEXT NOT NULL DEFAULT '#F5F5F7',
      interactive TEXT NOT NULL DEFAULT 'none',
      match TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL DEFAULT 999,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Primeira vez: preenche com o setor Infantil e as colecoes que ja
  // existiam no codigo, pra vitrine continuar igual depois da migracao.
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM sectors`;
  if (count === 0) {
    for (const s of DEFAULT_SECTORS) {
      const [row] = await sql`
        INSERT INTO sectors (slug, name, tagline, position, enabled)
        VALUES (${s.slug}, ${s.name}, ${s.tagline}, ${s.position}, ${s.enabled})
        ON CONFLICT (slug) DO NOTHING
        RETURNING id
      `;
      if (!row) continue;
      for (const c of s.collections) {
        await sql`
          INSERT INTO site_collections (sector_id, slug, name, short_name, tagline, description, image_url, photo_url, theme, bg_color, interactive, match, position, enabled)
          VALUES (${row.id}, ${c.slug}, ${c.name}, ${c.shortName}, ${c.tagline}, ${c.description}, ${c.imageUrl}, ${c.photoUrl}, ${c.theme}, ${c.bgColor}, ${c.interactive}, ${c.match}, ${c.position}, ${c.enabled})
          ON CONFLICT (slug) DO NOTHING
        `;
      }
    }
  }
}

function toCollection(r: Record<string, any>): SiteCollection {
  return {
    id: Number(r.id),
    sectorId: Number(r.sector_id),
    slug: String(r.slug),
    name: String(r.name),
    shortName: String(r.short_name || r.name),
    tagline: String(r.tagline || ''),
    description: String(r.description || ''),
    imageUrl: String(r.image_url || ''),
    photoUrl: String(r.photo_url || ''),
    theme: r.theme === 'dark' ? 'dark' : 'light',
    bgColor: String(r.bg_color || '#F5F5F7'),
    interactive: ['rompecabezas', 'colorear', 'encender'].includes(r.interactive) ? r.interactive : 'none',
    match: String(r.match || ''),
    position: Number(r.position),
    enabled: Boolean(r.enabled),
  };
}

// Todos os setores com as colecoes, em ordem. `includeDisabled` so pro admin.
export async function getSectors(includeDisabled = false): Promise<Sector[]> {
  try {
    await ensureSectorTables();
    const sectors = await sql`SELECT * FROM sectors ORDER BY position ASC, id ASC`;
    const cols = await sql`SELECT * FROM site_collections ORDER BY position ASC, id ASC`;
    const all: Sector[] = sectors.map((s: Record<string, any>) => ({
      id: Number(s.id),
      slug: String(s.slug),
      name: String(s.name),
      tagline: String(s.tagline || ''),
      position: Number(s.position),
      enabled: Boolean(s.enabled),
      collections: cols.filter((c: Record<string, any>) => Number(c.sector_id) === Number(s.id)).map(toCollection),
    }));
    if (includeDisabled) return all;
    return all
      .filter((s) => s.enabled)
      .map((s) => ({ ...s, collections: s.collections.filter((c) => c.enabled) }));
  } catch (err) {
    console.error('[getSectors]', err);
    if (includeDisabled) throw err;
    return DEFAULT_SECTORS;
  }
}
