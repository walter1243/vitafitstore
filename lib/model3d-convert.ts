// Conversor de modelos 3D do painel (roda no navegador; three.js carregado só aqui).
// Arquivo original (3MF do MakerWorld/Bambu, STL, OBJ ou GLB) → modelo pronto para AR:
//   1. lê o projeto inteiro (3MF: todas as peças, inclusive as que ficam em
//      3D/Objects/*.model, com as transformações e as cores dos filamentos)
//   2. unidade do arquivo → metros (padrão glTF)
//   3. eixo "para cima" Z (impressão 3D) → Y (glTF); giro opcional em volta da altura
//   4. escala UNIFORME para bater o comprimento e a altura reais informados
//      (se a proporção não bater, NÃO deforma: avisa e bloqueia a publicação)
//   5. origem no centro da base (fica apoiado na mesa/chão)
// Saída: GLB (Android/computador) e USDZ (iPhone), da MESMA cena = mesmo tamanho físico.
import type * as THREE_NS from 'three';
import type { Dims } from '@/lib/product-models-shared';
import { TOLERANCE_BLOCK } from '@/lib/product-models-shared';

export type UpAxis = 'z' | 'y';
export const ACCEPTED_3D = '.3mf,.stl,.obj,.glb';
export const extOf = (name: string) => (name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '');

type T3 = Awaited<ReturnType<typeof three>>;
async function three() {
  const THREE = await import('three');
  const [{ STLLoader }, { OBJLoader }, { GLTFLoader }, { GLTFExporter }, { USDZExporter }, { mergeVertices }, fflate] = await Promise.all([
    import('three/examples/jsm/loaders/STLLoader.js'),
    import('three/examples/jsm/loaders/OBJLoader.js'),
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/exporters/GLTFExporter.js'),
    import('three/examples/jsm/exporters/USDZExporter.js'),
    import('three/examples/jsm/utils/BufferGeometryUtils.js'),
    import('three/examples/jsm/libs/fflate.module.js'),
  ]);
  return { THREE, STLLoader, OBJLoader, GLTFLoader, GLTFExporter, USDZExporter, mergeVertices, fflate };
}

// ─── Leitor de 3MF (padrão 3MF + extensão de produção usada pelo Bambu Studio) ──
type Attrs = Record<string, string>;
const attrsOf = (s: string): Attrs => { const o: Attrs = {}; for (const m of s.matchAll(/([\w:]+)="([^"]*)"/g)) o[m[1]] = m[2]; return o; };
type Obj3mf = { id: string; pid?: string; pindex?: string; name?: string; verts?: Float32Array; tris?: Uint32Array; triProps?: (string | null)[]; components?: { objectid: string; path?: string; transform?: string }[] };
type Model3mf = { unit: string; objects: Map<string, Obj3mf>; items: { objectid: string; path?: string; transform?: string; printable?: string }[]; colors: Map<string, string[]> };

const UNIT_M: Record<string, number> = { micron: 1e-6, millimeter: 1e-3, centimeter: 1e-2, inch: 0.0254, foot: 0.3048, meter: 1 };

function parseModelXml(xml: string): Model3mf {
  const unit = /<model\b[^>]*\bunit="([^"]+)"/.exec(xml)?.[1] ?? 'millimeter';
  const colors = new Map<string, string[]>();
  for (const m of xml.matchAll(/<(?:\w+:)?basematerials\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?basematerials>/g)) {
    colors.set(attrsOf(m[1]).id, [...m[2].matchAll(/<(?:\w+:)?base\b([^>]*)\/?>/g)].map((b) => attrsOf(b[1]).displaycolor ?? '#cccccc'));
  }
  for (const m of xml.matchAll(/<(?:\w+:)?colorgroup\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?colorgroup>/g)) {
    colors.set(attrsOf(m[1]).id, [...m[2].matchAll(/<(?:\w+:)?color\b([^>]*)\/?>/g)].map((b) => attrsOf(b[1]).color ?? '#cccccc'));
  }
  const objects = new Map<string, Obj3mf>();
  for (const m of xml.matchAll(/<object\b([^>]*)>([\s\S]*?)<\/object>/g)) {
    const a = attrsOf(m[1]);
    const o: Obj3mf = { id: a.id, pid: a.pid, pindex: a.pindex, name: a.name };
    const body = m[2];
    const vBlock = /<vertices>([\s\S]*?)<\/vertices>/.exec(body)?.[1];
    if (vBlock) {
      const vs: number[] = [];
      for (const v of vBlock.matchAll(/<vertex\b([^>]*)\/>/g)) { const va = attrsOf(v[1]); vs.push(+va.x, +va.y, +va.z); }
      const ts: number[] = [];
      const props: (string | null)[] = [];
      let anyProp = false;
      const tBlock = /<triangles>([\s\S]*?)<\/triangles>/.exec(body)?.[1] ?? '';
      for (const t of tBlock.matchAll(/<triangle\b([^>]*)\/>/g)) {
        const ta = attrsOf(t[1]);
        ts.push(+ta.v1, +ta.v2, +ta.v3);
        const p = ta.pid != null || ta.p1 != null ? `${ta.pid ?? o.pid ?? ''}:${ta.p1 ?? o.pindex ?? '0'}` : null;
        if (p) anyProp = true;
        props.push(p);
      }
      o.verts = new Float32Array(vs);
      o.tris = new Uint32Array(ts);
      if (anyProp) o.triProps = props;
    }
    const comps = [...body.matchAll(/<component\b([^>]*)\/>/g)].map((c) => { const ca = attrsOf(c[1]); return { objectid: ca.objectid, path: ca['p:path'], transform: ca.transform }; });
    if (comps.length) o.components = comps;
    objects.set(o.id, o);
  }
  const build = /<build\b[^>]*>([\s\S]*?)<\/build>/.exec(xml)?.[1] ?? '';
  const items = [...build.matchAll(/<item\b([^>]*)\/>/g)].map((i) => { const ia = attrsOf(i[1]); return { objectid: ia.objectid, path: ia['p:path'], transform: ia.transform, printable: ia.printable }; });
  return { unit, objects, items, colors };
}

