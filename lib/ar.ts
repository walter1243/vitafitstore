// Realidade aumentada (“Ver en tu espacio”): o cliente aponta a câmera e vê o
// produto em tamanho real na mesa/chão ou na parede. No painel (Produtos →
// Realidade aumentada) a foto ganha o fundo removido e o tamanho em cm; na
// página do produto, o modelo 3D é montado na hora a partir dessa foto e aberto
// no <model-viewer> do Google (Android: WebXR/Scene Viewer · iPhone: Quick Look).
// O modelo tem volume: a silhueta recortada é "extrudada" em várias camadas
// (frente e verso com a foto, as camadas do meio um pouco mais escuras = laterais).

export type ArPlacement = 'floor' | 'wall';

export type ArConfig = {
  enabled: boolean;
  image: string; // PNG com fundo transparente
  widthCm: number;
  heightCm: number;
  depthCm: number; // espessura do volume; 0 = automática
  placement: ArPlacement; // 'floor' = mesa/chão (luminárias, figuras) · 'wall' = parede (quadros)
};

export const AR_DEFAULT: ArConfig = { enabled: false, image: '', widthCm: 20, heightCm: 30, depthCm: 0, placement: 'floor' };

const cm = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(500, Math.max(0.2, Math.round(n * 10) / 10)) : fallback;
};

export function parseAr(v: unknown): ArConfig {
  let o: any = v;
  if (typeof v === 'string') { try { o = JSON.parse(v); } catch { o = null; } }
  if (!o || typeof o !== 'object') return { ...AR_DEFAULT };
  return {
    enabled: Boolean(o.enabled),
    image: String(o.image ?? '').trim(),
    widthCm: cm(o.widthCm, AR_DEFAULT.widthCm),
    heightCm: cm(o.heightCm, AR_DEFAULT.heightCm),
    depthCm: cm(o.depthCm, 0),
    placement: o.placement === 'wall' ? 'wall' : 'floor',
  };
}

export const arReady = (a?: ArConfig | null) => Boolean(a?.enabled && a.image);

// Espessura usada no modelo (cm): a escolhida ou ~12% do menor lado (0,5–4 cm).
export function arDepthCm(a: Pick<ArConfig, 'widthCm' | 'heightCm' | 'depthCm'>): number {
  if (a.depthCm > 0) return a.depthCm;
  return Math.min(4, Math.max(0.5, Math.round(Math.min(a.widthCm, a.heightCm) * 1.2) / 10));
}

