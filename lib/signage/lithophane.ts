/* eslint-disable */
// Litofania: foto -> placa com espessura variável (escuro = grosso, claro = fino) para imprimir em branco
// e iluminar por trás. A placa sai em uma peça só, em pé (melhor qualidade), plana ou curva,
// com moldura e uma base com encaixe, janela de luz para o LED e furo do cabo.

import type { Mesh, Ring } from './engine';
import { nestRings, sdField, triangulatePoly } from './engine';

export type LithoShape = 'rect' | 'square' | 'rounded' | 'circle' | 'oval' | 'heart';

export interface LithoOptions {
  widthMm: number;        // largura da placa (planificada, se curva)
  heightMm: number;       // altura da placa
  shape: LithoShape;
  radius: number;         // raio dos cantos (formato arredondado)
  minT: number;           // espessura mínima (partes claras)
  maxT: number;           // espessura máxima (partes escuras)
  res: number;            // resolução da malha (mm por ponto)
  frame: number;          // largura da moldura (mm)
  frameT: number;         // espessura da moldura (mm)
  bottomFrame: number;    // altura da moldura de baixo (parte que entra na base)
  curve: number;          // curvatura em graus (0 = plana)
  gamma: number;          // contraste (1 = linear)
  brightness: number;     // -0.5..0.5
  invert: boolean;        // negativo
  textureBack: boolean;   // relevo virado para trás (frente lisa)
  mirror: boolean;        // espelhar a foto
}

export const DEFAULT_LITHO: LithoOptions = {
  widthMm: 120, heightMm: 150, shape: 'rect', radius: 8, minT: 0.8, maxT: 3.2, res: 0.3,
  frame: 3, frameT: 4, bottomFrame: 14, curve: 60, gamma: 1, brightness: 0, invert: false, textureBack: true, mirror: false,
};

export interface BaseOptions { enabled: boolean; margin: number; height: number; wall: number; clearance: number; cableD: number; window: number }
export const DEFAULT_BASE: BaseOptions = { enabled: true, margin: 8, height: 14, wall: 2, clearance: 0.35, cableD: 7, window: 14 };

/** Foto em tons de cinza (0 = preto, 1 = branco). */
export interface Gray { data: Float32Array; w: number; h: number }

export function toGray(rgba: ArrayLike<number>, w: number, h: number): Gray {
  const data = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const a = rgba[i * 4 + 3] / 255;
    const l = (0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2]) / 255;
    data[i] = l * a + (1 - a);
  }
  return { data, w, h };
}

/** Amostra bilinear com recorte "cobrir" (a foto preenche a placa sem distorcer). u, v em 0..1 (v = 0 embaixo). */
function sampler(g: Gray, W: number, H: number, mirror: boolean) {
  const ar = W / Math.max(1e-6, H), ai = g.w / g.h;
  let sw = g.w, sh = g.h;
  if (ai > ar) sw = g.h * ar; else sh = g.w / ar;
  const ox = (g.w - sw) / 2, oy = (g.h - sh) / 2;
  return (u: number, v: number) => {
    if (mirror) u = 1 - u;
    const x = ox + u * sw - 0.5, y = oy + (1 - v) * sh - 0.5;
    const x0 = Math.max(0, Math.min(g.w - 1, Math.floor(x))), y0 = Math.max(0, Math.min(g.h - 1, Math.floor(y)));
    const x1 = Math.min(g.w - 1, x0 + 1), y1 = Math.min(g.h - 1, y0 + 1);
    const fx = Math.max(0, Math.min(1, x - x0)), fy = Math.max(0, Math.min(1, y - y0));
    const d = g.data;
    return (d[y0 * g.w + x0] * (1 - fx) + d[y0 * g.w + x1] * fx) * (1 - fy) + (d[y1 * g.w + x0] * (1 - fx) + d[y1 * g.w + x1] * fx) * fy;
  };
}

export function lithoSize(o: LithoOptions): [number, number] {
  return o.shape === 'square' || o.shape === 'circle' ? [o.widthMm, o.widthMm] : [o.widthMm, o.heightMm];
}