// matriz 3MF (linha: m00 m01 m02 m10 m11 m12 m20 m21 m22 m30 m31 m32) → Matrix4 do three
function mat3mf(T: T3, s?: string): THREE_NS.Matrix4 {
  const m = new T.THREE.Matrix4();
  if (!s) return m;
  const n = s.trim().split(/\s+/).map(Number);
  if (n.length !== 12 || n.some((x) => !Number.isFinite(x))) return m;
  return m.set(n[0], n[3], n[6], n[9], n[1], n[4], n[7], n[10], n[2], n[5], n[8], n[11], 0, 0, 0, 1);
}

// Cores do projeto Bambu: filamento de cada objeto/peça (Metadata/model_settings.config)
function bambuColors(zip: Record<string, Uint8Array>) {
  const dec = new TextDecoder();
  let filaments: string[] = [];
  const proj = zip['Metadata/project_settings.config'];
  if (proj) { try { const j = JSON.parse(dec.decode(proj)); if (Array.isArray(j.filament_colour)) filaments = j.filament_colour.map(String); } catch { /* sem cores */ } }
  const objExt = new Map<string, number>();
  const partExt = new Map<string, number>();
  const cfg = zip['Metadata/model_settings.config'];
  if (cfg) {
    const xml = dec.decode(cfg);
    for (const m of xml.matchAll(/<object\b([^>]*)>([\s\S]*?)<\/object>/g)) {
      const oid = attrsOf(m[1]).id;
      const head = m[2].split('<part')[0];
      const e = /key="extruder"\s+value="(\d+)"/.exec(head)?.[1];
      if (e) objExt.set(oid, +e);
      for (const p of m[2].matchAll(/<part\b([^>]*)>([\s\S]*?)<\/part>/g)) {
        const pe = /key="extruder"\s+value="(\d+)"/.exec(p[2])?.[1];
        if (pe) partExt.set(`${oid}/${attrsOf(p[1]).id}`, +pe);
      }
    }
  }
  const color = (ext?: number) => (ext && filaments[ext - 1]) || null;
  return { objColor: (oid: string) => color(objExt.get(oid)), partColor: (oid: string, pid: string) => color(partExt.get(`${oid}/${pid}`) ?? objExt.get(oid)) };
}

