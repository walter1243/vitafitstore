// Modelos 3D dos produtos (realidade aumentada com o arquivo real da impressão).
// Arquivo sem dependências de servidor: usado no painel (conversor), na API e na loja.
//
// Regras (docs/modelos-3d.md):
// - Unidade do GLB/USDZ: metros (padrão glTF). Medidas do cadastro: milímetros.
// - Eixos: X = largura, Y = altura, Z = profundidade; origem no centro da base.
// - Nunca deformar para "bater" a medida: só escala uniforme (mesmo fator nos 3 eixos),
//   e só quando o cadastro pede. Proporção diferente = sinaliza e bloqueia.

export type Dims = { w: number; h: number; d: number }; // mm

export type ValidationStatus = 'pendente' | 'ok' | 'alerta' | 'bloqueado';
export type ArStatus = 'rascunho' | 'publicado';
export type Placement = 'floor' | 'wall';

export type ProductModel = {
  productId: number;
  glbUrl: string;
  usdzUrl: string;
  sourceUrl: string; // arquivo original (STL/3MF/OBJ/GLB), guardado sem alteração
  sourceName: string;
  real: Dims | null; // medidas reais informadas (mm)
  measured: Dims | null; // caixa do GLB publicado (mm), medida pelo servidor
  validation: ValidationStatus;
  report: ValidationReport | null;
  arStatus: ArStatus;
  placement: Placement;
  triangles: number;
  glbBytes: number;
  updatedAt?: string;
};

export type AxisCheck = { axis: 'largura' | 'altura' | 'profundidade'; real: number; measured: number; diffPct: number };

export type ValidationReport = {
  status: ValidationStatus;
  checks: AxisCheck[];
  uniformFactor: number | null; // modelo certo, mas noutra escala (ex.: 10 = arquivo em cm)
  rotated: boolean; // as medidas batem, mas em outra ordem (modelo deitado/girado)
  messages: string[];
};

export const TOLERANCE_OK = 2; // % de diferença aceita sem aviso
export const TOLERANCE_BLOCK = 5; // acima disso não publica

export const MAX_GLB_BYTES = 25 * 1024 * 1024;
export const WARN_GLB_BYTES = 5 * 1024 * 1024;
export const WARN_TRIANGLES = 300_000;

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0; };

// Comprimento (w) e altura (h) são obrigatórios; a profundidade (d) é opcional:
// quando não informada, vem da proporção do próprio modelo (nunca inventada).
export function parseDims(v: unknown): Dims | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const d = { w: num(o.w), h: num(o.h), d: num(o.d) };
  return d.w && d.h ? d : null;
}

const pct = (real: number, measured: number) => (Math.abs(measured - real) / real) * 100;
const round1 = (n: number) => Math.round(n * 10) / 10;

// Compara a caixa do modelo com as medidas reais. Não inventa nada: sem medidas = "pendente".
export function validateDims(real: Dims | null, measured: Dims | null): ValidationReport {
  if (!real) return { status: 'pendente', checks: [], uniformFactor: null, rotated: false, messages: ['Preencha o comprimento e a altura reais (mm) para validar.'] };
  if (!measured) return { status: 'pendente', checks: [], uniformFactor: null, rotated: false, messages: ['Envie o arquivo 3D para medir o modelo.'] };

  const checks: AxisCheck[] = [
    { axis: 'largura', real: real.w, measured: round1(measured.w), diffPct: round1(pct(real.w, measured.w)) },
    { axis: 'altura', real: real.h, measured: round1(measured.h), diffPct: round1(pct(real.h, measured.h)) },
  ];
  if (real.d) checks.push({ axis: 'profundidade', real: real.d, measured: round1(measured.d), diffPct: round1(pct(real.d, measured.d)) });
  const worst = Math.max(...checks.map((c) => c.diffPct));
  const status: ValidationStatus = worst <= TOLERANCE_OK ? 'ok' : worst <= TOLERANCE_BLOCK ? 'alerta' : 'bloqueado';
  const messages: string[] = [];

  // Mesmo fator em todos os eixos informados → só a escala difere (proporção preservada).
  const ratios = checks.map((c) => c.real / (c.measured || 1));
  const spread = Math.max(...ratios) / Math.min(...ratios) - 1;
  const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  const uniformFactor = status !== 'ok' && spread <= TOLERANCE_OK / 100 ? Math.round(mean * 10000) / 10000 : null;

  // Medidas batem trocando os eixos → o modelo está girado (ex.: deitado ou de lado).
  const dims = [measured.w, measured.h, measured.d];
  const rotated = status !== 'ok' && !uniformFactor
    && dims.some((a, i) => dims.some((b, j) => i !== j && pct(real.w, a) <= TOLERANCE_BLOCK && pct(real.h, b) <= TOLERANCE_BLOCK));

  if (status === 'ok') messages.push('Modelo confere com as medidas reais.');
  if (status === 'alerta') messages.push(`Diferença de até ${round1(worst)}%: confira as medidas antes de publicar.`);
  if (status === 'bloqueado') messages.push(`Diferença de ${round1(worst)}% (acima de ${TOLERANCE_BLOCK}%): publicação bloqueada até corrigir.`);
  if (uniformFactor) messages.push(`A proporção está certa, só a escala difere (fator ×${uniformFactor}). Provavelmente a unidade do arquivo: use "Corrigir escala".`);
  if (rotated) messages.push('As medidas batem em outra posição: o modelo parece girado. Use "Girar" ou troque o eixo "para cima".');
  if (status === 'bloqueado' && !uniformFactor && !rotated) messages.push('A proporção do arquivo não corresponde às medidas informadas. O modelo NÃO foi deformado: revise as medidas ou o arquivo.');
  return { status, checks, uniformFactor, rotated, messages };
}

