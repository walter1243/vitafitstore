// Modelos 3D dos produtos — tabela própria (não mexe em products, preços, estoque ou checkout).
// O servidor não confia no navegador: ao salvar, baixa o GLB do Blob, mede a caixa
// delimitadora e valida contra as medidas reais antes de permitir publicar.
import { sql } from '@/lib/db';
import {
  canPublish, dimsFromGlb, glbInfo, MAX_GLB_BYTES, parseDims, validateDims,
  type ArStatus, type Placement, type ProductModel, type ValidationReport,
} from '@/lib/product-models-shared';

let ready: Promise<void> | null = null;
export function ensureProductModels() {
  ready ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS product_models (
        product_id INT PRIMARY KEY,
        glb_url TEXT NOT NULL DEFAULT '',
        usdz_url TEXT NOT NULL DEFAULT '',
        source_url TEXT NOT NULL DEFAULT '',
        source_name TEXT NOT NULL DEFAULT '',
        real_mm JSONB,
        measured_mm JSONB,
        validation TEXT NOT NULL DEFAULT 'pendente',
        report JSONB,
        ar_status TEXT NOT NULL DEFAULT 'rascunho',
        placement TEXT NOT NULL DEFAULT 'floor',
        triangles INT NOT NULL DEFAULT 0,
        glb_bytes INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
  })().catch((e) => { ready = null; throw e; });
  return ready;
}

function rowToModel(r: any): ProductModel {
  return {
    productId: Number(r.product_id),
    glbUrl: r.glb_url ?? '',
    usdzUrl: r.usdz_url ?? '',
    sourceUrl: r.source_url ?? '',
    sourceName: r.source_name ?? '',
    real: parseDims(r.real_mm),
    measured: parseDims(r.measured_mm),
    validation: r.validation ?? 'pendente',
    report: (r.report as ValidationReport) ?? null,
    arStatus: r.ar_status === 'publicado' ? 'publicado' : 'rascunho',
    placement: r.placement === 'wall' ? 'wall' : 'floor',
    triangles: Number(r.triangles ?? 0),
    glbBytes: Number(r.glb_bytes ?? 0),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
  };
}

export async function getProductModel(productId: number, publishedOnly = false): Promise<ProductModel | null> {
  try {
    await ensureProductModels();
    const rows = (await sql`SELECT * FROM product_models WHERE product_id = ${productId}`) as any[];
    const m = rows[0] ? rowToModel(rows[0]) : null;
    if (!m) return null;
    if (publishedOnly && (m.arStatus !== 'publicado' || !canPublish(m))) return null;
    return m;
  } catch (err) {
    console.error('[getProductModel]', err);
    return null;
  }
}

// Só arquivos do nosso Vercel Blob (evita o servidor baixar URL qualquer).
export function isOurBlob(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname.endsWith('.public.blob.vercel-storage.com');
  } catch { return false; }
}