function load3mf(T: T3, buf: ArrayBuffer, fallbackColor: string): { root: THREE_NS.Group; unitToM: number; hasOwnColors: boolean } {
  const { THREE } = T;
  let zip: Record<string, Uint8Array>;
  try { zip = T.fflate.unzipSync(new Uint8Array(buf)); } catch { throw new Error('Não foi possível abrir o 3MF (arquivo corrompido ou não é 3MF).'); }
  const dec = new TextDecoder();
  const rels = zip['_rels/.rels'] ? dec.decode(zip['_rels/.rels']) : '';
  const mainPath = (/Target="\/?([^"]+\.model)"/i.exec(rels)?.[1]) ?? Object.keys(zip).find((k) => /^3D\/[^/]+\.model$/i.test(k));
  if (!mainPath || !zip[mainPath]) throw new Error('3MF sem modelo principal.');
  const models = new Map<string, Model3mf>();
  const model = (path: string) => {
    const key = path.replace(/^\//, '');
    if (!models.has(key)) { const data = zip[key]; if (!data) throw new Error(`3MF incompleto: falta ${key}.`); models.set(key, parseModelXml(dec.decode(data))); }
    return models.get(key)!;
  };
  const main = model(mainPath);
  const unitToM = UNIT_M[main.unit] ?? 1e-3;
  const bambu = bambuColors(zip);
  const root = new THREE.Group();
  let hasOwnColors = false;
  const matCache = new Map<string, THREE_NS.MeshStandardMaterial>();
  const mat = (hex: string) => {
    const c = hex.slice(0, 7);
    if (!matCache.has(c)) matCache.set(c, new THREE.MeshStandardMaterial({ color: new THREE.Color(c), roughness: 0.55, metalness: 0 }));
    return matCache.get(c)!;
  };
  const colorOf = (m: Model3mf, prop?: string | null) => {
    if (!prop) return null;
    const [pid, idx] = prop.split(':');
    return m.colors.get(pid)?.[+idx] ?? null;
  };

  const emit = (m: Model3mf, o: Obj3mf, world: THREE_NS.Matrix4, baseColor: string | null) => {
    if (!o.verts || !o.tris || !o.tris.length) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(o.verts.slice(), 3));
    const objColor = colorOf(m, o.pid ? `${o.pid}:${o.pindex ?? '0'}` : null) ?? baseColor;
    if (o.triProps) {
      // agrupa os triângulos por cor (um material por cor)
      const groups = new Map<string, number[]>();
      o.tris.forEach((_, i) => {
        if (i % 3) return;
        const c = colorOf(m, o.triProps![i / 3]) ?? objColor ?? fallbackColor;
        if (!groups.has(c)) groups.set(c, []);
        groups.get(c)!.push(o.tris![i], o.tris![i + 1], o.tris![i + 2]);
      });
      const idx: number[] = [];
      const mats: THREE_NS.Material[] = [];
      for (const [c, list] of groups) { geo.addGroup(idx.length, list.length, mats.length); for (const v of list) idx.push(v); mats.push(mat(c)); }
      geo.setIndex(idx);
      geo.applyMatrix4(world);
      root.add(new THREE.Mesh(geo, mats));
      hasOwnColors = true;
    } else {
      geo.setIndex(Array.from(o.tris));
      geo.applyMatrix4(world);
      if (objColor) hasOwnColors = true;
      root.add(new THREE.Mesh(geo, mat(objColor ?? fallbackColor)));
    }
  };

  const walk = (path: string, id: string, world: THREE_NS.Matrix4, color: string | null, topId: string, depth: number) => {
    if (depth > 16) return;
    const m = model(path);
    const o = m.objects.get(id);
    if (!o) return;
    emit(m, o, world, color);
    for (const c of o.components ?? []) {
      const cPath = c.path ? c.path.replace(/^\//, '') : path;
      const w = world.clone().multiply(mat3mf(T, c.transform));
      walk(cPath, c.objectid, w, bambu.partColor(topId, c.objectid) ?? color, topId, depth + 1);
    }
  };
  for (const it of main.items) {
    if (it.printable === '0') continue;
    const path = it.path ? it.path.replace(/^\//, '') : mainPath;
    walk(path, it.objectid, mat3mf(T, it.transform), bambu.objColor(it.objectid), it.objectid, 0);
  }
  if (!root.children.length) throw new Error('O 3MF não tem peças imprimíveis.');
  return { root, unitToM, hasOwnColors };
}

// ─── Leitura do arquivo (uma vez) ────────────────────────────────────────────
export type LoadedModel = { T: T3; root: THREE_NS.Object3D; unitToM: number; hasOwnColors: boolean; up: UpAxis; parts: number; name: string };

export async function loadModelFile(file: File, color: string): Promise<LoadedModel> {
  if (file.size > 60 * 1024 * 1024) throw new Error('Arquivo acima de 60 MB.');
  const T = await three();
  const { THREE } = T;
  const ext = extOf(file.name);
  const buf = await file.arrayBuffer();
  const paint = () => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0 });
  let root: THREE_NS.Object3D;
  let unitToM = 1e-3;
  let hasOwnColors = false;
  let up: UpAxis = 'z';
  if (ext === '3mf') ({ root, unitToM, hasOwnColors } = load3mf(T, buf, color));
  else if (ext === 'stl') {
    const geo = new T.STLLoader().parse(buf);
    const colored = Boolean((geo as any).hasColors && geo.getAttribute('color'));
    root = new THREE.Mesh(geo, colored ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }) : paint());
    hasOwnColors = colored;
  } else if (ext === 'obj') {
    root = new T.OBJLoader().parse(new TextDecoder().decode(buf));
    root.traverse((o: any) => { if (o.isMesh) o.material = paint(); });
    up = 'y';
  } else if (ext === 'glb') {
    root = (await new T.GLTFLoader().parseAsync(buf, '')).scene;
    unitToM = 1; hasOwnColors = true; up = 'y';
  } else throw new Error('Formato não suportado. Use 3MF, STL, OBJ ou GLB.');
  root.updateMatrixWorld(true);
  let parts = 0;
  root.traverse((o: any) => { if (o.isMesh) parts++; });
  if (!parts) throw new Error('O arquivo não tem geometria.');
  return { T, root, unitToM, hasOwnColors, up, parts, name: file.name };
}

