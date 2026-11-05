/* eslint-disable */
// Letreiro CAD - motor geométrico (sem dependências).
// Fluxo: imagem/texto/SVG rasterizado -> máscara -> peças (componentes) -> campo de distância suave
//        -> contornos (marching squares) -> triangulação com furos -> sólidos estanques -> 3MF.
// Unidades: milímetros. Eixo Y para cima no mundo; a máscara usa Y para baixo.

export type Pt = [number, number];
export type Ring = Pt[];
export interface Poly { outer: Ring; holes: Ring[] }
export interface Mesh { pos: number[]; idx: number[] }

export type StyleId = 'solid' | 'box' | 'boxFace';
export interface Hole { x: number; y: number; d: number }

export interface Part {
  id: number;
  name: string;
  ox: number; oy: number;           // deslocamento da sub-máscara na arte (px)
  w: number; h: number;             // tamanho da sub-máscara (px)
  mask: Uint8Array;                 // 1 = material
  bx0: number; by0: number; bx1: number; by1: number; // caixa justa na arte (px, inclusiva)
  style: StyleId;
  visible: boolean;
  holes: Hole[];                    // furos passantes na base (mm, mundo)
}

export interface Art { w: number; h: number; s: number; parts: Part[]; nextId: number }

export interface Params {
  base: number;           // espessura da base (mm)
  wall: number;           // espessura da parede (mm)
  height: number;         // altura total da caixa (mm)
  solidHeight: number;    // altura da letra sólida (mm)
  faceThickness: number;  // espessura da face acrílica (mm)
  clearance: number;      // folga da face (mm)
  simplify: number;       // tolerância de simplificação do contorno (mm)
  kerf: number;           // largura do corte (mm)
}
export const DEFAULT_PARAMS: Params = {
  base: 2, wall: 2, height: 35, solidHeight: 10, faceThickness: 3, clearance: 0.2, simplify: 0.08, kerf: 0.4,
};

export interface Plate {
  id: number;
  name: string;
  x: number; y: number; w: number; h: number;   // retângulo no mundo (mm)
  thickness: number;
  radius: number;                               // raio dos cantos
  position: 'back' | 'front';                   // atrás das letras ou à frente (tampa)
  cutLetters: boolean;                          // recortar o formato das letras na chapa
  clearance: number;                            // folga do recorte
  cornerHoleD: number;                          // 0 = sem furos de canto
  cornerInset: number;
  holes: Hole[];
  visible: boolean;
}

export interface SceneObject {
  id: string;
  name: string;
  kind: 'part' | 'face' | 'plate';
  partId?: number;
  mesh: Mesh;
  color: string;
}

// ---------------------------------------------------------------- geometria básica

export function ringArea(r: Ring): number {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1];
  return a / 2;
}

export function pointInRing(p: Pt, r: Ring): boolean {
  let inside = false;
  const x = p[0], y = p[1];
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function dpOpen(pts: Pt[], tol: number): Pt[] {
  const n = pts.length;
  if (n < 3) return pts.slice();
  const keep = new Uint8Array(n);
  keep[0] = 1; keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [s, e] = stack.pop()!;
    const ax = pts[s][0], ay = pts[s][1], bx = pts[e][0], by = pts[e][1];
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    let md = -1, mi = -1;
    for (let i = s + 1; i < e; i++) {
      const px = pts[i][0], py = pts[i][1];
      const d = L === 0 ? Math.hypot(px - ax, py - ay) : Math.abs((px - ax) * dy - (py - ay) * dx) / L;
      if (d > md) { md = d; mi = i; }
    }
    if (md > tol) { keep[mi] = 1; stack.push([s, mi], [mi, e]); }
  }
  return pts.filter((_, i) => keep[i] === 1);
}

export function simplifyRing(r: Ring, tol: number): Ring {
  if (r.length <= 4 || tol <= 0) return r;
  let k = 0, md = 0;
  for (let i = 1; i < r.length; i++) {
    const d = (r[i][0] - r[0][0]) ** 2 + (r[i][1] - r[0][1]) ** 2;
    if (d > md) { md = d; k = i; }
  }
  const a = dpOpen(r.slice(0, k + 1), tol);
  const b = dpOpen(r.slice(k).concat([r[0]]), tol);
  const out = a.concat(b.slice(1, -1));
  return out.length >= 3 ? out : r;
}

/** Agrupa anéis em polígonos com furos pela profundidade de aninhamento (par = contorno, ímpar = furo). */
export function nestRings(rings: Ring[], minArea = 0): Poly[] {
  const rs = rings.filter((r) => r.length >= 3 && Math.abs(ringArea(r)) > minArea);
  const n = rs.length;
  const area = rs.map((r) => Math.abs(ringArea(r)));
  const parent = new Array<number>(n).fill(-1);
  const depth = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    let best = -1;
    let cnt = 0;
    for (let j = 0; j < n; j++) {
      if (i === j || area[j] <= area[i]) continue;
      if (pointInRing(rs[i][0], rs[j])) {
        cnt++;
        if (best < 0 || area[j] < area[best]) best = j;
      }
    }
    depth[i] = cnt;
    parent[i] = best;
  }
  const polyOf = new Map<number, Poly>();
  const polys: Poly[] = [];
  for (let i = 0; i < n; i++) {
    if (depth[i] % 2 === 0) {
      const r = ringArea(rs[i]) > 0 ? rs[i] : rs[i].slice().reverse();
      const p: Poly = { outer: r, holes: [] };
      polyOf.set(i, p);
      polys.push(p);
    }
  }
  for (let i = 0; i < n; i++) {
    if (depth[i] % 2 === 1) {
      const p = polyOf.get(parent[i]);
      if (!p) continue;
      p.holes.push(ringArea(rs[i]) < 0 ? rs[i] : rs[i].slice().reverse());
    }
  }
  return polys;
}