// Monta um .glb (glTF binário) com o produto em tamanho real (metros).
// Origem embaixo no centro: fica em pé na mesa/chão; na parede o verso encosta nela.
export function buildArGlb(png: ArrayBuffer, widthM: number, heightM: number, depthM = 0, placement: ArPlacement = 'floor'): ArrayBuffer {
  const w = widthM / 2;
  const h = heightM;
  const d = Math.max(0, depthM);
  const layers = 18; // frente + verso + 16 camadas internas (as laterais do volume)
  const z0 = placement === 'wall' ? 0 : -d / 2;
  const zAt = (i: number) => z0 + (d * i) / (layers - 1);

  const nV = layers * 4;
  const pos = new Float32Array(nV * 3);
  const nor = new Float32Array(nV * 3);
  const uv = new Float32Array(nV * 2);
  for (let i = 0; i < layers; i++) {
    const z = zAt(i);
    pos.set([-w, 0, z, w, 0, z, w, h, z, -w, h, z], i * 12);
    nor.set([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], i * 12);
    uv.set([0, 1, 1, 1, 1, 0, 0, 0], i * 8);
  }
  const quad = (i: number) => { const b = i * 4; return [b, b + 1, b + 2, b, b + 2, b + 3]; };
  const outerLayers = [0, layers - 1];
  const innerLayers = Array.from({ length: layers - 2 }, (_, k) => k + 1);
  const idxOuter = new Uint16Array(outerLayers.flatMap(quad));
  const idxInner = new Uint16Array(innerLayers.flatMap(quad));
  const pad4 = (n: number) => (n + 3) & ~3;

  const views: Uint8Array[] = [
    new Uint8Array(pos.buffer), new Uint8Array(nor.buffer), new Uint8Array(uv.buffer),
    new Uint8Array(idxOuter.buffer), new Uint8Array(idxInner.buffer), new Uint8Array(png),
  ];
  const offsets: number[] = [];
  let off = 0;
  for (const v of views) { offsets.push(off); off = pad4(off + v.byteLength); }
  const binLen = off;
  const bin = new Uint8Array(binLen);
  views.forEach((v, i) => bin.set(v, offsets[i]));

  const zMin = zAt(0), zMax = zAt(layers - 1);
  const primitives = [
    { attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material: 0 },
    { attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 4, material: 1 },
  ];
  const mat = (shade: number) => ({
    pbrMetallicRoughness: { baseColorTexture: { index: 0 }, baseColorFactor: [shade, shade, shade, 1], metallicFactor: 0, roughnessFactor: 1 },
    alphaMode: 'MASK',
    alphaCutoff: 0.5,
    doubleSided: true,
    extensions: { KHR_materials_unlit: {} },
  });

  const gltf = {
    asset: { version: '2.0', generator: 'kitoys-ar' },
    extensionsUsed: ['KHR_materials_unlit'],
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives }],
    materials: [mat(1), mat(0.62)],
    textures: [{ source: 0, sampler: 0 }],
    samplers: [{ magFilter: 9729, minFilter: 9729, wrapS: 33071, wrapT: 33071 }],
    images: [{ bufferView: 5, mimeType: 'image/png' }],
    buffers: [{ byteLength: binLen }],
    bufferViews: [
      { buffer: 0, byteOffset: offsets[0], byteLength: pos.byteLength, target: 34962 },
      { buffer: 0, byteOffset: offsets[1], byteLength: nor.byteLength, target: 34962 },
      { buffer: 0, byteOffset: offsets[2], byteLength: uv.byteLength, target: 34962 },
      { buffer: 0, byteOffset: offsets[3], byteLength: idxOuter.byteLength, target: 34963 },
      { buffer: 0, byteOffset: offsets[4], byteLength: idxInner.byteLength, target: 34963 },
      { buffer: 0, byteOffset: offsets[5], byteLength: png.byteLength },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: nV, type: 'VEC3', min: [-w, 0, zMin], max: [w, h, zMax] },
      { bufferView: 1, componentType: 5126, count: nV, type: 'VEC3' },
      { bufferView: 2, componentType: 5126, count: nV, type: 'VEC2' },
      { bufferView: 3, componentType: 5123, count: idxOuter.length, type: 'SCALAR' },
      { bufferView: 4, componentType: 5123, count: idxInner.length, type: 'SCALAR' },
    ],
  };
  const jsonRaw = new TextEncoder().encode(JSON.stringify(gltf));
  const jsonLen = pad4(jsonRaw.length);
  const total = 12 + 8 + jsonLen + 8 + binLen;
  const out = new ArrayBuffer(total);
  const dv = new DataView(out);
  const u8 = new Uint8Array(out);
  dv.setUint32(0, 0x46546c67, true); // 'glTF'
  dv.setUint32(4, 2, true);
  dv.setUint32(8, total, true);
  dv.setUint32(12, jsonLen, true);
  dv.setUint32(16, 0x4e4f534a, true); // 'JSON'
  u8.fill(0x20, 20, 20 + jsonLen);
  u8.set(jsonRaw, 20);
  const binStart = 20 + jsonLen;
  dv.setUint32(binStart, binLen, true);
  dv.setUint32(binStart + 4, 0x004e4942, true); // 'BIN\0'
  u8.set(bin, binStart + 8);
  return out;
}

// Baixa a foto (data:, blob:, mesmo domínio ou outro domínio) como bitmap.
// Outro domínio: tenta direto (Vercel Blob libera CORS) e, se falhar, pelo
// /_next/image do próprio site (qualidade 75: a única liberada por padrão no Next 16).
export async function loadArBitmap(src: string): Promise<ImageBitmap> {
  const remote = /^https?:\/\//i.test(src);
  const tries = remote ? [src, `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`] : [src];
  let last: unknown = null;
  for (const url of tries) {
    try {
      const res = await fetch(url, remote && url === src ? { mode: 'cors' } : undefined);
      if (!res.ok) { last = new Error(`HTTP ${res.status}`); continue; }
      return await createImageBitmap(await res.blob());
    } catch (e) { last = e; }
  }
  throw last ?? new Error('img');
}