export const canPublish = (m: Pick<ProductModel, 'glbUrl' | 'validation'>) => Boolean(m.glbUrl) && (m.validation === 'ok' || m.validation === 'alerta');

export const fmtCm = (mm: number) => `${(Math.round(mm) / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 })} cm`;

// ─── Caixa delimitadora de um .glb (sem three.js; roda no servidor) ──────────
type Mat = number[]; // 4x4 coluna-maior
const I: Mat = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function mul(a: Mat, b: Mat): Mat {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
}
function trs(n: any): Mat {
  if (Array.isArray(n.matrix) && n.matrix.length === 16) return n.matrix;
  const [tx, ty, tz] = n.translation ?? [0, 0, 0];
  const [x, y, z, w] = n.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = n.scale ?? [1, 1, 1];
  return [
    (1 - 2 * (y * y + z * z)) * sx, (2 * (x * y + z * w)) * sx, (2 * (x * z - y * w)) * sx, 0,
    (2 * (x * y - z * w)) * sy, (1 - 2 * (x * x + z * z)) * sy, (2 * (y * z + x * w)) * sy, 0,
    (2 * (x * z + y * w)) * sz, (2 * (y * z - x * w)) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
    tx, ty, tz, 1,
  ];
}

export type GlbInfo = { min: [number, number, number]; max: [number, number, number]; triangles: number };

export function glbInfo(buf: ArrayBuffer): GlbInfo {
  const dv = new DataView(buf);
  if (buf.byteLength < 20 || dv.getUint32(0, true) !== 0x46546c67) throw new Error('Não é um arquivo GLB válido.');
  if (dv.getUint32(4, true) !== 2) throw new Error('GLB precisa ser glTF 2.0.');
  const jsonLen = dv.getUint32(12, true);
  if (dv.getUint32(16, true) !== 0x4e4f534a) throw new Error('GLB sem bloco JSON.');
  const gltf = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen)));
  const min = [Infinity, Infinity, Infinity] as [number, number, number];
  const max = [-Infinity, -Infinity, -Infinity] as [number, number, number];
  let triangles = 0;
  const visit = (idx: number, parent: Mat) => {
    const node = gltf.nodes?.[idx];
    if (!node) return;
    const m = mul(parent, trs(node));
    const mesh = node.mesh != null ? gltf.meshes?.[node.mesh] : null;
    for (const prim of mesh?.primitives ?? []) {
      const acc = gltf.accessors?.[prim.attributes?.POSITION];
      if (!acc?.min || !acc?.max) continue;
      triangles += prim.indices != null ? (gltf.accessors[prim.indices]?.count ?? 0) / 3 : acc.count / 3;
      for (let i = 0; i < 8; i++) {
        const p = [i & 1 ? acc.max[0] : acc.min[0], i & 2 ? acc.max[1] : acc.min[1], i & 4 ? acc.max[2] : acc.min[2]];
        for (let a = 0; a < 3; a++) {
          const v = m[a] * p[0] + m[4 + a] * p[1] + m[8 + a] * p[2] + m[12 + a];
          if (v < min[a]) min[a] = v;
          if (v > max[a]) max[a] = v;
        }
      }
    }
    for (const c of node.children ?? []) visit(c, m);
  };
  const scene = gltf.scenes?.[gltf.scene ?? 0];
  for (const n of scene?.nodes ?? []) visit(n, I);
  if (!Number.isFinite(min[0])) throw new Error('O GLB não tem geometria.');
  return { min, max, triangles: Math.round(triangles) };
}

export const dimsFromGlb = (i: GlbInfo): Dims => ({
  w: (i.max[0] - i.min[0]) * 1000,
  h: (i.max[1] - i.min[1]) * 1000,
  d: (i.max[2] - i.min[2]) * 1000,
});
