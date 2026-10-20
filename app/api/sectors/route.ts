import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { ensureSectorTables, getSectors } from '@/lib/sectors';
import { sectorStyleOf, slugify } from '@/lib/sectors-shared';
import { parseWorldContent } from '@/lib/world-content';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noStore = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };
const HEX = /^#[0-9a-fA-F]{6}$/;
const INTERACTIVE = ['none', 'rompecabezas', 'colorear', 'encender', 'nombre'];

// GET: setores ativos com as colecoes ativas (vitrine). ?all=1 (admin): tudo.
export async function GET(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get('all') === '1') {
      const auth = await requireAdmin(req);
      if (!auth.ok) return auth.response;
      return NextResponse.json(await getSectors(true), { headers: noStore });
    }
    return NextResponse.json(await getSectors(), { headers: noStore });
  } catch (err: any) {
    console.error('[GET /api/sectors]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao listar setores.' }, { status: 500 });
  }
}

const str = (v: unknown, max = 500) => String(v ?? '').trim().slice(0, max);
// Endereco: se colarem um link inteiro (https://.../sector/hogar), fica so a ultima parte.
const cleanSlug = (v: unknown) => {
  const raw = str(v, 300);
  if (!/[/:]/.test(raw)) return raw.slice(0, 80);
  return (raw.replace(/[?#].*$/, '').replace(/\/+$/, '').split('/').pop() || '').slice(0, 80);
};

// POST { action, ... } — criar/editar/apagar/reordenar setores e colecoes.
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;
    await ensureSectorTables();
    const body = await req.json();
    const action = str(body?.action, 40);

    if (action === 'saveSector') {
      const name = str(body.name, 80);
      if (!name) return NextResponse.json({ error: 'Nome do setor é obrigatório.' }, { status: 400 });
      const slug = slugify(cleanSlug(body.slug) || name);
      if (!slug) return NextResponse.json({ error: 'Nome do setor inválido.' }, { status: 400 });
      const tagline = str(body.tagline, 200);
      const enabled = body.enabled !== false;
      const style = sectorStyleOf(body.style);
      const description = str(body.description, 600);
      const imageUrl = str(body.imageUrl, 1000);
      const videoUrl = str(body.videoUrl, 1000);
      // Conteudo do mundo (Admin → Mundos): so troca quando vem no pedido.
      const hasContent = Object.prototype.hasOwnProperty.call(body, 'content');
      const content = hasContent ? JSON.stringify(parseWorldContent(body.content, style)) : null;
      const id = Number(body.id) || 0;
      const [clash] = await sql`SELECT id FROM sectors WHERE slug = ${slug} AND id <> ${id} LIMIT 1`;
      if (clash) return NextResponse.json({ error: 'Já existe um setor com esse endereço (slug).' }, { status: 409 });
      if (id) {
        await sql`UPDATE sectors SET name = ${name}, slug = ${slug}, tagline = ${tagline}, enabled = ${enabled}, style = ${style}, description = ${description}, image_url = ${imageUrl}, video_url = ${videoUrl}, content = CASE WHEN ${hasContent} THEN ${content} ELSE content END WHERE id = ${id}`;
      } else {
        await sql`
          INSERT INTO sectors (name, slug, tagline, enabled, style, description, image_url, video_url, content, position)
          VALUES (${name}, ${slug}, ${tagline}, ${enabled}, ${style}, ${description}, ${imageUrl}, ${videoUrl}, ${content}, COALESCE((SELECT MAX(position) + 1 FROM sectors), 1))
        `;
      }
      return NextResponse.json(await getSectors(true), { headers: noStore });
    }

    if (action === 'saveCollection') {
      const name = str(body.name, 80);
      const sectorId = Number(body.sectorId) || 0;
      if (!name || !sectorId) return NextResponse.json({ error: 'Nome e setor são obrigatórios.' }, { status: 400 });
      const slug = slugify(cleanSlug(body.slug) || name);
      if (!slug) return NextResponse.json({ error: 'Nome da coleção inválido.' }, { status: 400 });
      const id = Number(body.id) || 0;
      const [clash] = await sql`SELECT id FROM site_collections WHERE slug = ${slug} AND id <> ${id} LIMIT 1`;
      if (clash) return NextResponse.json({ error: 'Já existe uma coleção com esse endereço (slug).' }, { status: 409 });
      const v = {
        shortName: str(body.shortName, 40) || name,
        tagline: str(body.tagline, 200),
        description: str(body.description, 600),
        imageUrl: str(body.imageUrl, 1000),
        photoUrl: str(body.photoUrl, 1000),
        videoUrl: str(body.videoUrl, 1000),
        theme: body.theme === 'dark' ? 'dark' : 'light',
        bgColor: HEX.test(str(body.bgColor, 7)) ? str(body.bgColor, 7) : (body.theme === 'dark' ? '#07080F' : '#F5F5F7'),
        interactive: INTERACTIVE.includes(body.interactive) ? body.interactive : 'none',
        match: str(body.match, 500),
        enabled: body.enabled !== false,
      };
      if (id) {
        await sql`
          UPDATE site_collections SET
            sector_id = ${sectorId}, slug = ${slug}, name = ${name}, short_name = ${v.shortName}, tagline = ${v.tagline},
            description = ${v.description}, image_url = ${v.imageUrl}, photo_url = ${v.photoUrl}, theme = ${v.theme},
            bg_color = ${v.bgColor}, interactive = ${v.interactive}, match = ${v.match}, enabled = ${v.enabled}, video_url = ${v.videoUrl}
          WHERE id = ${id}
        `;
      } else {
        await sql`
          INSERT INTO site_collections (sector_id, slug, name, short_name, tagline, description, image_url, photo_url, video_url, theme, bg_color, interactive, match, enabled, position)
          VALUES (${sectorId}, ${slug}, ${name}, ${v.shortName}, ${v.tagline}, ${v.description}, ${v.imageUrl}, ${v.photoUrl}, ${v.videoUrl}, ${v.theme}, ${v.bgColor}, ${v.interactive}, ${v.match}, ${v.enabled},
                  COALESCE((SELECT MAX(position) + 1 FROM site_collections WHERE sector_id = ${sectorId}), 1))
        `;
      }
      return NextResponse.json(await getSectors(true), { headers: noStore });
    }

    if (action === 'deleteSector') {
      await sql`DELETE FROM sectors WHERE id = ${Number(body.id) || 0}`;
      return NextResponse.json(await getSectors(true), { headers: noStore });
    }

    if (action === 'deleteCollection') {
      await sql`DELETE FROM site_collections WHERE id = ${Number(body.id) || 0}`;
      return NextResponse.json(await getSectors(true), { headers: noStore });
    }

    // Sobe/desce trocando a posicao com o vizinho (setor, ou colecao dentro do mesmo setor).
    if (action === 'moveSector' || action === 'moveCollection') {
      const id = Number(body.id) || 0;
      const up = body.direction === 'up';
      if (action === 'moveSector') {
        const [cur] = await sql`SELECT id, position FROM sectors WHERE id = ${id}`;
        if (cur) {
          const [tgt] = up
            ? await sql`SELECT id, position FROM sectors WHERE position < ${cur.position} ORDER BY position DESC LIMIT 1`
            : await sql`SELECT id, position FROM sectors WHERE position > ${cur.position} ORDER BY position ASC LIMIT 1`;
          if (tgt) {
            await sql`UPDATE sectors SET position = ${tgt.position} WHERE id = ${cur.id}`;
            await sql`UPDATE sectors SET position = ${cur.position} WHERE id = ${tgt.id}`;
          }
        }
      } else {
        const [cur] = await sql`SELECT id, position, sector_id FROM site_collections WHERE id = ${id}`;
        if (cur) {
          const [tgt] = up
            ? await sql`SELECT id, position FROM site_collections WHERE sector_id = ${cur.sector_id} AND position < ${cur.position} ORDER BY position DESC LIMIT 1`
            : await sql`SELECT id, position FROM site_collections WHERE sector_id = ${cur.sector_id} AND position > ${cur.position} ORDER BY position ASC LIMIT 1`;
          if (tgt) {
            await sql`UPDATE site_collections SET position = ${tgt.position} WHERE id = ${cur.id}`;
            await sql`UPDATE site_collections SET position = ${cur.position} WHERE id = ${tgt.id}`;
          }
        }
      }
      return NextResponse.json(await getSectors(true), { headers: noStore });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (err: any) {
    console.error('[POST /api/sectors]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao salvar.' }, { status: 500 });
  }
}
