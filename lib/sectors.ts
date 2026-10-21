import { sql } from '@/lib/db';
import { DEFAULT_SECTORS, sectorStyleOf, type Sector, type SiteCollection } from '@/lib/sectors-shared';

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

  await sql`ALTER TABLE sectors ADD COLUMN IF NOT EXISTS style TEXT NOT NULL DEFAULT 'infantil'`;
  await sql`ALTER TABLE sectors ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE sectors ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE sectors ADD COLUMN IF NOT EXISTS video_url TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE sectors ADD COLUMN IF NOT EXISTS content TEXT`;
  await sql`ALTER TABLE site_collections ADD COLUMN IF NOT EXISTS video_url TEXT NOT NULL DEFAULT ''`;
  await sql`CREATE TABLE IF NOT EXISTS site_flags (key TEXT PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW())`;

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
  await seedNewSectors();
  await seedNavidadOnce();
  await mergeHogarOnce();
}

// Setores novos da Kitoys 3D (casa, chaveiros e pets), criados uma unica
// vez — depois disso o dono edita/apaga no Admin e eles nao voltam.
const NEW_SECTORS = [
  {
    slug: 'hogar', name: 'Hogar', style: 'hogar', tagline: 'Decoración y detalles para tu casa',
    description: 'Jarrones, decoración y pequeños detalles impresos en 3D en nuestro taller.',
    collections: [
      { slug: 'decoracion', name: 'Decoración', shortName: 'Decoración', tagline: 'Detalles que hacen casa', match: 'jarron, decor, hogar, casa, maceta, florero' },
    ],
  },
  {
    slug: 'llaveros', name: 'Llaveros personalizados', style: 'llaveros', tagline: 'Con tu nombre, impreso en 3D',
    description: 'Elige el modelo, escribe el nombre y míralo al momento en el llavero.',
    collections: [
      { slug: 'llaveros-con-nombre', name: 'Llaveros con nombre', shortName: 'Llaveros', tagline: 'Escribe el nombre y míralo al instante', match: 'llavero, chaveiro, keychain', interactive: 'nombre' },
    ],
  },
  {
    slug: 'mascotas', name: 'Mascotas', style: 'mascotas', tagline: 'Para los peludos de la casa',
    description: 'Placas, accesorios y detalles para tu mascota, personalizados con su nombre.',
    collections: [
      { slug: 'para-tu-mascota', name: 'Para tu mascota', shortName: 'Mascotas', tagline: 'Personalizado con su nombre', match: 'mascota, pet, perro, gato, chapa, placa, collar', interactive: 'nombre' },
    ],
  },
] as const;

// Correcao unica: ja existia um setor "Hogar" criado no admin (com um link
// colado no endereco). Fica o do dono (texto dele), recebe a colecao
// Decoracion, ganha o endereco /sector/hogar e o duplicado sai.
async function mergeHogarOnce() {
  const [done] = await sql`SELECT key FROM site_flags WHERE key = 'merge_hogar_v1'`;
  if (done) return;
  const [owner] = await sql`SELECT id, slug FROM sectors WHERE style = 'hogar' AND slug <> 'hogar' ORDER BY id LIMIT 1`;
  const [seeded] = await sql`SELECT id FROM sectors WHERE slug = 'hogar'`;
  if (owner && seeded) {
    await sql`UPDATE site_collections SET sector_id = ${owner.id} WHERE sector_id = ${seeded.id}`;
    await sql`DELETE FROM sectors WHERE id = ${seeded.id}`;
    if (/http|kitoys3d-com/.test(String(owner.slug))) await sql`UPDATE sectors SET slug = 'hogar' WHERE id = ${owner.id}`;
  }
  await sql`INSERT INTO site_flags (key) VALUES ('merge_hogar_v1') ON CONFLICT DO NOTHING`;
}

async function seedNavidadOnce() {
  const [done] = await sql`SELECT key FROM site_flags WHERE key = 'seed_navidad_v1'`;
  if (done) return;
  const [row] = await sql`
    INSERT INTO sectors (slug, name, tagline, style, description, position, enabled)
    VALUES ('navidad', 'Navidad', 'Detalles impresos en 3D para estas fiestas', 'navidad',
            'Decoración y regalos navideños impresos en 3D en nuestro taller.',
            COALESCE((SELECT MAX(position) + 1 FROM sectors), 1), TRUE)
    ON CONFLICT (slug) DO NOTHING
    RETURNING id
  `;
  if (row) {
    await sql`
      INSERT INTO site_collections (sector_id, slug, name, short_name, tagline, description, interactive, match, position, enabled, bg_color)
      VALUES (${row.id}, 'navidad', 'Navidad', 'Navidad', 'Decora y regala estas fiestas',
              'Decoración y regalos navideños impresos en 3D.', 'none', 'navidad, navideño, navideno, christmas, natal', 1, TRUE, '#166534')
      ON CONFLICT (slug) DO NOTHING
    `;
  }
  await sql`INSERT INTO site_flags (key) VALUES ('seed_navidad_v1') ON CONFLICT DO NOTHING`;
}

async function seedNewSectors() {
  const [done] = await sql`SELECT key FROM site_flags WHERE key = 'seed_sectors_v2'`;
  if (done) return;
  for (const s of NEW_SECTORS) {
    const [row] = await sql`
      INSERT INTO sectors (slug, name, tagline, style, description, position, enabled)
      VALUES (${s.slug}, ${s.name}, ${s.tagline}, ${s.style}, ${s.description}, COALESCE((SELECT MAX(position) + 1 FROM sectors), 1), TRUE)
      ON CONFLICT (slug) DO NOTHING
      RETURNING id
    `;
    if (!row) continue;
    for (const [i, c] of s.collections.entries()) {
      await sql`
        INSERT INTO site_collections (sector_id, slug, name, short_name, tagline, description, interactive, match, position, enabled, bg_color)
        VALUES (${row.id}, ${c.slug}, ${c.name}, ${c.shortName}, ${c.tagline}, ${s.description}, ${'interactive' in c ? c.interactive : 'none'}, ${c.match}, ${i + 1}, TRUE, '#F5F5F7')
        ON CONFLICT (slug) DO NOTHING
      `;
    }
  }
  await sql`INSERT INTO site_flags (key) VALUES ('seed_sectors_v2') ON CONFLICT DO NOTHING`;
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
    interactive: ['rompecabezas', 'colorear', 'encender', 'nombre'].includes(r.interactive) ? r.interactive : 'none',
    videoUrl: String(r.video_url || ''),
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
      style: sectorStyleOf(s.style),
      description: String(s.description || ''),
      imageUrl: String(s.image_url || ''),
      videoUrl: String(s.video_url || ''),
      content: s.content ?? null,
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
