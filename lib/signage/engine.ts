/* eslint-disable */
// Letreiro CAD - motor geométrico (sem dependências).
// Fluxo: imagem/texto/SVG rasterizado -> máscara -> peças (componentes) -> campo de distância suave
//        -> contornos (marching squares) -> camadas por estilo -> triangulação com furos -> sólidos -> 3MF.
// Unidades: milímetros. Eixo Y para cima no mundo; a máscara usa Y para baixo.
// Cada estilo de letra é descrito como uma pilha de "camadas": faixas entre dois recuos do contorno
// (a = recuo externo, b = recuo interno ou null = até o miolo) com altura z0..z1. Cada camada vira um
// prisma fechado; camadas da mesma peça física vão no mesmo objeto (o fatiador une os volumes).

export type Pt = [number, number];
export type Ring = Pt[];
export interface Poly { outer: Ring; holes: Ring[] }
export interface Mesh { pos: number[]; idx: number[] }

export type StyleId =
  | 'solid' | 'box' | 'boxFace' | 'openBack' | 'doubleLedge' | 'singleLedge' | 'backFit' | 'backlit'
  | 'inset' | 'insetPrinted' | 'ledDouble' | 'standing' | 'pattern' | 'neon' | 'organic' | 'tilted' | 'lightbox';
export interface Hole { x: number; y: number; d: number }

export interface Part {
  id: number;
  name: string;
  ox: number; oy: number;           // deslocamento da sub-máscara na arte (px)
  w: number; h: number;             // tamanho da sub-máscara (px)
  mask: Uint8Array;                 // 1 = material
  cmap?: Uint8Array;                // índice de cor da imagem por pixel (255 = sem cor)
  bx0: number; by0: number; bx1: number; by1: number; // caixa justa na arte (px, inclusiva)
  style: StyleId;
  visible: boolean;
  holes: Hole[];                    // furos (mm, mundo): passagem de fio / parafuso / espaçador
}

export interface Art { w: number; h: number; s: number; parts: Part[]; nextId: number; palette: string[] }

export interface Params {
  base: number;           // espessura da base / fundo (mm)
  wall: number;           // espessura da parede (mm)
  height: number;         // altura total da caixa (mm)
  solidHeight: number;    // altura da letra sólida / espessura da letra em pé (mm)
  faceThickness: number;  // espessura da face (acrílico ou impressa) (mm)
  clearance: number;      // folga de encaixe (mm)
  simplify: number;       // tolerância de simplificação do contorno (mm)
  kerf: number;           // largura do corte (mm)
  ledge: number;          // largura da aba de apoio interna (mm)
  ledgeThickness: number; // espessura da aba de apoio (mm)
  skirtDepth: number;     // profundidade da saia do back fit (mm)
  skirtWidth: number;     // espessura da saia do back fit (mm)
  standoff: number;       // afastamento da parede no retroiluminado (mm)
  tubeWall: number;       // parede do espaçador/tubo (mm)
  neonWidth: number;      // largura do canal do neon (mm)
  neonHeight: number;     // altura do canal do neon (mm)
  patternHole: number;    // diâmetro dos furos do vazado (mm)
  patternBar: number;     // espessura entre furos do vazado (mm)
  standBase: number;      // espessura da base da letra em pé (mm)
  standMargin: number;    // sobra da base da letra em pé (mm)
  organicRadius: number;  // raio do arredondamento (mm)
  tiltMin: number;        // altura no lado raso do fundo inclinado (mm)
}
export const DEFAULT_PARAMS: Params = {
  base: 2, wall: 2, height: 35, solidHeight: 10, faceThickness: 3, clearance: 0.2, simplify: 0.08, kerf: 0.4,
  ledge: 3, ledgeThickness: 1.6, skirtDepth: 4, skirtWidth: 1.2, standoff: 15, tubeWall: 1.6,
  neonWidth: 8, neonHeight: 14, patternHole: 4, patternBar: 1.6, standBase: 5, standMargin: 8, organicRadius: 3, tiltMin: 15,
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
  wireHoles?: boolean;                          // furar a chapa nos furos de fio das letras
  kind?: 'flat' | 'blade';                      // chapa simples ou luminoso de avanço (caixa dupla face com suporte)
  depth?: number;                               // profundidade da caixa do luminoso de avanço
}

export interface SceneObject {
  id: string;
  name: string;
  kind: 'part' | 'face' | 'plate';
  partId?: number;
  mesh: Mesh;
  color: string;
}

// ---------------------------------------------------------------- estilos

export type LayerObj = 'body' | 'face' | 'back';
export interface Layer {
  obj: LayerObj;
  a: number; b: number | null;  // faixa entre recuos (mm); b = null vai até o miolo
  z0: number; z1: number;
  noHoles?: boolean;            // camada de frente: o furo de fio não atravessa
  pattern?: boolean;            // face vazada com colmeia de furos
  colors?: boolean;             // face dividida pelas cores da imagem (lightbox)
}

export interface StyleInfo {
  id: StyleId;
  name: string;
  desc: string;
  lit: boolean;                               // leva LED
  params: (keyof Params)[];                   // medidas que importam para o estilo
  hole: string;                               // para que serve o furo neste estilo
  face?: string;                              // nome da face
  back?: string;                              // nome do fundo solto
}