/** O ponto (u, v em mm, origem embaixo à esquerda) está dentro do formato? */
function insideShape(o: LithoOptions, u: number, v: number): boolean {
  const [W, H] = lithoSize(o);
  if (u < 0 || v < 0 || u > W || v > H) return false;
  switch (o.shape) {
    case 'rect': case 'square': return true;
    case 'rounded': {
      const r = Math.min(o.radius, W / 2, H / 2);
      const cx = Math.max(r, Math.min(W - r, u)), cy = Math.max(r, Math.min(H - r, v));
      return (u - cx) ** 2 + (v - cy) ** 2 <= r * r + 1e-9;
    }
    case 'circle': case 'oval': {
      const a = W / 2, b = H / 2;
      return ((u - a) / a) ** 2 + ((v - b) / b) ** 2 <= 1;
    }
    case 'heart': {
      // coração clássico, encaixado no retângulo
      const x = ((u - W / 2) / (W / 2)) * 1.15, y = ((v - H * 0.45) / (H / 2)) * 1.25;
      const q = x * x + y * y - 1;
      return q * q * q - x * x * y * y * y <= 0;
    }
  }
}

export interface LithoGrid { nx: number; ny: number; t: Float32Array; inside: Uint8Array; W: number; H: number; T0: number }

/** Espessura (mm) em cada ponto da grade. */
export function lithoGrid(g: Gray, o: LithoOptions, res = o.res): LithoGrid {
  const [W, H] = lithoSize(o);
  const nx = Math.max(2, Math.round(W / res)), ny = Math.max(2, Math.round(H / res));
  const dx = W / nx, dy = H / ny;
  const vw = nx + 1, vh = ny + 1;
  const inside = new Uint8Array(vw * vh);
  for (let j = 0; j < vh; j++) for (let i = 0; i < vw; i++) inside[j * vw + i] = insideShape(o, i * dx, j * dy) ? 1 : 0;
  // distância até a borda do formato (para a moldura); grade com Y para baixo não importa aqui
  const sd = sdField(inside, vw, vh);
  // a foto ocupa só a área dentro da moldura (a moldura de baixo entra na base)
  const ix0 = o.frame, ix1 = W - o.frame, iy0 = Math.max(o.frame, o.bottomFrame), iy1 = H - o.frame;
  const samp = sampler(g, Math.max(1, ix1 - ix0), Math.max(1, iy1 - iy0), o.mirror);
  const t = new Float32Array(vw * vh);
  const T0 = Math.max(o.frameT, o.maxT);
  const step = Math.min(dx, dy);
  for (let j = 0; j < vh; j++) for (let i = 0; i < vw; i++) {
    const k = j * vw + i;
    if (!inside[k]) continue;
    const v = j * dy;
    if (sd[k] * step < o.frame || (o.bottomFrame > 0 && v < o.bottomFrame)) { t[k] = o.frameT; continue; }
    let l = samp(Math.max(0, Math.min(1, (i * dx - ix0) / Math.max(1, ix1 - ix0))), Math.max(0, Math.min(1, (v - iy0) / Math.max(1, iy1 - iy0)))) + o.brightness;
    l = Math.max(0, Math.min(1, l));
    if (o.invert) l = 1 - l;
    l = Math.pow(l, o.gamma);
    t[k] = o.minT + (1 - l) * (o.maxT - o.minT);
  }
  return { nx, ny, t, inside, W, H, T0 };
}

/** Mapeia (u ao longo da largura, d = distância para a frente, v = altura) para o mundo. Frente = -Y. */
function makeMap(o: LithoOptions, W: number) {
  const phi = (Math.max(0, Math.min(180, o.curve)) * Math.PI) / 180;
  if (phi < 0.01) return (u: number, d: number, v: number): [number, number, number] => [u - W / 2, -d, v];
  const R = W / phi;
  return (u: number, d: number, v: number): [number, number, number] => {
    const th = (u - W / 2) / R, r = R + d;
    return [r * Math.sin(th), R - r * Math.cos(th), v];
  };
}

function signedVolume(m: Mesh): number {
  let vol = 0;
  const p = m.pos, ix = m.idx;
  for (let i = 0; i < ix.length; i += 3) {
    const a = ix[i] * 3, b = ix[i + 1] * 3, c = ix[i + 2] * 3;
    vol += (p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) - p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c]) + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c])) / 6;
  }
  return vol;
}
function fixWinding(m: Mesh): Mesh {
  if (signedVolume(m) < 0) for (let i = 0; i < m.idx.length; i += 3) { const t = m.idx[i + 1]; m.idx[i + 1] = m.idx[i + 2]; m.idx[i + 2] = t; }
  return m;
}

