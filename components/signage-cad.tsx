'use client';
/* eslint-disable */
// Letreiro CAD - editor de letreiros para impressão 3D (saída 3MF).
// Uso: <SignageCad /> dentro do painel admin. Não depende de nenhuma biblioteca além de React.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as E from '@/lib/signage/engine';

type Tool = 'select' | 'hole' | 'cut';
interface Doc { art: E.Art | null; plates: E.Plate[] }

const STYLE_LABEL: Record<E.StyleId, string> = {
  solid: 'Letra sólida',
  box: 'Letra-caixa (base + parede)',
  boxFace: 'Letra-caixa + face acrílico',
};
const PART_COLORS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#00acc1', '#6d4c41'];
const FONTS = [
  'Arial Black, Impact, sans-serif', 'Impact, Haettenschweiler, sans-serif', 'Georgia, serif', 'Trebuchet MS, sans-serif',
  'Verdana, sans-serif', 'Courier New, monospace', 'Brush Script MT, cursive', 'Comic Sans MS, cursive',
];

// ------------------------------------------------------------------ UI básicos

function Num(p: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; suffix?: string }) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs text-zinc-400">
      <span>{p.label}</span>
      <span className="flex items-center gap-1">
        <input
          type="number"
          className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-right text-zinc-100 outline-none focus:border-emerald-500"
          value={Number.isFinite(p.value) ? p.value : 0}
          step={p.step ?? 1}
          min={p.min}
          max={p.max}
          onChange={(e) => { const v = parseFloat(e.target.value); if (!Number.isNaN(v)) p.onChange(v); }}
        />
        <span className="w-6 text-zinc-500">{p.suffix ?? 'mm'}</span>
      </span>
    </label>
  );
}

function Section(p: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{p.title}</h3>
        {p.right}
      </div>
      <div className="space-y-2">{p.children}</div>
    </section>
  );
}

function Btn(p: { children: React.ReactNode; onClick?: () => void; active?: boolean; disabled?: boolean; tone?: 'primary' | 'danger' | 'ghost'; title?: string; className?: string }) {
  const tone = p.tone ?? 'ghost';
  const base = 'rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40';
  const cls =
    tone === 'primary' ? 'bg-emerald-600 text-white hover:bg-emerald-500'
    : tone === 'danger' ? 'bg-red-600/80 text-white hover:bg-red-500'
    : p.active ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/60'
    : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700';
  return (
    <button type="button" title={p.title} disabled={p.disabled} onClick={p.onClick} className={`${base} ${cls} ${p.className ?? ''}`}>
      {p.children}
    </button>
  );
}

// ------------------------------------------------------------------ render 3D (software, sem WebGL)

interface Cam { yaw: number; pitch: number; dist: number; cx: number; cy: number; cz: number }

function hexRgb(h: string): [number, number, number] {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function render3D(ctx: CanvasRenderingContext2D, W: number, H: number, objs: E.SceneObject[], cam: Cam, explode: number, dpr: number) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1f2937'); g.addColorStop(1, '#0b0f14');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const ex = cam.cx + cam.dist * cp * Math.cos(cam.yaw), ey = cam.cy + cam.dist * cp * Math.sin(cam.yaw), ez = cam.cz + cam.dist * sp;
  let fx = cam.cx - ex, fy = cam.cy - ey, fz = cam.cz - ez;
  let l = Math.hypot(fx, fy, fz); fx /= l; fy /= l; fz /= l;
  let rx = fy, ry = -fx, rz = 0; // f x up(0,0,1)
  l = Math.hypot(rx, ry, rz) || 1; rx /= l; ry /= l; rz /= l;
  const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
  const focal = Math.min(W, H) * 1.05;

  // luz
  let lx = -fx + 0.5 * ux - 0.35 * rx, ly = -fy + 0.5 * uy - 0.35 * ry, lz = -fz + 0.5 * uz - 0.35 * rz;
  l = Math.hypot(lx, ly, lz); lx /= l; ly /= l; lz /= l;

  type T = { d: number; x0: number; y0: number; x1: number; y1: number; x2: number; y2: number; c: string };
  const tris: T[] = [];
  for (const o of objs) {
    const [cr, cg, cb] = hexRgb(o.color);
    const dz = o.kind === 'face' ? explode : o.kind === 'plate' ? (o.id.startsWith('c') && o.color === '#b0bec5' ? -explode : explode * 2) : 0;
    const p = o.mesh.pos, ix = o.mesh.idx;
    const n = p.length / 3;
    const sx = new Float32Array(n), sy = new Float32Array(n), sz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const X = p[i * 3] - ex, Y = p[i * 3 + 1] - ey, Z = p[i * 3 + 2] + dz - ez;
      const zc = X * fx + Y * fy + Z * fz;
      const xc = X * rx + Y * ry + Z * rz, yc = X * ux + Y * uy + Z * uz;
      const inv = focal / Math.max(zc, 1e-3);
      sx[i] = W / 2 + xc * inv; sy[i] = H / 2 - yc * inv; sz[i] = zc;
    }
    for (let t = 0; t < ix.length; t += 3) {
      const a = ix[t], b = ix[t + 1], c = ix[t + 2];
      const ax = p[a * 3], ay = p[a * 3 + 1], az = p[a * 3 + 2];
      const ux1 = p[b * 3] - ax, uy1 = p[b * 3 + 1] - ay, uz1 = p[b * 3 + 2] - az;
      const vx1 = p[c * 3] - ax, vy1 = p[c * 3 + 1] - ay, vz1 = p[c * 3 + 2] - az;
      let nx = uy1 * vz1 - uz1 * vy1, ny = uz1 * vx1 - ux1 * vz1, nz = ux1 * vy1 - uy1 * vx1;
      const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const toEye = (ex - ax) * nx + (ey - ay) * ny + (ez - (az + dz)) * nz;
      if (toEye <= 0) continue; // face de trás
      const lam = Math.max(0, nx * lx + ny * ly + nz * lz);
      const k = 0.28 + 0.72 * lam;
      tris.push({
        d: (sz[a] + sz[b] + sz[c]) / 3, x0: sx[a], y0: sy[a], x1: sx[b], y1: sy[b], x2: sx[c], y2: sy[c],
        c: `rgb(${Math.round(cr * k)},${Math.round(cg * k)},${Math.round(cb * k)})`,
      });
    }
  }
  tris.sort((a, b) => b.d - a.d);
  ctx.lineWidth = 0.7; ctx.lineJoin = 'round';
  for (const t of tris) {
    ctx.beginPath(); ctx.moveTo(t.x0, t.y0); ctx.lineTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2); ctx.closePath();
    ctx.fillStyle = t.c; ctx.strokeStyle = t.c; ctx.fill(); ctx.stroke();
  }
}