// Vários arquivos (ex.: o MakerWorld baixa um STL por peça): une tudo num modelo
// só, mantendo a posição de cada peça como veio do arquivo. Se as peças vierem
// todas "no mesmo lugar" (cada uma centrada sozinha), avisa: o arquivo não diz
// como montar — use o projeto já montado (3MF/STL do conjunto).
export type LoadedMany = LoadedModel & { files: number; overlap: boolean };

export async function loadModelFiles(files: File[], color: string): Promise<LoadedMany> {
  if (!files.length) throw new Error('Escolha ao menos um arquivo.');
  const list: LoadedModel[] = [];
  for (const f of files) list.push(await loadModelFile(f, color));
  if (list.length === 1) return { ...list[0], files: 1, overlap: false };
  const { T } = list[0];
  const { THREE } = T;
  const up = list[0].up;
  const root = new THREE.Group();
  const boxes: THREE_NS.Box3[] = [];
  for (const L of list) {
    const wrap = new THREE.Group();
    wrap.scale.setScalar(L.unitToM); // tudo em metros
    if (L.up !== up) wrap.rotation.x = up === 'z' ? Math.PI / 2 : -Math.PI / 2; // mesmo eixo "para cima"
    wrap.add(L.root);
    root.add(wrap);
    wrap.updateMatrixWorld(true);
    boxes.push(new THREE.Box3().setFromObject(wrap));
  }
  root.updateMatrixWorld(true);
  // peças empilhadas: quase todas as caixas se cruzam bastante entre si
  let crossing = 0, pairs = 0;
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    pairs++;
    const inter = boxes[i].clone().intersect(boxes[j]);
    if (inter.isEmpty()) continue;
    const v = (b: THREE_NS.Box3) => { const s = b.getSize(new THREE.Vector3()); return Math.max(1e-12, s.x * s.y * s.z); };
    if (v(inter) / Math.min(v(boxes[i]), v(boxes[j])) > 0.6) crossing++;
  }
  return {
    T, root, unitToM: 1, up,
    hasOwnColors: list.some((l) => l.hasOwnColors),
    parts: list.reduce((n, l) => n + l.parts, 0),
    name: `${files.length} arquivos`,
    files: files.length,
    overlap: pairs > 0 && crossing / pairs > 0.5,
  };
}