/** Malha fechada da placa (grade: relevo de um lado, liso do outro, paredes na borda do formato). */
export function buildLithophane(g: Gray, o: LithoOptions, res = o.res, zOffset = 0): Mesh {
  const G = lithoGrid(g, o, res);
  const { nx, ny, t, inside, W, H, T0 } = G;
  const vw = nx + 1;
  const dx = W / nx, dy = H / ny;
  const map = makeMap(o, W);
  const pos: number[] = [], idx: number[] = [];
  const top = new Int32Array(vw * (ny + 1)).fill(-1), bot = new Int32Array(vw * (ny + 1)).fill(-1);
  // relevo no lado de trás: a frente (d máximo) fica lisa
  const dTop = (k: number) => (o.textureBack ? T0 - t[k] : t[k]);
  const dBot = () => (o.textureBack ? T0 : 0);
  const vt = (i: number, j: number) => {
    const k = j * vw + i;
    if (top[k] < 0) { const [x, y, z] = map(i * dx, dTop(k), j * dy + zOffset); top[k] = pos.length / 3; pos.push(x, y, z); }
    return top[k];
  };
  const vb = (i: number, j: number) => {
    const k = j * vw + i;
    if (bot[k] < 0) { const [x, y, z] = map(i * dx, dBot(), j * dy + zOffset); bot[k] = pos.length / 3; pos.push(x, y, z); }
    return bot[k];
  };
  const cellIn = (i: number, j: number) =>
    i >= 0 && j >= 0 && i < nx && j < ny && inside[j * vw + i] && inside[j * vw + i + 1] && inside[(j + 1) * vw + i] && inside[(j + 1) * vw + i + 1];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (!cellIn(i, j)) continue;
    const c: [number, number][] = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
    const T = c.map(([a, b]) => vt(a, b)), B = c.map(([a, b]) => vb(a, b));
    idx.push(T[0], T[1], T[2], T[0], T[2], T[3]);
    idx.push(B[0], B[2], B[1], B[0], B[3], B[2]);
    const nb: [number, number][] = [[i, j - 1], [i + 1, j], [i, j + 1], [i - 1, j]];
    for (let e = 0; e < 4; e++) {
      if (cellIn(nb[e][0], nb[e][1])) continue;
      const p = e, q = (e + 1) % 4;
      idx.push(B[p], B[q], T[q], B[p], T[q], T[p]);
    }
  }
  return fixWinding({ pos, idx });
}

/** Anel do encaixe/janela na base: faixa entre d0 e d1 (mm, distância para a frente) ao longo de u0..u1. */
function arcBand(o: LithoOptions, W: number, u0: number, u1: number, d0: number, d1: number): Ring {
  const map = makeMap(o, W);
  const n = Math.max(2, Math.ceil((u1 - u0) / 2));
  const r: Ring = [];
  for (let k = 0; k <= n; k++) { const u = u0 + ((u1 - u0) * k) / n; const [x, y] = map(u, d0, 0); r.push([x, y]); }
  for (let k = n; k >= 0; k--) { const u = u0 + ((u1 - u0) * k) / n; const [x, y] = map(u, d1, 0); r.push([x, y]); }
  return r;
}

function rrectRing(x: number, y: number, w: number, h: number, rad: number): Ring {
  const r = Math.max(0, Math.min(rad, w / 2, h / 2));
  const out: Ring = [];
  const seg = 8;
  const corner = (cx: number, cy: number, a0: number) => { for (let i = 0; i <= seg; i++) { const t = a0 + (Math.PI / 2) * (i / seg); out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } };
  if (r < 0.01) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  corner(x + w - r, y + r, -Math.PI / 2); corner(x + w - r, y + h - r, 0); corner(x + r, y + h - r, Math.PI / 2); corner(x + r, y + r, Math.PI);
  return out;
}

function circleRing(cx: number, cy: number, d: number): Ring {
  const n = 32, r: Ring = [];
  for (let i = 0; i < n; i++) { const t = (2 * Math.PI * i) / n; r.push([cx + (d / 2) * Math.cos(t), cy + (d / 2) * Math.sin(t)]); }
  return r;
}

