import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HomeBlock = {
  key: string;
  label: string;
  position: number;
  enabled: boolean;
};

const DEFAULT_BLOCKS: HomeBlock[] = [
  { key: "hero", label: "Hero Vídeo", position: 1, enabled: true },
  { key: "trust", label: "Selos de Confiança", position: 2, enabled: true },
  { key: "products", label: "Produtos", position: 3, enabled: true },
  { key: "pin", label: "Sessão Pin", position: 4, enabled: true },
  { key: "newsletter", label: "Newsletter", position: 5, enabled: true },
];

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS home_blocks (
      block_key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      position INTEGER NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT TRUE
    )
  `;

  for (const block of DEFAULT_BLOCKS) {
    await sql`
      INSERT INTO home_blocks (block_key, label, position, enabled)
      VALUES (${block.key}, ${block.label}, ${block.position}, ${block.enabled})
      ON CONFLICT (block_key) DO NOTHING
    `;
  }
}

export async function GET() {
  try {
    await ensureTable();

    const rows = await sql`
      SELECT
        block_key AS key,
        label,
        position,
        enabled
      FROM home_blocks
      ORDER BY position ASC
    `;

    return NextResponse.json(rows, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
    });
  } catch (err: any) {
    console.error("[GET /api/home-blocks]", err);
    return NextResponse.json(DEFAULT_BLOCKS, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const body = await req.json();
    const blocks = Array.isArray(body?.blocks) ? body.blocks : [];

    for (const item of blocks) {
      const key = String(item?.key ?? "").trim();
      if (!key) continue;
      const position = Number(item?.position ?? 0);
      const enabled = Boolean(item?.enabled);

      await sql`
        UPDATE home_blocks
        SET position = ${position}, enabled = ${enabled}
        WHERE block_key = ${key}
      `;
    }

    const rows = await sql`
      SELECT block_key AS key, label, position, enabled
      FROM home_blocks
      ORDER BY position ASC
    `;

    return NextResponse.json({ success: true, blocks: rows }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
    });
  } catch (err: any) {
    console.error("[POST /api/home-blocks]", err);
    return NextResponse.json({ error: err?.message ?? "Erro ao salvar blocos." }, { status: 500 });
  }
}
