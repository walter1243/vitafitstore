import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

type Category = {
  id: number;
  name: string;
  slug: string;
  position: number;
  enabled: boolean;
  bannerType?: 'image' | 'video';
  bannerUrl?: string;
  logoUrl?: string;
};

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      position INTEGER NOT NULL DEFAULT 999,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      banner_type TEXT DEFAULT 'image',
      banner_url TEXT,
      logo_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS banner_type TEXT DEFAULT 'image'`;
  await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS banner_url TEXT`;
  await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS logo_url TEXT`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  try {
    await ensureTable();

    const rows = await sql`
      SELECT id, name, slug, position, enabled,
             COALESCE(banner_type, 'image') AS "bannerType",
             COALESCE(banner_url, '') AS "bannerUrl",
             COALESCE(logo_url, '') AS "logoUrl"
      FROM categories
      ORDER BY position ASC, name ASC
    `;

    return NextResponse.json(rows as Category[]);
  } catch (err: any) {
    console.error("[GET /api/categories]", err);
    return NextResponse.json({ error: err?.message ?? "Erro ao listar categorias." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const body = await req.json();
    const name = String(body?.name ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "Nome da categoria é obrigatório." }, { status: 400 });
    }

    const slug = slugify(name);
    if (!slug) {
      return NextResponse.json({ error: "Nome da categoria inválido." }, { status: 400 });
    }

    const [existing] = await sql`
      SELECT id FROM categories WHERE slug = ${slug} OR LOWER(name) = LOWER(${name}) LIMIT 1
    `;

    if (existing) {
      return NextResponse.json({ error: "Categoria já existe." }, { status: 409 });
    }

    const [category] = await sql`
      INSERT INTO categories (name, slug, position, enabled, banner_type, banner_url, logo_url)
      VALUES (
        ${name},
        ${slug},
        COALESCE((SELECT MAX(position) + 1 FROM categories), 1),
        TRUE,
        'image',
        NULL,
        NULL
      )
      RETURNING id, name, slug, position, enabled,
                COALESCE(banner_type, 'image') AS "bannerType",
                COALESCE(banner_url, '') AS "bannerUrl",
                COALESCE(logo_url, '') AS "logoUrl"
    `;

    return NextResponse.json(category, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/categories]", err);
    return NextResponse.json({ error: err?.message ?? "Erro ao criar categoria." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureTable();
    const body = await req.json();
    const action = String(body?.action ?? '').trim();

    if (action === 'move') {
      const id = Number(body?.id);
      const direction = String(body?.direction ?? '');
      if (!id || !['up', 'down'].includes(direction)) {
        return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
      }

      const [current] = await sql`
        SELECT id, position
        FROM categories
        WHERE id = ${id}
      `;

      if (!current) {
        return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
      }

      const [target] = direction === 'up'
        ? await sql`
            SELECT id, position
            FROM categories
            WHERE position < ${current.position}
            ORDER BY position DESC
            LIMIT 1
          `
        : await sql`
            SELECT id, position
            FROM categories
            WHERE position > ${current.position}
            ORDER BY position ASC
            LIMIT 1
          `;

      if (!target) return NextResponse.json({ success: true });

      await sql`UPDATE categories SET position = ${target.position} WHERE id = ${current.id}`;
      await sql`UPDATE categories SET position = ${current.position} WHERE id = ${target.id}`;
      return NextResponse.json({ success: true });
    }

    if (action === 'updateMedia') {
      const id = Number(body?.id);
      if (!id) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });

      const bannerType = String(body?.bannerType ?? 'image');
      const bannerUrl = String(body?.bannerUrl ?? '').trim();
      const logoUrl = String(body?.logoUrl ?? '').trim();

      if (!['image', 'video'].includes(bannerType)) {
        return NextResponse.json({ error: 'Tipo de banner inválido.' }, { status: 400 });
      }

      await sql`
        UPDATE categories
        SET banner_type = ${bannerType},
            banner_url = ${bannerUrl || null},
            logo_url = ${logoUrl || null}
        WHERE id = ${id}
      `;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (err: any) {
    console.error('[PATCH /api/categories]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao atualizar categoria.' }, { status: 500 });
  }
}