export const STYLES: StyleInfo[] = [
  { id: 'boxFace', name: 'Face acrílico - fundo impresso', lit: true, face: 'face acrílico', params: ['base', 'wall', 'height', 'faceThickness', 'clearance'],
    desc: 'Caixa impressa com fundo e parede. A face de acrílico (ou impressa translúcida) é colada em cima da parede. O LED fica no fundo.', hole: 'Passagem do fio pelo fundo.' },
  { id: 'openBack', name: 'Face acrílico - fundo vazado', lit: true, face: 'face acrílico', params: ['wall', 'height', 'base', 'ledge', 'faceThickness', 'clearance'],
    desc: 'Só a parede, sem fundo: a letra é fixada direto na parede ou numa chapa. Uma aba interna embaixo serve para parafusar. Face em cima.', hole: 'Furo de parafuso na aba de baixo (o fio sai por trás).' },
  { id: 'doubleLedge', name: 'Face acrílico - apoio duplo', lit: true, face: 'face acrílico', back: 'fundo solto', params: ['wall', 'height', 'base', 'ledge', 'ledgeThickness', 'faceThickness', 'clearance'],
    desc: 'Parede com duas abas internas: a de cima segura a face embutida e a de baixo segura um fundo solto (impresso ou acrílico). Dá para abrir e trocar o LED.', hole: 'Passagem do fio pelo fundo solto.' },
  { id: 'singleLedge', name: 'Face acrílico - apoio único', lit: true, face: 'face acrílico', params: ['base', 'wall', 'height', 'ledge', 'ledgeThickness', 'faceThickness', 'clearance'],
    desc: 'Caixa com fundo impresso e uma aba interna em cima onde a face apoia, embutida e nivelada com a borda.', hole: 'Passagem do fio pelo fundo.' },
  { id: 'backFit', name: 'Face acrílico - back fit', lit: true, face: 'face com saia', params: ['base', 'wall', 'height', 'faceThickness', 'skirtDepth', 'skirtWidth', 'clearance'],
    desc: 'A face cobre a letra toda e tem uma saia que entra por dentro da parede (encaixe por pressão, sem cola aparente).', hole: 'Passagem do fio pelo fundo.' },
  { id: 'backlit', name: 'Retroiluminado', lit: true, params: ['base', 'wall', 'height', 'standoff', 'tubeWall'],
    desc: 'Frente fechada e fundo aberto. O LED fica dentro, virado para a parede, e faz o halo de luz atrás. Espaçadores afastam a letra da parede.', hole: 'Cada furo vira um espaçador (tubo) para parafuso.' },
  { id: 'inset', name: 'Face acrílico - encaixe', lit: true, face: 'face acrílico', params: ['base', 'wall', 'height', 'faceThickness', 'clearance'],
    desc: 'A parede tem um rebaixo no topo e a face entra nele, ficando nivelada com a borda.', hole: 'Passagem do fio pelo fundo.' },
  { id: 'insetPrinted', name: 'Face impressa - encaixe', lit: true, face: 'face impressa', params: ['base', 'wall', 'height', 'faceThickness', 'clearance'],
    desc: 'Igual ao encaixe, mas a face é impressa (filamento branco/translúcido, 1 a 2 mm). Tudo sai da impressora.', hole: 'Passagem do fio pelo fundo.' },
  { id: 'ledDouble', name: 'LED duplo', lit: true, face: 'face frontal', back: 'face traseira', params: ['wall', 'height', 'base', 'faceThickness', 'clearance'],
    desc: 'Caixa com uma prateleira no meio: LED virado para a frente e LED virado para trás. Faces encaixadas dos dois lados (luz na frente e halo atrás).', hole: 'Passagem do fio pela prateleira do meio.' },
  { id: 'standing', name: 'Letra curva (em pé com base)', lit: false, params: ['solidHeight', 'standBase', 'standMargin'],
    desc: 'Letras sólidas em pé sobre uma base única, para mesa ou balcão.', hole: 'Sem furo.' },
  { id: 'pattern', name: 'Vazado paramétrico', lit: true, params: ['base', 'wall', 'height', 'faceThickness', 'patternHole', 'patternBar'],
    desc: 'Caixa impressa com a frente vazada em colmeia: a luz passa pelos furos. Sai inteira da impressora.', hole: 'Passagem do fio pelo fundo.' },
  { id: 'neon', name: 'Neon LED 2ª geração', lit: true, params: ['base', 'wall', 'neonWidth', 'neonHeight'],
    desc: 'Canal que acompanha o contorno da letra para encaixar a mangueira de neon flex.', hole: 'Furo no fundo do canal para o fio do neon.' },
  { id: 'organic', name: 'Organic', lit: true, face: 'face acrílico', params: ['base', 'wall', 'height', 'organicRadius', 'faceThickness', 'clearance'],
    desc: 'Letra-caixa com a borda de cima arredondada, visual macio. A face entra no rebaixo.', hole: 'Passagem do fio pelo fundo.' },
  { id: 'tilted', name: 'Fundo inclinado', lit: true, face: 'face acrílico', params: ['base', 'wall', 'height', 'tiltMin', 'faceThickness', 'clearance'],
    desc: 'A profundidade diminui da esquerda para a direita (fundo em rampa). Para fachada inclinada ou efeito de perspectiva.', hole: 'Passagem do fio pelo fundo.' },
  { id: 'lightbox', name: 'Lightbox multicolorido', lit: true, face: 'face colorida', params: ['base', 'wall', 'height', 'faceThickness', 'clearance'],
    desc: 'Caixa com face impressa dividida pelas cores da imagem: cada cor sai como uma peça (um filamento por cor).', hole: 'Passagem do fio pelo fundo.' },
  { id: 'box', name: 'Letra-caixa sem face', lit: false, params: ['base', 'wall', 'height'],
    desc: 'Fundo e parede, aberta em cima.', hole: 'Furo no fundo.' },
  { id: 'solid', name: 'Letra sólida', lit: false, params: ['solidHeight'],
    desc: 'Letra maciça, sem LED.', hole: 'Furo passante (parafuso ou pendurar).' },
];
export const styleInfo = (id: StyleId): StyleInfo => STYLES.find((s) => s.id === id) ?? STYLES[0];

/** Camadas de cada estilo. Coordenadas: z = 0 é o fundo (encosta na parede), z cresce para a frente. */
export function styleLayers(style: StyleId, P: Params): Layer[] {
  const { base: b, wall: w, height: H, faceThickness: fT, clearance: c, ledge: lg, ledgeThickness: lT } = P;
  const ov = Math.min(0.3, w / 4); // sobreposição das abas na parede para colar no fatiador
  const bodyBox: Layer[] = [{ obj: 'body', a: 0, b: null, z0: 0, z1: b }, { obj: 'body', a: 0, b: w, z0: b, z1: H }];
  const insetBody = (top: number): Layer[] => [
    { obj: 'body', a: 0, b: null, z0: 0, z1: b },
    { obj: 'body', a: 0, b: w, z0: b, z1: top - fT },
    { obj: 'body', a: 0, b: w / 2, z0: top - fT, z1: top },
  ];
  switch (style) {
    case 'solid': return [{ obj: 'body', a: 0, b: null, z0: 0, z1: P.solidHeight }];
    case 'standing': return [{ obj: 'body', a: 0, b: null, z0: 0, z1: P.solidHeight }];
    case 'box': return bodyBox;
    case 'boxFace': return [...bodyBox, { obj: 'face', a: c, b: null, z0: H, z1: H + fT }];
    case 'openBack': return [
      { obj: 'body', a: 0, b: w, z0: 0, z1: H },
      { obj: 'body', a: w - ov, b: w + lg, z0: 0, z1: b },
      { obj: 'face', a: c, b: null, z0: H, z1: H + fT },
    ];
    case 'doubleLedge': return [
      { obj: 'body', a: 0, b: w, z0: 0, z1: H },
      { obj: 'body', a: w - ov, b: w + lg, z0: H - fT - lT, z1: H - fT, noHoles: true },
      { obj: 'body', a: w - ov, b: w + lg, z0: b, z1: b + lT, noHoles: true },
      { obj: 'face', a: w + c, b: null, z0: H - fT, z1: H },
      { obj: 'back', a: w + c, b: null, z0: 0, z1: b },
    ];
    case 'singleLedge': return [
      ...bodyBox,
      { obj: 'body', a: w - ov, b: w + lg, z0: H - fT - lT, z1: H - fT, noHoles: true },
      { obj: 'face', a: w + c, b: null, z0: H - fT, z1: H },
    ];
    case 'backFit': return [
      ...bodyBox,
      { obj: 'face', a: 0, b: null, z0: H, z1: H + fT },
      { obj: 'face', a: w + c, b: w + c + P.skirtWidth, z0: H - P.skirtDepth, z1: H + 0.01 },
    ];
    case 'backlit': return [
      { obj: 'body', a: 0, b: null, z0: H - b, z1: H, noHoles: true },
      { obj: 'body', a: 0, b: w, z0: 0, z1: H - b },
    ];
    case 'inset': case 'insetPrinted': return [...insetBody(H), { obj: 'face', a: w / 2 + c, b: null, z0: H - fT, z1: H }];
    case 'lightbox': return [...insetBody(H), { obj: 'face', a: w / 2 + c, b: null, z0: H - fT, z1: H, colors: true }];
    case 'tilted': return [...insetBody(H), { obj: 'face', a: w / 2 + c, b: null, z0: H - fT, z1: H }];
    case 'ledDouble': return [
      { obj: 'body', a: 0, b: w / 2, z0: 0, z1: fT },
      { obj: 'body', a: 0, b: w, z0: fT, z1: H - fT },
      { obj: 'body', a: 0, b: w / 2, z0: H - fT, z1: H },
      { obj: 'body', a: w - ov, b: null, z0: H / 2 - b / 2, z1: H / 2 + b / 2 },
      { obj: 'face', a: w / 2 + c, b: null, z0: H - fT, z1: H },
      { obj: 'back', a: w / 2 + c, b: null, z0: 0, z1: fT },
    ];
    case 'pattern': return [...bodyBox.map((l) => (l.b === w ? { ...l, z1: H - fT } : l)), { obj: 'body', a: w - ov, b: null, z0: H - fT, z1: H, noHoles: true, pattern: true }, { obj: 'body', a: 0, b: w, z0: H - fT, z1: H, noHoles: true }];
    case 'neon': return [
      { obj: 'body', a: 0, b: null, z0: 0, z1: b },
      { obj: 'body', a: 0, b: w, z0: b, z1: P.neonHeight },
      { obj: 'body', a: w + P.neonWidth, b: null, z0: b, z1: P.neonHeight, noHoles: true },
    ];
    case 'organic': {
      // borda externa arredondada: degraus finos que recuam seguindo um quarto de círculo
      const R = Math.max(0.5, Math.min(P.organicRadius, H - b - fT - 1));
      const wall = Math.max(w, R * 0.6 + w);
      const out: Layer[] = [{ obj: 'body', a: 0, b: null, z0: 0, z1: b }, { obj: 'body', a: 0, b: wall, z0: b, z1: H - R }];
      const steps = Math.max(4, Math.min(12, Math.round(R / 0.35)));
      for (let i = 0; i < steps; i++) {
        const t0 = (i / steps) * R, t1 = ((i + 1) / steps) * R;
        const tm = (t0 + t1) / 2;
        const rec = R - Math.sqrt(Math.max(0, R * R - tm * tm));
        const inner = H - t1 > H - fT ? wall : wall / 2;
        if (rec < inner - 0.4) out.push({ obj: 'body', a: rec, b: inner, z0: H - R + t0, z1: H - R + t1 });
      }
      out.push({ obj: 'face', a: wall / 2 + c, b: null, z0: H - fT, z1: H });
      return out;
    }
  }
  return bodyBox;
}