// prisma simples a partir de polígonos (triangulação do motor)
function prismMesh(rings: Ring[], z0: number, z1: number): Mesh {
  const polys = nestRings(rings, 0.01);
  const pos: number[] = [], idx: number[] = [];
  const add = (x: number, y: number, z: number) => { pos.push(x, y, z); return pos.length / 3 - 1; };
  for (const poly of polys) {
    const { verts, tris } = triangulatePoly(poly);
    const b = verts.map(([x, y]) => add(x, y, z0)), t = verts.map(([x, y]) => add(x, y, z1));
    for (let i = 0; i < tris.length; i += 3) { idx.push(t[tris[i]], t[tris[i + 1]], t[tris[i + 2]]); idx.push(b[tris[i]], b[tris[i + 2]], b[tris[i + 1]]); }
    let off = 0;
    for (const r of [poly.outer, ...poly.holes]) {
      for (let i = 0; i < r.length; i++) {
        const a = off + i, c = off + ((i + 1) % r.length);
        idx.push(b[a], b[c], t[c], b[a], t[c], t[a]);
      }
      off += r.length;
    }
  }
  return { pos, idx };
}

function merge(ms: Mesh[]): Mesh {
  const pos: number[] = [], idx: number[] = [];
  for (const m of ms) { const off = pos.length / 3; for (const v of m.pos) pos.push(v); for (const i of m.idx) idx.push(i + off); }
  return { pos, idx };
}

/** Base: caixa oca com encaixe da placa, janela de luz atrás da placa (LED embaixo) e furo do cabo atrás. */
export function buildLithoBase(o: LithoOptions, b: BaseOptions): { mesh: Mesh; floor: number } {
  const [W] = lithoSize(o);
  const T0 = Math.max(o.frameT, o.maxT);
  const c = b.clearance;
  const slot = arcBand(o, W, -c, W + c, -c, T0 + c);
  const guide = arcBand(o, W, -c - 1.6, W + c + 1.6, -c - 1.6, T0 + c + 1.6);
  const win = arcBand(o, W, Math.min(10, W * 0.15), W - Math.min(10, W * 0.15), -c - 2 - b.window, -c - 2);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of [...guide, ...win]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  x0 -= b.margin; y0 -= b.margin; x1 += b.margin; y1 += b.margin;
  const w = b.wall, Hb = b.height;
  const outer = rrectRing(x0, y0, x1 - x0, y1 - y0, 6);
  const inner = rrectRing(x0 + w, y0 + w, x1 - x0 - 2 * w, y1 - y0 - 2 * w, Math.max(0, 6 - w));
  const cable = circleRing((x0 + x1) / 2, y1 - w - b.cableD / 2 - 3, b.cableD);
  const parts: Mesh[] = [
    prismMesh([outer, cable], 0, w),                   // fundo com furo do cabo
    prismMesh([outer, inner], w, Hb - w),              // paredes
    prismMesh([outer, slot, win], Hb - w, Hb),         // tampa com encaixe e janela de luz
    prismMesh([guide, slot], Math.max(w, Hb - w - 8), Hb - w), // guia do encaixe
  ];
  return { mesh: fixWinding(merge(parts)), floor: w };
}

/** Prévia "acesa": transmissão da luz pela espessura (mais fino = mais claro). */
export function litPreview(G: LithoGrid, warm = true): ImageData | null {
  if (typeof ImageData === 'undefined') return null;
  const vw = G.nx + 1, vh = G.ny + 1;
  const img = new ImageData(vw, vh);
  const k = 1.15;
  const tMin = Math.exp(-k * 0.6);
  for (let j = 0; j < vh; j++) for (let i = 0; i < vw; i++) {
    const s = j * vw + i, d = ((vh - 1 - j) * vw + i) * 4;
    if (!G.inside[s]) { img.data[d + 3] = 0; continue; }
    const tr = Math.min(1, Math.exp(-k * G.t[s]) / tMin);
    const L = Math.pow(tr, 0.7);
    img.data[d] = Math.round(255 * L); img.data[d + 1] = Math.round((warm ? 214 : 245) * L); img.data[d + 2] = Math.round((warm ? 150 : 235) * L); img.data[d + 3] = 255;
  }
  return img;
}
