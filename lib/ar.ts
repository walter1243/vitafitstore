// Realidade aumentada (“Ver en tu espacio”): o cliente aponta a câmera e vê o
// produto em tamanho real na mesa/chão ou na parede. No painel (Produtos →
// Realidade aumentada) a foto ganha o fundo removido e o tamanho em cm; na
// página do produto, o modelo 3D é montado na hora a partir dessa foto (um
// “cartão” plano com a imagem recortada) e aberto no <model-viewer> do Google
// (Android: WebXR/Scene Viewer · iPhone: Quick Look). Sem arquivo 3D manual.

export type ArPlacement = 'floor' | 'wall';

export type ArConfig = {
  enabled: boolean;
  image: string; // PNG com fundo transparente
  widthCm: number;
  heightCm: number;
  placement: ArPlacement; // 'floor' = mesa/chão (luminárias, figuras) · 'wall' = parede (quadros)
};

export const AR_DEFAULT: ArConfig = { enabled: false, image: '', widthCm: 20, heightCm: 30, placement: 'floor' };

const cm = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(500, Math.max(1, Math.round(n * 10) / 10)) : fallback;
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
    placement: o.placement === 'wall' ? 'wall' : 'floor',
  };
}

export const arReady = (a?: ArConfig | null) => Boolean(a?.enabled && a.image);

// Monta um .glb (glTF binário) com um retângulo do tamanho real do produto e a
// foto recortada como textura (sem luz: a foto aparece com as cores reais).
// Origem embaixo no centro: fica em pé na mesa/chão; na parede fica encostado.
export function buildArGlb(png: ArrayBuffer, widthM: number, heightM: number): ArrayBuffer {
  const w = widthM / 2;
  const h = heightM;
  const pos = new Float32Array([-w, 0, 0, w, 0, 0, w, h, 0, -w, h, 0]);
  const nor = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
  const uv = new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]);
  const idx = new Uint16Array([0, 1, 2, 0, 2, 3]);
  const pad4 = (n: number) => (n + 3) & ~3;

  const offImg = pad4(48 + 48 + 32 + 12);
  const binLen = pad4(offImg + png.byteLength);
  const bin = new Uint8Array(binLen);
  bin.set(new Uint8Array(pos.buffer), 0);
  bin.set(new Uint8Array(nor.buffer), 48);
  bin.set(new Uint8Array(uv.buffer), 96);
  bin.set(new Uint8Array(idx.buffer), 128);
  bin.set(new Uint8Array(png), offImg);

  const gltf = {
    asset: { version: '2.0', generator: 'kitoys-ar' },
    extensionsUsed: ['KHR_materials_unlit'],
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material: 0 }] }],
    materials: [{
      pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 1 },
      alphaMode: 'BLEND',
      doubleSided: true,
      extensions: { KHR_materials_unlit: {} },
    }],
    textures: [{ source: 0, sampler: 0 }],
    samplers: [{ magFilter: 9729, minFilter: 9729, wrapS: 33071, wrapT: 33071 }],
    images: [{ bufferView: 4, mimeType: 'image/png' }],
    buffers: [{ byteLength: binLen }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 48, target: 34962 },
      { buffer: 0, byteOffset: 48, byteLength: 48, target: 34962 },
      { buffer: 0, byteOffset: 96, byteLength: 32, target: 34962 },
      { buffer: 0, byteOffset: 128, byteLength: 12, target: 34963 },
      { buffer: 0, byteOffset: offImg, byteLength: png.byteLength },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 4, type: 'VEC3', min: [-w, 0, 0], max: [w, h, 0] },
      { bufferView: 1, componentType: 5126, count: 4, type: 'VEC3' },
      { bufferView: 2, componentType: 5126, count: 4, type: 'VEC2' },
      { bufferView: 3, componentType: 5123, count: 6, type: 'SCALAR' },
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