/** Faixa (recuos em mm) onde o furo de fio pode ficar, por estilo. null = estilo sem furo. */
export function holeBand(style: StyleId, P: Params): [number, number | null] | null {
  switch (style) {
    case 'standing': return null;
    case 'solid': return [0, null];
    case 'openBack': return [P.wall, P.wall + P.ledge];
    case 'doubleLedge': return [P.wall + P.ledge, null];
    case 'backlit': return [P.wall + P.tubeWall, null];
    case 'neon': return [P.wall, P.wall + P.neonWidth];
    case 'organic': return [Math.max(P.wall, P.organicRadius * 0.6 + P.wall), null];
    default: return [P.wall, null];
  }
}

/** Recuo (mm) onde a fita/mangueira de LED corre, para estimar o comprimento. */
export function ledInset(style: StyleId, P: Params): number {
  if (style === 'neon') return P.wall + P.neonWidth / 2;
  if (style === 'organic') return Math.max(P.wall, P.organicRadius * 0.6 + P.wall) + 3;
  return P.wall + 3;
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


function makePart(id: number, name: string, srcMask: Uint8Array, sw: number, lab: Int32Array | null, l: number, bb: number[], style: StyleId, visible: boolean, holes: Hole[], srcC?: Uint8Array): Part {
  const [x0, y0, x1, y1] = bb;
  const w = x1 - x0 + 1 + PAD * 2, h = y1 - y0 + 1 + PAD * 2;
  const mask = new Uint8Array(w * h);
  const cmap = srcC ? new Uint8Array(w * h).fill(255) : undefined;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const sp = y * sw + x;
    if (lab ? lab[sp] === l : srcMask[sp]) {
      const dp = (y - y0 + PAD) * w + (x - x0 + PAD);
      mask[dp] = 1;
      if (cmap) cmap[dp] = srcC![sp];
    }
  }
  return { id, name, ox: x0 - PAD, oy: y0 - PAD, w, h, mask, cmap, bx0: x0, by0: y0, bx1: x1, by1: y1, style, visible, holes };
}

// ---------------------------------------------------------------- detecção do desenho na imagem

/** auto = separa do fundo (transparência ou cor da borda); colors = como auto, mas cada cor vira peça; closed = áreas fechadas por contorno; luma = claro/escuro pelo limiar. */
export type DetectMode = 'auto' | 'colors' | 'closed' | 'luma';
export interface ArtOptions {
  threshold: number; invert: boolean; widthMm: number; minAreaMm2: number;
  mode?: DetectMode;
  tolerance?: number;   // 0 = automático; senão distância de cor ao fundo (0..255)
  fill?: boolean;       // preencher buracos internos (silhueta)
  colors?: number;      // nº de cores para o lightbox (0 = não separar)
}

function otsu(hist: number[], total: number): number {
  let sum = 0;
  for (let i = 0; i < hist.length; i++) sum += i * hist[i];
  let sB = 0, wB = 0, best = 0, th = 0;
  for (let t = 0; t < hist.length; t++) {
    wB += hist[t]; if (!wB) continue;
    const wF = total - wB; if (!wF) break;
    sB += t * hist[t];
    const mB = sB / wB, mF = (sum - sB) / wF;
    const v = wB * wF * (mB - mF) * (mB - mF);
    if (v > best) { best = v; th = t; }
  }
  return th;
}

/** Marca como 1 os pixels "0" que não se ligam à borda da imagem (buracos fechados). */
function enclosed(mask: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(w * h);
  const seen = new Uint8Array(w * h);
  const st = new Int32Array(w * h);
  let sp = 0;
  const push = (i: number) => { if (!mask[i] && !seen[i]) { seen[i] = 1; st[sp++] = i; } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (sp) {
    const p = st[--sp], x = p % w, y = (p / w) | 0;
    if (x > 0) push(p - 1); if (x < w - 1) push(p + 1); if (y > 0) push(p - w); if (y < h - 1) push(p + w);
  }
  for (let i = 0; i < w * h; i++) if (!mask[i] && !seen[i]) out[i] = 1;
  return out;
}

/** Dilatação quadrada de raio r (separável, O(n)). */
function dilate(m: Uint8Array, w: number, h: number, r: number): Uint8Array {
  const t = new Uint8Array(w * h), o = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    let last = -1e9;
    for (let x = 0; x < w; x++) { if (m[y * w + x]) last = x; if (x - last <= r) t[y * w + x] = 1; }
    last = 1e9;
    for (let x = w - 1; x >= 0; x--) { if (m[y * w + x]) last = x; if (last - x <= r) t[y * w + x] = 1; }
  }
  for (let x = 0; x < w; x++) {
    let last = -1e9;
    for (let y = 0; y < h; y++) { if (t[y * w + x]) last = y; if (y - last <= r) o[y * w + x] = 1; }
    last = 1e9;
    for (let y = h - 1; y >= 0; y--) { if (t[y * w + x]) last = y; if (last - y <= r) o[y * w + x] = 1; }
  }
  return o;
}

/** Componentes conectados em que os vizinhos precisam ter a mesma cor (modo "separar por cor"). */
function labelByColor(mask: Uint8Array, cidx: Uint8Array, w: number, h: number) {
  const lab = new Int32Array(w * h);
  const areas: number[] = [0];
  const bb: number[][] = [[0, 0, 0, 0]];
  const stack = new Int32Array(w * h);
  let count = 0;
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || lab[i]) continue;
    count++;
    const c = cidx[i];
    let sp = 0, area = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
    stack[sp++] = i; lab[i] = count;
    while (sp) {
      const p = stack[--sp];
      area++;
      const x = p % w, y = (p / w) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of nb) if (q >= 0 && mask[q] && !lab[q] && cidx[q] === c) { lab[q] = count; stack[sp++] = q; }
    }
    areas.push(area); bb.push([x0, y0, x1, y1]);
  }
  return { lab, count, areas, bb };
}

