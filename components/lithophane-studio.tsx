'use client';
/* eslint-disable */
// Litofania: foto -> placa em 3MF (uma peça só, impressa em pé em branco) + base com LED.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as E from '@/lib/signage/engine';
import * as L from '@/lib/signage/lithophane';
import { Cam, render3D } from '@/lib/signage/render3d';

const PRINTERS = [
  { name: 'Bambu Lab P1S / P1P / X1C', w: 256, d: 256, h: 256 },
  { name: 'Bambu Lab A1', w: 256, d: 256, h: 256 },
  { name: 'Bambu Lab A1 mini', w: 180, d: 180, h: 180 },
  { name: 'Creality Ender 3 / K1', w: 220, d: 220, h: 250 },
  { name: 'Prusa MK4', w: 250, d: 210, h: 220 },
];

const SHAPES: { id: L.LithoShape; label: string; icon: React.ReactNode }[] = [
  { id: 'rect', label: 'Retângulo', icon: <rect x="3" y="6" width="18" height="13" rx="0.5" /> },
  { id: 'square', label: 'Quadrado', icon: <rect x="4.5" y="4.5" width="15" height="15" rx="0.5" /> },
  { id: 'rounded', label: 'Arredondado', icon: <rect x="3" y="6" width="18" height="13" rx="4" /> },
  { id: 'circle', label: 'Círculo', icon: <circle cx="12" cy="12" r="8" /> },
  { id: 'oval', label: 'Oval', icon: <ellipse cx="12" cy="12" rx="6.5" ry="9" /> },
  { id: 'heart', label: 'Coração', icon: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /> },
];

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900';

function Num(p: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; suffix?: string; hint?: string }) {
  return (
    <label className="flex items-center justify-between gap-3 py-0.5 text-[13px] text-zinc-300">
      <span className="leading-tight">{p.label}{p.hint && <span className="block text-[11px] text-zinc-500">{p.hint}</span>}</span>
      <span className="flex shrink-0 items-center gap-1.5">
        <input type="number" className={`h-9 w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-right text-zinc-100 transition-colors duration-150 hover:border-zinc-500 ${FOCUS}`}
          value={Number.isFinite(p.value) ? p.value : 0} step={p.step ?? 1} min={p.min} max={p.max}
          onChange={(e) => { const v = parseFloat(e.target.value); if (!Number.isNaN(v)) p.onChange(v); }} />
        <span className="w-7 text-xs text-zinc-500">{p.suffix ?? 'mm'}</span>
      </span>
    </label>
  );
}
function Slider(p: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <label className="block py-0.5 text-[13px] text-zinc-300">
      <span className="mb-1 flex justify-between"><span>{p.label}</span><span className="font-medium tabular-nums text-emerald-300">{p.fmt ? p.fmt(p.value) : p.value}</span></span>
      <input type="range" min={p.min} max={p.max} step={p.step} value={p.value} onChange={(e) => p.onChange(+e.target.value)} className={`h-2 w-full cursor-pointer accent-emerald-500 ${FOCUS}`} />
    </label>
  );
}
function Check(p: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg py-1 text-[13px] text-zinc-300">
      <input type="checkbox" checked={p.checked} onChange={(e) => p.onChange(e.target.checked)} className={`mt-0.5 h-4 w-4 cursor-pointer accent-emerald-500 ${FOCUS}`} />
      <span>{p.label}{p.hint && <span className="block text-[11px] text-zinc-500">{p.hint}</span>}</span>
    </label>
  );
}
function Group(p: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 border-t border-zinc-800 pt-3 first:border-t-0 first:pt-0">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{p.title}</h4>
      {p.children}
    </div>
  );
}
function Advanced(p: { children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
      <summary className={`flex cursor-pointer list-none items-center justify-between text-[13px] text-zinc-400 hover:text-zinc-200 ${FOCUS}`}>
        Avançado
        <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2}><path d="m6 9 6 6 6-6" /></svg>
      </summary>
      <div className="mt-2 space-y-1.5">{p.children}</div>
    </details>
  );
}
function Btn(p: { children: React.ReactNode; onClick?: () => void; active?: boolean; disabled?: boolean; primary?: boolean; className?: string; title?: string; ariaLabel?: string }) {
  const cls = p.primary ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500'
    : p.active ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/60'
    : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700';
  return (
    <button type="button" title={p.title} aria-label={p.ariaLabel} aria-pressed={p.active} disabled={p.disabled} onClick={p.onClick}
      className={`inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS} ${cls} ${p.className ?? ''}`}>
      {p.children}
    </button>
  );
}
const Icon = {
  upload: <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />,
  shape: <><rect x="3" y="3" width="8" height="8" rx="1" /><circle cx="17" cy="17" r="4" /><path d="M14 3h7v7" /></>,
  sliders: <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4" />,
  box: <><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7M12 11v10" /></>,
  download: <path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16" />,
  check: <path d="m5 12 5 5L20 7" />,
};
function Svg(p: { d: React.ReactNode; className?: string }) {
  return <svg viewBox="0 0 24 24" className={p.className ?? 'h-4 w-4'} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p.d}</svg>;
}
function Spinner() {
  return <svg className="h-4 w-4 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>;
}

