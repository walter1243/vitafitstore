'use client';
/* eslint-disable */
// Letreiro CAD - editor de letreiros para impressão 3D (saída 3MF).
// Uso: <SignageCad /> dentro do painel admin. Não depende de nenhuma biblioteca além de React.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as E from '@/lib/signage/engine';
import { Cam, render3D } from '@/lib/signage/render3d';
import LithophaneStudio from '@/components/lithophane-studio';

type Tool = 'select' | 'hole' | 'cut';
interface Doc { art: E.Art | null; plates: E.Plate[] }

const PART_COLORS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#00acc1', '#6d4c41'];
const FONTS = [
  'Arial Black, Impact, sans-serif', 'Impact, Haettenschweiler, sans-serif', 'Georgia, serif', 'Trebuchet MS, sans-serif',
  'Verdana, sans-serif', 'Courier New, monospace', 'Brush Script MT, cursive', 'Comic Sans MS, cursive',
];
const PRINTERS: { name: string; w: number; d: number }[] = [
  { name: 'Bambu Lab P1S / P1P / X1C', w: 256, d: 256 },
  { name: 'Bambu Lab A1', w: 256, d: 256 },
  { name: 'Bambu Lab A1 mini', w: 180, d: 180 },
  { name: 'Creality Ender 3 / K1', w: 220, d: 220 },
  { name: 'Prusa MK4', w: 250, d: 210 },
];
const DETECT: { id: E.DetectMode; label: string; tip: string }[] = [
  { id: 'auto', label: 'Automático (separa do fundo)', tip: 'PNG sem fundo usa a transparência; JPG usa a cor da borda como fundo. Cada forma solta vira uma peça.' },
  { id: 'colors', label: 'Separar por cor', tip: 'Igual ao automático, mas cada cor vira uma peça (logo colorido com letras encostadas).' },
  { id: 'closed', label: 'Áreas fechadas (desenho de contorno)', tip: 'Para logos com contorno: cada área fechada pelas linhas vira uma peça.' },
  { id: 'luma', label: 'Claro / escuro (limiar)', tip: 'O que for mais escuro que o limiar vira peça.' },
];
const PARAM_INFO: Record<keyof E.Params, [string, number, number]> = {
  base: ['Espessura do fundo', 0.2, 0.4], wall: ['Espessura da parede', 0.2, 0.4], height: ['Altura (profundidade) da letra', 1, 5],
  solidHeight: ['Espessura da letra maciça', 1, 1], faceThickness: ['Espessura da face', 0.1, 0.5], clearance: ['Folga do encaixe', 0.05, 0],
  simplify: ['Simplificação', 0.02, 0.01], kerf: ['Largura do corte', 0.1, 0.1], ledge: ['Largura da aba de apoio', 0.5, 1],
  ledgeThickness: ['Espessura da aba', 0.2, 0.6], skirtDepth: ['Profundidade da saia', 0.5, 1], skirtWidth: ['Espessura da saia', 0.2, 0.6],
  standoff: ['Afastamento da parede', 1, 3], tubeWall: ['Parede do espaçador', 0.2, 0.8], neonWidth: ['Largura do canal do neon', 0.5, 3],
  neonHeight: ['Altura do canal do neon', 1, 4], patternHole: ['Diâmetro dos furos da colmeia', 0.5, 1.5], patternBar: ['Espessura entre furos', 0.2, 0.6],
  standBase: ['Espessura da base', 0.5, 1], standMargin: ['Sobra da base', 1, 0], organicRadius: ['Raio do arredondamento', 0.5, 0.5],
  tiltMin: ['Altura no lado raso', 1, 5],
  reliefHeight: ['Altura de cada cor', 0.2, 0.2], reliefBase: ['Espessura da base', 0.2, 0.4], reliefMargin: ['Sobra da base', 0.5, 0],
};

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

// ------------------------------------------------------------------ corte transversal de cada estilo (gerado das camadas reais)

const OBJ_FILL: Record<E.LayerObj, string> = { body: '#9ca3af', face: '#60a5fa', back: '#64748b' };

function StyleDiagram({ style, P, big }: { style: E.StyleId; P: E.Params; big?: boolean }) {
  const layers = E.styleLayers(style, P);
  const finite = layers.flatMap((l) => [l.a, l.b ?? 0]);
  const S = Math.max(34, 2 * Math.max(...finite) + 16);
  let zMin = Math.min(0, ...layers.map((l) => l.z0));
  let zMax = Math.max(...layers.map((l) => l.z1));
  if (style === 'backlit') zMin = -P.standoff;
  if (style === 'standing') zMin = -P.standBase;
  const pad = 4;
  const W = S + pad * 2, Hh = zMax - zMin + pad * 2 + 6;
  const Y = (z: number) => zMax - z + pad;
  const X = (x: number) => x + pad;
  const rects: React.ReactNode[] = [];
  layers.forEach((l, i) => {
    const fill = style === 'insetPrinted' && l.obj === 'face' ? '#e5e7eb' : style === 'lightbox' && l.obj === 'face' ? 'url(#lbx)' : OBJ_FILL[l.obj];
    const spans: [number, number][] = l.b === null ? [[l.a, S - l.a]] : [[l.a, l.b], [S - l.b, S - l.a]];
    for (const [x0, x1] of spans) {
      if (x1 - x0 <= 0) continue;
      if (l.pattern) {
        const n = Math.max(3, Math.floor((x1 - x0) / 3));
        for (let k = 0; k < n; k++) if (k % 2 === 0) rects.push(<rect key={`${i}-${x0}-${k}`} x={X(x0 + (k * (x1 - x0)) / n)} y={Y(l.z1)} width={(x1 - x0) / n} height={l.z1 - l.z0} fill={OBJ_FILL.body} />);
      } else rects.push(<rect key={`${i}-${x0}`} x={X(x0)} y={Y(l.z1)} width={x1 - x0} height={l.z1 - l.z0} fill={fill} opacity={l.obj === 'face' ? 0.85 : 1} />);
    }
  });
  if (style === 'backlit') {
    const cx = S / 2, d = 4, tw = P.tubeWall;
    rects.push(<rect key="t1" x={X(cx - d / 2 - tw)} y={Y(P.height - P.base)} width={tw} height={P.height - P.base + P.standoff} fill="#a78bfa" />);
    rects.push(<rect key="t2" x={X(cx + d / 2)} y={Y(P.height - P.base)} width={tw} height={P.height - P.base + P.standoff} fill="#a78bfa" />);
    rects.push(<line key="wl" x1={0} x2={W} y1={Y(-P.standoff)} y2={Y(-P.standoff)} stroke="#52525b" strokeWidth={0.6} strokeDasharray="1.5 1" />);
  }
  if (style === 'standing') rects.push(<rect key="sb" x={X(-2)} y={Y(0)} width={S + 4} height={P.standBase} fill="#78909c" />);
  // LED e fio
  const info = E.styleInfo(style);
  const leds: [number, number][] = [];
  if (info.lit) {
    if (style === 'backlit') leds.push([S / 2 - 8, P.height - P.base - 1.6], [S / 2 + 8, P.height - P.base - 1.6]);
    else if (style === 'neon') { const c = P.wall + P.neonWidth / 2; leds.push([c, P.base + 2.5], [S - c, P.base + 2.5]); }
    else if (style === 'ledDouble') leds.push([S / 2, P.height / 2 + P.base / 2 + 1.4], [S / 2, P.height / 2 - P.base / 2 - 1.4]);
    else if (style === 'openBack' || style === 'doubleLedge') leds.push([S / 2, P.base + 1.6]);
    else leds.push([S / 2, P.base + 1.6]);
  }
  const wx = style === 'neon' ? P.wall + P.neonWidth / 2 + 1.5 : S / 2 + 3;
  const wireTop = style === 'ledDouble' ? P.height / 2 : style === 'backlit' ? P.height - P.base - 1.6 : P.base + 1.6;
  return (
    <svg viewBox={`0 0 ${W} ${Hh}`} className={big ? 'h-36 w-full' : 'h-16 w-full'} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="lbx" x1="0" x2="1"><stop offset="0" stopColor="#ef4444" /><stop offset="0.33" stopColor="#f59e0b" /><stop offset="0.66" stopColor="#22c55e" /><stop offset="1" stopColor="#3b82f6" /></linearGradient>
      </defs>
      {rects}
      {info.lit && <polyline points={`${X(wx)},${Y(wireTop)} ${X(wx)},${Y(zMin) + 4}`} fill="none" stroke="#ef4444" strokeWidth={0.7} strokeDasharray="1.4 0.9" />}
      {leds.map(([x, z], i) => <circle key={i} cx={X(x)} cy={Y(z)} r={1.3} fill="#facc15" />)}
      {big && <text x={1} y={Hh - 1} fontSize={2.6} fill="#a1a1aa">frente ↑ · fundo ↓ · amarelo = LED · vermelho = fio</text>}
    </svg>
  );
}