/** Regiões de cor pequenas (brilhos, sombras, contornos) passam para a região vizinha maior. */
function mergeSmall(L: { lab: Int32Array; count: number; areas: number[]; bb: number[][] }, mask: Uint8Array, w: number, h: number) {
  let total = 0;
  for (let l = 1; l <= L.count; l++) total += L.areas[l];
  const minA = Math.max(50, total * 0.004);
  const lab = L.lab;
  const q = new Int32Array(w * h);
  let qh = 0, qt = 0;
  for (let i = 0; i < w * h; i++) {
    if (!lab[i]) continue;
    if (L.areas[lab[i]] < minA) lab[i] = -1;
  }
  for (let i = 0; i < w * h; i++) if (lab[i] > 0) q[qt++] = i;
  while (qh < qt) {
    const p = q[qh++], x = p % w, y = (p / w) | 0;
    for (const n of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
      if (n >= 0 && lab[n] === -1) { lab[n] = lab[p]; q[qt++] = n; }
    }
  }
  // renumera e recalcula áreas/caixas
  const map = new Map<number, number>();
  const areas: number[] = [0], bb: number[][] = [[0, 0, 0, 0]];
  for (let i = 0; i < w * h; i++) {
    let l = lab[i];
    if (l === -1) { lab[i] = 0; mask[i] = 0; continue; }
    if (!l) continue;
    let k = map.get(l);
    if (k === undefined) { k = areas.length; map.set(l, k); areas.push(0); bb.push([w, h, -1, -1]); }
    lab[i] = k; areas[k]++;
    const x = i % w, y = (i / w) | 0, b = bb[k];
    if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y;
  }
  return { lab, count: areas.length - 1, areas, bb };
}

/** Máscara de "tinta" (1 = desenho) a partir dos pixels RGBA. */
export function inkMask(rgba: ArrayLike<number>, w: number, h: number, o: ArtOptions): Uint8Array {
  const n = w * h;
  const m = new Uint8Array(n);
  const mode = o.mode ?? 'luma';
  // cor composta sobre branco
  const R = new Uint8Array(n), G = new Uint8Array(n), B = new Uint8Array(n);
  let transp = 0;
  for (let i = 0; i < n; i++) {
    const a = rgba[i * 4 + 3] / 255;
    if (a < 0.5) transp++;
    R[i] = rgba[i * 4] * a + 255 * (1 - a); G[i] = rgba[i * 4 + 1] * a + 255 * (1 - a); B[i] = rgba[i * 4 + 2] * a + 255 * (1 - a);
  }
  if (mode === 'luma') {
    for (let i = 0; i < n; i++) {
      let ink = 0.299 * R[i] + 0.587 * G[i] + 0.114 * B[i] < o.threshold;
      if (o.invert) ink = !ink;
      m[i] = ink ? 1 : 0;
    }
  } else if ((mode === 'auto' || mode === 'colors') && transp > n * 0.01) {
    // PNG com fundo transparente: o desenho é o que não é transparente
    for (let i = 0; i < n; i++) m[i] = rgba[i * 4 + 3] >= 128 ? 1 : 0;
    if (o.invert) for (let i = 0; i < n; i++) m[i] = 1 - m[i];
  } else {
    // cor do fundo = mediana da borda; desenho = o que se afasta dessa cor
    const br: number[] = [], bg: number[] = [], bb: number[] = [];
    const add = (i: number) => { br.push(R[i]); bg.push(G[i]); bb.push(B[i]); };
    for (let x = 0; x < w; x++) { add(x); add((h - 1) * w + x); }
    for (let y = 1; y < h - 1; y++) { add(y * w); add(y * w + w - 1); }
    const med = (a: number[]) => { const s = a.slice().sort((p, q) => p - q); return s[s.length >> 1]; };
    const r0 = med(br), g0 = med(bg), b0 = med(bb);
    const dist = new Uint8Array(n);
    const hist = new Array(256).fill(0);
    for (let i = 0; i < n; i++) {
      const d = Math.min(255, Math.round(Math.sqrt((R[i] - r0) ** 2 + (G[i] - g0) ** 2 + (B[i] - b0) ** 2)));
      dist[i] = d; hist[d]++;
    }
    let tol = o.tolerance && o.tolerance > 0 ? o.tolerance : otsu(hist, n);
    if (!(o.tolerance && o.tolerance > 0)) tol = Math.max(14, Math.min(160, tol));
    for (let i = 0; i < n; i++) m[i] = dist[i] > tol ? 1 : 0;
    if (o.invert && mode !== 'closed') for (let i = 0; i < n; i++) m[i] = 1 - m[i];
  }
  if (mode === 'closed') {
    // desenho de contorno: as peças são as áreas fechadas pelas linhas.
    // Engrossa as linhas antes (fecha pequenas falhas) e devolve a espessura às áreas depois.
    const r = Math.max(2, Math.round(Math.min(w, h) * 0.003));
    const e = enclosed(dilate(m, w, h, r), w, h);
    m.set(dilate(e, w, h, r));
  }
  if (o.fill) {
    const e = enclosed(m, w, h);
    for (let i = 0; i < n; i++) if (e[i]) m[i] = 1;
  }
  return m;
}

/** Agrupa as cores do desenho em até k cores (k-means simples). */
function quantize(rgba: ArrayLike<number>, mask: Uint8Array, n: number, k: number): { idx: Uint8Array; palette: string[] } {
  const idx = new Uint8Array(n).fill(255);
  const samp: number[][] = [];
  const step = Math.max(1, Math.floor(n / 40000));
  for (let i = 0; i < n; i += step) if (mask[i]) samp.push([rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]]);
  if (!samp.length) return { idx, palette: [] };
  const cents: number[][] = [samp[0].slice()];
  while (cents.length < k) {
    let bi = -1, bd = -1;
    for (let s = 0; s < samp.length; s++) {
      let md = Infinity;
      for (const c of cents) md = Math.min(md, (samp[s][0] - c[0]) ** 2 + (samp[s][1] - c[1]) ** 2 + (samp[s][2] - c[2]) ** 2);
      if (md > bd) { bd = md; bi = s; }
    }
    if (bd < 900) break; // cores restantes muito parecidas
    cents.push(samp[bi].slice());
  }
  for (let it = 0; it < 8; it++) {
    const acc = cents.map(() => [0, 0, 0, 0]);
    for (const p of samp) {
      let best = 0, bd = Infinity;
      cents.forEach((c, ci) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; best = ci; } });
      acc[best][0] += p[0]; acc[best][1] += p[1]; acc[best][2] += p[2]; acc[best][3]++;
    }
    acc.forEach((a, ci) => { if (a[3]) cents[ci] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; });
  }
  for (let i = 0; i < n; i++) {
    if (!mask[i]) continue;
    let best = 0, bd = Infinity;
    for (let ci = 0; ci < cents.length; ci++) { const c = cents[ci]; const d = (rgba[i * 4] - c[0]) ** 2 + (rgba[i * 4 + 1] - c[1]) ** 2 + (rgba[i * 4 + 2] - c[2]) ** 2; if (d < bd) { bd = d; best = ci; } }
    idx[i] = best;
  }
  const hex = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return { idx, palette: cents.map((c) => `#${hex(c[0])}${hex(c[1])}${hex(c[2])}`) };
}

