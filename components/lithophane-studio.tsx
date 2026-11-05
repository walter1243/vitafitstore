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

function Num(p: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; suffix?: string }) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs text-zinc-400">
      <span>{p.label}</span>
      <span className="flex items-center gap-1">
        <input type="number" className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-right text-zinc-100 outline-none focus:border-emerald-500"
          value={Number.isFinite(p.value) ? p.value : 0} step={p.step ?? 1} min={p.min} max={p.max}
          onChange={(e) => { const v = parseFloat(e.target.value); if (!Number.isNaN(v)) p.onChange(v); }} />
        <span className="w-6 text-zinc-500">{p.suffix ?? 'mm'}</span>
      </span>
    </label>
  );
}
function Slider(p: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs text-zinc-400">
      <span>{p.label} <span className="text-zinc-300">{p.fmt ? p.fmt(p.value) : p.value}</span></span>
      <input type="range" min={p.min} max={p.max} step={p.step} value={p.value} onChange={(e) => p.onChange(+e.target.value)} className="w-32 accent-emerald-500" />
    </label>
  );
}
function Section(p: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{p.title}</h3>
      <div className="space-y-2">{p.children}</div>
    </section>
  );
}
function Btn(p: { children: React.ReactNode; onClick?: () => void; active?: boolean; disabled?: boolean; primary?: boolean; className?: string; title?: string }) {
  const cls = p.primary ? 'bg-emerald-600 text-white hover:bg-emerald-500' : p.active ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/60' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700';
  return <button type="button" title={p.title} disabled={p.disabled} onClick={p.onClick} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${cls} ${p.className ?? ''}`}>{p.children}</button>;
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
      setMsg({ t: 'Foto carregada. Ajuste o formato e o contraste olhando a prévia acesa, depois baixe o 3MF.' });
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
    if (mount === 'lightbox') for (const x of L.buildLightbox(o, bx, Math.max(1.2, Math.max(W, H) / 120)).objects) if (x.id !== 'lock') objs.push({ id: x.id, name: x.name, kind: 'part', mesh: x.mesh, color: x.id === 'box' ? '#57534e' : '#78716c' });
    return objs;
  }, [photo, o, b, bx, mount, view, W, H, plateZ]);
  const draw3 = useCallback(() => {
    const cv = cv3.current; if (!cv) return;
    const box = cv.parentElement!.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = box.width * dpr; cv.height = box.height * dpr; cv.style.width = `${box.width}px`; cv.style.height = `${box.height}px`;
    render3D(cv.getContext('2d')!, box.width, box.height, preview, cam.current, 0, dpr);
  }, [preview]);
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

  return (
    <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)_300px]">
      {/* esquerda */}
      <div className="space-y-3">
        <Section title="1. Foto">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-600 bg-zinc-950/60 px-3 py-5 text-center text-xs text-zinc-300 hover:border-emerald-500"
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) load(f); }}>
            {photo ? <img src={photo.url} alt="" className="mb-2 max-h-28 rounded" /> : null}
            <span className="font-medium">{photo ? 'Trocar foto' : 'Subir foto (ou arraste aqui)'}</span>
            <span className="text-[11px] text-zinc-500">JPG ou PNG. Quanto maior a resolução, melhor.</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); e.target.value = ''; }} />
          </label>
          <Slider label="Contraste" value={o.gamma} min={0.4} max={2.2} step={0.05} onChange={(v) => set({ gamma: v })} fmt={(v) => v.toFixed(2)} />
          <Slider label="Brilho" value={o.brightness} min={-0.4} max={0.4} step={0.02} onChange={(v) => set({ brightness: v })} fmt={(v) => (v > 0 ? '+' : '') + Math.round(v * 100) + '%'} />
          <label className="flex items-center gap-2 text-xs text-zinc-400"><input type="checkbox" checked={o.mirror} onChange={(e) => set({ mirror: e.target.checked })} /> Espelhar foto</label>
          <label className="flex items-center gap-2 text-xs text-zinc-400"><input type="checkbox" checked={o.invert} onChange={(e) => set({ invert: e.target.checked })} /> Negativo</label>
        </Section>

        <Section title="2. Formato da placa">
          <div className="grid grid-cols-3 gap-1.5">
            {SHAPES.map((s) => (
              <button key={s.id} type="button" onClick={() => set({ shape: s.id })}
                className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[10px] ${o.shape === s.id ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-600'}`}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.6}>{s.icon}</svg>
                {s.label}
              </button>
            ))}
          </div>
          <Num label={o.shape === 'square' || o.shape === 'circle' ? 'Tamanho' : 'Largura'} value={o.widthMm} step={5} min={30} onChange={(v) => set({ widthMm: v })} />
          {!(o.shape === 'square' || o.shape === 'circle') && (
            <div className="flex items-end gap-2">
              <div className="flex-1"><Num label="Altura" value={o.heightMm} step={5} min={30} onChange={(v) => set({ heightMm: v })} /></div>
              <Btn disabled={!photo} title="Altura pela proporção da foto" onClick={() => photo && set({ heightMm: Math.round((o.widthMm - 2 * o.frame) / photo.ar + Math.max(o.frame, o.bottomFrame) + o.frame) })}>Da foto</Btn>
            </div>
          )}
          {o.shape === 'rounded' && <Num label="Raio dos cantos" value={o.radius} step={1} min={1} onChange={(v) => set({ radius: v })} />}
          <Slider label="Curvatura" value={o.curve} min={0} max={180} step={5} onChange={(v) => set({ curve: v })} fmt={(v) => (v ? `${v}°` : 'plana')} />
          <p className="text-[11px] text-zinc-500">A foto preenche o formato sem distorcer (corta as sobras).</p>
        </Section>

        <Section title="3. Espessura e moldura">
          <Num label="Espessura mínima (claro)" value={o.minT} step={0.1} min={0.4} onChange={(v) => set({ minT: v })} />
          <Num label="Espessura máxima (escuro)" value={o.maxT} step={0.1} min={1} onChange={(v) => set({ maxT: v })} />
          <Num label="Largura da moldura" value={o.frame} step={0.5} min={0} onChange={(v) => set({ frame: v })} />
          <Num label="Espessura da moldura" value={o.frameT} step={0.5} min={1} onChange={(v) => set({ frameT: v })} />
          <Num label="Moldura de baixo (encaixe)" value={o.bottomFrame} step={1} min={0} onChange={(v) => set({ bottomFrame: v })} />
          <label className="flex items-center gap-2 text-xs text-zinc-400"><input type="checkbox" checked={o.textureBack} onChange={(e) => set({ textureBack: e.target.checked })} /> Relevo atrás (frente lisa)</label>
          <label className="block text-xs text-zinc-400">Resolução
            <select value={o.res} onChange={(e) => set({ res: +e.target.value })} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100">
              <option value={0.2}>Fina 0,2 mm (arquivo grande)</option>
              <option value={0.3}>Normal 0,3 mm (recomendado)</option>
              <option value={0.5}>Rápida 0,5 mm</option>
            </select>
          </label>
        </Section>
      </div>

      {/* centro */}
      <div className="space-y-2">
        <div className="flex gap-1">
          <Btn active={view === 'lit'} onClick={() => setView('lit')}>Prévia acesa</Btn>
          <Btn active={view === '3d'} onClick={() => setView('3d')}>3D</Btn>
          <Btn active={view === 'photo'} onClick={() => setView('photo')}>Foto original</Btn>
        </div>
        <div className="relative h-[600px] overflow-hidden rounded-xl border border-zinc-800 bg-[#09090b]">
          {!photo && <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-zinc-500">Suba uma foto para criar a litofania.<br />Ela vira uma placa em uma peça só, pronta para imprimir em branco.</div>}
          {photo && view === 'lit' && <canvas ref={cvL} className="block" />}
          {photo && view === 'photo' && <img src={photo.url} alt="" className="h-full w-full object-contain" />}
          {photo && view === '3d' && (
            <canvas ref={cv3} className="block cursor-grab" style={{ touchAction: 'none' }}
              onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, yaw: cam.current.yaw, pitch: cam.current.pitch }; }}
              onPointerMove={(e) => { const d = drag.current; if (!d) return; cam.current = { ...cam.current, yaw: d.yaw - (e.clientX - d.x) * 0.008, pitch: Math.max(-1.4, Math.min(1.4, d.pitch + (e.clientY - d.y) * 0.008)) }; draw3(); }}
              onPointerUp={() => { drag.current = null; }}
              onWheel={(e) => { cam.current = { ...cam.current, dist: Math.max(50, cam.current.dist * Math.pow(1.0015, e.deltaY)) }; draw3(); }} />
          )}
          {photo && view === '3d' && <div className="absolute left-3 top-3 rounded bg-zinc-800/90 px-2 py-1 text-[11px] text-zinc-300">Prévia simplificada · arraste para girar · o 3MF sai em {o.res} mm</div>}
        </div>
        {msg && <div className={`rounded-lg px-3 py-2 text-xs ${msg.err ? 'bg-red-950/70 text-red-300' : 'bg-emerald-950/60 text-emerald-300'}`}>{msg.t}</div>}
        {fitWarn.map((w, i) => <div key={i} className="rounded-lg bg-amber-950/50 px-3 py-2 text-xs text-amber-300">{w}</div>)}
      </div>

      {/* direita */}
      <div className="space-y-3">
        <Section title="4. Suporte e luz">
          <div className="grid grid-cols-3 gap-1">
            <Btn active={mount === 'lightbox'} onClick={() => setMount('lightbox')} title="Caixa atrás da placa, no mesmo formato, com o LED dentro">Light box</Btn>
            <Btn active={mount === 'base'} onClick={() => setMount('base')} title="Base embaixo com rasgo de encaixe">Base</Btn>
            <Btn active={mount === 'none'} onClick={() => setMount('none')}>Só placa</Btn>
          </div>
          {mount === 'lightbox' && (
            <>
              <LightboxDiagram />
              <Num label="Profundidade (LED até a foto)" value={bx.depth} step={1} min={10} onChange={(v) => setBox({ depth: v })} />
              <Num label="Parede" value={bx.wall} step={0.2} min={1.2} onChange={(v) => setBox({ wall: v })} />
              <Num label="Borda da frente" value={bx.lip} step={0.2} min={0.8} onChange={(v) => setBox({ lip: v })} />
              <Num label="Folga da placa" value={bx.clearance} step={0.05} min={0.1} onChange={(v) => setBox({ clearance: v })} />
              <Num label="Tampa traseira" value={bx.back} step={0.2} min={1.2} onChange={(v) => setBox({ back: v })} />
              <Num label="Furo do cabo Ø" value={bx.cableD} step={0.5} min={3} onChange={(v) => setBox({ cableD: v })} />
              <label className="flex items-center gap-2 text-xs text-zinc-300"><input type="checkbox" checked={bx.foot} onChange={(e) => setBox({ foot: e.target.checked })} /> Pé de apoio (para ficar em pé na mesa)</label>
              {bx.foot && <Num label="Altura do pé" value={bx.footH} step={1} min={4} onChange={(v) => setBox({ footH: v })} />}
              <label className="flex items-center gap-2 text-xs text-zinc-300"><input type="checkbox" checked={bx.hang} onChange={(e) => setBox({ hang: e.target.checked })} /> Furos para pendurar na parede</label>
              <p className="text-[11px] leading-snug text-zinc-500">Montagem: encaixe a placa por trás, contra a borda da frente, e empurre a trava. Cole a fita de LED por dentro da tampa traseira, passe o cabo pelo furo e encaixe a tampa. A caixa segue o formato e a curvatura da placa.</p>
            </>
          )}
          {mount === 'base' && (
            <>
              <Num label="Altura da base" value={b.height} step={1} min={8} onChange={(v) => setBase({ height: v })} />
              <Num label="Sobra em volta" value={b.margin} step={1} min={3} onChange={(v) => setBase({ margin: v })} />
              <Num label="Parede" value={b.wall} step={0.2} min={1.2} onChange={(v) => setBase({ wall: v })} />
              <Num label="Folga do encaixe" value={b.clearance} step={0.05} min={0.1} onChange={(v) => setBase({ clearance: v })} />
              <Num label="Janela de luz (atrás da placa)" value={b.window} step={1} min={4} onChange={(v) => setBase({ window: v })} />
              <Num label="Furo do cabo Ø" value={b.cableD} step={0.5} min={3} onChange={(v) => setBase({ cableD: v })} />
              <p className="text-[11px] leading-snug text-zinc-500">A placa entra no rasgo da tampa e apoia no fundo. A fita de LED fica no fundo, embaixo da janela de luz, e o cabo sai pelo furo de trás.</p>
            </>
          )}
        </Section>

        <Section title="5. Exportar 3MF">
          <input value={fileName} onChange={(e) => setFileName(e.target.value)} className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs" />
          <label className="block text-xs text-zinc-400">Impressora
            <select value={printer} onChange={(e) => setPrinter(+e.target.value)} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100">
              {PRINTERS.map((p, i) => <option key={p.name} value={i}>{p.name} ({p.w}×{p.d}×{p.h})</option>)}
            </select>
          </label>
          <div className="text-[11px] text-zinc-400">Placa: {W.toFixed(0)} × {H.toFixed(0)} mm · {o.minT}–{o.maxT} mm · moldura {o.frameT} mm · {o.curve ? `curva ${o.curve}°` : 'plana'}</div>
          <Btn primary className="w-full py-2 text-sm" disabled={!photo || busy} onClick={() => exportNow('all')}>{busy ? 'Gerando…' : mount === 'lightbox' ? 'Baixar 3MF (placa + light box)' : mount === 'base' ? 'Baixar 3MF (placa + base)' : 'Baixar 3MF da placa'}</Btn>
          <div className="flex gap-1">
            <Btn className="flex-1" disabled={!photo || busy} onClick={() => exportNow('plate')}>Só a placa</Btn>
            <Btn className="flex-1" disabled={mount === 'none' || busy} onClick={() => exportNow('base')}>{mount === 'lightbox' ? 'Só a light box' : 'Só a base'}</Btn>
          </div>
        </Section>

        <Section title="Como imprimir (P1S)">
          <ul className="list-disc space-y-1 pl-4 text-[11px] leading-snug text-zinc-400">
            <li>Placa em <b className="text-zinc-200">PLA branco</b>, em pé como vem no arquivo, <b className="text-zinc-200">100% de preenchimento</b>.</li>
            <li>Camada 0,12 mm; com 100% de preenchimento a placa sai toda maciça. Velocidade baixa nas paredes externas.</li>
            <li>Use aba (brim) de 5 mm na placa em pé para não descolar.</li>
            <li>Light box e base em PLA escuro e opaco (preto ou cinza), para a luz sair só pela foto.</li>
            <li>LED: fita branca quente USB 5 V (2700–3000 K) colada na tampa traseira, em zigue-zague para iluminar por igual.</li>
            <li>Teste com uma placa pequena (60 mm) para calibrar o contraste.</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