// ─── Montagem para AR com as medidas reais ───────────────────────────────────
export type BuildResult = {
  glb: ArrayBuffer;
  usdz: Uint8Array | null;
  usdzError: string;
  native: Dims; // medida do arquivo como veio (mm), já na posição escolhida
  measured: Dims; // medida final do modelo exportado (mm)
  scale: number; // escala uniforme aplicada
  proportionDiffPct: number; // diferença de proporção comprimento/altura (0 = idêntica)
  triangles: number;
  previewUrl: string;
};

export async function buildForAr(L: LoadedModel, opts: { up: UpAxis; rotY: number; real: { w: number; h: number } | null }): Promise<BuildResult> {
  const { T } = L;
  const { THREE } = T;
  const base = new THREE.Matrix4().makeScale(L.unitToM, L.unitToM, L.unitToM);
  const orient = new THREE.Matrix4().makeRotationY((opts.rotY * Math.PI) / 180);
  if (opts.up === 'z') orient.multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

  const out = new THREE.Group();
  out.name = 'produto';
  let triangles = 0;
  L.root.traverse((o: any) => {
    if (!o.isMesh || !o.geometry) return;
    let g: THREE_NS.BufferGeometry = o.geometry.clone();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(orient, base).multiply(o.matrixWorld));
    if (!g.index) { g.deleteAttribute('normal'); g = T.mergeVertices(g, 1e-7); }
    g.deleteAttribute('normal');
    g.computeVertexNormals();
    const toStd = (m: any) => (m?.isMeshStandardMaterial ? m : new THREE.MeshStandardMaterial({ color: m?.color ?? 0xcccccc, map: m?.map ?? null, vertexColors: Boolean(g.getAttribute('color')), roughness: 0.55, metalness: 0 }));
    const mesh = new THREE.Mesh(g, Array.isArray(o.material) ? o.material.map(toStd) : toStd(o.material));
    out.add(mesh);
    triangles += (g.index ? g.index.count : g.getAttribute('position').count) / 3;
  });

  const size0 = new THREE.Box3().setFromObject(out).getSize(new THREE.Vector3());
  const native: Dims = { w: size0.x * 1000, h: size0.y * 1000, d: size0.z * 1000 };
  if (!(native.w > 0 && native.h > 0 && native.d > 0)) throw new Error('O modelo ficou sem volume (medida zero). Confira o arquivo.');

  // Escala uniforme a partir do comprimento e da altura reais. Proporção diferente = não deforma.
  let scale = 1;
  let proportionDiffPct = 0;
  if (opts.real) {
    const fw = opts.real.w / native.w, fh = opts.real.h / native.h;
    proportionDiffPct = Math.round((Math.abs(fw / fh - 1) * 100) * 10) / 10;
    if (proportionDiffPct <= TOLERANCE_BLOCK) scale = (fw + fh) / 2;
  }
  const box = new THREE.Box3().setFromObject(out);
  const c = box.getCenter(new THREE.Vector3());
  const finalM = new THREE.Matrix4().makeScale(scale, scale, scale).multiply(new THREE.Matrix4().makeTranslation(-c.x, -box.min.y, -c.z));
  out.children.forEach((m: any) => m.geometry.applyMatrix4(finalM));
  out.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(out).getSize(new THREE.Vector3());
  const measured: Dims = { w: size.x * 1000, h: size.y * 1000, d: size.z * 1000 };

  const glb = (await new T.GLTFExporter().parseAsync(out, { binary: true })) as ArrayBuffer;
  let usdz: Uint8Array | null = null;
  let usdzError = '';
  try { usdz = await new T.USDZExporter().parse(out); } catch (e: any) { usdzError = e?.message || 'Falha ao gerar o USDZ.'; }
  const previewUrl = URL.createObjectURL(new Blob([glb], { type: 'model/gltf-binary' }));
  return { glb, usdz, usdzError, native, measured, scale, proportionDiffPct, triangles: Math.round(triangles), previewUrl };
}