export function createArt(rgba: ArrayLike<number>, w: number, h: number, o: ArtOptions): Art {
  const m0 = inkMask(rgba, w, h, o);
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  // Descarta pontinhos soltos (ruído de JPG, sombras finas) antes de medir a arte:
  // senão um único pixel escuro vira uma "peça" esticada para a largura total e sem geometria.
  const noise = label4(m0, w, h);
  const minSpeck = Math.max(25, Math.round(w * h * 0.0001));
  for (let i = 0; i < w * h; i++) {
    const l = noise.lab[i];
    if (!l) continue;
    if (noise.areas[l] < minSpeck) { m0[i] = 0; continue; }
    const x = i % w, y = (i / w) | 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 < 0) throw new Error('Nenhuma forma encontrada. Troque o modo de detecção, mexa na sensibilidade/limiar ou marque "Inverter".');
  const tw = x1 - x0 + 1, th = y1 - y0 + 1;
  const s = o.widthMm / tw;
  const mask = new Uint8Array(tw * th);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) mask[y * tw + x] = m0[(y + y0) * w + (x + x0)];
  // cores da imagem (para o lightbox multicolorido)
  let cidx: Uint8Array | undefined;
  let palette: string[] = [];
  const byColor = o.mode === 'colors';
  if ((o.colors ?? 0) > 1 || byColor) {
    const crop = new Uint8ClampedArray(tw * th * 4);
    for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
      const sp = ((y + y0) * w + (x + x0)) * 4, dp = (y * tw + x) * 4;
      crop[dp] = rgba[sp]; crop[dp + 1] = rgba[sp + 1]; crop[dp + 2] = rgba[sp + 2]; crop[dp + 3] = 255;
    }
    const q = quantize(crop, mask, tw * th, Math.min(8, Math.max(2, o.colors || 6)));
    cidx = q.idx; palette = q.palette;
  }
  const L0 = byColor && cidx ? mergeSmall(labelByColor(mask, cidx, tw, th), mask, tw, th) : label4(mask, tw, th);
  const { lab, count, areas, bb } = L0;
  const minPx = (o.minAreaMm2 ?? 4) / (s * s);
  const order: number[] = [];
  for (let l = 1; l <= count; l++) if (areas[l] >= minPx) order.push(l);
  order.sort((a, b) => bb[a][0] - bb[b][0]);
  const raw = order.map((l) => makePart(0, '', mask, tw, lab, l, bb[l], 'boxFace', true, [], cidx));
  const art: Art = { w: tw, h: th, s, parts: raw, nextId: 1, palette };
  // Peças finas demais somem na suavização do contorno; não deixar peça vazia (sem malha 3D).
  const parts = raw.filter((p) => partOutline(art, p).length > 0);
  parts.forEach((p, i) => { p.id = i + 1; p.name = `Peça ${i + 1}`; });
  if (!parts.length) throw new Error('As formas encontradas são finas demais para virar peça. Mexa na sensibilidade, troque o modo de detecção ou use uma imagem com traço mais grosso.');
  art.parts = parts;
  art.nextId = parts.length + 1;
  return art;
}

// ---------------------------------------------------------------- campos e contornos por peça

// caches pela máscara (a mesma máscara é compartilhada quando a peça só é movida/renomeada)
const fieldCache = new WeakMap<Uint8Array, Float32Array>();
function fieldOf(p: Part): Float32Array {
  let f = fieldCache.get(p.mask);
  if (!f) { f = sdField(p.mask, p.w, p.h); fieldCache.set(p.mask, f); }
  return f;
}
const ringCache = new WeakMap<Uint8Array, Map<string, Ring[]>>();
function pxRings(p: Part, isoPx: number): Ring[] {
  let m = ringCache.get(p.mask);
  if (!m) { m = new Map(); ringCache.set(p.mask, m); }
  const key = isoPx.toFixed(4);
  let r = m.get(key);
  if (!r) { r = isoRings(fieldOf(p), p.w, p.h, isoPx); m.set(key, r); }
  return r;
}

function toWorld(r: Ring, ox: number, oy: number, s: number, hPx: number): Ring {
  return r.map(([x, y]) => [(ox + x) * s, (hPx - (oy + y)) * s] as Pt);
}

/** Contornos (mm) da peça deslocados para dentro por `inset` mm. */
export function partRings(art: Art, p: Part, insetMm: number, simplify: number): Ring[] {
  return pxRings(p, insetMm / art.s).map((r) => simplifyRing(toWorld(r, p.ox, p.oy, art.s, art.h), simplify));
}

const outlineCache = new WeakMap<Part, Poly[]>();
export function partOutline(art: Art, p: Part): Poly[] {
  let o = outlineCache.get(p);
  if (!o) { o = nestRings(partRings(art, p, 0, 0.1), 0.05); outlineCache.set(p, o); }
  return o;
}

/** Profundidade (mm) do ponto dentro da peça: distância até a borda (negativa fora). null = longe da peça. */
export function depthAt(art: Art, p: Part, x: number, y: number): number | null {
  const ix = Math.round(x / art.s - p.ox), iy = Math.round(art.h - y / art.s - p.oy);
  if (ix < 0 || iy < 0 || ix >= p.w || iy >= p.h) return null;
  return fieldOf(p)[iy * p.w + ix] * art.s;
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

// ---------------------------------------------------------------- edição: mover, furos, corte

/** Move a peça (mm). O deslocamento é arredondado para o pixel da arte. */
export function movePart(art: Art, partId: number, dxMm: number, dyMm: number): Art {
  const dpx = Math.round(dxMm / art.s), dpy = -Math.round(dyMm / art.s);
  if (!dpx && !dpy) return art;
  const mx = dpx * art.s, my = -dpy * art.s;
  return {
    ...art,
    parts: art.parts.map((p) => (p.id !== partId ? p : {
      ...p, ox: p.ox + dpx, oy: p.oy + dpy, bx0: p.bx0 + dpx, bx1: p.bx1 + dpx, by0: p.by0 + dpy, by1: p.by1 + dpy,
      holes: p.holes.map((h) => ({ ...h, x: h.x + mx, y: h.y + my })),
    })),
  };
}

export function validateHole(art: Art, p: Part, hole: Hole, P: Params, ignoreIndex = -1): string | null {
  if (!(hole.d > 0)) return 'Diâmetro inválido.';
  const band = holeBand(p.style, P);
  if (!band) return `O estilo "${styleInfo(p.style).name}" não leva furo.`;
  const dep = depthAt(art, p, hole.x, hole.y);
  if (dep === null || dep <= 0) return 'Furo fora da peça.';
  const r = hole.d / 2;
  if (dep - r < band[0] + 0.15) {
    if (p.style === 'solid') return 'O furo sai da peça.';
    if (p.style === 'openBack') return 'No fundo vazado o furo só cabe na aba interna (parafuso). Aumente a largura da aba ou diminua o diâmetro.';
    if (p.style === 'backlit') return 'O espaçador encosta na parede. Mova para o centro da letra ou diminua o diâmetro.';
    return 'O furo encosta na parede. Mova para o centro da letra ou diminua o diâmetro.';
  }
  if (band[1] !== null && dep + r > band[1] - 0.15) {
    if (p.style === 'neon') return 'No neon o furo precisa ficar dentro do canal. Diminua o diâmetro ou aumente a largura do canal.';
    return 'O furo não cabe na aba. Diminua o diâmetro ou aumente a aba.';
  }
  const extra = p.style === 'backlit' ? 2 * P.tubeWall : 0;
  for (let i = 0; i < p.holes.length; i++) {
    if (i === ignoreIndex) continue;
    const o = p.holes[i];
    if (Math.hypot(o.x - hole.x, o.y - hole.y) < (o.d + hole.d) / 2 + 0.2 + extra) return 'Furo sobrepõe outro furo.';
  }
  return null;
}

export function addHole(art: Art, partId: number, hole: Hole): Art {
  return { ...art, parts: art.parts.map((p) => (p.id === partId ? { ...p, holes: [...p.holes, hole] } : p)) };
}

/** Acha um ponto válido para o furo de fio: o mais baixo da letra (o fio desce por trás), longe dos outros furos. */
export function autoHolePoint(art: Art, p: Part, P: Params, d: number): Hole | null {
  const band = holeBand(p.style, P);
  if (!band) return null;
  const f = fieldOf(p);
  const step = Math.max(1, Math.round(0.6 / art.s));
  let best: Hole | null = null, bestScore = -Infinity;
  const r = d / 2;
  for (let j = 0; j < p.h; j += step) for (let i = 0; i < p.w; i += step) {
    const dep = f[j * p.w + i] * art.s;
    if (dep - r < band[0] + 0.4) continue;
    if (band[1] !== null && dep + r > band[1] - 0.4) continue;
    const x = (p.ox + i) * art.s, y = (art.h - (p.oy + j)) * art.s;
    // prefere embaixo, com folga da parede
    const score = -y + Math.min(dep - r - band[0], 4) * 3;
    if (score <= bestScore) continue;
    const h = { x, y, d };
    if (validateHole(art, p, h, P) === null) { best = h; bestScore = score; }
  }
  return best;
}

/** Junta várias peças numa só (une as máscaras; mantém nome, estilo e furos da primeira). */
export function mergeParts(art: Art, ids: number[]): Art | null {
  const ps = art.parts.filter((p) => ids.includes(p.id));
  if (ps.length < 2) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of ps) { x0 = Math.min(x0, p.bx0); y0 = Math.min(y0, p.by0); x1 = Math.max(x1, p.bx1); y1 = Math.max(y1, p.by1); }
  const sw = x1 - x0 + 1, sh = y1 - y0 + 1;
  const src = new Uint8Array(sw * sh);
  const hasC = ps.some((p) => p.cmap);
  const srcC = hasC ? new Uint8Array(sw * sh).fill(255) : undefined;
  for (const p of ps) for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) {
    if (!p.mask[j * p.w + i]) continue;
    const x = p.ox + i - x0, y = p.oy + j - y0;
    if (x < 0 || y < 0 || x >= sw || y >= sh) continue;
    src[y * sw + x] = 1;
    if (srcC && p.cmap) srcC[y * sw + x] = p.cmap[j * p.w + i];
  }
  const first = ps[0];
  const np = makePart(first.id, first.name, src, sw, null, 1, [0, 0, sw - 1, sh - 1], first.style, true, ps.flatMap((p) => p.holes), srcC);
  np.ox += x0; np.oy += y0; np.bx0 += x0; np.bx1 += x0; np.by0 += y0; np.by1 += y0;
  const parts: Part[] = [];
  for (const p of art.parts) {
    if (p.id === first.id) parts.push(np);
    else if (!ids.includes(p.id)) parts.push(p);
  }
  return { ...art, parts };
}