// ---------------------------------------------------------------- triangulação (ear clipping com ponte para furos)

function area2(a: Pt, b: Pt, c: Pt): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function segInter(p1: Pt, p2: Pt, q1: Pt, q2: Pt): boolean {
  const d1 = area2(q1, q2, p1), d2 = area2(q1, q2, p2), d3 = area2(p1, p2, q1), d4 = area2(p1, p2, q2);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  const on = (a: Pt, b: Pt, c: Pt) =>
    Math.min(a[0], b[0]) <= c[0] && c[0] <= Math.max(a[0], b[0]) && Math.min(a[1], b[1]) <= c[1] && c[1] <= Math.max(a[1], b[1]);
  if (d1 === 0 && on(q1, q2, p1)) return true;
  if (d2 === 0 && on(q1, q2, p2)) return true;
  if (d3 === 0 && on(p1, p2, q1)) return true;
  if (d4 === 0 && on(p1, p2, q2)) return true;
  return false;
}

/** Triangula um polígono com furos. Retorna vértices (outer + holes concatenados) e triângulos CCW. */
export function triangulatePoly(poly: Poly): { verts: Pt[]; tris: number[] } {
  const verts: Pt[] = [];
  const ringStart: number[] = [];
  const ringLen: number[] = [];
  const allRings = [poly.outer, ...poly.holes];
  for (const r of allRings) {
    ringStart.push(verts.length);
    ringLen.push(r.length);
    for (const p of r) verts.push(p);
  }
  // lista circular de nós
  const nv: number[] = [];
  const nn: number[] = [];
  const np: number[] = [];
  const newNode = (v: number) => { nv.push(v); nn.push(-1); np.push(-1); return nv.length - 1; };
  const makeRing = (ri: number): number[] => {
    const ids: number[] = [];
    for (let k = 0; k < ringLen[ri]; k++) ids.push(newNode(ringStart[ri] + k));
    for (let k = 0; k < ids.length; k++) { nn[ids[k]] = ids[(k + 1) % ids.length]; np[ids[k]] = ids[(k - 1 + ids.length) % ids.length]; }
    return ids;
  };
  const outerIds = makeRing(0);
  let start = outerIds[0];

  // arestas obstáculo (todos os anéis originais) + pontes
  const obst: [number, number][] = [];
  allRings.forEach((r, ri) => {
    for (let k = 0; k < r.length; k++) obst.push([ringStart[ri] + k, ringStart[ri] + ((k + 1) % r.length)]);
  });
  const bridgeSegs: [Pt, Pt][] = [];
  const usedVerts = new Set<number>();

  const holeIdxs = poly.holes.map((_, i) => i + 1).sort((a, b) => {
    const ma = Math.max(...allRings[a].map((p) => p[0]));
    const mb = Math.max(...allRings[b].map((p) => p[0]));
    return mb - ma;
  });

  for (const hi of holeIdxs) {
    const hIds = makeRing(hi);
    // candidatos de furo: vértices por x decrescente
    const hCand = hIds.slice().sort((a, b) => verts[nv[b]][0] - verts[nv[a]][0]).slice(0, 8);
    let done = false;
    for (const hn of hCand) {
      const H = verts[nv[hn]];
      // nós do anel atual
      const ringNodes: number[] = [];
      let c = start;
      do { ringNodes.push(c); c = nn[c]; } while (c !== start);
      const cands = ringNodes
        .filter((id) => !usedVerts.has(nv[id]))
        .map((id) => ({ id, d: (verts[nv[id]][0] - H[0]) ** 2 + (verts[nv[id]][1] - H[1]) ** 2 }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 60);
      for (const cd of cands) {
        const V = verts[nv[cd.id]];
        let ok = true;
        for (const [ea, eb] of obst) {
          if (ea === nv[hn] || eb === nv[hn] || ea === nv[cd.id] || eb === nv[cd.id]) continue;
          if (segInter(H, V, verts[ea], verts[eb])) { ok = false; break; }
        }
        if (ok) {
          for (const [bp, bq] of bridgeSegs) {
            if (segInter(H, V, bp, bq) && !((bp[0] === H[0] && bp[1] === H[1]) || (bq[0] === H[0] && bq[1] === H[1]) || (bp[0] === V[0] && bp[1] === V[1]) || (bq[0] === V[0] && bq[1] === V[1]))) { ok = false; break; }
          }
        }
        if (!ok) continue;
        // costura: o -> hn ... hPrev -> hDup -> oDup -> oNext
        const o = cd.id;
        const oNext = nn[o];
        const hPrev = np[hn];
        const hDup = newNode(nv[hn]);
        const oDup = newNode(nv[o]);
        nn[o] = hn; np[hn] = o;
        nn[hPrev] = hDup; np[hDup] = hPrev;
        nn[hDup] = oDup; np[oDup] = hDup;
        nn[oDup] = oNext; np[oNext] = oDup;
        bridgeSegs.push([H, V]);
        usedVerts.add(nv[o]);
        usedVerts.add(nv[hn]);
        done = true;
        break;
      }
      if (done) break;
    }
    // se não conseguiu ligar, o furo é ignorado (raro)
  }

  // ear clipping
  const tris: number[] = [];
  let count = 0;
  { let c = start; do { count++; c = nn[c]; } while (c !== start); }
  const P = (id: number) => verts[nv[id]];
  const eps = 1e-12;
  const reflex = new Set<number>();
  const isRefl = (id: number) => area2(P(np[id]), P(id), P(nn[id])) <= eps;
  { let c = start; do { if (isRefl(c)) reflex.add(c); c = nn[c]; } while (c !== start); }

  const same = (a: Pt, b: Pt) => a[0] === b[0] && a[1] === b[1];
  const isEar = (id: number): boolean => {
    const a = P(np[id]), b = P(id), c = P(nn[id]);
    if (area2(a, b, c) <= eps) return false;
    for (const r of reflex) {
      if (r === np[id] || r === id || r === nn[id]) continue;
      const p = P(r);
      if (same(p, a) || same(p, b) || same(p, c)) continue;
      if (area2(a, b, p) >= 0 && area2(b, c, p) >= 0 && area2(c, a, p) >= 0) return false;
    }
    return true;
  };
  const removeNode = (id: number) => {
    const p = np[id], n = nn[id];
    nn[p] = n; np[n] = p;
    reflex.delete(id);
    if (start === id) start = n;
    for (const q of [p, n]) { if (isRefl(q)) reflex.add(q); else reflex.delete(q); }
    count--;
  };

  let cur = start;
  let stall = 0;
  while (count > 3) {
    if (stall > count) {
      // sem orelha: remove vértice degenerado/colinear ou o mais convexo
      let best = -1, ba = -Infinity;
      let c = cur;
      for (let k = 0; k < count; k++) { const ar = area2(P(np[c]), P(c), P(nn[c])); if (Math.abs(ar) <= 1e-9) { best = c; ba = Infinity; break; } if (ar > ba) { ba = ar; best = c; } c = nn[c]; }
      if (best < 0) break;
      if (ba !== Infinity && ba > 0) tris.push(nv[np[best]], nv[best], nv[nn[best]]);
      const nx = nn[best];
      removeNode(best);
      cur = nx; stall = 0;
      continue;
    }
    if (isEar(cur)) {
      tris.push(nv[np[cur]], nv[cur], nv[nn[cur]]);
      const nx = nn[cur];
      removeNode(cur);
      cur = nx; stall = 0;
    } else {
      cur = nn[cur]; stall++;
    }
  }
  if (count === 3) {
    const a = start, b = nn[a], c = nn[b];
    if (area2(P(a), P(b), P(c)) > 0) tris.push(nv[a], nv[b], nv[c]);
  }
  return { verts, tris };
}

// ---------------------------------------------------------------- campo de distância e contornos

function edtSq(mask: Uint8Array, w: number, h: number, feature: number): Float64Array {
  const INF = 1e20;
  const f = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) f[i] = mask[i] === feature ? 0 : INF;
  const n = Math.max(w, h);
  const d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1), col = new Float64Array(n);
  const pass = (len: number, get: (i: number) => number, set: (i: number, val: number) => void) => {
    for (let i = 0; i < len; i++) col[i] = get(i);
    let k = 0;
    v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < len; q++) {
      let s = 0;
      for (;;) {
        const p = v[k];
        s = (col[q] + q * q - (col[p] + p * p)) / (2 * q - 2 * p);
        if (s <= z[k] && k > 0) k--; else break;
      }
      if (s <= z[k]) { v[k] = q; continue; }
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < len; q++) {
      while (z[k + 1] < q) k++;
      d[q] = (q - v[k]) * (q - v[k]) + col[v[k]];
    }
    for (let i = 0; i < len; i++) set(i, d[i]);
  };
  for (let x = 0; x < w; x++) pass(h, (y) => f[y * w + x], (y, val) => { f[y * w + x] = val; });
  for (let y = 0; y < h; y++) pass(w, (x) => f[y * w + x], (x, val) => { f[y * w + x] = val; });
  return f;
}