// ------------------------------------------------------------------ componente principal

export default function SignageCad() {
  const [doc, setDoc] = useState<Doc>({ art: null, plates: [] });
  const past = useRef<Doc[]>([]);
  const future = useRef<Doc[]>([]);
  const [params, setParams] = useState<E.Params>({ ...E.DEFAULT_PARAMS });
  const [tool, setTool] = useState<Tool>('select');
  const [selId, setSelId] = useState<number | null>(null);
  const [selPlate, setSelPlate] = useState<number | null>(null);
  const [holeD, setHoleD] = useState(4);
  const [cutPts, setCutPts] = useState<E.Pt[]>([]);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [msg, setMsg] = useState<{ t: string; kind: 'ok' | 'err' } | null>(null);
  const [explode, setExplode] = useState(0);
  const [fitTick, setFitTick] = useState(0);

  // fonte
  const srcRef = useRef<{ data: Uint8ClampedArray; w: number; h: number } | null>(null);
  const [opts, setOpts] = useState({ widthMm: 300, threshold: 128, invert: false, minAreaMm2: 4 });
  const [text, setText] = useState('Kitoys');
  const [font, setFont] = useState(FONTS[0]);
  const [srcName, setSrcName] = useState('');

  // export
  const [layout, setLayout] = useState<'print' | 'assembled'>('print');
  const [bedW, setBedW] = useState(256);
  const [bedD, setBedD] = useState(256);
  const [gap, setGap] = useState(5);
  const [onlySel, setOnlySel] = useState(false);
  const [fileName, setFileName] = useState('letreiro');
  const [pricePerKg, setPricePerKg] = useState(20);

  const art = doc.art;
  const flash = useCallback((t: string, kind: 'ok' | 'err' = 'ok') => { setMsg({ t, kind }); }, []);

  // --------------------------------------------------- histórico
  const commit = useCallback((next: Doc) => {
    past.current.push(doc);
    if (past.current.length > 60) past.current.shift();
    future.current = [];
    setDoc(next);
  }, [doc]);
  const undo = useCallback(() => { const p = past.current.pop(); if (!p) return; future.current.push(doc); setDoc(p); }, [doc]);
  const redo = useCallback(() => { const n = future.current.pop(); if (!n) return; past.current.push(doc); setDoc(n); }, [doc]);

  // --------------------------------------------------- entrada: imagem / SVG / texto
  const generate = useCallback((o = opts) => {
    const s = srcRef.current;
    if (!s) return;
    try {
      const a = E.createArt(s.data, s.w, s.h, o);
      past.current.push(doc); future.current = [];
      setDoc({ art: a, plates: [] });
      setSelId(null); setSelPlate(null); setCutPts([]);
      setFitTick((t) => t + 1);
      flash(`${a.parts.length} peça(s) detectada(s). Largura ${o.widthMm} mm.`);
    } catch (e: any) { flash(e?.message || String(e), 'err'); }
  }, [opts, doc, flash]);

  const loadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const nw = img.naturalWidth || 1000, nh = img.naturalHeight || 1000;
      const sc = 1600 / Math.max(nw, nh);
      const w = Math.max(16, Math.round(nw * sc)), h = Math.max(16, Math.round(nh * sc));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      srcRef.current = { data: ctx.getImageData(0, 0, w, h).data, w, h };
      URL.revokeObjectURL(url);
      setSrcName(file.name);
      generate();
    };
    img.onerror = () => { URL.revokeObjectURL(url); flash('Não consegui abrir esse arquivo.', 'err'); };
    img.src = url;
  };

  const renderText = () => {
    const lines = text.split('\n').filter((l) => l.length > 0);
    if (!lines.length) { flash('Digite um texto.', 'err'); return; }
    const fs = 360;
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d')!;
    ctx.font = `${fs}px ${font}`;
    const wMax = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const lh = fs * 1.15;
    c.width = Math.ceil(wMax + 80); c.height = Math.ceil(lh * lines.length + 80);
    const k = Math.min(1, 2200 / c.width);
    const ctx2 = c.getContext('2d')!;
    ctx2.fillStyle = '#fff'; ctx2.fillRect(0, 0, c.width, c.height);
    ctx2.fillStyle = '#000'; ctx2.font = `${fs}px ${font}`; ctx2.textBaseline = 'top';
    lines.forEach((l, i) => ctx2.fillText(l, 40, 40 + i * lh));
    let out = c;
    if (k < 1) {
      out = document.createElement('canvas'); out.width = Math.round(c.width * k); out.height = Math.round(c.height * k);
      const o2 = out.getContext('2d')!; o2.drawImage(c, 0, 0, out.width, out.height);
    }
    const d = out.getContext('2d')!.getImageData(0, 0, out.width, out.height);
    srcRef.current = { data: d.data, w: out.width, h: out.height };
    setSrcName(`Texto: ${lines[0]}${lines.length > 1 ? '…' : ''}`);
    generate();
  };

  // --------------------------------------------------- seleção e edição
  const selPart = useMemo(() => art?.parts.find((p) => p.id === selId) ?? null, [art, selId]);
  const plate = useMemo(() => doc.plates.find((p) => p.id === selPlate) ?? null, [doc.plates, selPlate]);

  const updatePart = (id: number, patch: Partial<E.Part>) => {
    if (!art) return;
    commit({ ...doc, art: { ...art, parts: art.parts.map((p) => (p.id === id ? { ...p, ...patch } : p)) } });
  };
  const deletePart = (id: number) => {
    if (!art) return;
    commit({ ...doc, art: { ...art, parts: art.parts.filter((p) => p.id !== id) } });
    if (selId === id) setSelId(null);
  };
  const setAllStyle = (style: E.StyleId) => { if (!art) return; commit({ ...doc, art: { ...art, parts: art.parts.map((p) => ({ ...p, style })) } }); };
  const updatePlate = (id: number, patch: Partial<E.Plate>) => commit({ ...doc, plates: doc.plates.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const addPlate = () => {
    if (!art) return;
    const id = (doc.plates.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;
    commit({ ...doc, plates: [...doc.plates, E.defaultPlate(art, id)] });
    setSelPlate(id);
  };
  const fitPlate = (margin: number) => {
    if (!art || !plate) return;
    const b = E.artBounds(art);
    updatePlate(plate.id, { x: Math.round((b.x0 - margin) * 10) / 10, y: Math.round((b.y0 - margin) * 10) / 10, w: Math.round((b.x1 - b.x0 + margin * 2) * 10) / 10, h: Math.round((b.y1 - b.y0 + margin * 2) * 10) / 10 });
  };

  const doCut = (id: number, p1: E.Pt, p2: E.Pt) => {
    if (!art) return;
    const r = E.cutPart(art, id, p1, p2, params.kerf);
    if (!r) { flash('Essa reta não separa a peça em duas.', 'err'); return; }
    commit({ ...doc, art: r });
    setSelId(null);
    flash('Peça cortada em partes independentes.');
  };
  const cutAt = (axis: 'v' | 'h', pos: number | null) => {
    if (!art || !selPart) return;
    const b = E.partBounds(art, selPart);
    if (axis === 'v') { const x = pos === null ? (b.x0 + b.x1) / 2 : b.x0 + pos; doCut(selPart.id, [x, b.y0 - 10], [x, b.y1 + 10]); }
    else { const y = pos === null ? (b.y0 + b.y1) / 2 : b.y0 + pos; doCut(selPart.id, [b.x0 - 10, y], [b.x1 + 10, y]); }
  };
  const [cutPos, setCutPos] = useState(50);

  const addHoleAt = (x: number, y: number) => {
    if (!art) return;
    const hit = E.pickPart(art, x, y);
    if (hit) {
      const hole = { x, y, d: holeD };
      const err = E.validateHole(art, hit, hole, params);
      if (err) { flash(err, 'err'); return; }
      commit({ ...doc, art: E.addHole(art, hit.id, hole) });
      setSelId(hit.id);
      flash(`Furo Ø${holeD} mm adicionado.`);
      return;
    }
    if (plate && x >= plate.x && x <= plate.x + plate.w && y >= plate.y && y <= plate.y + plate.h) {
      updatePlate(plate.id, { holes: [...plate.holes, { x, y, d: holeD }] });
      flash(`Furo Ø${holeD} mm na chapa.`);
      return;
    }
    flash('Clique sobre uma peça (ou sobre a chapa selecionada).', 'err');
  };
  const holeCenter = () => {
    if (!art || !selPart) return;
    const b = E.partBounds(art, selPart);
    addHoleAt((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2);
  };
  const removeHole = (partId: number, i: number) => {
    if (!art) return;
    commit({ ...doc, art: { ...art, parts: art.parts.map((p) => (p.id === partId ? { ...p, holes: p.holes.filter((_, k) => k !== i) } : p)) } });
  };

  // --------------------------------------------------- cena 3D (malhas)
  const [scene, setScene] = useState<{ objects: E.SceneObject[]; warnings: string[] }>({ objects: [], warnings: [] });
  const [building, setBuilding] = useState(false);
  useEffect(() => {
    if (!doc.art) { setScene({ objects: [], warnings: [] }); return; }
    setBuilding(true);
    const t = setTimeout(() => {
      try { setScene(E.buildScene(doc.art!, doc.plates, params)); }
      catch (e: any) { setScene({ objects: [], warnings: [String(e?.message || e)] }); }
      setBuilding(false);
    }, 180);
    return () => clearTimeout(t);
  }, [doc, params]);

  const stats = useMemo(() => scene.objects.map((o) => ({ o, s: E.meshStats(o.mesh) })), [scene]);
  const exportObjs = useMemo(() => (onlySel && selId ? scene.objects.filter((o) => o.partId === selId) : scene.objects), [scene, onlySel, selId]);
  const layoutWarn = useMemo(() => E.layoutObjects(exportObjs, { mode: layout, bedW, bedD, gap }).warnings, [exportObjs, layout, bedW, bedD, gap]);
  const totalG = stats.filter((x) => exportObjs.includes(x.o)).reduce((s, x) => s + (x.s.volumeMm3 / 1000) * 1.24, 0);

  const download = () => {
    if (!exportObjs.length) { flash('Nada para exportar.', 'err'); return; }
    const r = E.build3MF(exportObjs, { mode: layout, bedW, bedD, gap });
    const blob = new Blob([r.data as unknown as BlobPart], { type: 'model/3mf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${(fileName || 'letreiro').replace(/[^\w\-]+/g, '_')}.3mf`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    flash(`3MF gerado com ${exportObjs.length} objeto(s).`);
  };

  // --------------------------------------------------- canvas 2D
  const wrap = useRef<HTMLDivElement>(null);
  const cv2 = useRef<HTMLCanvasElement>(null);
  const cv3 = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 800, h: 560 });
  const vw = useRef({ k: 2, vx: 40, vy: 500 });
  const hover = useRef<E.Pt | null>(null);
  const dragRef = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean; button: number } | null>(null);
  const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;

  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: Math.max(200, el.clientWidth), h: Math.max(200, el.clientHeight) }));
    ro.observe(el);
    setSize({ w: Math.max(200, el.clientWidth), h: Math.max(200, el.clientHeight) });
    return () => ro.disconnect();
  }, []);

  const paths = useMemo(() => {
    const m = new Map<number, Path2D>();
    if (!art) return m;
    for (const p of art.parts) {
      const path = new Path2D();
      for (const poly of E.partOutline(art, p)) for (const r of [poly.outer, ...poly.holes]) {
        r.forEach(([x, y], i) => (i === 0 ? path.moveTo(x, y) : path.lineTo(x, y)));
        path.closePath();
      }
      m.set(p.id, path);
    }
    return m;
  }, [art]);

  const fit = useCallback(() => {
    if (!art) return;
    const b = E.artBounds(art);
    let { x0, y0, x1, y1 } = b;
    for (const pl of doc.plates) { x0 = Math.min(x0, pl.x); y0 = Math.min(y0, pl.y); x1 = Math.max(x1, pl.x + pl.w); y1 = Math.max(y1, pl.y + pl.h); }
    const pad = 30;
    const k = Math.min((size.w - pad * 2) / (x1 - x0 || 1), (size.h - pad * 2) / (y1 - y0 || 1));
    const left = pad + (size.w - pad * 2 - (x1 - x0) * k) / 2;
    const top = pad + (size.h - pad * 2 - (y1 - y0) * k) / 2;
    vw.current = { k, vx: left - x0 * k, vy: top + y1 * k };
  }, [art, doc.plates, size]);
  useEffect(() => { fit(); draw2D(); /* eslint-disable-next-line */ }, [fitTick]);

  const draw2D = useCallback(() => {
    const cv = cv2.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const { k, vx, vy } = vw.current;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // grade
    const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    const step = steps.find((s) => s * k >= 36) ?? 1000;
    const wx0 = (0 - vx) / k, wx1 = (size.w - vx) / k, wy1 = (vy - 0) / k, wy0 = (vy - size.h) / k;
    ctx.lineWidth = 1;
    for (let x = Math.floor(wx0 / step) * step; x <= wx1; x += step) { ctx.strokeStyle = x % (step * 5) === 0 ? '#243040' : '#161d27'; ctx.beginPath(); ctx.moveTo(vx + x * k, 0); ctx.lineTo(vx + x * k, size.h); ctx.stroke(); }
    for (let y = Math.floor(wy0 / step) * step; y <= wy1; y += step) { ctx.strokeStyle = y % (step * 5) === 0 ? '#243040' : '#161d27'; ctx.beginPath(); ctx.moveTo(0, vy - y * k); ctx.lineTo(size.w, vy - y * k); ctx.stroke(); }
    ctx.fillStyle = '#5b6b7e'; ctx.font = '10px sans-serif';
    ctx.fillText(`grade ${step} mm`, 8, size.h - 8);
    if (!art) return;
    // mundo
    ctx.save();
    ctx.setTransform(dpr * k, 0, 0, -dpr * k, dpr * vx, dpr * vy);
    for (const pl of doc.plates) {
      if (!pl.visible) continue;
      ctx.beginPath();
      const r = Math.min(pl.radius, pl.w / 2, pl.h / 2);
      if (r > 0.01) {
        ctx.moveTo(pl.x + r, pl.y); ctx.arcTo(pl.x + pl.w, pl.y, pl.x + pl.w, pl.y + pl.h, r); ctx.arcTo(pl.x + pl.w, pl.y + pl.h, pl.x, pl.y + pl.h, r);
        ctx.arcTo(pl.x, pl.y + pl.h, pl.x, pl.y, r); ctx.arcTo(pl.x, pl.y, pl.x + pl.w, pl.y, r); ctx.closePath();
      } else ctx.rect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = pl.position === 'back' ? 'rgba(176,190,197,0.10)' : 'rgba(129,212,250,0.12)';
      ctx.fill();
      ctx.setLineDash([6 / k, 4 / k]); ctx.lineWidth = (pl.id === selPlate ? 2.4 : 1.2) / k;
      ctx.strokeStyle = pl.id === selPlate ? '#4fc3f7' : '#78909c'; ctx.stroke(); ctx.setLineDash([]);
      const holesDraw: E.Hole[] = [...pl.holes];
      if (pl.cornerHoleD > 0) for (const [cx, cy] of [[pl.x + pl.cornerInset, pl.y + pl.cornerInset], [pl.x + pl.w - pl.cornerInset, pl.y + pl.cornerInset], [pl.x + pl.w - pl.cornerInset, pl.y + pl.h - pl.cornerInset], [pl.x + pl.cornerInset, pl.y + pl.h - pl.cornerInset]]) holesDraw.push({ x: cx, y: cy, d: pl.cornerHoleD });
      ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1 / k;
      for (const h of holesDraw) { ctx.beginPath(); ctx.arc(h.x, h.y, h.d / 2, 0, Math.PI * 2); ctx.stroke(); }
    }
    art.parts.forEach((p, i) => {
      if (!p.visible) return;
      const path = paths.get(p.id); if (!path) return;
      const col = PART_COLORS[i % PART_COLORS.length];
      ctx.fillStyle = col + (p.id === selId ? 'cc' : '88');
      ctx.fill(path, 'evenodd');
      ctx.lineWidth = (p.id === selId ? 2.4 : 1) / k; ctx.strokeStyle = p.id === selId ? '#ffffff' : col;
      ctx.stroke(path);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2 / k;
      for (const h of p.holes) { ctx.beginPath(); ctx.arc(h.x, h.y, h.d / 2, 0, Math.PI * 2); ctx.fillStyle = '#0d1117'; ctx.fill(); ctx.stroke(); }
    });
    // pré-visualização da ferramenta
    const hv = hover.current;
    if (tool === 'hole' && hv) {
      const hit = E.pickPart(art, hv[0], hv[1]);
      let ok = false;
      if (hit) ok = E.validateHole(art, hit, { x: hv[0], y: hv[1], d: holeD }, params) === null;
      else if (plate) ok = hv[0] >= plate.x && hv[0] <= plate.x + plate.w && hv[1] >= plate.y && hv[1] <= plate.y + plate.h;
      ctx.beginPath(); ctx.arc(hv[0], hv[1], holeD / 2, 0, Math.PI * 2);
      ctx.fillStyle = ok ? 'rgba(76,175,80,0.45)' : 'rgba(244,67,54,0.45)'; ctx.fill();
      ctx.strokeStyle = ok ? '#66bb6a' : '#ef5350'; ctx.lineWidth = 1.5 / k; ctx.stroke();
    }
    if (tool === 'cut' && (cutPts.length || hv)) {
      const a = cutPts[0] ?? hv!; const b = cutPts.length ? (hv ?? cutPts[0]) : hv!;
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      if (L > 0.01) {
        const far = 5000 / k;
        ctx.beginPath(); ctx.moveTo(a[0] - (dx / L) * far, a[1] - (dy / L) * far); ctx.lineTo(a[0] + (dx / L) * far, a[1] + (dy / L) * far);
        ctx.setLineDash([8 / k, 5 / k]); ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 1.6 / k; ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.beginPath(); ctx.arc(a[0], a[1], 4 / k, 0, Math.PI * 2); ctx.fillStyle = '#ffeb3b'; ctx.fill();
    }
    ctx.restore();
    // medidas da peça selecionada
    if (selPart) {
      const b = E.partBounds(art, selPart);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#e6edf3'; ctx.font = '11px sans-serif';
      ctx.fillText(`${(b.x1 - b.x0).toFixed(1)} × ${(b.y1 - b.y0).toFixed(1)} mm`, vx + b.x0 * k, vy - b.y1 * k - 6);
    }
    if (hv) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#7d8da1'; ctx.font = '10px sans-serif';
      ctx.fillText(`x ${hv[0].toFixed(1)}  y ${hv[1].toFixed(1)} mm`, size.w - 130, size.h - 8);
    }
  }, [art, doc.plates, paths, selId, selPlate, selPart, plate, tool, holeD, cutPts, params, size, dpr]);

  useEffect(() => {
    const cv = cv2.current; if (!cv) return;
    cv.width = Math.round(size.w * dpr); cv.height = Math.round(size.h * dpr);
    if (view === '2d') draw2D();
  }, [size, dpr, view, draw2D]);
  useEffect(() => { if (view === '2d') draw2D(); }, [draw2D, view]);

  const toWorld = (e: { clientX: number; clientY: number }): E.Pt => {
    const r = cv2.current!.getBoundingClientRect();
    return [(e.clientX - r.left - vw.current.vx) / vw.current.k, (vw.current.vy - (e.clientY - r.top)) / vw.current.k];
  };

  const onDown2 = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, vx: vw.current.vx, vy: vw.current.vy, moved: false, button: e.button };
  };
  const onMove2 = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (d) {
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (d.moved || Math.hypot(dx, dy) > 4 || d.button !== 0) {
        d.moved = true;
        vw.current.vx = d.vx + dx; vw.current.vy = d.vy + dy;
      }
    }
    hover.current = toWorld(e);
    draw2D();
  };
  const onUp2 = (e: React.PointerEvent) => {
    const d = dragRef.current; dragRef.current = null;
    if (!d || d.moved || d.button !== 0 || !art) return;
    const [x, y] = toWorld(e);
    if (tool === 'select') {
      const p = E.pickPart(art, x, y);
      setSelId(p ? p.id : null);
      if (!p) setSelPlate(null);
    } else if (tool === 'hole') {
      addHoleAt(x, y);
    } else if (tool === 'cut') {
      if (cutPts.length === 0) { setCutPts([[x, y]]); flash('Clique no segundo ponto da reta de corte.'); }
      else {
        const target = selPart ?? E.pickPart(art, cutPts[0][0], cutPts[0][1]) ?? E.pickPart(art, x, y);
        setCutPts([]);
        if (!target) flash('Selecione a peça que será cortada.', 'err'); else doCut(target.id, cutPts[0], [x, y]);
      }
    }
  };
  useEffect(() => {
    const cv = cv2.current; if (!cv) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const f = Math.pow(1.0018, -e.deltaY);
      const v = vw.current;
      const nk = Math.min(60, Math.max(0.05, v.k * f));
      const wx = (mx - v.vx) / v.k, wy = (v.vy - my) / v.k;
      vw.current = { k: nk, vx: mx - wx * nk, vy: my + wy * nk };
      draw2D();
    };
    cv.addEventListener('wheel', onWheel, { passive: false });
    return () => cv.removeEventListener('wheel', onWheel);
  }, [draw2D]);

  // --------------------------------------------------- canvas 3D
  const cam = useRef<Cam>({ yaw: -Math.PI / 2 - 0.5, pitch: 0.65, dist: 600, cx: 0, cy: 0, cz: 0 });
  const camDrag = useRef<{ x: number; y: number; yaw: number; pitch: number; cx: number; cy: number; cz: number; pan: boolean } | null>(null);
  const draw3D = useCallback(() => {
    const cv = cv3.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    render3D(ctx, size.w, size.h, scene.objects, cam.current, explode, dpr);
  }, [scene, explode, size, dpr]);
  useEffect(() => {
    const cv = cv3.current; if (!cv) return;
    cv.width = Math.round(size.w * dpr); cv.height = Math.round(size.h * dpr);
    if (view === '3d') draw3D();
  }, [size, dpr, view, draw3D]);
  useEffect(() => { if (view === '3d') draw3D(); }, [draw3D, view]);
  const frame3D = useCallback(() => {
    if (!scene.objects.length) return;
    let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (const x of stats) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], x.s.min[k]); mx[k] = Math.max(mx[k], x.s.max[k]); }
    const sz = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2], 20);
    cam.current = { ...cam.current, cx: (mn[0] + mx[0]) / 2, cy: (mn[1] + mx[1]) / 2, cz: (mn[2] + mx[2]) / 2, dist: sz * 1.15 };
  }, [scene, stats]);
  useEffect(() => { frame3D(); if (view === '3d') draw3D(); /* eslint-disable-next-line */ }, [scene.objects.length, fitTick]);
  useEffect(() => {
    const cv = cv3.current; if (!cv) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); cam.current.dist = Math.max(10, cam.current.dist * Math.pow(1.0015, e.deltaY)); draw3D(); };
    cv.addEventListener('wheel', onWheel, { passive: false });
    return () => cv.removeEventListener('wheel', onWheel);
  }, [draw3D]);

  // --------------------------------------------------- teclado
  const onKey = (e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    else if (e.key === 'Delete' && selId) deletePart(selId);
    else if (e.key === 'Escape') { setCutPts([]); setTool('select'); }
    else if (e.key.toLowerCase() === 'v') setTool('select');
    else if (e.key.toLowerCase() === 'f') setTool('hole');
    else if (e.key.toLowerCase() === 'c') setTool('cut');
  };

  // --------------------------------------------------- tela
  const total = stats.filter((x) => exportObjs.includes(x.o));
  return (
    <div className="space-y-3 text-zinc-100 outline-none" tabIndex={0} onKeyDown={onKey} data-testid="signage-cad">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Letreiro CAD</h2>
          <p className="text-xs text-zinc-400">Suba uma imagem, digite um texto ou carregue um SVG. Edite as peças e exporte em 3MF.</p>
        </div>
        <div className="flex gap-2">
          <Btn onClick={undo} disabled={!past.current.length} title="Desfazer (Ctrl+Z)">↶ Desfazer</Btn>
          <Btn onClick={redo} disabled={!future.current.length} title="Refazer (Ctrl+Y)">↷ Refazer</Btn>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
        {/* ---------- coluna esquerda */}
        <div className="space-y-3">
          <Section title="1. Origem do desenho">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-600 bg-zinc-950/60 px-3 py-4 text-center text-xs text-zinc-300 hover:border-emerald-500">
              <span className="font-medium">Subir imagem ou SVG</span>
              <span className="text-[11px] text-zinc-500">PNG, JPG, WEBP ou SVG. Fundo claro, forma escura.</span>
              <input data-testid="file-input" type="file" accept="image/*,.svg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ''; }} />
            </label>
            <div className="space-y-2 rounded-lg bg-zinc-950/50 p-2">
              <textarea data-testid="text-input" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ou digite o texto…"
                className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm outline-none focus:border-emerald-500" />
              <select value={font} onChange={(e) => setFont(e.target.value)} className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs">
                {FONTS.map((f) => <option key={f} value={f}>{f.split(',')[0]}</option>)}
              </select>
              <Btn tone="primary" className="w-full" onClick={renderText}>Gerar letras do texto</Btn>
            </div>
            {srcName && <p className="truncate text-[11px] text-zinc-500">Fonte atual: {srcName}</p>}
            <Num label="Largura total" value={opts.widthMm} step={10} min={10} onChange={(v) => setOpts({ ...opts, widthMm: v })} />
            <label className="flex items-center justify-between gap-2 text-xs text-zinc-400">
              <span>Limiar</span>
              <input type="range" min={20} max={235} value={opts.threshold} onChange={(e) => setOpts({ ...opts, threshold: +e.target.value })} className="w-32 accent-emerald-500" />
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input type="checkbox" checked={opts.invert} onChange={(e) => setOpts({ ...opts, invert: e.target.checked })} /> Inverter (forma clara em fundo escuro)
            </label>
            <Btn className="w-full" disabled={!srcRef.current} onClick={() => generate(opts)} title="Refaz as peças com estes ajustes (perde as edições)">Regenerar peças</Btn>
          </Section>

          <Section title="2. Medidas da letra-caixa">
            <Num label="Espessura da base" value={params.base} step={0.2} min={0.4} onChange={(v) => setParams({ ...params, base: v })} />
            <Num label="Espessura da parede" value={params.wall} step={0.2} min={0.4} onChange={(v) => setParams({ ...params, wall: v })} />
            <Num label="Altura da caixa" value={params.height} step={1} min={3} onChange={(v) => setParams({ ...params, height: v })} />
            <Num label="Altura da letra sólida" value={params.solidHeight} step={1} min={1} onChange={(v) => setParams({ ...params, solidHeight: v })} />
            <Num label="Espessura da face acrílico" value={params.faceThickness} step={0.1} min={0.5} onChange={(v) => setParams({ ...params, faceThickness: v })} />
            <Num label="Folga do encaixe" value={params.clearance} step={0.05} min={0} onChange={(v) => setParams({ ...params, clearance: v })} />
            <Num label="Largura do corte" value={params.kerf} step={0.1} min={0.1} onChange={(v) => setParams({ ...params, kerf: v })} />
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-zinc-400">Estilo de todas:</span>
              <select disabled={!art} onChange={(e) => e.target.value && setAllStyle(e.target.value as E.StyleId)} value="" className="flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs">
                <option value="">escolher…</option>
                {(Object.keys(STYLE_LABEL) as E.StyleId[]).map((s) => <option key={s} value={s}>{STYLE_LABEL[s]}</option>)}
              </select>
            </div>
          </Section>
        </div>

        {/* ---------- centro */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1">
              <Btn active={view === '2d'} onClick={() => setView('2d')}>Editor 2D</Btn>
              <Btn active={view === '3d'} onClick={() => setView('3d')}>Visualização 3D</Btn>
            </div>
            {view === '2d' ? (
              <div className="flex flex-wrap gap-1">
                <Btn active={tool === 'select'} onClick={() => { setTool('select'); setCutPts([]); }} title="V">Selecionar</Btn>
                <Btn active={tool === 'hole'} onClick={() => { setTool('hole'); setCutPts([]); }} title="F">Furo</Btn>
                <Btn active={tool === 'cut'} onClick={() => { setTool('cut'); setCutPts([]); }} title="C">Corte</Btn>
                <Btn onClick={() => { fit(); draw2D(); }}>Ajustar</Btn>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-zinc-400">Montagem
                  <input type="range" min={0} max={60} value={explode} onChange={(e) => setExplode(+e.target.value)} className="w-28 accent-emerald-500" />
                  <span className="w-10 text-right text-zinc-300">{explode} mm</span>
                </label>
                <Btn onClick={() => { frame3D(); draw3D(); }}>Ajustar</Btn>
              </div>
            )}
          </div>

          <div ref={wrap} className="relative h-[560px] overflow-hidden rounded-xl border border-zinc-800 bg-[#0d1117]">
            <canvas ref={cv2} data-testid="canvas-2d" style={{ width: size.w, height: size.h, touchAction: 'none', cursor: tool === 'select' ? 'default' : 'crosshair', display: view === '2d' ? 'block' : 'none' }}
              onPointerDown={onDown2} onPointerMove={onMove2} onPointerUp={onUp2} onPointerLeave={() => { hover.current = null; draw2D(); }} onContextMenu={(e) => e.preventDefault()} />
            <canvas ref={cv3} data-testid="canvas-3d" style={{ width: size.w, height: size.h, touchAction: 'none', cursor: 'grab', display: view === '3d' ? 'block' : 'none' }}
              onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); const c = cam.current; camDrag.current = { x: e.clientX, y: e.clientY, yaw: c.yaw, pitch: c.pitch, cx: c.cx, cy: c.cy, cz: c.cz, pan: e.button !== 0 || e.shiftKey }; }}
              onPointerMove={(e) => {
                const d = camDrag.current; if (!d) return;
                const dx = e.clientX - d.x, dy = e.clientY - d.y;
                if (d.pan) {
                  const c = cam.current, s = c.dist / 700;
                  cam.current = { ...c, cx: d.cx + Math.sin(c.yaw) * dx * s, cy: d.cy - Math.cos(c.yaw) * dx * s, cz: d.cz + dy * s };
                } else cam.current = { ...cam.current, yaw: d.yaw - dx * 0.008, pitch: Math.max(-1.45, Math.min(1.45, d.pitch + dy * 0.008)) };
                draw3D();
              }}
              onPointerUp={() => { camDrag.current = null; }} onContextMenu={(e) => e.preventDefault()} />
            {!art && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center text-sm text-zinc-500">
                Suba uma imagem ou digite um texto<br />para começar.
              </div>
            )}
            {building && <div className="absolute right-3 top-3 rounded bg-zinc-800/90 px-2 py-1 text-[11px] text-zinc-300">Gerando 3D…</div>}
            {view === '2d' && tool === 'cut' && <div className="absolute left-3 top-3 rounded bg-zinc-800/90 px-2 py-1 text-[11px] text-yellow-300">Corte: clique em 2 pontos para traçar a reta (Esc cancela)</div>}
            {view === '2d' && tool === 'hole' && <div className="absolute left-3 top-3 rounded bg-zinc-800/90 px-2 py-1 text-[11px] text-emerald-300">Furo Ø{holeD} mm: clique dentro da peça (verde = válido)</div>}
          </div>
          {msg && <div data-testid="status" className={`rounded-lg px-3 py-2 text-xs ${msg.kind === 'err' ? 'bg-red-950/70 text-red-300' : 'bg-emerald-950/60 text-emerald-300'}`}>{msg.t}</div>}
          {scene.warnings.map((w, i) => <div key={i} className="rounded-lg bg-amber-950/50 px-3 py-2 text-xs text-amber-300">{w}</div>)}
        </div>

        {/* ---------- coluna direita */}
        <div className="space-y-3">
          <Section title={`Peças (${art?.parts.length ?? 0})`}>
            {!art && <p className="text-xs text-zinc-500">Nenhuma peça ainda.</p>}
            <div className="max-h-52 space-y-1 overflow-auto pr-1">
              {art?.parts.map((p, i) => {
                const b = E.partBounds(art, p);
                return (
                  <div key={p.id} onClick={() => { setSelId(p.id); setSelPlate(null); }}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-xs ${p.id === selId ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-600'}`}>
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: PART_COLORS[i % PART_COLORS.length] }} />
                    <input value={p.name} onClick={(e) => e.stopPropagation()} onChange={(e) => updatePart(p.id, { name: e.target.value })} className="w-0 flex-1 bg-transparent outline-none" />
                    <span className="text-[10px] text-zinc-500">{(b.x1 - b.x0).toFixed(0)}×{(b.y1 - b.y0).toFixed(0)}</span>
                    <button title="Mostrar/ocultar" className="text-zinc-400 hover:text-white" onClick={(e) => { e.stopPropagation(); updatePart(p.id, { visible: !p.visible }); }}>{p.visible ? '👁' : '—'}</button>
                    <button title="Excluir (Del)" className="text-zinc-500 hover:text-red-400" onClick={(e) => { e.stopPropagation(); deletePart(p.id); }}>✕</button>
                  </div>
                );
              })}
            </div>
          </Section>

          {selPart && art && (
            <Section title={`Peça selecionada: ${selPart.name}`}>
              <select value={selPart.style} onChange={(e) => updatePart(selPart.id, { style: e.target.value as E.StyleId })} className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs">
                {(Object.keys(STYLE_LABEL) as E.StyleId[]).map((s) => <option key={s} value={s}>{STYLE_LABEL[s]}</option>)}
              </select>
              <div className="rounded-lg bg-zinc-950/50 p-2">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Furos na base</div>
                <Num label="Diâmetro do furo" value={holeD} step={0.5} min={0.5} onChange={setHoleD} />
                <div className="mt-2 flex gap-1">
                  <Btn onClick={() => setTool('hole')} active={tool === 'hole'}>Clicar na peça</Btn>
                  <Btn onClick={holeCenter}>No centro</Btn>
                </div>
                {selPart.holes.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {selPart.holes.map((h, i) => (
                      <li key={i} className="flex items-center justify-between rounded bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300">
                        <span>Ø{h.d} mm em ({h.x.toFixed(1)}, {h.y.toFixed(1)})</span>
                        <button className="text-zinc-500 hover:text-red-400" onClick={() => removeHole(selPart.id, i)}>✕</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-lg bg-zinc-950/50 p-2">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Cortar a peça</div>
                <div className="flex gap-1">
                  <Btn onClick={() => cutAt('v', null)}>Meio vertical</Btn>
                  <Btn onClick={() => cutAt('h', null)}>Meio horizontal</Btn>
                </div>
                <div className="mt-2"><Num label="Posição a partir da esquerda/base" value={cutPos} step={5} min={1} onChange={setCutPos} /></div>
                <div className="mt-1 flex gap-1">
                  <Btn onClick={() => cutAt('v', cutPos)}>Cortar em X</Btn>
                  <Btn onClick={() => cutAt('h', cutPos)}>Cortar em Y</Btn>
                  <Btn active={tool === 'cut'} onClick={() => setTool('cut')}>Traçar reta</Btn>
                </div>
              </div>
            </Section>
          )}

          <Section title="Chapa / tampa" right={<Btn onClick={addPlate} disabled={!art}>+ Chapa</Btn>}>
            {doc.plates.length === 0 && <p className="text-xs text-zinc-500">Adicione uma chapa acrílica de fundo ou uma tampa com os recortes das letras.</p>}
            <div className="flex flex-wrap gap-1">
              {doc.plates.map((p) => <Btn key={p.id} active={p.id === selPlate} onClick={() => { setSelPlate(p.id); setSelId(null); }}>{p.name}</Btn>)}
            </div>
            {plate && (
              <div className="space-y-2">
                <input value={plate.name} onChange={(e) => updatePlate(plate.id, { name: e.target.value })} className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs" />
                <Num label="Largura" value={plate.w} step={5} min={5} onChange={(v) => updatePlate(plate.id, { w: v })} />
                <Num label="Altura" value={plate.h} step={5} min={5} onChange={(v) => updatePlate(plate.id, { h: v })} />
                <Num label="Posição X" value={plate.x} step={1} onChange={(v) => updatePlate(plate.id, { x: v })} />
                <Num label="Posição Y" value={plate.y} step={1} onChange={(v) => updatePlate(plate.id, { y: v })} />
                <Num label="Espessura" value={plate.thickness} step={0.5} min={0.4} onChange={(v) => updatePlate(plate.id, { thickness: v })} />
                <Num label="Raio dos cantos" value={plate.radius} step={1} min={0} onChange={(v) => updatePlate(plate.id, { radius: v })} />
                <div className="flex gap-1">
                  <Btn active={plate.position === 'back'} onClick={() => updatePlate(plate.id, { position: 'back' })}>Atrás (fundo)</Btn>
                  <Btn active={plate.position === 'front'} onClick={() => updatePlate(plate.id, { position: 'front' })}>À frente (tampa)</Btn>
                </div>
                <label className="flex items-center gap-2 text-xs text-zinc-300">
                  <input type="checkbox" checked={plate.cutLetters} onChange={(e) => updatePlate(plate.id, { cutLetters: e.target.checked })} /> Recortar o formato das letras
                </label>
                {plate.cutLetters && <Num label="Folga do recorte" value={plate.clearance} step={0.1} min={0} onChange={(v) => updatePlate(plate.id, { clearance: v })} />}
                <Num label="Furos de canto Ø (0 = sem)" value={plate.cornerHoleD} step={0.5} min={0} onChange={(v) => updatePlate(plate.id, { cornerHoleD: v })} />
                <Num label="Recuo dos furos" value={plate.cornerInset} step={1} min={1} onChange={(v) => updatePlate(plate.id, { cornerInset: v })} />
                <div className="flex gap-1">
                  <Btn onClick={() => fitPlate(10)}>Ajustar ao desenho</Btn>
                  <Btn tone="danger" onClick={() => { commit({ ...doc, plates: doc.plates.filter((p) => p.id !== plate.id) }); setSelPlate(null); }}>Excluir</Btn>
                </div>
                {plate.holes.length > 0 && (
                  <ul className="space-y-1">
                    {plate.holes.map((h, i) => (
                      <li key={i} className="flex items-center justify-between rounded bg-zinc-950 px-2 py-1 text-[11px] text-zinc-300">
                        <span>Ø{h.d} mm em ({h.x.toFixed(1)}, {h.y.toFixed(1)})</span>
                        <button className="text-zinc-500 hover:text-red-400" onClick={() => updatePlate(plate.id, { holes: plate.holes.filter((_, k) => k !== i) })}>✕</button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-[11px] text-zinc-500">Dica: com a chapa selecionada, use a ferramenta Furo e clique na chapa para furar.</p>
              </div>
            )}
          </Section>

          <Section title="Exportar 3MF">
            <input value={fileName} onChange={(e) => setFileName(e.target.value)} className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs" placeholder="nome do arquivo" />
            <div className="flex gap-1">
              <Btn active={layout === 'print'} onClick={() => setLayout('print')} title="Cada peça apoiada na mesa, lado a lado">Para imprimir</Btn>
              <Btn active={layout === 'assembled'} onClick={() => setLayout('assembled')} title="Peças na posição de montagem">Montado</Btn>
            </div>
            {layout === 'print' && (
              <>
                <Num label="Mesa largura" value={bedW} step={10} min={50} onChange={setBedW} />
                <Num label="Mesa profundidade" value={bedD} step={10} min={50} onChange={setBedD} />
                <Num label="Espaço entre peças" value={gap} step={1} min={0} onChange={setGap} />
              </>
            )}
            <label className="flex items-center gap-2 text-xs text-zinc-300"><input type="checkbox" checked={onlySel} onChange={(e) => setOnlySel(e.target.checked)} disabled={!selId} /> Só a peça selecionada</label>
            {layoutWarn.map((w, i) => <div key={i} className="rounded bg-amber-950/50 px-2 py-1 text-[11px] text-amber-300">{w}</div>)}
            <div className="max-h-40 space-y-1 overflow-auto text-[11px] text-zinc-400">
              {total.map(({ o, s }) => (
                <div key={o.id} className="flex justify-between gap-2"><span className="truncate">{o.name}</span><span className="shrink-0">{s.size[0].toFixed(0)}×{s.size[1].toFixed(0)}×{s.size[2].toFixed(0)} · {((s.volumeMm3 / 1000) * 1.24).toFixed(0)} g</span></div>
              ))}
            </div>
            <label className="flex items-center justify-between gap-2 text-xs text-zinc-400"><span>Filamento por kg</span><input type="number" value={pricePerKg} onChange={(e) => setPricePerKg(parseFloat(e.target.value) || 0)} className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-right text-zinc-100" /></label>
            <div className="flex justify-between text-xs text-zinc-300"><span>Peso máx. (PLA sólido)</span><span>{totalG.toFixed(0)} g · custo {(totalG / 1000 * pricePerKg).toFixed(2)}</span></div>
            <Btn tone="primary" className="w-full py-2 text-sm" disabled={!exportObjs.length || building} onClick={download} title="Baixa um arquivo .3mf com um objeto por peça">Baixar 3MF</Btn>
          </Section>
        </div>
      </div>
    </div>
  );
}