/** Corta automaticamente as peças maiores que a mesa (retas verticais/horizontais igualmente espaçadas). */
export function splitToBed(art: Art, maxW: number, maxH: number, kerfMm: number): { art: Art; cuts: number } {
  let cur = art, cuts = 0;
  for (let guard = 0; guard < 200; guard++) {
    const big = cur.parts.find((p) => {
      if (!p.visible) return false;
      const b = partBounds(cur, p);
      return b.x1 - b.x0 > maxW || b.y1 - b.y0 > maxH;
    });
    if (!big) break;
    const b = partBounds(cur, big);
    const wide = (b.x1 - b.x0) / maxW >= (b.y1 - b.y0) / maxH;
    const n = Math.ceil((wide ? b.x1 - b.x0 : b.y1 - b.y0) / (wide ? maxW : maxH));
    const pos = wide ? b.x0 + (b.x1 - b.x0) / n : b.y0 + (b.y1 - b.y0) / n;
    const r = wide ? cutPart(cur, big.id, [pos, b.y0 - 10], [pos, b.y1 + 10], kerfMm) : cutPart(cur, big.id, [b.x0 - 10, pos], [b.x1 + 10, pos], kerfMm);
    if (!r) { cur = { ...cur, parts: cur.parts.map((p) => (p.id === big.id ? { ...p, visible: p.visible } : p)) }; break; }
    cur = r; cuts++;
  }
  return { art: cur, cuts };
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
    const np = makePart(nextId++, `${p.name}.${k + 1}`, mask, p.w, lab, l, [x0, y0, x1, y1], p.style, p.visible, [], p.cmap);
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

function prism(polys: Poly[], z0: number, z1: number): Mesh {
  const mb = new MB();
  addFace(mb, polys, z0, false);
  addFace(mb, polys, z1, true);
  addSides(mb, polyRings(polys), z0, z1);
  return mb.mesh();
}

/** Junta várias cascas fechadas num objeto só (sem fundir vértices entre cascas). */
function mergeMeshes(ms: Mesh[]): Mesh {
  const pos: number[] = [], idx: number[] = [];
  for (const m of ms) {
    const off = pos.length / 3;
    for (const v of m.pos) pos.push(v);
    for (const i of m.idx) idx.push(i + off);
  }
  return { pos, idx };
}

/** Aplica uma transformação de vértice; flip = true inverte a ordem dos triângulos (transformação espelhada). */
function mapMesh(m: Mesh, f: (x: number, y: number, z: number) => [number, number, number], flip: boolean): Mesh {
  const pos: number[] = [];
  for (let i = 0; i < m.pos.length; i += 3) { const [x, y, z] = f(m.pos[i], m.pos[i + 1], m.pos[i + 2]); pos.push(x, y, z); }
  const idx = m.idx.slice();
  if (flip) for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  return { pos, idx };
}

/** O círculo do furo cabe inteiro dentro da faixa [a, b] da peça? */
function holeInBand(art: Art, p: Part, h: Hole, a: number, b: number | null): boolean {
  const dep = depthAt(art, p, h.x, h.y);
  if (dep === null) return false;
  const r = h.d / 2;
  return dep - r >= a + 0.05 && (b === null || dep + r <= b - 0.05);
}

function bandPolys(art: Art, p: Part, a: number, b: number | null, simplify: number, holes: Hole[]): Poly[] {
  const rings = partRings(art, p, a, simplify);
  if (!rings.length) return [];
  if (b !== null) rings.push(...partRings(art, p, b, simplify));
  for (const h of holes) if (holeInBand(art, p, h, a, b)) rings.push(circle(h.x, h.y, h.d, true));
  return nestRings(rings, 0.02);
}

function hexRing(cx: number, cy: number, R: number): Ring {
  const r: Ring = [];
  for (let k = 0; k < 6; k++) { const t = Math.PI / 2 + (k * Math.PI) / 3; r.push([cx + R * Math.cos(t), cy + R * Math.sin(t)]); }
  return r;
}

/** Face vazada: borda cheia + colmeia de células (hexágono com furo redondo) que cabem inteiras na face. */
function patternMeshes(art: Art, p: Part, a: number, z0: number, z1: number, P: Params): Mesh[] {
  const rIn = P.patternHole / 2 + P.patternBar / 2;
  const R = (rIn * 2) / Math.sqrt(3);
  const out: Mesh[] = [];
  const border = bandPolys(art, p, a, a + 2 * R + 0.4, P.simplify, []);
  if (border.length) out.push(prism(border, z0, z1));
  const bnd = partBounds(art, p);
  let row = 0;
  for (let cy = bnd.y0; cy <= bnd.y1; cy += 1.5 * R, row++) {
    for (let cx = bnd.x0 + (row % 2 ? rIn : 0); cx <= bnd.x1; cx += 2 * rIn) {
      const hex = hexRing(cx, cy, R * 1.03);
      if (!hex.every(([x, y]) => { const d = depthAt(art, p, x, y); return d !== null && d >= a + 0.1; })) continue;
      out.push(prism(nestRings([hex, circle(cx, cy, P.patternHole, true)], 0), z0, z1));
    }
  }
  return out;
}

/** Face do lightbox dividida pelas cores da imagem: uma malha por cor. */
function colorFaceMeshes(art: Art, p: Part, a: number, z0: number, z1: number, P: Params): { color: string; ci: number; mesh: Mesh }[] {
  if (!p.cmap || art.palette.length < 2) return [];
  const f = fieldOf(p);
  const out: { color: string; ci: number; mesh: Mesh }[] = [];
  const aPx = (a + 0.2) / art.s;
  for (let ci = 0; ci < art.palette.length; ci++) {
    const sub = new Uint8Array(p.w * p.h);
    let cnt = 0;
    for (let i = 0; i < sub.length; i++) if (p.mask[i] && p.cmap[i] === ci && f[i] >= aPx) { sub[i] = 1; cnt++; }
    if (cnt * art.s * art.s < 2) continue;
    const sf = sdField(sub, p.w, p.h);
    const rings = isoRings(sf, p.w, p.h, 0).map((r) => simplifyRing(toWorld(r, p.ox, p.oy, art.s, art.h), P.simplify));
    const polys = nestRings(rings, 0.5);
    if (!polys.length) continue;
    out.push({ color: art.palette[ci], ci, mesh: prism(polys, z0, z1) });
  }
  return out;
}

export function topZ(art: Art, P: Params): number {
  let z = 0;
  for (const p of art.parts) {
    if (!p.visible) continue;
    for (const l of styleLayers(p.style, P)) z = Math.max(z, l.z1);
  }
  return z;
}

const COLORS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#00acc1', '#6d4c41'];

function partObjects(art: Art, p: Part, i: number, P: Params, warnings: string[], tiltRange: [number, number] | null): SceneObject[] {
  const info = styleInfo(p.style);
  const layers = styleLayers(p.style, P);
  const groups: Record<LayerObj, Mesh[]> = { body: [], face: [], back: [] };
  const extra: SceneObject[] = [];
  for (const L of layers) {
    if (L.z1 - L.z0 < 0.05) continue;
    if (L.pattern) { groups[L.obj].push(...patternMeshes(art, p, L.a, L.z0, L.z1, P)); continue; }
    if (L.colors) {
      const cm = colorFaceMeshes(art, p, L.a, L.z0, L.z1, P);
      if (cm.length) {
        cm.forEach((c) => extra.push({ id: `k${p.id}_${c.ci}`, name: `${p.name} - face cor ${c.ci + 1}`, kind: 'face', partId: p.id, mesh: c.mesh, color: c.color }));
        continue;
      }
    }
    const cut = L.obj !== 'face' && !L.noHoles && p.style !== 'backlit' ? p.holes : [];
    const polys = bandPolys(art, p, L.a, L.b, P.simplify, cut);
    if (polys.length) groups[L.obj].push(prism(polys, L.z0, L.z1));
  }
  if (p.style === 'backlit') {
    for (const h of p.holes) {
      const tube = nestRings([circle(h.x, h.y, h.d + 2 * P.tubeWall, false), circle(h.x, h.y, h.d, true)], 0);
      groups.body.push(prism(tube, -P.standoff, P.height - P.base + 0.01));
    }
    if (!p.holes.length) warnings.push(`${p.name}: retroiluminado sem espaçador. Use a ferramenta Furo (ou "Furos automáticos") para criar os espaçadores.`);
  }
  const objs: SceneObject[] = [];
  const color = COLORS[i % COLORS.length];
  if (groups.body.length) objs.push({ id: `p${p.id}`, name: p.style === 'solid' || p.style === 'standing' ? p.name : `${p.name} - corpo`, kind: 'part', partId: p.id, mesh: mergeMeshes(groups.body), color });
  if (groups.face.length) objs.push({ id: `f${p.id}`, name: `${p.name} - ${info.face ?? 'face'}`, kind: 'face', partId: p.id, mesh: mergeMeshes(groups.face), color: p.style === 'insetPrinted' ? '#f5f5f5' : '#4fc3f7' });
  else if (info.face && !extra.length) warnings.push(`${p.name}: a face ficou vazia (a letra é fina demais para esta folga/parede).`);
  if (groups.back.length) objs.push({ id: `b${p.id}`, name: `${p.name} - ${info.back ?? 'fundo'}`, kind: 'face', partId: p.id, mesh: mergeMeshes(groups.back), color: p.style === 'ledDouble' ? '#81d4fa' : '#90a4ae' });
  objs.push(...extra);
  if (!groups.body.length) warnings.push(`${p.name}: a parede não coube (letra fina demais). Diminua a parede ou aumente a largura total.`);
  if (p.style === 'tilted' && tiltRange) {
    const Htop = P.height - P.faceThickness, b = P.base;
    const dMax = Math.max(0, Math.min(P.height - P.tiltMin, Htop - b - 2));
    const [X0, X1] = tiltRange;
    const map = (x: number, y: number, z: number): [number, number, number] => {
      const d = dMax * Math.min(1, Math.max(0, (x - X0) / (X1 - X0 || 1)));
      if (z <= b + 1e-6) return [x, y, z + d];
      if (z < Htop - 1e-6) return [x, y, z + (d * (Htop - z)) / (Htop - b)];
      return [x, y, z];
    };
    for (const o of objs) o.mesh = mapMesh(o.mesh, map, false);
  }
  return objs;
}

function globalRings(art: Art, isoMmOut: number, simplify: number): Ring[] {
  const G = Math.ceil(isoMmOut / art.s) + 6;
  let mx0 = Infinity, my0 = Infinity, mx1 = -Infinity, my1 = -Infinity;
  for (const p of art.parts) {
    if (!p.visible) continue;
    mx0 = Math.min(mx0, p.ox); my0 = Math.min(my0, p.oy); mx1 = Math.max(mx1, p.ox + p.w); my1 = Math.max(my1, p.oy + p.h);
  }
  if (mx0 === Infinity) return [];
  const ox = mx0 - G, oy = my0 - G;
  const gw = mx1 - mx0 + G * 2, gh = my1 - my0 + G * 2;
  const m = new Uint8Array(gw * gh);
  for (const p of art.parts) {
    if (!p.visible) continue;
    for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) {
      if (!p.mask[j * p.w + i]) continue;
      const x = p.ox + i - ox, y = p.oy + j - oy;
      if (x >= 0 && y >= 0 && x < gw && y < gh) m[y * gw + x] = 1;
    }
  }
  const f = sdField(m, gw, gh);
  return isoRings(f, gw, gh, -isoMmOut / art.s).map((r) => simplifyRing(toWorld(r, ox, oy, art.s, art.h), simplify));
}