function blur121(a: Float32Array, w: number, h: number) {
  const t = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const l = a[y * w + Math.max(0, x - 1)], c = a[y * w + x], r = a[y * w + Math.min(w - 1, x + 1)];
    t[y * w + x] = (l + 2 * c + r) / 4;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = t[Math.max(0, y - 1) * w + x], c = t[y * w + x], d = t[Math.min(h - 1, y + 1) * w + x];
    a[y * w + x] = (u + 2 * c + d) / 4;
  }
}

/** Distância assinada em px (positivo dentro do material), suavizada. */
export function sdField(mask: Uint8Array, w: number, h: number): Float32Array {
  const dBg = edtSq(mask, w, h, 0);
  const dInk = edtSq(mask, w, h, 1);
  const sd = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) sd[i] = mask[i] ? Math.sqrt(dBg[i]) - 0.5 : 0.5 - Math.sqrt(dInk[i]);
  blur121(sd, w, h);
  blur121(sd, w, h);
  return sd;
}

/** Marching squares: anéis fechados em coordenadas de pixel. */
export function isoRings(f: Float32Array, w: number, h: number, iso: number): Ring[] {
  const hc = (w - 1) * h;
  const segA: number[] = [], segB: number[] = [];
  const pos = new Map<number, Pt>();
  const adj = new Map<number, number[]>();
  const addSeg = (ea: number, pa: Pt, eb: number, pb: Pt) => {
    const si = segA.length;
    segA.push(ea); segB.push(eb);
    if (!pos.has(ea)) pos.set(ea, pa);
    if (!pos.has(eb)) pos.set(eb, pb);
    let l = adj.get(ea); if (!l) { l = []; adj.set(ea, l); } l.push(si);
    l = adj.get(eb); if (!l) { l = []; adj.set(eb, l); } l.push(si);
  };
  for (let j = 0; j < h - 1; j++) {
    for (let i = 0; i < w - 1; i++) {
      const a = f[j * w + i], b = f[j * w + i + 1], c = f[(j + 1) * w + i + 1], d = f[(j + 1) * w + i];
      const idx = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0);
      if (idx === 0 || idx === 15) continue;
      const T = (): [number, Pt] => [j * (w - 1) + i, [i + (iso - a) / (b - a), j]];
      const B = (): [number, Pt] => [(j + 1) * (w - 1) + i, [i + (iso - d) / (c - d), j + 1]];
      const L = (): [number, Pt] => [hc + j * w + i, [i, j + (iso - a) / (d - a)]];
      const R = (): [number, Pt] => [hc + j * w + i + 1, [i + 1, j + (iso - b) / (c - b)]];
      const link = (p: [number, Pt], q: [number, Pt]) => addSeg(p[0], p[1], q[0], q[1]);
      switch (idx) {
        case 1: link(L(), B()); break;
        case 2: link(B(), R()); break;
        case 3: link(L(), R()); break;
        case 4: link(T(), R()); break;
        case 5: {
          const center = (a + b + c + d) / 4 > iso;
          if (center) { link(T(), L()); link(B(), R()); } else { link(T(), R()); link(L(), B()); }
          break;
        }
        case 6: link(T(), B()); break;
        case 7: link(T(), L()); break;
        case 8: link(T(), L()); break;
        case 9: link(T(), B()); break;
        case 10: {
          const center = (a + b + c + d) / 4 > iso;
          if (center) { link(T(), R()); link(L(), B()); } else { link(T(), L()); link(B(), R()); }
          break;
        }
        case 11: link(T(), R()); break;
        case 12: link(L(), R()); break;
        case 13: link(B(), R()); break;
        case 14: link(L(), B()); break;
      }
    }
  }
  const used = new Uint8Array(segA.length);
  const rings: Ring[] = [];
  for (let s = 0; s < segA.length; s++) {
    if (used[s]) continue;
    const startEdge = segA[s];
    let curEdge = segB[s];
    const pts: Pt[] = [pos.get(startEdge)!];
    used[s] = 1;
    let closed = true;
    while (curEdge !== startEdge) {
      pts.push(pos.get(curEdge)!);
      const lst = adj.get(curEdge)!;
      let nxt = -1;
      for (const t of lst) if (!used[t]) { nxt = t; break; }
      if (nxt < 0) { closed = false; break; }
      used[nxt] = 1;
      curEdge = segA[nxt] === curEdge ? segB[nxt] : segA[nxt];
    }
    if (closed && pts.length >= 3) rings.push(pts);
  }
  return rings;
}