function readGray(file: File): Promise<{ g: L.Gray; url: string; ar: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const nw = img.naturalWidth || 1000, nh = img.naturalHeight || 1000;
      const sc = Math.min(1, 1800 / Math.max(nw, nh));
      const w = Math.max(8, Math.round(nw * sc)), h = Math.max(8, Math.round(nh * sc));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve({ g: L.toGray(ctx.getImageData(0, 0, w, h).data, w, h), url, ar: nw / nh });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não consegui abrir essa foto.')); };
    img.src = url;
  });
}

function saveFile(data: Uint8Array, name: string) {
  const blob = new Blob([data as unknown as BlobPart], { type: 'model/3mf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${(name || 'litofania').replace(/[^\w\-]+/g, '_')}.3mf`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/** Corte lateral da light box: borda, placa, trava, caixa, LED e tampa. */
function LightboxDiagram() {
  return (
    <svg viewBox="0 0 120 64" className="h-28 w-full rounded bg-zinc-950/60">
      <rect x="6" y="6" width="3" height="52" fill="#9ca3af" />
      <rect x="9" y="6" width="96" height="3" fill="#71717a" />
      <rect x="9" y="55" width="96" height="3" fill="#71717a" />
      <rect x="9" y="12" width="4" height="40" fill="#f5f0e6" />
      <rect x="13" y="9" width="2" height="5" fill="#a1a1aa" /><rect x="13" y="50" width="2" height="5" fill="#a1a1aa" />
      <rect x="105" y="6" width="3" height="52" fill="#52525b" />
      <rect x="101" y="9" width="4" height="3" fill="#52525b" /><rect x="101" y="52" width="4" height="3" fill="#52525b" />
      {[16, 26, 36, 46].map((y) => <circle key={y} cx="102" cy={y} r="1.6" fill="#facc15" />)}
      {[16, 26, 36, 46].map((y) => <line key={'l' + y} x1="100" y1={y} x2="16" y2={y} stroke="#facc15" strokeOpacity="0.35" strokeWidth="1.2" strokeDasharray="2 2" />)}
      <line x1="108" y1="50" x2="118" y2="58" stroke="#ef4444" strokeWidth="1" />
      <text x="2" y="63" fontSize="4" fill="#a1a1aa">frente</text>
      <text x="10" y="4" fontSize="3.6" fill="#a1a1aa">borda · placa · trava</text>
      <text x="62" y="4" fontSize="3.6" fill="#a1a1aa">caixa (profundidade)</text>
      <text x="92" y="63" fontSize="4" fill="#a1a1aa">tampa + LED</text>
    </svg>
  );
}

export default function LithophaneStudio() {
  const [photo, setPhoto] = useState<{ g: L.Gray; url: string; ar: number; name: string } | null>(null);
  const [o, setO] = useState<L.LithoOptions>({ ...L.DEFAULT_LITHO });
  const [b, setB] = useState<L.BaseOptions>({ ...L.DEFAULT_BASE });
  const [bx, setBx] = useState<L.BoxOptions>({ ...L.DEFAULT_BOX });
  const [mount, setMount] = useState<'lightbox' | 'base' | 'none'>('lightbox');
  const setBox = (patch: Partial<L.BoxOptions>) => setBx((p) => ({ ...p, ...patch }));
  const [view, setView] = useState<'lit' | '3d' | 'photo'>('lit');
  const [step, setStep] = useState(0);
  const [printer, setPrinter] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: string; err?: boolean } | null>(null);
  const [fileName, setFileName] = useState('litofania');
  const set = (patch: Partial<L.LithoOptions>) => setO((p) => ({ ...p, ...patch }));
  const setBase = (patch: Partial<L.BaseOptions>) => setB((p) => ({ ...p, ...patch }));

  const load = async (f: File) => {
    try {
      const r = await readGray(f);
      if (photo) URL.revokeObjectURL(photo.url);
      setPhoto({ ...r, name: f.name });
      setFileName(f.name.replace(/\.[^.]+$/, ''));
      // altura pela proporção da foto (formatos livres)
      setO((p) => ({ ...p, heightMm: Math.round((p.widthMm - 2 * p.frame) / r.ar + Math.max(p.frame, p.bottomFrame) + p.frame) }));
      setMsg({ t: 'Foto carregada. Agora escolha o formato da placa.' });
      setStep((st) => (st === 0 ? 1 : st)); setView('lit');
    } catch (e: any) { setMsg({ t: e?.message || String(e), err: true }); }
  };

  // base com encaixe precisa da moldura de baixo; a light box segura a placa pela moldura em volta
  useEffect(() => {
    if (mount === 'base' && o.bottomFrame < b.height) set({ bottomFrame: b.height });
    if (mount === 'lightbox' && o.bottomFrame > 0) set({ bottomFrame: 0 });
    /* eslint-disable-next-line */
  }, [mount, b.height]);
  const plateZ = mount === 'base' ? b.wall : mount === 'lightbox' ? (bx.foot ? bx.footH : 0) + bx.clearance + bx.wall : 0;

  const [W, H] = L.lithoSize(o);
  const pr = PRINTERS[printer] ?? PRINTERS[0];
  const T0 = Math.max(o.frameT, o.maxT);
  const fitWarn = useMemo(() => {
    const w: string[] = [];
    const phi = (o.curve * Math.PI) / 180;
    const chord = phi > 0.01 ? 2 * (W / phi) * Math.sin(phi / 2) : W;
    if (chord > pr.w - 10) w.push(`A placa (${chord.toFixed(0)} mm de largura) não cabe na mesa de ${pr.w} mm. Diminua a largura.`);
    if (H > pr.h - 5) w.push(`A placa em pé tem ${H.toFixed(0)} mm de altura; a ${pr.name} imprime até ${pr.h} mm.`);
    if (mount === 'lightbox') {
      const bw = W + 2 * (bx.clearance + bx.wall), bh = H + 2 * (bx.clearance + bx.wall) + (bx.foot ? bx.footH : 0);
      if (o.curve < 1 && (Math.min(bw, bh) > Math.min(pr.w, pr.d) || Math.max(bw, bh) > Math.max(pr.w, pr.d))) w.push(`A light box (${bw.toFixed(0)}×${bh.toFixed(0)} mm deitada) não cabe na mesa.`);
      if (o.curve >= 1) w.push('Light box curva: imprima o corpo em pé, como vem no arquivo, com suporte em árvore ligado (a parte de cima fica em balanço).');
      if (bx.depth < 20) w.push('Profundidade menor que 20 mm deixa pontos de luz do LED aparecendo na foto.');
      if (o.frame < 2) w.push('Moldura da placa menor que 2 mm: a borda da light box quase não segura a placa.');
    }
    if (o.maxT - o.minT < 1.2) w.push('Pouca diferença entre espessura mínima e máxima: a foto vai ficar sem contraste.');
    if (o.minT < 0.6) w.push('Espessura mínima abaixo de 0,6 mm pode furar.');
    return w;
  }, [o, b, bx, mount, W, H, pr]);

  // ---------------------------------------------------- prévia acesa (2D)
  const cvL = useRef<HTMLCanvasElement>(null);
  const grid = useMemo(() => (photo ? L.lithoGrid(photo.g, o, Math.max(0.4, Math.max(W, H) / 450)) : null), [photo, o, W, H]);
  useEffect(() => {
    const cv = cvL.current; if (!cv || !grid || view !== 'lit') return;
    const img = L.litPreview(grid); if (!img) return;
    const off = document.createElement('canvas'); off.width = img.width; off.height = img.height;
    off.getContext('2d')!.putImageData(img, 0, 0);
    const box = cv.parentElement!.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = box.width * dpr; cv.height = box.height * dpr; cv.style.width = `${box.width}px`; cv.style.height = `${box.height}px`;
    const ctx = cv.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createRadialGradient(box.width / 2, box.height / 2, 10, box.width / 2, box.height / 2, box.width * 0.7);
    g.addColorStop(0, '#1c1917'); g.addColorStop(1, '#09090b');
    ctx.fillStyle = g; ctx.fillRect(0, 0, box.width, box.height);
    const k = Math.min((box.width - 40) / img.width, (box.height - 40) / img.height);
    ctx.shadowColor = 'rgba(255,200,120,0.45)'; ctx.shadowBlur = 40;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, (box.width - img.width * k) / 2, (box.height - img.height * k) / 2, img.width * k, img.height * k);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#a1a1aa'; ctx.font = '11px sans-serif';
    ctx.fillText(`${W.toFixed(0)} × ${H.toFixed(0)} mm · como fica com a luz acesa atrás`, 10, box.height - 10);
  }, [grid, view]);

  // ---------------------------------------------------- 3D (malha leve só para ver)
  const cv3 = useRef<HTMLCanvasElement>(null);
  const cam = useRef<Cam>({ yaw: -Math.PI / 2 - 0.45, pitch: 0.25, dist: 400, cx: 0, cy: 0, cz: 60 });
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);
  const preview = useMemo(() => {
    if (!photo || view !== '3d') return [];
    const res = Math.max(0.8, Math.max(W, H) / 160);
    const objs: E.SceneObject[] = [{ id: 'l', name: 'placa', kind: 'part', mesh: L.buildLithophane(photo.g, o, res, plateZ), color: '#f5f0e6' }];
    if (mount === 'base') objs.push({ id: 'b', name: 'base', kind: 'part', mesh: L.buildLithoBase(o, b).mesh, color: '#57534e' });
    if (mount === 'lightbox') for (const x of L.buildLightbox(o, bx, Math.max(1.2, Math.max(W, H) / 120)).objects) objs.push({ id: x.id, name: x.name, kind: 'part', mesh: x.mesh, color: x.id === 'box' ? '#57534e' : x.id === 'lock' ? '#a8a29e' : '#78716c' });
    return objs;
  }, [photo, o, b, bx, mount, view, W, H, plateZ]);

  // vista explodida: cada peça se afasta na direção em que é montada
  const [explode, setExplode] = useState(0);
  const [anim, setAnim] = useState(false);
  const exploded = useMemo(() => {
    if (!explode) return preview;
    // light box: placa, trava e tampa saem para trás (+Y), na ordem de montagem; base: a placa sobe
    const step: Record<string, [number, number, number]> = mount === 'lightbox'
      ? { box: [0, 0, 0], l: [0, 1, 0], lock: [0, 1.6, 0], back: [0, 2.4, 0] }
      : { b: [0, 0, 0], l: [0, 0, 1] };
    return preview.map((ob) => {
      const d = step[ob.id];
      if (!d || (!d[0] && !d[1] && !d[2])) return ob;
      const p = ob.mesh.pos, pos = new Array<number>(p.length);
      for (let i = 0; i < p.length; i += 3) { pos[i] = p[i] + d[0] * explode; pos[i + 1] = p[i + 1] + d[1] * explode; pos[i + 2] = p[i + 2] + d[2] * explode; }
      return { ...ob, mesh: { pos, idx: ob.mesh.idx } };
    });
  }, [preview, explode, mount]);
  const maxExplode = mount === 'lightbox' ? Math.max(40, bx.depth * 1.5) : Math.max(30, H * 0.4);
  // animação montar / desmontar
  useEffect(() => {
    if (!anim) return;
    const target = explode > maxExplode / 2 ? 0 : maxExplode;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setExplode(target); setAnim(false); return; }
    const from = explode, t0 = performance.now(), dur = 1200;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      setExplode(Math.round(from + (target - from) * e));
      if (k < 1) raf = requestAnimationFrame(tick); else setAnim(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    /* eslint-disable-next-line */
  }, [anim]);

  const draw3 = useCallback(() => {
    const cv = cv3.current; if (!cv) return;
    const box = cv.parentElement!.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = box.width * dpr; cv.height = box.height * dpr; cv.style.width = `${box.width}px`; cv.style.height = `${box.height}px`;
    render3D(cv.getContext('2d')!, box.width, box.height, exploded, cam.current, 0, dpr);
  }, [exploded]);
  useEffect(() => { if (view === '3d') draw3(); }, [draw3, view]);
  useEffect(() => {
    if (view !== '3d') return;
    cam.current = { ...cam.current, cx: 0, cy: 0, cz: H / 2, dist: Math.max(W, H) * 1.9 };
    draw3();
    /* eslint-disable-next-line */
  }, [view, preview]);

  // ---------------------------------------------------- exportar
  const exportNow = async (what: 'all' | 'plate' | 'base') => {
    if (!photo && what !== 'base') { setMsg({ t: 'Suba uma foto primeiro.', err: true }); return; }
    setBusy(true); setMsg({ t: 'Gerando a malha em alta resolução… (pode levar alguns segundos)' });
    await new Promise((r) => setTimeout(r, 30));
    try {
      const objs: E.SceneObject[] = [];
      if (what !== 'base' && photo) objs.push({ id: 'l', name: 'Litofania', kind: 'part', mesh: L.buildLithophane(photo.g, o, o.res, 0), color: '#FFFFFF' });
      if (what !== 'plate' && mount === 'base') objs.push({ id: 'b', name: 'Base com LED', kind: 'plate', mesh: L.buildLithoBase(o, b).mesh, color: '#3F3F46' });
      if (what !== 'plate' && mount === 'lightbox') for (const x of L.buildLightbox(o, bx).objects) objs.push({ id: x.id, name: x.name, kind: 'plate', mesh: x.flatPrint ? L.layFlat(x.mesh) : x.mesh, color: x.color });
      if (!objs.length) throw new Error('Nada para exportar.');
      const r = await E.build3MFCompressed(objs, { mode: 'print', bedW: pr.w, bedD: pr.d, gap: 8 });
      saveFile(r.data, what === 'base' ? `${fileName}_base` : what === 'plate' ? `${fileName}_placa` : fileName);
      const tris = objs.reduce((s, x) => s + x.mesh.idx.length / 3, 0);
      setMsg({ t: `3MF baixado (${(r.data.length / 1e6).toFixed(1)} MB, ${Math.round(tris / 1000)} mil triângulos). A placa já vem em pé, em uma peça só${mount === 'lightbox' && o.curve < 1 ? '; a light box vem deitada, abertura para baixo, sem suporte' : ''}.${r.warnings.length ? ' ' + r.warnings.join(' ') : ''}` });
    } catch (e: any) { setMsg({ t: e?.message || String(e), err: true }); }
    setBusy(false);
  };

  const steps = [
    { title: 'Foto', icon: Icon.upload, done: !!photo, sum: photo ? photo.name : 'envie a imagem' },
    { title: 'Formato', icon: Icon.shape, done: !!photo, sum: `${SHAPES.find((s) => s.id === o.shape)?.label} · ${W.toFixed(0)}×${H.toFixed(0)} · ${o.curve ? `${o.curve}°` : 'plana'}` },
    { title: 'Ajustes', icon: Icon.sliders, done: !!photo, sum: `${o.minT}–${o.maxT} mm · contraste ${o.gamma.toFixed(1)}` },
    { title: 'Suporte', icon: Icon.box, done: !!photo, sum: mount === 'lightbox' ? `light box ${bx.depth} mm` : mount === 'base' ? 'base com encaixe' : 'só a placa' },
    { title: 'Exportar', icon: Icon.download, done: false, sum: pr.name.split(' / ')[0] },
  ];
  const go = (i: number) => {
    setStep(i);
    if (!photo) return;
    if (i === 1 || i === 2) setView('lit');
    else if (i === 3 && mount !== 'none') setView('3d');
  };
  const supportLabel = mount === 'lightbox' ? 'placa + light box' : mount === 'base' ? 'placa + base' : 'placa';

  return (
    <div className="space-y-3">
      {/* etapas */}
      <nav aria-label="Etapas da litofania" className="grid grid-cols-5 gap-1 rounded-xl border border-zinc-800 bg-zinc-900/70 p-1">
        {steps.map((s, i) => {
          const cur = i === step;
          return (
            <button key={s.title} type="button" onClick={() => go(i)} aria-current={cur ? 'step' : undefined}
              className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 ${FOCUS} ${cur ? 'bg-emerald-500/15 ring-1 ring-inset ring-emerald-500/50' : 'hover:bg-zinc-800/70'}`}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${cur ? 'bg-emerald-500 text-zinc-950' : s.done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'}`}>
                {s.done && !cur ? <Svg d={Icon.check} className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className={`block text-[13px] font-medium ${cur ? 'text-emerald-200' : 'text-zinc-200'}`}>{s.title}</span>
                <span className="block truncate text-[11px] text-zinc-500">{s.sum}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="grid gap-3 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* painel da etapa atual */}
        <aside className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/70 lg:max-h-[calc(100vh-260px)] lg:min-h-[560px]">
          <header className="flex items-center gap-2.5 border-b border-zinc-800 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300"><Svg d={steps[step].icon} /></span>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">{step + 1}. {steps[step].title}</h3>
              <p className="text-[11px] text-zinc-500">{['Escolha a foto que vai virar a placa.', 'Formato, tamanho e curvatura da placa.', 'Contraste da foto e espessuras.', 'Como a placa fica em pé e onde vai o LED.', 'Baixe o 3MF pronto para a impressora.'][step]}</p>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {step === 0 && (
              <>
                <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-8 text-center transition-colors duration-150 hover:border-emerald-500 hover:bg-emerald-500/5 ${FOCUS}`}
                  onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) load(f); }}>
                  {photo ? <img src={photo.url} alt={`Foto escolhida: ${photo.name}`} className="max-h-40 rounded-lg" /> : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300"><Svg d={Icon.upload} className="h-6 w-6" /></span>}
                  <span className="text-sm font-medium text-zinc-100">{photo ? 'Trocar foto' : 'Escolher foto'}</span>
                  <span className="text-xs text-zinc-500">ou arraste aqui · JPG ou PNG · quanto maior a resolução, melhor</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); e.target.value = ''; }} />
                </label>
                <ul className="space-y-1 text-[12px] text-zinc-400">
                  <li>• Fotos com rosto bem iluminado e fundo simples ficam melhores.</li>
                  <li>• A foto vira relevo em <b className="text-zinc-200">uma peça só</b>, impressa em branco.</li>
                </ul>
              </>
            )}

            {step === 1 && (
              <>
                <Group title="Formato">
                  <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Formato da placa">
                    {SHAPES.map((s) => (
                      <button key={s.id} type="button" role="radio" aria-checked={o.shape === s.id} onClick={() => set({ shape: s.id })}
                        className={`flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border text-[11px] transition-colors duration-150 ${FOCUS} ${o.shape === s.id ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-600'}`}>
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">{s.icon}</svg>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </Group>
                <Group title="Tamanho">
                  <Num label={o.shape === 'square' || o.shape === 'circle' ? 'Tamanho' : 'Largura'} value={o.widthMm} step={5} min={30} onChange={(v) => set({ widthMm: v })} />
                  {!(o.shape === 'square' || o.shape === 'circle') && (
                    <>
                      <Num label="Altura" value={o.heightMm} step={5} min={30} onChange={(v) => set({ heightMm: v })} />
                      <Btn className="w-full" disabled={!photo} title="Altura pela proporção da foto" onClick={() => photo && set({ heightMm: Math.round((o.widthMm - 2 * o.frame) / photo.ar + Math.max(o.frame, o.bottomFrame) + o.frame) })}>Usar a proporção da foto</Btn>
                    </>
                  )}
                  {o.shape === 'rounded' && <Num label="Raio dos cantos" value={o.radius} step={1} min={1} onChange={(v) => set({ radius: v })} />}
                </Group>
                <Group title="Curvatura">
                  <Slider label="Curva da placa" value={o.curve} min={0} max={180} step={5} onChange={(v) => set({ curve: v })} fmt={(v) => (v ? `${v}°` : 'plana')} />
                  <div className="flex gap-1">{[0, 45, 60, 90, 120].map((c) => <Btn key={c} className="flex-1 px-1" active={o.curve === c} onClick={() => set({ curve: c })}>{c ? `${c}°` : 'Plana'}</Btn>)}</div>
                </Group>
                <p className="text-[11px] text-zinc-500">A foto preenche o formato sem distorcer (as sobras são cortadas).</p>
              </>
            )}

            {step === 2 && (
              <>
                <Group title="Foto">
                  <Slider label="Contraste" value={o.gamma} min={0.4} max={2.2} step={0.05} onChange={(v) => set({ gamma: v })} fmt={(v) => v.toFixed(2)} />
                  <Slider label="Brilho" value={o.brightness} min={-0.4} max={0.4} step={0.02} onChange={(v) => set({ brightness: v })} fmt={(v) => (v > 0 ? '+' : '') + Math.round(v * 100) + '%'} />
                  <Check label="Espelhar foto" checked={o.mirror} onChange={(v) => set({ mirror: v })} />
                  <Check label="Negativo" checked={o.invert} onChange={(v) => set({ invert: v })} />
                </Group>
                <Group title="Espessura">
                  <Num label="Mínima" hint="partes claras" value={o.minT} step={0.1} min={0.4} onChange={(v) => set({ minT: v })} />
                  <Num label="Máxima" hint="partes escuras" value={o.maxT} step={0.1} min={1} onChange={(v) => set({ maxT: v })} />
                  <Num label="Moldura" hint="largura da borda lisa" value={o.frame} step={0.5} min={0} onChange={(v) => set({ frame: v })} />
                </Group>
                <Advanced>
                  <Num label="Espessura da moldura" value={o.frameT} step={0.5} min={1} onChange={(v) => set({ frameT: v })} />
                  <Num label="Moldura de baixo" hint="parte que entra na base" value={o.bottomFrame} step={1} min={0} onChange={(v) => set({ bottomFrame: v })} />
                  <Check label="Relevo atrás (frente lisa)" checked={o.textureBack} onChange={(v) => set({ textureBack: v })} />
                  <label className="block text-[13px] text-zinc-300">Resolução da malha
                    <select value={o.res} onChange={(e) => set({ res: +e.target.value })} className={`mt-1 h-9 w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-zinc-100 ${FOCUS}`}>
                      <option value={0.2}>Fina 0,2 mm (arquivo grande)</option>
                      <option value={0.3}>Normal 0,3 mm (recomendado)</option>
                      <option value={0.5}>Rápida 0,5 mm</option>
                    </select>
                  </label>
                </Advanced>
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Tipo de suporte">
                  {([['lightbox', 'Light box', 'caixa atrás com LED'], ['base', 'Base', 'rasgo de encaixe'], ['none', 'Só placa', 'sem suporte']] as const).map(([id, t, d]) => (
                    <button key={id} type="button" role="radio" aria-checked={mount === id} onClick={() => { setMount(id); if (photo && id !== 'none') setView('3d'); }}
                      className={`min-h-14 cursor-pointer rounded-lg border px-2 py-2 text-center transition-colors duration-150 ${FOCUS} ${mount === id ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-600'}`}>
                      <span className={`block text-[13px] font-medium ${mount === id ? 'text-emerald-300' : 'text-zinc-200'}`}>{t}</span>
                      <span className="block text-[10px] text-zinc-500">{d}</span>
                    </button>
                  ))}
                </div>
                {mount === 'lightbox' && (
                  <>
                    <LightboxDiagram />
                    <Group title="Caixa">
                      <Num label="Profundidade" hint="distância do LED até a foto" value={bx.depth} step={1} min={10} onChange={(v) => setBox({ depth: v })} />
                      <Check label="Pé de apoio" hint="para ficar em pé na mesa" checked={bx.foot} onChange={(v) => setBox({ foot: v })} />
                      {bx.foot && <Num label="Altura do pé" value={bx.footH} step={1} min={4} onChange={(v) => setBox({ footH: v })} />}
                      <Check label="Furos para pendurar na parede" checked={bx.hang} onChange={(v) => setBox({ hang: v })} />
                    </Group>
                    <Advanced>
                      <Num label="Parede" value={bx.wall} step={0.2} min={1.2} onChange={(v) => setBox({ wall: v })} />
                      <Num label="Borda da frente" value={bx.lip} step={0.2} min={0.8} onChange={(v) => setBox({ lip: v })} />
                      <Num label="Folga da placa" value={bx.clearance} step={0.05} min={0.1} onChange={(v) => setBox({ clearance: v })} />
                      <Num label="Tampa traseira" value={bx.back} step={0.2} min={1.2} onChange={(v) => setBox({ back: v })} />
                      <Num label="Furo do cabo Ø" value={bx.cableD} step={0.5} min={3} onChange={(v) => setBox({ cableD: v })} />
                    </Advanced>
                    <p className="text-[11px] leading-relaxed text-zinc-500">Montagem: a placa entra por trás, contra a borda da frente, e a trava prende. A fita de LED vai colada por dentro da tampa traseira; o cabo sai pelo furo. Use <b className="text-zinc-300">Desmontar</b> no 3D para ver a ordem.</p>
                  </>
                )}
                {mount === 'base' && (
                  <>
                    <Group title="Base">
                      <Num label="Altura da base" value={b.height} step={1} min={8} onChange={(v) => setBase({ height: v })} />
                      <Num label="Sobra em volta" value={b.margin} step={1} min={3} onChange={(v) => setBase({ margin: v })} />
                      <Num label="Janela de luz" hint="atrás da placa" value={b.window} step={1} min={4} onChange={(v) => setBase({ window: v })} />
                    </Group>
                    <Advanced>
                      <Num label="Parede" value={b.wall} step={0.2} min={1.2} onChange={(v) => setBase({ wall: v })} />
                      <Num label="Folga do encaixe" value={b.clearance} step={0.05} min={0.1} onChange={(v) => setBase({ clearance: v })} />
                      <Num label="Furo do cabo Ø" value={b.cableD} step={0.5} min={3} onChange={(v) => setBase({ cableD: v })} />
                    </Advanced>
                    <p className="text-[11px] leading-relaxed text-zinc-500">A placa entra no rasgo e apoia no fundo. A fita de LED fica no fundo, embaixo da janela de luz.</p>
                  </>
                )}
                {mount === 'none' && <p className="text-[12px] text-zinc-400">Só a placa, para usar num suporte ou porta-retrato que você já tem.</p>}
              </>
            )}

            {step === 4 && (
              <>
                <Group title="Arquivo">
                  <label className="block text-[13px] text-zinc-300">Nome do arquivo
                    <input value={fileName} onChange={(e) => setFileName(e.target.value)} className={`mt-1 h-9 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-zinc-100 ${FOCUS}`} />
                  </label>
                  <div className="flex gap-1.5">
                    <Btn className="flex-1" disabled={!photo || busy} onClick={() => exportNow('plate')}>Só a placa</Btn>
                    <Btn className="flex-1" disabled={mount === 'none' || busy} onClick={() => exportNow('base')}>{mount === 'lightbox' ? 'Só a light box' : 'Só a base'}</Btn>
                  </div>
                </Group>
                <Group title="Como imprimir">
                  <ul className="space-y-1.5 text-[12px] leading-relaxed text-zinc-400">
                    <li>• Placa em <b className="text-zinc-200">PLA branco</b>, em pé como vem no arquivo, <b className="text-zinc-200">100% de preenchimento</b>, camada 0,12 mm, aba (brim) de 5 mm.</li>
                    <li>• Light box e base em <b className="text-zinc-200">PLA escuro e opaco</b>, para a luz sair só pela foto.</li>
                    <li>• LED: fita branca quente USB 5 V (2700–3000 K) em zigue-zague.</li>
                    <li>• Primeira vez? Teste uma placa de 60 mm para calibrar o contraste.</li>
                  </ul>
                </Group>
              </>
            )}
          </div>

          <footer className="flex gap-2 border-t border-zinc-800 px-4 py-3">
            <Btn className="flex-1" disabled={step === 0} onClick={() => go(step - 1)}>Voltar</Btn>
            {step < 4
              ? <Btn className="flex-1" primary disabled={step === 0 && !photo} onClick={() => go(step + 1)}>Próximo</Btn>
              : <Btn className="flex-1" primary disabled={!photo || busy} onClick={() => exportNow('all')}>{busy ? <><Spinner /> Gerando…</> : 'Baixar 3MF'}</Btn>}
          </footer>
        </aside>

        {/* visualizador */}
        <main className="space-y-2">
          <div className="relative h-[min(68vh,640px)] min-h-[420px] overflow-hidden rounded-xl border border-zinc-800 bg-[#09090b]"
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) { load(f); setStep(1); setView('lit'); } }}>
            {!photo && (
              <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300"><Svg d={Icon.upload} className="h-8 w-8" /></span>
                <span className="text-base font-medium text-zinc-200">Arraste a foto aqui</span>
                <span className="max-w-sm text-sm text-zinc-500">Ela vira uma placa em uma peça só, pronta para imprimir em branco e iluminar por trás.</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) { load(f); setStep(1); setView('lit'); } e.target.value = ''; }} />
              </label>
            )}
            {photo && view === 'lit' && <canvas ref={cvL} className="block" aria-label="Prévia da litofania acesa" />}
            {photo && view === 'photo' && <img src={photo.url} alt="Foto original" className="h-full w-full object-contain" />}
            {photo && view === '3d' && (
              <canvas ref={cv3} className="block cursor-grab active:cursor-grabbing" style={{ touchAction: 'none' }} aria-label="Modelo 3D: arraste para girar, role para aproximar"
                onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, yaw: cam.current.yaw, pitch: cam.current.pitch }; }}
                onPointerMove={(e) => { const d = drag.current; if (!d) return; cam.current = { ...cam.current, yaw: d.yaw - (e.clientX - d.x) * 0.008, pitch: Math.max(-1.4, Math.min(1.4, d.pitch + (e.clientY - d.y) * 0.008)) }; draw3(); }}
                onPointerUp={() => { drag.current = null; }}
                onWheel={(e) => { cam.current = { ...cam.current, dist: Math.max(50, cam.current.dist * Math.pow(1.0015, e.deltaY)) }; draw3(); }} />
            )}

            {/* barra de visualização (sobre o canvas) */}
            {photo && (
              <div className="absolute inset-x-3 top-3 z-10 flex flex-wrap items-start justify-between gap-2">
                <div role="tablist" aria-label="Modo de visualização" className="flex rounded-lg border border-zinc-700/70 bg-zinc-900/90 p-0.5 backdrop-blur">
                  {([['lit', 'Acesa'], ['3d', '3D'], ['photo', 'Original']] as const).map(([id, t]) => (
                    <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)}
                      className={`min-h-8 cursor-pointer rounded-md px-3 text-[13px] font-medium transition-colors duration-150 ${FOCUS} ${view === id ? 'bg-emerald-600 text-white' : 'text-zinc-300 hover:text-white'}`}>{t}</button>
                  ))}
                </div>
                {view === '3d' && (
                  <div className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-700/70 bg-zinc-900/90 p-1 backdrop-blur">
                    {mount !== 'none' && (
                      <>
                        <label className="flex items-center gap-2 px-1 text-[12px] text-zinc-400">Explodir
                          <input type="range" min={0} max={Math.round(maxExplode)} value={explode} onChange={(e) => { setAnim(false); setExplode(+e.target.value); }} className={`w-24 cursor-pointer accent-emerald-500 ${FOCUS}`} aria-label="Distância da vista explodida" />
                          <span className="w-11 text-right tabular-nums text-zinc-300">{explode} mm</span>
                        </label>
                        <Btn className="min-h-8" onClick={() => setAnim(true)} disabled={anim}>{explode > maxExplode / 2 ? 'Montar' : 'Desmontar'}</Btn>
                        <span className="mx-0.5 h-5 w-px bg-zinc-700" aria-hidden="true" />
                      </>
                    )}
                    <Btn className="min-h-8 px-2" title="Ver de frente" onClick={() => { cam.current = { ...cam.current, yaw: -Math.PI / 2, pitch: 0.1 }; draw3(); }}>Frente</Btn>
                    <Btn className="min-h-8 px-2" title="Ver de lado" onClick={() => { cam.current = { ...cam.current, yaw: 0, pitch: 0.15 }; draw3(); }}>Lado</Btn>
                    <Btn className="min-h-8 px-2" title="Ver por trás" onClick={() => { cam.current = { ...cam.current, yaw: Math.PI / 2 - 0.5, pitch: 0.3 }; draw3(); }}>Trás</Btn>
                  </div>
                )}
              </div>
            )}
            {photo && view === '3d' && (
              <div className="absolute bottom-3 left-3 max-w-[calc(100%-24px)] rounded-lg bg-zinc-900/90 px-3 py-2 text-[12px] leading-relaxed text-zinc-300 backdrop-blur">
                {explode > 0
                  ? (mount === 'lightbox' ? <>Ordem de montagem (por trás): <b>1</b> corpo · <b>2</b> placa · <b>3</b> trava · <b>4</b> tampa com LED</> : <>Ordem: <b>1</b> base com LED · <b>2</b> placa desce no rasgo</>)
                  : <>Prévia simplificada · arraste para girar · o 3MF sai em {o.res} mm</>}
              </div>
            )}
          </div>
          <div aria-live="polite" className="space-y-2">
            {msg && <div className={`rounded-lg px-3 py-2 text-[13px] ${msg.err ? 'bg-red-950/70 text-red-300' : 'bg-emerald-950/60 text-emerald-300'}`}>{msg.t}</div>}
            {fitWarn.map((w, i) => <div key={i} className="rounded-lg border border-amber-800/40 bg-amber-950/40 px-3 py-2 text-[13px] text-amber-300">{w}</div>)}
          </div>
        </main>
      </div>

      {/* barra de ação fixa */}
      <div className="sticky bottom-2 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/95 px-4 py-2.5 shadow-2xl shadow-black/50 backdrop-blur">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-zinc-400">
          <span><span className="text-zinc-500">Placa</span> <b className="font-medium text-zinc-200">{W.toFixed(0)} × {H.toFixed(0)} mm</b></span>
          <span><span className="text-zinc-500">Formato</span> <b className="font-medium text-zinc-200">{SHAPES.find((s) => s.id === o.shape)?.label}{o.curve ? `, curva ${o.curve}°` : ', plana'}</b></span>
          <span><span className="text-zinc-500">Saída</span> <b className="font-medium text-zinc-200">{supportLabel}</b></span>
        </div>
        <label className="flex items-center gap-2 text-[12px] text-zinc-400">Impressora
          <select value={printer} onChange={(e) => setPrinter(+e.target.value)} className={`h-9 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-[13px] text-zinc-100 ${FOCUS}`}>
            {PRINTERS.map((p, i) => <option key={p.name} value={i}>{p.name} ({p.w}×{p.d}×{p.h})</option>)}
          </select>
        </label>
        <Btn primary className="min-h-10 px-5 text-sm" disabled={!photo || busy} onClick={() => exportNow('all')}>
          {busy ? <><Spinner /> Gerando…</> : <><Svg d={Icon.download} /> Baixar 3MF ({supportLabel})</>}
        </Btn>
      </div>
    </div>
  );
}