export function buildPlate(art: Art, pl: Plate, P: Params, warnings: string[]): Mesh {
  const outer = rrect(pl.x, pl.y, pl.w, pl.h, pl.radius);
  const inner: Ring[] = [];
  if (pl.cornerHoleD > 0) {
    const i = pl.cornerInset;
    for (const [cx, cy] of [[pl.x + i, pl.y + i], [pl.x + pl.w - i, pl.y + i], [pl.x + pl.w - i, pl.y + pl.h - i], [pl.x + i, pl.y + pl.h - i]]) {
      inner.push(circle(cx, cy, pl.cornerHoleD, true));
    }
  }
  for (const h of pl.holes) inner.push(circle(h.x, h.y, h.d, true));
  if (pl.wireHoles && !pl.cutLetters && pl.position === 'back') {
    for (const p of art.parts) {
      if (!p.visible || p.style === 'backlit') continue;
      for (const h of p.holes) if (h.x > pl.x + h.d && h.x < pl.x + pl.w - h.d && h.y > pl.y + h.d && h.y < pl.y + pl.h - h.d) inner.push(circle(h.x, h.y, h.d, true));
    }
  }
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
  return prism(polys, z0, z0 + pl.thickness);
}

/** Luminoso de avanço: caixa dupla face no formato da chapa (redonda se o raio for grande),
 *  prateleira de LED no meio, as letras em relevo na face e um braço com flange para a parede. */