// ---------------------------------------------------------------- arte, peças, componentes

const PAD = 4;

function label4(mask: Uint8Array, w: number, h: number) {
  const lab = new Int32Array(w * h);
  const areas: number[] = [0];
  const bb: number[][] = [[0, 0, 0, 0]];
  const stack = new Int32Array(w * h);
  let count = 0;
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || lab[i]) continue;
    count++;
    let sp = 0, area = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
    stack[sp++] = i; lab[i] = count;
    while (sp) {
      const p = stack[--sp];
      area++;
      const x = p % w, y = (p / w) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0 && mask[p - 1] && !lab[p - 1]) { lab[p - 1] = count; stack[sp++] = p - 1; }
      if (x < w - 1 && mask[p + 1] && !lab[p + 1]) { lab[p + 1] = count; stack[sp++] = p + 1; }
      if (y > 0 && mask[p - w] && !lab[p - w]) { lab[p - w] = count; stack[sp++] = p - w; }
      if (y < h - 1 && mask[p + w] && !lab[p + w]) { lab[p + w] = count; stack[sp++] = p + w; }
    }
    areas.push(area); bb.push([x0, y0, x1, y1]);
  }
  return { lab, count, areas, bb };
}

function makePart(id: number, name: string, srcMask: Uint8Array, sw: number, lab: Int32Array | null, l: number, bb: number[], style: StyleId, visible: boolean, holes: Hole[]): Part {
  const [x0, y0, x1, y1] = bb;
  const w = x1 - x0 + 1 + PAD * 2, h = y1 - y0 + 1 + PAD * 2;
  const mask = new Uint8Array(w * h);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const sp = y * sw + x;
    if (lab ? lab[sp] === l : srcMask[sp]) mask[(y - y0 + PAD) * w + (x - x0 + PAD)] = 1;
  }
  return { id, name, ox: x0 - PAD, oy: y0 - PAD, w, h, mask, bx0: x0, by0: y0, bx1: x1, by1: y1, style, visible, holes };
}

export interface ArtOptions { threshold: number; invert: boolean; widthMm: number; minAreaMm2: number }

export function createArt(rgba: ArrayLike<number>, w: number, h: number, o: ArtOptions): Art {
  const m0 = new Uint8Array(w * h);
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = (y * w + x) * 4;
    const a = rgba[p + 3] / 255;
    const lum = (0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2]) * a + 255 * (1 - a);
    let ink = lum < o.threshold;
    if (o.invert) ink = !ink;
    if (ink) { m0[y * w + x] = 1; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) throw new Error('Nenhuma forma encontrada. Ajuste o limiar ou inverta a imagem.');
  const tw = x1 - x0 + 1, th = y1 - y0 + 1;
  const s = o.widthMm / tw;
  const mask = new Uint8Array(tw * th);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) mask[y * tw + x] = m0[(y + y0) * w + (x + x0)];
  const { lab, count, areas, bb } = label4(mask, tw, th);
  const minPx = (o.minAreaMm2 ?? 4) / (s * s);
  const order: number[] = [];
  for (let l = 1; l <= count; l++) if (areas[l] >= minPx) order.push(l);
  order.sort((a, b) => bb[a][0] - bb[b][0]);
  const parts = order.map((l, i) => makePart(i + 1, `Peça ${i + 1}`, mask, tw, lab, l, bb[l], 'box', true, []));
  return { w: tw, h: th, s, parts, nextId: parts.length + 1 };
}