// ------------------------------------------------------------------ leitura de arquivo

type Src = { data: Uint8ClampedArray; w: number; h: number };

function readImage(file: File): Promise<Src> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const nw = img.naturalWidth || 1000, nh = img.naturalHeight || 1000;
      const sc = 1600 / Math.max(nw, nh);
      const w = Math.max(16, Math.round(nw * sc)), h = Math.max(16, Math.round(nh * sc));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d')!;
      ctx.clearRect(0, 0, w, h);          // mantém a transparência do PNG/SVG
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve({ data: ctx.getImageData(0, 0, w, h).data, w, h });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não consegui abrir esse arquivo.')); };
    img.src = url;
  });
}

function saveBlob(data: Uint8Array, name: string) {
  const blob = new Blob([data as unknown as BlobPart], { type: 'model/3mf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${(name || 'letreiro').replace(/[^\w\-]+/g, '_')}.3mf`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ------------------------------------------------------------------ componente principal

export default function SignageCad() {
  const [doc, setDoc] = useState<Doc>({ art: null, plates: [] });
  const past = useRef<Doc[]>([]);
  const future = useRef<Doc[]>([]);
  const [params, setParams] = useState<E.Params>({ ...E.DEFAULT_PARAMS });
  const [tool, setTool] = useState<Tool>('select');
  const [selIds, setSelIds] = useState<number[]>([]);
  const selId = selIds.length ? selIds[selIds.length - 1] : null;
  const [selPlate, setSelPlate] = useState<number | null>(null);
  const [holeD, setHoleD] = useState(5);
  const [cutPts, setCutPts] = useState<E.Pt[]>([]);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [msg, setMsg] = useState<{ t: string; kind: 'ok' | 'err' } | null>(null);
  const [explode, setExplode] = useState(0);
  const [fitTick, setFitTick] = useState(0);
  const [curStyle, setCurStyle] = useState<E.StyleId>('boxFace');
  const [showWires, setShowWires] = useState(false);
  const [realColors, setRealColors] = useState(true);
  const [project, setProject] = useState<'litho' | 'sign' | 'image' | 'character'>('litho');
  const [shapeW, setShapeW] = useState(100);
  const [shapeH, setShapeH] = useState(60);

  // fonte
  const srcRef = useRef<Src | null>(null);
  const [opts, setOpts] = useState<E.ArtOptions>({ widthMm: 300, threshold: 128, invert: false, minAreaMm2: 20, mode: 'auto', tolerance: 0, fill: false, colors: 8, detail: 0.5 });
  const [text, setText] = useState('Kitoys');
  const [font, setFont] = useState(FONTS[0]);
  const [srcName, setSrcName] = useState('');

  // export
  const [layout, setLayout] = useState<'print' | 'assembled'>('print');
  const [printer, setPrinter] = useState(0);
  const [bedW, setBedW] = useState(256);
  const [bedD, setBedD] = useState(256);
  const [gap, setGap] = useState(5);
  const [onlySel, setOnlySel] = useState(false);
  const [fileName, setFileName] = useState('letreiro');
  const [pricePerKg, setPricePerKg] = useState(20);
  const [quickBusy, setQuickBusy] = useState(false);

  const art = doc.art;
  const flash = useCallback((t: string, kind: 'ok' | 'err' = 'ok') => { setMsg({ t, kind }); }, []);
  const setSel = (id: number | null) => setSelIds(id === null ? [] : [id]);

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
  const makeArt = (s: Src, o: E.ArtOptions, style: E.StyleId): E.Art => {
    const a = E.createArt(s.data, s.w, s.h, { ...o, colors: Math.max(2, o.colors ?? 8) });
    return { ...a, parts: a.parts.map((p) => ({ ...p, style })) };
  };

  const generate = useCallback((o: E.ArtOptions = opts) => {
    const s = srcRef.current;
    if (!s) return;
    try {
      const a = makeArt(s, o, curStyle);
      past.current.push(doc); future.current = [];
      setDoc({ art: a, plates: [] });
      setSelIds([]); setSelPlate(null); setCutPts([]);
      setFitTick((t) => t + 1);
      flash(`${a.parts.length} peça(s) detectada(s). Largura ${o.widthMm} mm. Clique numa peça para editar (Shift+clique seleciona várias).`);
    } catch (e: any) { flash(e?.message || String(e), 'err'); }
  }, [opts, doc, flash, curStyle]);

  const loadFile = async (file: File) => {
    try {
      srcRef.current = await readImage(file);
      setSrcName(file.name);
      generate();
    } catch (e: any) { flash(e?.message || String(e), 'err'); }
  };

  /** Imagem -> 3MF pronto para imprimir, sem editar: detecta, aplica o estilo, fura, corta no tamanho da mesa e baixa. */
  const quickFile = async (file: File) => {
    setQuickBusy(true);
    try {
      const s = await readImage(file);
      srcRef.current = s; setSrcName(file.name);
      let a = makeArt(s, opts, curStyle);
      if (E.styleInfo(curStyle).lit) {
        for (const p of a.parts) {
          if (p.holes.length) continue;
          const h = E.autoHolePoint(a, p, params, curStyle === 'backlit' ? 4 : holeD);
          if (h) a = E.addHole(a, p.id, h);
        }
      }
      const sp = E.splitToBed(a, bedW - 2 * gap, bedD - 2 * gap, params.kerf);
      a = sp.art;
      const nd = { art: a, plates: [] };
      commit(nd);
      setSelIds([]); setSelPlate(null); setFitTick((t) => t + 1);
      const sc = E.buildScene(a, [], params);
      const r = E.build3MF(sc.objects, { mode: 'print', bedW, bedD, gap });
      const base = file.name.replace(/\.[^.]+$/, '');
      setFileName(base);
      saveBlob(r.data, base);
      flash(`3MF baixado: ${sc.objects.length} objeto(s), ${a.parts.length} peça(s)${sp.cuts ? `, ${sp.cuts} corte(s) para caber na mesa ${bedW}×${bedD}` : ''}. Abra no Bambu Studio / Orca e fatie.`);
    } catch (e: any) { flash(e?.message || String(e), 'err'); }
    setQuickBusy(false);
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
    const o = { ...opts, mode: 'auto' as const };
    generate(o);
  };

  const chooseProject = (id: 'litho' | 'sign' | 'image' | 'character') => {
    setProject(id);
    if (id === 'image') {
      setOpts((o) => ({ ...o, mode: 'colors', colors: Math.max(o.colors ?? 8, 10), detail: 0.7 }));
      setCurStyle('colorRelief'); setLayout('assembled'); setRealColors(true);
      if (art) applyStyle('colorRelief');
      flash('Imagem colorida: suba a imagem. Cada cor vira uma peça com a cor real sobre uma base. Exporte "Montado" e no Bambu Studio carregue como um objeto com várias partes.');
    } else if (id === 'sign') {
      setOpts((o) => ({ ...o, mode: 'auto' }));
      setCurStyle('boxFace'); setLayout('print');
    }
  };

  // --------------------------------------------------- seleção e edição
  const selPart = useMemo(() => art?.parts.find((p) => p.id === selId) ?? null, [art, selId]);
  const plate = useMemo(() => doc.plates.find((p) => p.id === selPlate) ?? null, [doc.plates, selPlate]);

  const updatePart = (id: number, patch: Partial<E.Part>) => {
    if (!art) return;
    commit({ ...doc, art: { ...art, parts: art.parts.map((p) => (p.id === id ? { ...p, ...patch } : p)) } });
  };
  const deleteParts = (ids: number[]) => {
    if (!art || !ids.length) return;
    commit({ ...doc, art: { ...art, parts: art.parts.filter((p) => !ids.includes(p.id)) } });
    setSelIds((s) => s.filter((x) => !ids.includes(x)));
  };
  const applyStyle = (style: E.StyleId) => {
    setCurStyle(style);
    if (!art) return;
    const target = selIds.length ? selIds : art.parts.map((p) => p.id);
    let a: E.Art = { ...art, parts: art.parts.map((p) => (target.includes(p.id) ? { ...p, style } : p)) };
    // o lightbox precisa das cores da imagem: refaz a detecção se ainda não tiver
    if (style === 'lightbox' && !art.palette.length && srcRef.current) {
      try { a = makeArt(srcRef.current, opts, style); flash('Lightbox: peças refeitas com as cores da imagem.'); setSelIds([]); } catch {}
    }
    commit({ ...doc, art: a });
  };
  const joinSelected = () => {
    if (!art || selIds.length < 2) return;
    const r = E.mergeParts(art, selIds);
    if (!r) return;
    commit({ ...doc, art: r });
    setSelIds([selIds[0]]);
    flash(`${selIds.length} peças unidas em uma.`);
  };
  const updatePlate = (id: number, patch: Partial<E.Plate>) => commit({ ...doc, plates: doc.plates.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const addPlate = (kind: 'flat' | 'blade' = 'flat') => {
    if (!art) return;
    const id = (doc.plates.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;
    const pl = E.defaultPlate(art, id, kind === 'blade' ? 25 : 10);
    if (kind === 'blade') {
      const side = Math.max(pl.w, pl.h);
      Object.assign(pl, { name: `Luminoso de avanço ${id}`, kind: 'blade', x: pl.x + pl.w / 2 - side / 2, y: pl.y + pl.h / 2 - side / 2, w: side, h: side, radius: side / 2, depth: 60 });
    }
    commit({ ...doc, plates: [...doc.plates, pl] });
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
    setSelIds([]);
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
      setSel(hit.id);
      flash(`Furo Ø${holeD} mm adicionado em ${hit.name}.`);
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
    const h = E.autoHolePoint(art, selPart, params, holeD);
    if (!h) { flash('Não achei lugar para esse furo nesta peça. Diminua o diâmetro.', 'err'); return; }
    commit({ ...doc, art: E.addHole(art, selPart.id, h) });
    flash(`Furo Ø${holeD} mm colocado automaticamente.`);
  };
  const autoHolesAll = () => {
    if (!art) return;
    let a = art, n = 0, miss = 0;
    for (const p of art.parts) {
      if (!p.visible || !E.styleInfo(p.style).lit || p.holes.length) continue;
      const h = E.autoHolePoint(a, p, params, p.style === 'backlit' ? 4 : holeD);
      if (h) { a = E.addHole(a, p.id, h); n++; } else miss++;
    }
    commit({ ...doc, art: a });
    flash(`${n} furo(s) de fio colocados${miss ? `; ${miss} peça(s) pequenas demais para Ø${holeD} mm` : ''}.`, miss && !n ? 'err' : 'ok');
  };
  const setHoleDiameter = (partId: number, i: number, d: number) => {
    if (!art) return;
    const p = art.parts.find((q) => q.id === partId); if (!p) return;
    const nh = { ...p.holes[i], d };
    const err = E.validateHole(art, p, nh, params, i);
    if (err) { flash(err, 'err'); return; }
    updatePart(partId, { holes: p.holes.map((h, k) => (k === i ? nh : h)) });
  };
  const removeHole = (partId: number, i: number) => {
    if (!art) return;
    commit({ ...doc, art: { ...art, parts: art.parts.map((p) => (p.id === partId ? { ...p, holes: p.holes.filter((_, k) => k !== i) } : p)) } });
  };
  const nudge = (dx: number, dy: number) => {
    if (!art || !selIds.length) return;
    let a = art;
    for (const id of selIds) a = E.movePart(a, id, dx, dy);
    commit({ ...doc, art: a });
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
  const exportObjs = useMemo(() => (onlySel && selIds.length ? scene.objects.filter((o) => o.partId !== undefined && selIds.includes(o.partId)) : scene.objects), [scene, onlySel, selIds]);
  const layoutWarn = useMemo(() => E.layoutObjects(exportObjs, { mode: layout, bedW, bedD, gap }).warnings, [exportObjs, layout, bedW, bedD, gap]);
  const totalG = stats.filter((x) => exportObjs.includes(x.o)).reduce((s, x) => s + (x.s.volumeMm3 / 1000) * 1.24, 0);
  const wires = useMemo(() => (art && showWires ? E.wiringPlan(art, params) : null), [art, params, showWires]);

  const download = () => {
    if (!exportObjs.length) { flash('Nada para exportar.', 'err'); return; }
    const r = E.build3MF(exportObjs, { mode: layout, bedW, bedD, gap });
    saveBlob(r.data, fileName);
    flash(`3MF gerado com ${exportObjs.length} objeto(s).`);
  };

  // --------------------------------------------------- canvas 2D
  const wrap = useRef<HTMLDivElement>(null);
  const cv2 = useRef<HTMLCanvasElement>(null);
  const cv3 = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 800, h: 560 });
  const vw = useRef({ k: 2, vx: 40, vy: 500 });
  const hover = useRef<E.Pt | null>(null);
  const dragRef = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean; button: number; move: number[] | null; w0: E.Pt; shift: boolean } | null>(null);
  const moveOff = useRef<{ ids: number[]; dx: number; dy: number } | null>(null);
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
    for (const pl of doc.plates) { x0 = Math.min(x0, pl.x - (pl.kind === 'blade' ? 50 : 0)); y0 = Math.min(y0, pl.y); x1 = Math.max(x1, pl.x + pl.w); y1 = Math.max(y1, pl.y + pl.h); }
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
    const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    const step = steps.find((s) => s * k >= 36) ?? 1000;
    const wx0 = (0 - vx) / k, wx1 = (size.w - vx) / k, wy1 = (vy - 0) / k, wy0 = (vy - size.h) / k;
    ctx.lineWidth = 1;
    for (let x = Math.floor(wx0 / step) * step; x <= wx1; x += step) { ctx.strokeStyle = x % (step * 5) === 0 ? '#243040' : '#161d27'; ctx.beginPath(); ctx.moveTo(vx + x * k, 0); ctx.lineTo(vx + x * k, size.h); ctx.stroke(); }
    for (let y = Math.floor(wy0 / step) * step; y <= wy1; y += step) { ctx.strokeStyle = y % (step * 5) === 0 ? '#243040' : '#161d27'; ctx.beginPath(); ctx.moveTo(0, vy - y * k); ctx.lineTo(size.w, vy - y * k); ctx.stroke(); }
    ctx.fillStyle = '#5b6b7e'; ctx.font = '10px sans-serif';
    ctx.fillText(`grade ${step} mm`, 8, size.h - 8);
    if (!art) return;
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
      if (pl.kind === 'blade') { ctx.fillStyle = 'rgba(176,190,197,0.35)'; ctx.fillRect(pl.x - 45, pl.y + pl.h / 2 - 35, 45, 70); }
      const holesDraw: E.Hole[] = [...pl.holes];
      if (pl.cornerHoleD > 0 && pl.kind !== 'blade') for (const [cx, cy] of [[pl.x + pl.cornerInset, pl.y + pl.cornerInset], [pl.x + pl.w - pl.cornerInset, pl.y + pl.cornerInset], [pl.x + pl.w - pl.cornerInset, pl.y + pl.h - pl.cornerInset], [pl.x + pl.cornerInset, pl.y + pl.h - pl.cornerInset]]) holesDraw.push({ x: cx, y: cy, d: pl.cornerHoleD });
      ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1 / k;
      for (const h of holesDraw) { ctx.beginPath(); ctx.arc(h.x, h.y, h.d / 2, 0, Math.PI * 2); ctx.stroke(); }
    }
    const mo = moveOff.current;
    art.parts.forEach((p, i) => {
      if (!p.visible) return;
      const path = paths.get(p.id); if (!path) return;
      const sel = selIds.includes(p.id);
      const moving = mo && mo.ids.includes(p.id);
      if (moving) { ctx.save(); ctx.translate(mo!.dx, mo!.dy); }
      const col = p.color ?? PART_COLORS[i % PART_COLORS.length];
      ctx.fillStyle = realColors && p.color ? p.color : col + (sel ? 'cc' : '77');
      ctx.fill(path, 'evenodd');
      ctx.lineWidth = (sel ? 2.4 : realColors ? 0 : 1) / k; ctx.strokeStyle = sel ? '#ffffff' : col;
      if (sel || !realColors) ctx.stroke(path);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2 / k;
      for (const h of p.holes) { ctx.beginPath(); ctx.arc(h.x, h.y, h.d / 2, 0, Math.PI * 2); ctx.fillStyle = '#0d1117'; ctx.fill(); ctx.stroke(); }
      if (moving) ctx.restore();
    });
    // diagrama de fiação
    if (wires) {
      ctx.setLineDash([3 / k, 2 / k]); ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.4 / k;
      for (const it of wires.items) for (const r of it.ledRings) { ctx.beginPath(); r.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke(); }
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2 / k; ctx.setLineDash([6 / k, 3 / k]);
      const pts = wires.items.map((it) => it.entry).filter(Boolean) as E.Hole[];
      if (pts.length > 1) { ctx.beginPath(); pts.forEach((h, j) => (j ? ctx.lineTo(h.x, h.y) : ctx.moveTo(h.x, h.y))); ctx.stroke(); }
      ctx.setLineDash([]);
      if (pts.length) {
        const f = pts[0];
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - 25, f.y - 25); ctx.strokeStyle = '#ef4444'; ctx.stroke();
      }
    }
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (wires) {
      ctx.font = 'bold 11px sans-serif';
      wires.items.forEach((it, n) => {
        if (!it.entry) return;
        const sx = vx + it.entry.x * k, sy = vy - it.entry.y * k;
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(sx + 12, sy - 12, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText(String(n + 1), sx + (n + 1 > 9 ? 5 : 9), sy - 8);
      });
      const f = wires.items.find((it) => it.entry)?.entry;
      if (f) { ctx.fillStyle = '#fca5a5'; ctx.fillText('Entrada da fonte 12V', vx + (f.x - 25) * k - 60, vy - (f.y - 25) * k + 14); }
    }
    if (selPart) {
      const b = E.partBounds(art, selPart);
      ctx.fillStyle = '#e6edf3'; ctx.font = '11px sans-serif';
      ctx.fillText(`${selPart.name}: ${(b.x1 - b.x0).toFixed(1)} × ${(b.y1 - b.y0).toFixed(1)} mm`, vx + b.x0 * k, vy - b.y1 * k - 6);
    }
    if (hv) {
      ctx.fillStyle = '#7d8da1'; ctx.font = '10px sans-serif';
      ctx.fillText(`x ${hv[0].toFixed(1)}  y ${hv[1].toFixed(1)} mm`, size.w - 130, size.h - 8);
    }
  }, [art, doc.plates, paths, selIds, selPlate, selPart, plate, tool, holeD, cutPts, params, size, dpr, wires, realColors]);

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
    const w0 = toWorld(e);
    let move: number[] | null = null;
    if (tool === 'select' && e.button === 0 && art && !e.shiftKey) {
      const hit = E.pickPart(art, w0[0], w0[1]);
      if (hit) move = selIds.includes(hit.id) ? selIds : [hit.id];
    }
    dragRef.current = { x: e.clientX, y: e.clientY, vx: vw.current.vx, vy: vw.current.vy, moved: false, button: e.button, move, w0, shift: e.shiftKey };
  };
  const onMove2 = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (d) {
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (d.moved || Math.hypot(dx, dy) > 4 || d.button !== 0) {
        d.moved = true;
        if (d.move) {
          const w = toWorld(e);
          moveOff.current = { ids: d.move, dx: w[0] - d.w0[0], dy: w[1] - d.w0[1] };
        } else { vw.current.vx = d.vx + dx; vw.current.vy = d.vy + dy; }
      }
    }
    hover.current = toWorld(e);
    draw2D();
  };
  const onUp2 = (e: React.PointerEvent) => {
    const d = dragRef.current; dragRef.current = null;
    const mo = moveOff.current; moveOff.current = null;
    if (!d || !art) return;
    if (d.moved && d.move && mo) {
      let a = art;
      for (const id of mo.ids) a = E.movePart(a, id, mo.dx, mo.dy);
      commit({ ...doc, art: a });
      setSelIds(mo.ids);
      return;
    }
    if (d.moved || d.button !== 0) { draw2D(); return; }
    const [x, y] = toWorld(e);
    if (tool === 'select') {
      const p = E.pickPart(art, x, y);
      if (d.shift && p) setSelIds((s) => (s.includes(p.id) ? s.filter((q) => q !== p.id) : [...s, p.id]));
      else { setSel(p ? p.id : null); if (!p) setSelPlate(null); }
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
    for (const x of stats) { if (!x.s.tris) continue; for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], x.s.min[k]); mx[k] = Math.max(mx[k], x.s.max[k]); } }
    if (mn[0] === Infinity) return;
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
    const st = e.shiftKey ? 10 : 1;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && art) { e.preventDefault(); setSelIds(art.parts.map((p) => p.id)); }
    else if (e.key === 'Delete' && selIds.length) deleteParts(selIds);
    else if (e.key === 'Escape') { setCutPts([]); setTool('select'); setSelIds([]); }
    else if (e.key === 'ArrowLeft' && selIds.length) { e.preventDefault(); nudge(-st, 0); }
    else if (e.key === 'ArrowRight' && selIds.length) { e.preventDefault(); nudge(st, 0); }
    else if (e.key === 'ArrowUp' && selIds.length) { e.preventDefault(); nudge(0, st); }
    else if (e.key === 'ArrowDown' && selIds.length) { e.preventDefault(); nudge(0, -st); }
    else if (e.key.toLowerCase() === 'v') setTool('select');
    else if (e.key.toLowerCase() === 'f') setTool('hole');
    else if (e.key.toLowerCase() === 'c') setTool('cut');
    else if (e.key.toLowerCase() === 'j') joinSelected();
  };

  // --------------------------------------------------- tela
  const total = stats.filter((x) => exportObjs.includes(x.o));
  const activeStyle = selPart?.style ?? curStyle;
  const activeInfo = E.styleInfo(activeStyle);
  const usedStyles = useMemo(() => Array.from(new Set([activeStyle, ...(art?.parts.filter((p) => p.visible).map((p) => p.style) ?? [])])), [art, activeStyle]);
  const shownParams = useMemo(() => Array.from(new Set(usedStyles.flatMap((s) => E.styleInfo(s).params))), [usedStyles]);
  const detect = DETECT.find((d) => d.id === opts.mode) ?? DETECT[0];

  return (
    <div className="space-y-3 text-zinc-100 outline-none" tabIndex={0} onKeyDown={onKey} data-testid="signage-cad">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Letreiro CAD</h2>
          <p className="text-xs text-zinc-400">Suba uma imagem (PNG, JPG, SVG) ou digite um texto, escolha o estilo da letra, edite as peças e exporte em 3MF.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold ${quickBusy ? 'bg-zinc-700 text-zinc-400' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`} title="Detecta, aplica o estilo escolhido, fura, corta no tamanho da mesa e baixa o 3MF">
            {quickBusy ? 'Gerando…' : '⚡ Imagem → 3MF direto'}
            <input type="file" accept="image/*,.svg" className="hidden" disabled={quickBusy} onChange={(e) => { const f = e.target.files?.[0]; if (f) quickFile(f); e.target.value = ''; }} />
          </label>
          <Btn onClick={undo} disabled={!past.current.length} title="Desfazer (Ctrl+Z)">↶ Desfazer</Btn>
          <Btn onClick={redo} disabled={!future.current.length} title="Refazer (Ctrl+Y)">↷ Refazer</Btn>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border border-zinc-800 bg-zinc-900/70 p-1">
        {([
          ['litho', 'Litofania (foto em placa)'],
          ['sign', 'Letreiro (letra-caixa com LED)'],
          ['image', 'Imagem colorida fiel (relevo multicor)'],
          ['character', 'Personagem 3D (IA)'],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => chooseProject(id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${project === id ? 'bg-emerald-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}>{label}</button>
        ))}
      </div>
      {project === 'character' && (
        <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-3 text-xs leading-relaxed text-amber-200">
          Personagem 3D com volume (frente, costas, rosto) a partir de uma foto precisa de um serviço de IA de imagem para 3D (roda em servidor com GPU).
          Essa parte ainda não está ligada: falta escolher o serviço e cadastrar a chave da API. Enquanto isso, use "Imagem colorida fiel" para relevo multicor fiel à imagem.
        </div>
      )}

      {project === 'litho' ? <LithophaneStudio /> : (
      <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
        {/* ---------- coluna esquerda */}
        <div className="space-y-3">
          <Section title="1. Origem do desenho">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-600 bg-zinc-950/60 px-3 py-4 text-center text-xs text-zinc-300 hover:border-emerald-500"
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) loadFile(f); }}>
              <span className="font-medium">Subir imagem ou SVG (ou arraste aqui)</span>
              <span className="text-[11px] text-zinc-500">PNG sem fundo, JPG, WEBP ou SVG.</span>
              <input data-testid="file-input" type="file" accept="image/*,.svg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ''; }} />
            </label>
            <label className="block text-xs text-zinc-400">Como separar as peças
              <select value={opts.mode} onChange={(e) => setOpts({ ...opts, mode: e.target.value as E.DetectMode })} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100">
                {DETECT.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </label>
            <p className="text-[11px] text-zinc-500">{detect.tip}</p>
            {opts.mode === 'luma' ? (
              <label className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                <span>Limiar ({opts.threshold})</span>
                <input type="range" min={20} max={250} value={opts.threshold} onChange={(e) => setOpts({ ...opts, threshold: +e.target.value })} className="w-32 accent-emerald-500" />
              </label>
            ) : (
              <label className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                <span>Sensibilidade ({opts.tolerance ? opts.tolerance : 'auto'})</span>
                <input type="range" min={0} max={150} value={opts.tolerance ?? 0} onChange={(e) => setOpts({ ...opts, tolerance: +e.target.value })} className="w-32 accent-emerald-500" />
              </label>
            )}
            <Num label="Cores da imagem" value={opts.colors ?? 8} step={1} min={2} max={16} suffix="" onChange={(v) => setOpts({ ...opts, colors: Math.max(2, Math.min(16, Math.round(v))) })} />
            {opts.mode === 'colors' && (
              <label className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                <span>Detalhe ({Math.round((opts.detail ?? 0.5) * 100)}%)</span>
                <input type="range" min={0} max={100} value={Math.round((opts.detail ?? 0.5) * 100)} onChange={(e) => setOpts({ ...opts, detail: +e.target.value / 100 })} className="w-32 accent-emerald-500" />
              </label>
            )}
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input type="checkbox" checked={!!opts.fill} onChange={(e) => setOpts({ ...opts, fill: e.target.checked })} /> Preencher buracos (silhueta)
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input type="checkbox" checked={opts.invert} onChange={(e) => setOpts({ ...opts, invert: e.target.checked })} /> Inverter (pega o fundo em vez do desenho)
            </label>
            <Num label="Largura total" value={opts.widthMm} step={10} min={10} onChange={(v) => setOpts({ ...opts, widthMm: v })} />
            <Num label="Ignorar peças menores que" value={opts.minAreaMm2} step={5} min={0} suffix="mm²" onChange={(v) => setOpts({ ...opts, minAreaMm2: v })} />
            <Btn className="w-full" disabled={!srcRef.current} onClick={() => generate(opts)} title="Refaz as peças com estes ajustes (perde as edições)">Regenerar peças</Btn>
            <div className="space-y-2 rounded-lg bg-zinc-950/50 p-2">
              <textarea data-testid="text-input" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ou digite o texto…"
                className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm outline-none focus:border-emerald-500" />
              <select value={font} onChange={(e) => setFont(e.target.value)} className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs">
                {FONTS.map((f) => <option key={f} value={f}>{f.split(',')[0]}</option>)}
              </select>
              <Btn tone="primary" className="w-full" onClick={renderText}>Gerar letras do texto</Btn>
            </div>
            {srcName && <p className="truncate text-[11px] text-zinc-500">Fonte atual: {srcName}</p>}
          </Section>

          <Section title="Formas">
            <p className="text-[11px] text-zinc-500">Adiciona uma forma como peça (para placas, fundos e molduras). Depois arraste para posicionar e escolha o estilo.</p>
            <div className="grid grid-cols-2 gap-2">
              <Num label="Largura" value={shapeW} step={5} min={5} onChange={setShapeW} />
              <Num label="Altura" value={shapeH} step={5} min={5} onChange={setShapeH} />
            </div>
            <div className="flex flex-wrap gap-1">
              {([['rect', 'Retângulo'], ['square', 'Quadrado'], ['rounded', 'Arredondado'], ['circle', 'Círculo'], ['oval', 'Oval']] as const).map(([k, label]) => (
                <Btn key={k} onClick={() => { const a = E.addShapePart(art, k, shapeW, shapeH, curStyle); commit({ ...doc, art: a }); setSel(a.parts[a.parts.length - 1].id); setFitTick((t) => t + 1); }}>+ {label}</Btn>
              ))}
            </div>
          </Section>

          <Section title={`2. Estilo da letra${selIds.length ? ` (${selIds.length} selecionada${selIds.length > 1 ? 's' : ''})` : ' (todas)'}`}>
            <div className="grid max-h-[420px] grid-cols-2 gap-2 overflow-auto pr-1">
              {E.STYLES.map((s) => (
                <button key={s.id} type="button" onClick={() => applyStyle(s.id)} title={s.desc}
                  className={`rounded-lg border p-1.5 text-left transition ${activeStyle === s.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-600'}`}>
                  <StyleDiagram style={s.id} P={params} />
                  <div className="mt-1 text-[10px] font-semibold uppercase leading-tight tracking-wide text-zinc-300">{s.name}</div>
                </button>
              ))}
            </div>
            <div className="rounded-lg bg-zinc-950/60 p-2">
              <div className="text-xs font-semibold text-emerald-300">{activeInfo.name}</div>
              <StyleDiagram style={activeStyle} P={params} big />
              <p className="text-[11px] leading-snug text-zinc-400">{activeInfo.desc}</p>
              <p className="mt-1 text-[11px] text-zinc-500">Furo: {activeInfo.hole}</p>
            </div>
            <p className="text-[11px] text-zinc-500">Sem peça selecionada o estilo vai para todas. Com peças selecionadas, só para elas.</p>
          </Section>

          <Section title="3. Medidas">
            {shownParams.map((k) => {
              const [label, step, min] = PARAM_INFO[k];
              return <Num key={k} label={label} value={params[k]} step={step} min={min} onChange={(v) => setParams({ ...params, [k]: v })} />;
            })}
            <Num label="Largura do corte" value={params.kerf} step={0.1} min={0.1} onChange={(v) => setParams({ ...params, kerf: v })} />
            <Btn className="w-full" onClick={() => setParams({ ...E.DEFAULT_PARAMS })}>Voltar ao padrão</Btn>
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
                <Btn active={tool === 'select'} onClick={() => { setTool('select'); setCutPts([]); }} title="V - clique seleciona, Shift+clique soma, arrastar move">Selecionar / mover</Btn>
                <Btn active={tool === 'hole'} onClick={() => { setTool('hole'); setCutPts([]); }} title="F">Furo</Btn>
                <Btn active={tool === 'cut'} onClick={() => { setTool('cut'); setCutPts([]); }} title="C">Corte</Btn>
                <Btn active={showWires} onClick={() => setShowWires(!showWires)} title="Mostra o caminho do LED e dos fios">Fiação</Btn>
                <Btn active={realColors} onClick={() => setRealColors(!realColors)} title="Mostra as peças com a cor real da imagem">Cores reais</Btn>
                <Btn onClick={() => { fit(); draw2D(); }}>Ajustar</Btn>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-zinc-400">Explodir
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
            {view === '2d' && tool === 'select' && art && <div className="absolute left-3 top-3 rounded bg-zinc-800/90 px-2 py-1 text-[11px] text-zinc-300">Clique = seleciona · Shift+clique = soma · arrastar = move · setas = 1 mm · J = unir</div>}
          </div>
          {msg && <div data-testid="status" className={`rounded-lg px-3 py-2 text-xs ${msg.kind === 'err' ? 'bg-red-950/70 text-red-300' : 'bg-emerald-950/60 text-emerald-300'}`}>{msg.t}</div>}
          {scene.warnings.map((w, i) => <div key={i} className="rounded-lg bg-amber-950/50 px-3 py-2 text-xs text-amber-300">{w}</div>)}

          {showWires && wires && (
            <Section title="Diagrama de fiação">
              <p className="text-[11px] leading-snug text-zinc-400">
                Amarelo = onde corre a fita de LED (ou o neon) dentro de cada letra. Vermelho = furo de passagem do fio, numerado na ordem de ligação.
                A fonte 12V entra na letra 1; de cada letra sai um par de fios (+ e -) pelo furo, corre por trás (na chapa ou na parede) e entra no furo da próxima.
                Ligue as letras em paralelo (todos os + juntos, todos os - juntos).
              </p>
              <div className="max-h-48 overflow-auto text-[11px]">
                <table className="w-full text-left text-zinc-300">
                  <thead className="text-zinc-500"><tr><th>#</th><th>Peça</th><th>LED</th><th>Furo</th><th>Fio até a próxima</th></tr></thead>
                  <tbody>
                    {wires.items.map((it, n) => (
                      <tr key={it.partId} className="border-t border-zinc-800">
                        <td>{n + 1}</td><td>{it.name}</td><td>{(it.ledMm / 10).toFixed(0)} cm</td>
                        <td>{it.entry ? `Ø${it.entry.d}` : <span className="text-amber-400">sem furo</span>}</td>
                        <td>{n < wires.hops.length ? (wires.hops[n] !== null ? `${(wires.hops[n]! / 10).toFixed(0)} cm` : '—') : 'fim'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-300">
                <span>Total: {(wires.ledMm / 1000).toFixed(2)} m de LED · {(wires.wireMm / 1000).toFixed(2)} m de fio (par)</span>
                <Btn onClick={autoHolesAll}>Furos de fio automáticos (Ø{holeD})</Btn>
              </div>
              {wires.items.length === 0 && <p className="text-[11px] text-amber-400">Nenhuma peça com estilo iluminado. Escolha um estilo com LED.</p>}
            </Section>
          )}
        </div>

        {/* ---------- coluna direita */}
        <div className="space-y-3">
          <Section title={`Peças (${art?.parts.length ?? 0})`} right={art ? <div className="flex gap-1"><Btn onClick={() => setSelIds(art.parts.map((p) => p.id))} title="Ctrl+A">Todas</Btn><Btn onClick={() => setSelIds([])}>Nenhuma</Btn></div> : undefined}>
            {!art && <p className="text-xs text-zinc-500">Nenhuma peça ainda.</p>}
            <div className="max-h-56 space-y-1 overflow-auto pr-1">
              {art?.parts.map((p, i) => {
                const b = E.partBounds(art, p);
                const sel = selIds.includes(p.id);
                return (
                  <div key={p.id} onClick={(e) => { setSelPlate(null); if (e.shiftKey || e.ctrlKey || e.metaKey) setSelIds((s) => (s.includes(p.id) ? s.filter((q) => q !== p.id) : [...s, p.id])); else setSel(p.id); }}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-xs ${sel ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-600'}`}>
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: p.color ?? PART_COLORS[i % PART_COLORS.length] }} />
                    <input value={p.name} onClick={(e) => e.stopPropagation()} onChange={(e) => updatePart(p.id, { name: e.target.value })} className="w-0 flex-1 bg-transparent outline-none" />
                    <span className="text-[10px] text-zinc-500" title={E.styleInfo(p.style).name}>{(b.x1 - b.x0).toFixed(0)}×{(b.y1 - b.y0).toFixed(0)}</span>
                    <button title="Mostrar/ocultar" className="text-zinc-400 hover:text-white" onClick={(e) => { e.stopPropagation(); updatePart(p.id, { visible: !p.visible }); }}>{p.visible ? '👁' : '—'}</button>
                    <button title="Excluir (Del)" className="text-zinc-500 hover:text-red-400" onClick={(e) => { e.stopPropagation(); deleteParts([p.id]); }}>✕</button>
                  </div>
                );
              })}
            </div>
            {selIds.length > 1 && (
              <div className="flex gap-1">
                <Btn tone="primary" onClick={joinSelected} title="J">Unir {selIds.length} peças</Btn>
                <Btn tone="danger" onClick={() => deleteParts(selIds)}>Excluir</Btn>
              </div>
            )}
          </Section>

          {selPart && art && selIds.length === 1 && (
            <Section title={`Peça selecionada: ${selPart.name}`}>
              <p className="text-[11px] text-zinc-400">Estilo: <span className="text-zinc-200">{E.styleInfo(selPart.style).name}</span> (troque na lista de estilos)</p>
              <div className="flex flex-wrap gap-1">
                <Btn onClick={() => nudge(-1, 0)}>←</Btn><Btn onClick={() => nudge(1, 0)}>→</Btn><Btn onClick={() => nudge(0, 1)}>↑</Btn><Btn onClick={() => nudge(0, -1)}>↓</Btn>
                <span className="self-center text-[11px] text-zinc-500">mover 1 mm (Shift = 10)</span>
              </div>
              <div className="rounded-lg bg-zinc-950/50 p-2">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Furos</div>
                <p className="mb-1 text-[11px] text-zinc-500">{E.styleInfo(selPart.style).hole}</p>
                <Num label="Diâmetro do próximo furo" value={holeD} step={0.5} min={0.5} onChange={setHoleD} />
                <div className="mt-2 flex gap-1">
                  <Btn onClick={() => setTool('hole')} active={tool === 'hole'}>Clicar na peça</Btn>
                  <Btn onClick={holeCenter}>Automático</Btn>
                </div>
                {selPart.holes.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {selPart.holes.map((h, i) => (
                      <li key={i} className="flex items-center justify-between gap-1 rounded bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300">
                        <span>Ø</span>
                        <input type="number" step={0.5} min={0.5} value={h.d} onChange={(e) => { const v = parseFloat(e.target.value); if (v > 0) setHoleDiameter(selPart.id, i, v); }}
                          className="w-14 rounded border border-zinc-700 bg-zinc-950 px-1 text-right" />
                        <span className="flex-1">mm em ({h.x.toFixed(0)}, {h.y.toFixed(0)})</span>
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

          <Section title="Chapa / luminoso de avanço" right={<div className="flex gap-1"><Btn onClick={() => addPlate('flat')} disabled={!art}>+ Chapa</Btn><Btn onClick={() => addPlate('blade')} disabled={!art} title="Caixa redonda dupla face com braço para a parede">+ Avanço</Btn></div>}>
            {doc.plates.length === 0 && <p className="text-xs text-zinc-500">Chapa de fundo (atrás das letras, furada nos furos de fio), tampa com recorte, ou luminoso de avanço (caixa dupla face com braço e flange para a parede, com as letras em relevo).</p>}
            <div className="flex flex-wrap gap-1">
              {doc.plates.map((p) => <Btn key={p.id} active={p.id === selPlate} onClick={() => { setSelPlate(p.id); setSelIds([]); }}>{p.name}</Btn>)}
            </div>
            {plate && (
              <div className="space-y-2">
                <input value={plate.name} onChange={(e) => updatePlate(plate.id, { name: e.target.value })} className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs" />
                <Num label="Largura" value={plate.w} step={5} min={5} onChange={(v) => updatePlate(plate.id, { w: v })} />
                <Num label="Altura" value={plate.h} step={5} min={5} onChange={(v) => updatePlate(plate.id, { h: v })} />
                <Num label="Posição X" value={plate.x} step={1} onChange={(v) => updatePlate(plate.id, { x: v })} />
                <Num label="Posição Y" value={plate.y} step={1} onChange={(v) => updatePlate(plate.id, { y: v })} />
                <Num label="Raio dos cantos" value={plate.radius} step={1} min={0} onChange={(v) => updatePlate(plate.id, { radius: v })} />
                {plate.kind === 'blade' ? (
                  <>
                    <Num label="Profundidade da caixa" value={plate.depth ?? 60} step={5} min={20} onChange={(v) => updatePlate(plate.id, { depth: v })} />
                    <p className="text-[11px] text-zinc-500">Raio = metade da largura deixa a caixa redonda. As letras viram relevo na face; o LED fica na prateleira do meio, iluminando as duas faces. O fio passa pelo braço até a flange.</p>
                  </>
                ) : (
                  <>
                    <Num label="Espessura" value={plate.thickness} step={0.5} min={0.4} onChange={(v) => updatePlate(plate.id, { thickness: v })} />
                    <div className="flex gap-1">
                      <Btn active={plate.position === 'back'} onClick={() => updatePlate(plate.id, { position: 'back' })}>Atrás (fundo)</Btn>
                      <Btn active={plate.position === 'front'} onClick={() => updatePlate(plate.id, { position: 'front' })}>À frente (tampa)</Btn>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-zinc-300">
                      <input type="checkbox" checked={plate.cutLetters} onChange={(e) => updatePlate(plate.id, { cutLetters: e.target.checked })} /> Recortar o formato das letras
                    </label>
                    {plate.cutLetters && <Num label="Folga do recorte" value={plate.clearance} step={0.1} min={0} onChange={(v) => updatePlate(plate.id, { clearance: v })} />}
                    <label className="flex items-center gap-2 text-xs text-zinc-300">
                      <input type="checkbox" checked={!!plate.wireHoles} onChange={(e) => updatePlate(plate.id, { wireHoles: e.target.checked })} /> Furar nos furos de fio das letras
                    </label>
                    <Num label="Furos de canto Ø (0 = sem)" value={plate.cornerHoleD} step={0.5} min={0} onChange={(v) => updatePlate(plate.id, { cornerHoleD: v })} />
                    <Num label="Recuo dos furos" value={plate.cornerInset} step={1} min={1} onChange={(v) => updatePlate(plate.id, { cornerInset: v })} />
                  </>
                )}
                <div className="flex gap-1">
                  <Btn onClick={() => fitPlate(plate.kind === 'blade' ? 25 : 10)}>Ajustar ao desenho</Btn>
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
              </div>
            )}
          </Section>

          <Section title="Exportar 3MF">
            <input value={fileName} onChange={(e) => setFileName(e.target.value)} className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs" placeholder="nome do arquivo" />
            <label className="block text-xs text-zinc-400">Impressora
              <select value={printer} onChange={(e) => { const i = +e.target.value; setPrinter(i); if (PRINTERS[i]) { setBedW(PRINTERS[i].w); setBedD(PRINTERS[i].d); } }}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100">
                {PRINTERS.map((p, i) => <option key={p.name} value={i}>{p.name} ({p.w}×{p.d})</option>)}
                <option value={-1}>Personalizada</option>
              </select>
            </label>
            <div className="flex gap-1">
              <Btn active={layout === 'print'} onClick={() => setLayout('print')} title="Cada peça apoiada na mesa, lado a lado">Para imprimir</Btn>
              <Btn active={layout === 'assembled'} onClick={() => setLayout('assembled')} title="Peças na posição de montagem">Montado</Btn>
            </div>
            {layout === 'print' && (
              <>
                <Num label="Mesa largura" value={bedW} step={10} min={50} onChange={(v) => { setBedW(v); setPrinter(-1); }} />
                <Num label="Mesa profundidade" value={bedD} step={10} min={50} onChange={(v) => { setBedD(v); setPrinter(-1); }} />
                <Num label="Espaço entre peças" value={gap} step={1} min={0} onChange={setGap} />
              </>
            )}
            <label className="flex items-center gap-2 text-xs text-zinc-300"><input type="checkbox" checked={onlySel} onChange={(e) => setOnlySel(e.target.checked)} disabled={!selIds.length} /> Só as peças selecionadas</label>
            {layoutWarn.map((w, i) => <div key={i} className="rounded bg-amber-950/50 px-2 py-1 text-[11px] text-amber-300">{w}</div>)}
            {layoutWarn.length > 0 && art && (
              <Btn className="w-full" onClick={() => { const r = E.splitToBed(art, bedW - 2 * gap, bedD - 2 * gap, params.kerf); commit({ ...doc, art: r.art }); flash(`${r.cuts} corte(s) para caber na mesa.`); }}>Cortar automaticamente no tamanho da mesa</Btn>
            )}
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
      )}
    </div>
  );
}
