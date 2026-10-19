// Detecta as areas pintaveis de um desenho de colorir (traco escuro sobre
// fundo claro ou transparente) — usado na amostra "pintar" de qualquer
// produto. Mesmo metodo do mapa pronto do triceratops:
//  1. linhas = pixels escuros;
//  2. fundo = o que se alcanca a partir da borda sem cruzar as linhas
//     engrossadas (fecha as falhas do contorno externo) e depois volta ate a
//     linha original;
//  3. areas = pedacos fechados por dentro (linhas um pouco engrossadas);
//  4. areas pequenas demais somem e linhas/sobras viram parte da area vizinha
//     (pintar nao deixa borda branca).

export type ColoringRegions = {
  w: number;
  h: number;
  lum: Uint8Array;     // luminosidade do desenho (mantem o traco ao pintar)
  label: Int32Array;   // area de cada pixel (0 = fundo)
  paintable: number[];
};

const LINE = 150;

// Engrossa uma mascara binaria por `r` px (janela quadrada, separavel).
function dilate(mask: Uint8Array, w: number, h: number, r: number) {
  if (r <= 0) return mask.slice();
  const tmp = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    let count = 0;
    const row = y * w;
    for (let x = -r; x < w; x++) {
      const add = x + r;
      if (add < w && mask[row + add]) count++;
      const rem = x - r - 1;
      if (rem >= 0 && mask[row + rem]) count--;
      if (x >= 0) tmp[row + x] = count > 0 ? 1 : 0;
    }
  }
  for (let x = 0; x < w; x++) {
    let count = 0;
    for (let y = -r; y < h; y++) {
      const add = y + r;
      if (add < h && tmp[add * w + x]) count++;
      const rem = y - r - 1;
      if (rem >= 0 && tmp[rem * w + x]) count--;
      if (y >= 0) out[y * w + x] = count > 0 ? 1 : 0;
    }
  }
  return out;
}

export function detectRegions(data: ImageData): ColoringRegions {
  const { width: w, height: h } = data;
  const n = w * h;
  const lum = new Uint8Array(n);
  const dark = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const a = data.data[i * 4 + 3] / 255;
    const r = data.data[i * 4], g = data.data[i * 4 + 1], b = data.data[i * 4 + 2];
    // Transparente conta como branco.
    const l = Math.round((0.299 * r + 0.587 * g + 0.114 * b) * a + 255 * (1 - a));
    lum[i] = l;
    dark[i] = l < LINE ? 1 : 0;
  }

  const scale = Math.max(w, h) / 700;
  const closed = dilate(dark, w, h, Math.max(4, Math.round(12 * scale)));

  // Fundo: a partir da borda, sem cruzar as linhas engrossadas.
  const outside = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0, tail = 0;
  const seed = (p: number) => { if (!outside[p] && !closed[p]) { outside[p] = 1; queue[tail++] = p; } };
  for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
  const neighbors = (p: number, fn: (q: number) => void) => {
    const x = p % w;
    if (x > 0) fn(p - 1);
    if (x < w - 1) fn(p + 1);
    if (p >= w) fn(p - w);
    if (p < n - w) fn(p + w);
  };
  while (head < tail) neighbors(queue[head++], (q) => seed(q));

  // Volta o fundo ate a linha original (desfaz o engrossamento por fora).
  const dist = new Int16Array(n).fill(-1);
  head = 0; tail = 0;
  for (let p = 0; p < n; p++) if (outside[p]) { dist[p] = 0; queue[tail++] = p; }
  const maxGrow = Math.max(4, Math.round(13 * scale));
  while (head < tail) {
    const p = queue[head++];
    if (dist[p] >= maxGrow) continue;
    neighbors(p, (q) => {
      if (dist[q] !== -1 || dark[q]) return;
      dist[q] = dist[p] + 1;
      outside[q] = 1;
      queue[tail++] = q;
    });
  }

  // Areas por dentro, com as linhas um pouco engrossadas.
  const lines = dilate(dark, w, h, Math.max(1, Math.round(2 * scale)));
  const raw = new Int32Array(n).fill(-1);
  const sizes: number[] = [];
  for (let start = 0; start < n; start++) {
    if (raw[start] !== -1 || outside[start] || lines[start]) continue;
    const id = sizes.length;
    let size = 0;
    head = 0; tail = 0;
    queue[tail++] = start;
    raw[start] = id;
    while (head < tail) {
      const p = queue[head++];
      size++;
      neighbors(p, (q) => {
        if (raw[q] !== -1 || outside[q] || lines[q]) return;
        raw[q] = id;
        queue[tail++] = q;
      });
    }
    sizes.push(size);
  }

  // Tira os pedacos minusculos e espalha as areas pelas linhas/sobras.
  const minArea = Math.round(300 * scale * scale);
  const remap = new Int32Array(sizes.length).fill(0);
  let next = 1;
  sizes.forEach((s, id) => { if (s >= minArea) remap[id] = next++; });
  const label = new Int32Array(n);
  head = 0; tail = 0;
  for (let p = 0; p < n; p++) {
    if (raw[p] >= 0 && remap[raw[p]]) { label[p] = remap[raw[p]]; queue[tail++] = p; }
  }
  while (head < tail) {
    const p = queue[head++];
    neighbors(p, (q) => {
      if (label[q] || outside[q]) return;
      label[q] = label[p];
      queue[tail++] = q;
    });
  }

  const paintable = Array.from({ length: next - 1 }, (_, i) => i + 1);
  return { w, h, lum, label, paintable };
}

// Carrega a imagem (mesma origem ou com CORS liberado) e detecta as areas,
// limitando o maior lado a ~700 px pra ficar rapido no celular.
export async function loadColoringRegions(src: string): Promise<ColoringRegions> {
  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  await img.decode();
  const k = Math.min(1, 700 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * k));
  const h = Math.max(1, Math.round(img.naturalHeight * k));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return detectRegions(ctx.getImageData(0, 0, w, h));
}