// ---------------------------------------------------------------- campos e contornos por peça

const fieldCache = new WeakMap<Part, Float32Array>();
function fieldOf(p: Part): Float32Array {
  let f = fieldCache.get(p);
  if (!f) { f = sdField(p.mask, p.w, p.h); fieldCache.set(p, f); }
  return f;
}

function toWorld(r: Ring, ox: number, oy: number, s: number, hPx: number): Ring {
  return r.map(([x, y]) => [(ox + x) * s, (hPx - (oy + y)) * s] as Pt);
}

/** Contornos (mm) da peça deslocados para dentro por `inset` mm (negativo = para fora, não usar em peça). */
export function partRings(art: Art, p: Part, insetMm: number, simplify: number): Ring[] {
  const f = fieldOf(p);
  const rings = isoRings(f, p.w, p.h, insetMm / art.s);
  return rings.map((r) => simplifyRing(toWorld(r, p.ox, p.oy, art.s, art.h), simplify));
}

const outlineCache = new WeakMap<Part, Poly[]>();
export function partOutline(art: Art, p: Part): Poly[] {
  let o = outlineCache.get(p);
  if (!o) { o = nestRings(partRings(art, p, 0, 0.1), 0.05); outlineCache.set(p, o); }
  return o;
}

export function maskAt(art: Art, p: Part, x: number, y: number): boolean {
  const px = Math.round(x / art.s - p.ox), py = Math.round(art.h - y / art.s - p.oy);
  if (px < 0 || py < 0 || px >= p.w || py >= p.h) return false;
  return p.mask[py * p.w + px] === 1;
}

export function pickPart(art: Art, x: number, y: number): Part | null {
  for (let i = art.parts.length - 1; i >= 0; i--) {
    const p = art.parts[i];
    if (p.visible && maskAt(art, p, x, y)) return p;
  }
  return null;
}

export function partBounds(art: Art, p: Part) {
  return { x0: p.bx0 * art.s, x1: (p.bx1 + 1) * art.s, y0: (art.h - (p.by1 + 1)) * art.s, y1: (art.h - p.by0) * art.s };
}

export function artBounds(art: Art) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of art.parts) {
    if (!p.visible) continue;
    const b = partBounds(art, p);
    x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1);
  }
  if (x0 === Infinity) return { x0: 0, y0: 0, x1: art.w * art.s, y1: art.h * art.s };
  return { x0, y0, x1, y1 };
}

// ---------------------------------------------------------------- furos e corte

export function validateHole(art: Art, p: Part, hole: Hole, P: Params): string | null {
  if (hole.d <= 0) return 'Diâmetro inválido.';
  const f = fieldOf(p);
  const px = hole.x / art.s - p.ox, py = art.h - hole.y / art.s - p.oy;
  const ix = Math.round(px), iy = Math.round(py);
  if (ix < 1 || iy < 1 || ix >= p.w - 1 || iy >= p.h - 1) return 'Furo fora da peça.';
  const depthMm = f[iy * p.w + ix] * art.s;
  const need = (p.style === 'solid' ? 0 : P.wall) + hole.d / 2 + 0.2;
  if (depthMm < need) return p.style === 'solid' ? 'O furo sai da peça.' : 'O furo encosta na parede. Mova para o centro da base.';
  for (const o of p.holes) {
    if (Math.hypot(o.x - hole.x, o.y - hole.y) < (o.d + hole.d) / 2 + 0.2) return 'Furo sobrepõe outro furo.';
  }
  return null;
}

export function addHole(art: Art, partId: number, hole: Hole): Art {
  return { ...art, parts: art.parts.map((p) => (p.id === partId ? { ...p, holes: [...p.holes, hole] } : p)) };
}

/** Corta a peça por uma reta (p1-p2, infinita). Retorna nova arte ou null se a reta não separa a peça. */
export function cutPart(art: Art, partId: number, p1: Pt, p2: Pt, kerfMm: number): Art | null {
  const idx = art.parts.findIndex((p) => p.id === partId);
  if (idx < 0) return null;
  const p = art.parts[idx];
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
  const L = Math.hypot(dx, dy);
  if (L < 1e-6) return null;
  const half = Math.max(kerfMm, 1.8 * art.s) / 2;
  const mask = p.mask.slice();
  for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) {
    if (!mask[j * p.w + i]) continue;
    const wx = (p.ox + i) * art.s, wy = (art.h - (p.oy + j)) * art.s;
    const dist = Math.abs((wx - p1[0]) * dy - (wy - p1[1]) * dx) / L;
    if (dist < half) mask[j * p.w + i] = 0;
  }
  const { lab, count, areas, bb } = label4(mask, p.w, p.h);
  const keep: number[] = [];
  for (let l = 1; l <= count; l++) if (areas[l] >= 4) keep.push(l);
  if (keep.length < 2) return null;
  let nextId = art.nextId;
  const pieces: Part[] = keep.map((l, k) => {
    const [x0, y0, x1, y1] = bb[l];
    const np = makePart(nextId++, `${p.name}.${k + 1}`, mask, p.w, lab, l, [x0, y0, x1, y1], p.style, p.visible, []);
    // converter para coordenadas da arte
    np.ox += p.ox; np.oy += p.oy;
    np.bx0 = x0 + p.ox; np.by0 = y0 + p.oy; np.bx1 = x1 + p.ox; np.by1 = y1 + p.oy;
    return np;
  });
  for (const hole of p.holes) {
    const target = pieces.find((q) => maskAt(art, q, hole.x, hole.y));
    if (target) target.holes.push(hole);
  }
  const parts = art.parts.slice();
  parts.splice(idx, 1, ...pieces);
  return { ...art, parts, nextId };
}