function buildBlade(art: Art, pl: Plate, P: Params, warnings: string[]): SceneObject[] {
  const D = Math.max(20, pl.depth ?? 60);
  const { wall: w, faceThickness: fT, clearance: c, base: b } = P;
  const shape = (inset: number) => rrect(pl.x + inset, pl.y + inset, pl.w - 2 * inset, pl.h - 2 * inset, Math.max(0, pl.radius - inset));
  const band = (a: number, bb: number) => nestRings([shape(a), shape(bb)], 0);
  const cx = pl.x + pl.w / 2, cy = pl.y + pl.h / 2;
  const body: Mesh[] = [
    prism(band(0, w / 2), 0, fT),
    prism(band(0, w), fT, D - fT),
    prism(band(0, w / 2), D - fT, D),
    prism(nestRings([shape(w - 0.3), circle(cx, pl.y + w + 8, 6, true)], 0), D / 2 - b / 2, D / 2 + b / 2),
  ];
  // braço + flange na lateral esquerda
  const armL = 40;
  body.push(prism(nestRings([[[pl.x - armL, cy - 15], [pl.x + w, cy - 15], [pl.x + w, cy + 15], [pl.x - armL, cy + 15]]], 0), D / 2 - 4, D / 2 + 4));
  const FL = 70, FH = D + 30, t = 5;
  const flange2d = nestRings([[[0, 0], [FL, 0], [FL, FH], [0, FH]], circle(FL / 2, 10, 5, true), circle(FL / 2, FH - 10, 5, true)], 0);
  body.push(mapMesh(prism(flange2d, 0, t), (u, v, ww) => [pl.x - armL - ww + 0.01, cy - FL / 2 + u, v - 15], true));
  const objs: SceneObject[] = [
    { id: `c${pl.id}`, name: `${pl.name} - caixa`, kind: 'plate', mesh: mergeMeshes(body), color: '#b0bec5' },
    { id: `cf${pl.id}`, name: `${pl.name} - face frontal`, kind: 'face', mesh: prism(nestRings([shape(w / 2 + c)], 0), D - fT, D), color: '#4fc3f7' },
    { id: `cb${pl.id}`, name: `${pl.name} - face traseira`, kind: 'face', mesh: prism(nestRings([shape(w / 2 + c)], 0), 0, fT), color: '#4fc3f7' },
  ];
  let out = 0;
  art.parts.forEach((p, i) => {
    if (!p.visible) return;
    const bnd = partBounds(art, p);
    if (bnd.x0 < pl.x + w || bnd.x1 > pl.x + pl.w - w || bnd.y0 < pl.y + w || bnd.y1 > pl.y + pl.h - w) { out++; return; }
    const polys = nestRings(partRings(art, p, 0, P.simplify), 0.02);
    if (polys.length) objs.push({ id: `r${p.id}`, name: `${p.name} - relevo`, kind: 'part', partId: p.id, mesh: prism(polys, D, D + 1.2), color: COLORS[i % COLORS.length] });
  });
  if (out) warnings.push(`${pl.name}: ${out} peça(s) fora da caixa do luminoso não viraram relevo. Use "Ajustar ao desenho".`);
  return objs;
}

export function defaultPlate(art: Art, id: number, margin = 10): Plate {
  const b = artBounds(art);
  return {
    id, name: `Chapa ${id}`, x: Math.round((b.x0 - margin) * 10) / 10, y: Math.round((b.y0 - margin) * 10) / 10, w: Math.round((b.x1 - b.x0 + margin * 2) * 10) / 10, h: Math.round((b.y1 - b.y0 + margin * 2) * 10) / 10,
    thickness: 3, radius: 4, position: 'back', cutLetters: false, clearance: 0.3, cornerHoleD: 4, cornerInset: 6, holes: [], visible: true,
    wireHoles: true, kind: 'flat', depth: 60,
  };
}

export function buildScene(art: Art, plates: Plate[], P: Params): { objects: SceneObject[]; warnings: string[] } {
  const objects: SceneObject[] = [];
  const warnings: string[] = [];
  const blade = plates.find((pl) => pl.visible && pl.kind === 'blade');
  const vis = art.parts.filter((p) => p.visible);
  let tiltRange: [number, number] | null = null;
  for (const p of vis) if (p.style === 'tilted') { const b = partBounds(art, p); tiltRange = tiltRange ? [Math.min(tiltRange[0], b.x0), Math.max(tiltRange[1], b.x1)] : [b.x0, b.x1]; }
  if (!blade) {
    // letras em pé: ficam apoiadas na mesma base, pela linha mais baixa
    const standing = vis.filter((p) => p.style === 'standing');
    let Y0 = Infinity, X0 = Infinity, X1 = -Infinity;
    for (const p of standing) { const b = partBounds(art, p); Y0 = Math.min(Y0, b.y0); X0 = Math.min(X0, b.x0); X1 = Math.max(X1, b.x1); }
    art.parts.forEach((p, i) => {
      if (!p.visible) return;
      try {
        let objs = partObjects(art, p, i, P, warnings, tiltRange);
        if (p.style === 'standing') objs = objs.map((o) => ({ ...o, mesh: mapMesh(o.mesh, (x, y, z) => [x, z, y - Y0 + P.standBase], true) }));
        objects.push(...objs);
      } catch (e: any) {
        warnings.push(`${p.name}: falha ao gerar (${e?.message || e}).`);
      }
    });
    if (standing.length) {
      const m = P.standMargin, T = P.solidHeight;
      objects.push({ id: 'standbase', name: 'Base das letras em pé', kind: 'plate', mesh: prism(nestRings([rrect(X0 - m, -m, X1 - X0 + 2 * m, T + 2 * m, Math.min(6, m))], 0), 0, P.standBase), color: '#b0bec5' });
    }
  }
  for (const pl of plates) {
    if (!pl.visible) continue;
    try {
      if (pl.kind === 'blade') { if (pl === blade) objects.push(...buildBlade(art, pl, P, warnings)); continue; }
      objects.push({ id: `c${pl.id}`, name: pl.name, kind: 'plate', mesh: buildPlate(art, pl, P, warnings), color: pl.position === 'back' ? '#b0bec5' : '#81d4fa' });
    } catch (e: any) {
      warnings.push(`${pl.name}: falha ao gerar (${e?.message || e}).`);
    }
  }
  return { objects, warnings };
}

// ---------------------------------------------------------------- fiação

export interface WireItem { partId: number; name: string; ledMm: number; entry: Hole | null; ledRings: Ring[] }
export interface WirePlan { items: WireItem[]; hops: (number | null)[]; ledMm: number; wireMm: number }

function perimeter(r: Ring): number {
  let s = 0;
  for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; s += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  return s;
}

/** Ordem de ligação (da esquerda para a direita), comprimento de LED por letra e fio entre letras. */
export function wiringPlan(art: Art, P: Params): WirePlan {
  const lit = art.parts.filter((p) => p.visible && styleInfo(p.style).lit).sort((a, b) => a.bx0 - b.bx0);
  const items: WireItem[] = lit.map((p) => {
    let rings = partRings(art, p, ledInset(p.style, P), 0.3);
    if (!rings.length) rings = partRings(art, p, P.wall, 0.3);
    return { partId: p.id, name: p.name, ledMm: rings.reduce((s, r) => s + perimeter(r), 0), entry: p.holes[0] ?? null, ledRings: rings };
  });
  const hops: (number | null)[] = [];
  for (let i = 0; i + 1 < items.length; i++) {
    const a = items[i].entry, b = items[i + 1].entry;
    hops.push(a && b ? Math.hypot(b.x - a.x, b.y - a.y) * 1.15 + 40 : null);
  }
  return { items, hops, ledMm: items.reduce((s, x) => s + x.ledMm, 0), wireMm: hops.reduce((s: number, x) => s + (x ?? 0), 0) };
}

// ---------------------------------------------------------------- estatísticas

export function meshStats(m: Mesh) {
  if (!m.pos.length) return { tris: 0, volumeMm3: 0, min: [0, 0, 0], max: [0, 0, 0], size: [0, 0, 0], openEdges: 0 };
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