async function fetchBytes(url: string, max: number): Promise<ArrayBuffer> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Não foi possível baixar o arquivo (${res.status}).`);
  const len = Number(res.headers.get('content-length') ?? 0);
  if (len > max) throw new Error('Arquivo grande demais.');
  const buf = await res.arrayBuffer();
  if (buf.byteLength > max) throw new Error('Arquivo grande demais.');
  return buf;
}

export type SaveModelInput = {
  productId: number;
  glbUrl?: string;
  usdzUrl?: string;
  sourceUrl?: string;
  sourceName?: string;
  real?: unknown;
  placement?: Placement;
  arStatus?: ArStatus;
};

export async function saveProductModel(input: SaveModelInput): Promise<ProductModel> {
  await ensureProductModels();
  const productId = Number(input.productId);
  if (!Number.isInteger(productId) || productId <= 0) throw new Error('Produto inválido.');
  const exists = (await sql`SELECT id FROM products WHERE id = ${productId}`) as any[];
  if (!exists.length) throw new Error('Produto não encontrado.');

  const prev = await getProductModel(productId);
  const glbUrl = String(input.glbUrl ?? prev?.glbUrl ?? '');
  const usdzUrl = String(input.usdzUrl ?? prev?.usdzUrl ?? '');
  const sourceUrl = String(input.sourceUrl ?? prev?.sourceUrl ?? '');
  const sourceName = String(input.sourceName ?? prev?.sourceName ?? '').slice(0, 200);
  for (const u of [glbUrl, usdzUrl, sourceUrl]) if (u && !isOurBlob(u)) throw new Error('Os arquivos precisam estar no armazenamento da loja.');

  const real = input.real !== undefined ? parseDims(input.real) : prev?.real ?? null;
  const placement: Placement = input.placement === 'wall' ? 'wall' : input.placement === 'floor' ? 'floor' : prev?.placement ?? 'floor';

  // Mede o GLB de verdade (no servidor) — só quando o arquivo mudou.
  let measured = prev?.measured ?? null;
  let triangles = prev?.triangles ?? 0;
  let glbBytes = prev?.glbBytes ?? 0;
  if (glbUrl && glbUrl !== prev?.glbUrl) {
    const buf = await fetchBytes(glbUrl, MAX_GLB_BYTES);
    const info = glbInfo(buf);
    measured = dimsFromGlb(info);
    triangles = info.triangles;
    glbBytes = buf.byteLength;
  }
  if (!glbUrl) { measured = null; triangles = 0; glbBytes = 0; }
  if (usdzUrl && usdzUrl !== prev?.usdzUrl) {
    const head = new Uint8Array(await fetchBytes(usdzUrl, MAX_GLB_BYTES * 2), 0, 4);
    if (!(head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04)) throw new Error('O arquivo USDZ é inválido.');
  }

  const report = validateDims(real, measured);
  let arStatus: ArStatus = input.arStatus ?? prev?.arStatus ?? 'rascunho';
  if (arStatus === 'publicado' && !canPublish({ glbUrl, validation: report.status })) {
    if (input.arStatus === 'publicado') throw new Error(report.status === 'pendente' ? report.messages[0] : 'Publicação bloqueada: o modelo não confere com as medidas reais.');
    arStatus = 'rascunho'; // arquivo/medida mudou e deixou de passar: volta para rascunho
  }

  const rows = (await sql`
    INSERT INTO product_models (product_id, glb_url, usdz_url, source_url, source_name, real_mm, measured_mm, validation, report, ar_status, placement, triangles, glb_bytes, updated_at)
    VALUES (${productId}, ${glbUrl}, ${usdzUrl}, ${sourceUrl}, ${sourceName}, ${real ? JSON.stringify(real) : null}::jsonb, ${measured ? JSON.stringify(measured) : null}::jsonb,
            ${report.status}, ${JSON.stringify(report)}::jsonb, ${arStatus}, ${placement}, ${triangles}, ${glbBytes}, NOW())
    ON CONFLICT (product_id) DO UPDATE SET
      glb_url = EXCLUDED.glb_url, usdz_url = EXCLUDED.usdz_url, source_url = EXCLUDED.source_url, source_name = EXCLUDED.source_name,
      real_mm = EXCLUDED.real_mm, measured_mm = EXCLUDED.measured_mm, validation = EXCLUDED.validation, report = EXCLUDED.report,
      ar_status = EXCLUDED.ar_status, placement = EXCLUDED.placement, triangles = EXCLUDED.triangles, glb_bytes = EXCLUDED.glb_bytes,
      updated_at = NOW()
    RETURNING *
  `) as any[];
  return rowToModel(rows[0]);
}

// Remove a ligação modelo ↔ produto. Os arquivos no Blob (inclusive o original) ficam guardados.
export async function deleteProductModel(productId: number) {
  await ensureProductModels();
  await sql`DELETE FROM product_models WHERE product_id = ${productId}`;
}