// ---------------------------------------------------------------- malha

class MB {
  pos: number[] = [];
  idx: number[] = [];
  map = new Map<string, number>();
  v(x: number, y: number, z: number): number {
    const k = Math.round(x * 1e4) + ',' + Math.round(y * 1e4) + ',' + Math.round(z * 1e4);
    let i = this.map.get(k);
    if (i === undefined) { i = this.pos.length / 3; this.pos.push(x, y, z); this.map.set(k, i); }
    return i;
  }
  tri(a: number, b: number, c: number) { if (a !== b && b !== c && a !== c) this.idx.push(a, b, c); }
  mesh(): Mesh { return { pos: this.pos, idx: this.idx }; }
}

function addFace(mb: MB, polys: Poly[], z: number, up: boolean) {
  for (const poly of polys) {
    const { verts, tris } = triangulatePoly(poly);
    const ids = verts.map((p) => mb.v(p[0], p[1], z));
    for (let i = 0; i < tris.length; i += 3) {
      const a = ids[tris[i]], b = ids[tris[i + 1]], c = ids[tris[i + 2]];
      if (up) mb.tri(a, b, c); else mb.tri(a, c, b);
    }
  }
}

function addSides(mb: MB, rings: Ring[], z0: number, z1: number, flip = false) {
  for (const r of rings) {
    const n = r.length;
    for (let i = 0; i < n; i++) {
      const a = r[i], b = r[(i + 1) % n];
      const a0 = mb.v(a[0], a[1], z0), b0 = mb.v(b[0], b[1], z0), a1 = mb.v(a[0], a[1], z1), b1 = mb.v(b[0], b[1], z1);
      if (!flip) { mb.tri(a0, b0, b1); mb.tri(a0, b1, a1); } else { mb.tri(a0, b1, b0); mb.tri(a0, a1, b1); }
    }
  }
}

function polyRings(polys: Poly[]): Ring[] {
  const out: Ring[] = [];
  for (const p of polys) { out.push(p.outer); for (const h of p.holes) out.push(h); }
  return out;
}

function circle(cx: number, cy: number, d: number, cw: boolean): Ring {
  const n = Math.max(16, Math.min(96, Math.ceil((Math.PI * d) / 0.5)));
  const r: Ring = [];
  for (let i = 0; i < n; i++) {
    const t = ((cw ? -1 : 1) * 2 * Math.PI * i) / n;
    r.push([cx + (d / 2) * Math.cos(t), cy + (d / 2) * Math.sin(t)]);
  }
  return r;
}

function rrect(x: number, y: number, w: number, h: number, rad: number): Ring {
  const r = Math.max(0, Math.min(rad, w / 2, h / 2));
  if (r < 0.01) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const seg = 10;
  const out: Ring = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= seg; i++) { const t = a0 + (Math.PI / 2) * (i / seg); out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
  };
  corner(x + w - r, y + r, -Math.PI / 2);
  corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, Math.PI / 2);
  corner(x + r, y + r, Math.PI);
  return out;
}

function buildSolid(art: Art, p: Part, P: Params): Mesh {
  const mb = new MB();
  const H = P.solidHeight;
  const rM = partRings(art, p, 0, P.simplify);
  const D = p.holes.map((h) => circle(h.x, h.y, h.d, true));
  const polys = nestRings([...rM, ...D], 0.02);
  addFace(mb, polys, 0, false);
  addFace(mb, polys, H, true);
  addSides(mb, polyRings(polys), 0, H);
  return mb.mesh();
}

function buildBox(art: Art, p: Part, P: Params): Mesh {
  const rM = partRings(art, p, 0, P.simplify);
  const rE = partRings(art, p, P.wall, P.simplify);
  if (!rE.length) return buildSolid(art, p, { ...P, solidHeight: P.height });
  const mb = new MB();
  const H = P.height, b = P.base;
  const D = p.holes.map((h) => circle(h.x, h.y, h.d, true));
  const polysM = nestRings(rM, 0.02);
  const polysE = nestRings(rE, 0.02);
  const polysR = nestRings([...polysRingsFlat(polysM), ...polysRingsFlat(polysE)], 0);
  const bottom = nestRings([...polysRingsFlat(polysM), ...D], 0);
  const floor = nestRings([...polysRingsFlat(polysE), ...D], 0);
  addFace(mb, bottom, 0, false);
  addFace(mb, floor, b, true);
  addFace(mb, polysR, H, true);
  addSides(mb, polyRings(polysM), 0, H);
  addSides(mb, polyRings(polysE), b, H, true);
  addSides(mb, D, 0, b);
  return mb.mesh();
}

function polysRingsFlat(polys: Poly[]): Ring[] { return polyRings(polys); }

function buildFace(art: Art, p: Part, P: Params): Mesh | null {
  const rF = partRings(art, p, P.clearance, P.simplify);
  if (!rF.length) return null;
  const mb = new MB();
  const z0 = P.height, z1 = P.height + P.faceThickness;
  const polys = nestRings(rF, 0.02);
  addFace(mb, polys, z0, false);
  addFace(mb, polys, z1, true);
  addSides(mb, polyRings(polys), z0, z1);
  return mb.mesh();
}

export function topZ(art: Art, P: Params): number {
  let z = 0;
  for (const p of art.parts) {
    if (!p.visible) continue;
    z = Math.max(z, p.style === 'solid' ? P.solidHeight : p.style === 'box' ? P.height : P.height + P.faceThickness);
  }
  return z;
}

const COLORS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#00acc1', '#6d4c41'];

function globalRings(art: Art, isoMmOut: number, simplify: number): Ring[] {
  const G = Math.ceil(isoMmOut / art.s) + 6;
  const gw = art.w + G * 2, gh = art.h + G * 2;
  const m = new Uint8Array(gw * gh);
  for (const p of art.parts) {
    if (!p.visible) continue;
    for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) {
      if (!p.mask[j * p.w + i]) continue;
      const x = p.ox + i + G, y = p.oy + j + G;
      if (x >= 0 && y >= 0 && x < gw && y < gh) m[y * gw + x] = 1;
    }
  }
  const f = sdField(m, gw, gh);
  return isoRings(f, gw, gh, -isoMmOut / art.s).map((r) => simplifyRing(toWorld(r, -G, -G, art.s, art.h), simplify));
}

export function buildPlate(art: Art, pl: Plate, P: Params, warnings: string[]): Mesh {
  const mb = new MB();
  const outer = rrect(pl.x, pl.y, pl.w, pl.h, pl.radius);
  const inner: Ring[] = [];
  if (pl.cornerHoleD > 0) {
    const i = pl.cornerInset;
    for (const [cx, cy] of [[pl.x + i, pl.y + i], [pl.x + pl.w - i, pl.y + i], [pl.x + pl.w - i, pl.y + pl.h - i], [pl.x + i, pl.y + pl.h - i]]) {
      inner.push(circle(cx, cy, pl.cornerHoleD, true));
    }
  }
  for (const h of pl.holes) inner.push(circle(h.x, h.y, h.d, true));
  if (pl.cutLetters) {
    const rings = globalRings(art, pl.clearance, P.simplify);
    let skipped = 0;
    for (const r of rings) {
      const inside = r.every(([x, y]) => x > pl.x + 0.3 && x < pl.x + pl.w - 0.3 && y > pl.y + 0.3 && y < pl.y + pl.h - 0.3);
      if (inside) inner.push(r); else skipped++;
    }
    if (skipped) warnings.push(`${pl.name}: ${skipped} recorte(s) de letra não couberam dentro da chapa e foram ignorados.`);
  }
  const polys = nestRings([outer, ...inner], 0.02);
  const z0 = pl.position === 'back' ? -pl.thickness : topZ(art, P);
  const z1 = z0 + pl.thickness;
  addFace(mb, polys, z0, false);
  addFace(mb, polys, z1, true);
  addSides(mb, polyRings(polys), z0, z1);
  return mb.mesh();
}

export function defaultPlate(art: Art, id: number, margin = 10): Plate {
  const b = artBounds(art);
  return {
    id, name: `Chapa ${id}`, x: Math.round((b.x0 - margin) * 10) / 10, y: Math.round((b.y0 - margin) * 10) / 10, w: Math.round((b.x1 - b.x0 + margin * 2) * 10) / 10, h: Math.round((b.y1 - b.y0 + margin * 2) * 10) / 10,
    thickness: 3, radius: 4, position: 'back', cutLetters: false, clearance: 0.3, cornerHoleD: 4, cornerInset: 6, holes: [], visible: true,
  };
}

export function buildScene(art: Art, plates: Plate[], P: Params): { objects: SceneObject[]; warnings: string[] } {
  const objects: SceneObject[] = [];
  const warnings: string[] = [];
  art.parts.forEach((p, i) => {
    if (!p.visible) return;
    const color = COLORS[i % COLORS.length];
    try {
      const mesh = p.style === 'solid' ? buildSolid(art, p, P) : buildBox(art, p, P);
      objects.push({ id: `p${p.id}`, name: p.style === 'solid' ? p.name : `${p.name} - corpo`, kind: 'part', partId: p.id, mesh, color });
      if (p.style === 'boxFace') {
        const fm = buildFace(art, p, P);
        if (fm) objects.push({ id: `f${p.id}`, name: `${p.name} - face acrílico`, kind: 'face', partId: p.id, mesh: fm, color: '#4fc3f7' });
        else warnings.push(`${p.name}: face acrílico vazio (folga maior que a peça).`);
      }
    } catch (e: any) {
      warnings.push(`${p.name}: falha ao gerar (${e?.message || e}).`);
    }
  });
  for (const pl of plates) {
    if (!pl.visible) continue;
    try {
      objects.push({ id: `c${pl.id}`, name: pl.name, kind: 'plate', mesh: buildPlate(art, pl, P, warnings), color: pl.position === 'back' ? '#b0bec5' : '#81d4fa' });
    } catch (e: any) {
      warnings.push(`${pl.name}: falha ao gerar (${e?.message || e}).`);
    }
  }
  return { objects, warnings };
}

// ---------------------------------------------------------------- estatísticas

export function meshStats(m: Mesh) {
  let vol = 0;
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < m.pos.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], m.pos[i + k]); mx[k] = Math.max(mx[k], m.pos[i + k]); }
  const edges = new Map<string, number>();
  for (let i = 0; i < m.idx.length; i += 3) {
    const a = m.idx[i] * 3, b = m.idx[i + 1] * 3, c = m.idx[i + 2] * 3;
    const ax = m.pos[a], ay = m.pos[a + 1], az = m.pos[a + 2];
    const bx = m.pos[b], by = m.pos[b + 1], bz = m.pos[b + 2];
    const cx = m.pos[c], cy = m.pos[c + 1], cz = m.pos[c + 2];
    vol += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
    for (const [u, v] of [[m.idx[i], m.idx[i + 1]], [m.idx[i + 1], m.idx[i + 2]], [m.idx[i + 2], m.idx[i]]]) {
      const k = u + '>' + v;
      edges.set(k, (edges.get(k) || 0) + 1);
    }
  }
  let open = 0;
  edges.forEach((cnt, k) => {
    const [u, v] = k.split('>');
    if (cnt !== 1 || edges.get(v + '>' + u) !== 1) open++;
  });
  return { tris: m.idx.length / 3, volumeMm3: vol, min: mn, max: mx, size: [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]], openEdges: open };
}

// ---------------------------------------------------------------- 3MF

const CRC_T = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_T[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function zipStore(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const u16 = (v: number) => [v & 255, (v >> 8) & 255];
  const u32 = (v: number) => [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255];
  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const local = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(f.data.length), ...u32(f.data.length), ...u16(name.length), ...u16(0)]);
    chunks.push(local, name, f.data);
    central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(f.data.length), ...u32(f.data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), name);
    offset += local.length + name.length + f.data.length;
  }
  const cdSize = central.reduce((s, c) => s + c.length, 0);
  const eocd = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
  const all = [...chunks, ...central, eocd];
  const out = new Uint8Array(all.reduce((s, c) => s + c.length, 0));
  let o = 0;
  for (const c of all) { out.set(c, o); o += c.length; }
  return out;
}

export interface LayoutOptions { mode: 'assembled' | 'print'; bedW: number; bedD: number; gap: number }

export function layoutObjects(objects: SceneObject[], opt: LayoutOptions): { tx: number[]; ty: number[]; tz: number[]; warnings: string[] } {
  const n = objects.length;
  const tx = new Array(n).fill(0), ty = new Array(n).fill(0), tz = new Array(n).fill(0);
  const warnings: string[] = [];
  if (opt.mode === 'assembled') return { tx, ty, tz, warnings };
  const stats = objects.map((o) => meshStats(o.mesh));
  const order = objects.map((_, i) => i).sort((a, b) => stats[b].size[1] - stats[a].size[1]);
  let cx = 0, cy = 0, rowH = 0;
  for (const i of order) {
    const s = stats[i];
    const w = s.size[0], d = s.size[1];
    if (w > opt.bedW || d > opt.bedD) warnings.push(`${objects[i].name} (${w.toFixed(0)}x${d.toFixed(0)} mm) é maior que a mesa. Use a ferramenta Cortar.`);
    if (cx > 0 && cx + w > opt.bedW) { cx = 0; cy += rowH + opt.gap; rowH = 0; }
    tx[i] = cx - s.min[0]; ty[i] = cy - s.min[1]; tz[i] = -s.min[2];
    cx += w + opt.gap; rowH = Math.max(rowH, d);
  }
  return { tx, ty, tz, warnings };
}

const esc = (s: string) => s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] as string));
const num = (v: number) => (Math.round(v * 1e4) / 1e4).toString();

export function build3MF(objects: SceneObject[], opt: LayoutOptions): { data: Uint8Array; warnings: string[] } {
  const lay = layoutObjects(objects, opt);
  const colors: string[] = [];
  objects.forEach((o) => { if (!colors.includes(o.color)) colors.push(o.color); });
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<model unit="millimeter" xml:lang="pt-BR" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n';
  xml += ' <metadata name="Title">Letreiro CAD</metadata>\n <metadata name="Application">Letreiro CAD - Kitoys3D</metadata>\n <resources>\n';
  xml += '  <basematerials id="1">\n';
  colors.forEach((c, i) => { xml += `   <base name="Cor ${i + 1}" displaycolor="${c.toUpperCase()}FF"/>\n`; });
  xml += '  </basematerials>\n';
  objects.forEach((o, i) => {
    xml += `  <object id="${i + 2}" type="model" name="${esc(o.name)}" pid="1" pindex="${colors.indexOf(o.color)}">\n   <mesh>\n    <vertices>\n`;
    for (let k = 0; k < o.mesh.pos.length; k += 3) xml += `     <vertex x="${num(o.mesh.pos[k])}" y="${num(o.mesh.pos[k + 1])}" z="${num(o.mesh.pos[k + 2])}"/>\n`;
    xml += '    </vertices>\n    <triangles>\n';
    for (let k = 0; k < o.mesh.idx.length; k += 3) xml += `     <triangle v1="${o.mesh.idx[k]}" v2="${o.mesh.idx[k + 1]}" v3="${o.mesh.idx[k + 2]}"/>\n`;
    xml += '    </triangles>\n   </mesh>\n  </object>\n';
  });
  xml += ' </resources>\n <build>\n';
  objects.forEach((_, i) => { xml += `  <item objectid="${i + 2}" transform="1 0 0 0 1 0 0 0 1 ${num(lay.tx[i])} ${num(lay.ty[i])} ${num(lay.tz[i])}"/>\n`; });
  xml += ' </build>\n</model>\n';
  const enc = new TextEncoder();
  const data = zipStore([
    { name: '[Content_Types].xml', data: enc.encode('<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>') },
    { name: '_rels/.rels', data: enc.encode('<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>') },
    { name: '3D/3dmodel.model', data: enc.encode(xml) },
  ]);
  return { data, warnings: lay.warnings };
}
