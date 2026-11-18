'use client';

// Produtos → "Realidade aumentada (ver no espaço)". Liga o recurso, tira o fundo
// da foto (aqui mesmo, sem serviço pago), define o tamanho real e onde o
// produto fica (mesa/chão ou parede). O resultado é salvo em products.ar.
// Remoção de fundo: funciona bem com foto em fundo liso. PNG já transparente é usado como está.

import { useCallback, useEffect, useRef, useState } from 'react';
import { arDepthCm, loadArBitmap, parseAr, type ArConfig } from '@/lib/ar';
import { ArModel3D } from '@/components/ar/ar-viewer';

const CARD = 'rounded-2xl border border-white/10 bg-[#0f1117] p-5';
const inputCls = 'w-full rounded-xl border border-white/10 bg-[#1c2236] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40';

async function loadCanvas(src: string, max = 1200): Promise<HTMLCanvasElement> {
  const img = await loadArBitmap(src).catch(() => { throw new Error('Não foi possível ler a foto.'); });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(img.width * scale));
  cv.height = Math.max(1, Math.round(img.height * scale));
  cv.getContext('2d', { willReadFrequently: true })!.drawImage(img, 0, 0, cv.width, cv.height);
  return cv;
}

// Fundo liso: parte das bordas e apaga o que tem a cor do fundo e encosta na
// borda (flood fill), com borda suave no recorte; depois corta as sobras.
async function removeBackground(src: string, tolerance: number): Promise<{ png: string; hadAlpha: boolean; chroma: boolean }> {
  const cv = await loadCanvas(src);
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  const { width: w, height: h } = cv;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  let transparent = 0;
  for (let i = 3; i < d.length; i += 4 * 7) if (d[i] < 20) transparent++;
  const hadAlpha = transparent > (w * h) / 7 / 50;

  let chroma = false;
  if (!hadAlpha) {
    let r = 0, g = 0, b = 0, n = 0;
    const sample = (x: number, y: number) => { const k = (y * w + x) * 4; r += d[k]; g += d[k + 1]; b += d[k + 2]; n++; };
    for (let x = 0; x < w; x += 2) { sample(x, 0); sample(x, h - 1); }
    for (let y = 0; y < h; y += 2) { sample(0, y); sample(w - 1, y); }
    r /= n; g /= n; b /= n;
    // Fundo colorido forte (chroma verde/azul): recorte por cor em toda a foto.
    chroma = Math.max(r, g, b) - Math.min(r, g, b) > 50 && (g > r + 25 && g > b + 15 || b > r + 25 && b > g + 15);
  }
  if (chroma) {
    let r = 0, g = 0, b = 0, n = 0;
    const sample = (x: number, y: number) => { const k = (y * w + x) * 4; r += d[k]; g += d[k + 1]; b += d[k + 2]; n++; };
    for (let x = 0; x < w; x += 2) { sample(x, 0); sample(x, h - 1); }
    for (let y = 0; y < h; y += 2) { sample(0, y); sample(w - 1, y); }
    r /= n; g /= n; b /= n;
    const cb = (R: number, G: number, B: number) => -0.168736 * R - 0.331264 * G + 0.5 * B;
    const cr = (R: number, G: number, B: number) => 0.5 * R - 0.418688 * G - 0.081312 * B;
    const kcb = cb(r, g, b), kcr = cr(r, g, b);
    const greenKey = g >= b; // canal dominante do chroma (verde ou azul)
    const inner = tolerance * 0.7, outer = tolerance * 1.2;
    for (let k = 0; k < d.length; k += 4) {
      const R = d[k], G = d[k + 1], B = d[k + 2];
      const dist = Math.hypot(cb(R, G, B) - kcb, cr(R, G, B) - kcr);
      const a = dist <= inner ? 0 : dist >= outer ? 1 : (dist - inner) / (outer - inner);
      d[k + 3] = Math.round(d[k + 3] * a);
      // tira o reflexo do chroma nas bordas e nas partes tingidas
      if (a > 0 && dist < outer * 1.6) {
        if (greenKey) { const lim = Math.max(R, B); if (G > lim) d[k + 1] = lim; }
        else { const lim = Math.max(R, G); if (B > lim) d[k + 2] = lim; }
      }
    }
    // some com pontinhos soltos (ruído do chroma)
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const p = (y * w + x) * 4 + 3;
      if (d[p] && !d[p - 4] && !d[p + 4] && !d[p - w * 4] && !d[p + w * 4]) d[p] = 0;
    }
    ctx.putImageData(img, 0, 0);
  } else if (!hadAlpha) {
    let r = 0, g = 0, b = 0, n = 0;
    const sample = (x: number, y: number) => { const k = (y * w + x) * 4; r += d[k]; g += d[k + 1]; b += d[k + 2]; n++; };
    for (let x = 0; x < w; x += 2) { sample(x, 0); sample(x, h - 1); }
    for (let y = 0; y < h; y += 2) { sample(0, y); sample(w - 1, y); }
    r /= n; g /= n; b /= n;
    const dist = (k: number) => Math.abs(d[k] - r) + Math.abs(d[k + 1] - g) + Math.abs(d[k + 2] - b);
    const seen = new Uint8Array(w * h);
    const stack: number[] = [];
    const push = (x: number, y: number) => { const p = y * w + x; if (!seen[p] && dist(p * 4) <= tolerance) { seen[p] = 1; stack.push(p); } };
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % w, y = (p / w) | 0;
      if (x > 0) push(x - 1, y);
      if (x < w - 1) push(x + 1, y);
      if (y > 0) push(x, y - 1);
      if (y < h - 1) push(x, y + 1);
    }
    for (let p = 0; p < w * h; p++) if (seen[p]) d[p * 4 + 3] = 0;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (seen[p]) continue;
      if (seen[p - 1] || seen[p + 1] || seen[p - w] || seen[p + w]) d[p * 4 + 3] = dist(p * 4) < tolerance * 1.8 ? 110 : 220;
    }
    ctx.putImageData(img, 0, 0);
  }

  const data = ctx.getImageData(0, 0, w, h).data;
  let top = h, left = w, right = -1, bottom = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (data[(y * w + x) * 4 + 3] > 16) { if (x < left) left = x; if (x > right) right = x; if (y < top) top = y; if (y > bottom) bottom = y; }
  }
  if (right < 0) throw new Error('A foto ficou vazia. Diminua a tolerância.');
  const out = document.createElement('canvas');
  out.width = right - left + 1;
  out.height = bottom - top + 1;
  out.getContext('2d')!.drawImage(cv, left, top, out.width, out.height, 0, 0, out.width, out.height);
  return { png: out.toDataURL('image/png'), hadAlpha, chroma };
}

const readFile = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); });

export function ArEditor({ value, onChange, productImage }: { value: string; onChange: (json: string) => void; productImage: string | null }) {
  const cfg = parseAr(value);
  const set = (patch: Partial<ArConfig>) => onChange(JSON.stringify({ ...cfg, ...patch }));
  const source = useRef<string>('');
  const [tolerance, setTolerance] = useState(60);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const cut = useCallback(async (src: string) => {
    if (!src) return;
    source.current = src;
    setBusy(true); setMsg(null);
    try {
      const { png, hadAlpha, chroma } = await removeBackground(src, tolerance);
      onChange(JSON.stringify({ ...parseAr(value), enabled: true, image: png }));
      setMsg({ ok: true, text: hadAlpha ? 'A foto já tinha fundo transparente: usada como está.' : chroma ? 'Chroma removido. Se sobrou verde, aumente a tolerância; se comeu o produto, diminua.' : 'Fundo removido. Se sobrou fundo, aumente a tolerância; se comeu o produto, diminua.' });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || 'Não foi possível remover o fundo desta foto.' });
    } finally { setBusy(false); }
  }, [onChange, tolerance, value]);

  // Colar (Ctrl+V) uma imagem em qualquer lugar do painel com a AR ligada, ou arrastar sobre o quadro.
  const [dragging, setDragging] = useState(false);
  const cutRef = useRef(cut);
  cutRef.current = cut;
  const imageFrom = (files: FileList | DataTransferItemList | null | undefined): File | null => {
    if (!files) return null;
    for (const it of Array.from(files as ArrayLike<File | DataTransferItem>)) {
      const f = it instanceof File ? it : it.kind === 'file' ? it.getAsFile() : null;
      if (f && f.type.startsWith('image/')) return f;
    }
    return null;
  };
  useEffect(() => {
    if (!cfg.enabled) return;
    const onPaste = async (e: ClipboardEvent) => {
      const f = imageFrom(e.clipboardData?.items);
      if (!f) return; // texto colado em outro campo segue normal
      e.preventDefault();
      cutRef.current(await readFile(f));
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [cfg.enabled]);

  return (
    <section className={CARD}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-[10px] font-black text-green-400">AR</span>
        <div>
          <p className="text-sm font-semibold text-white">Realidade aumentada (ver no espaço)</p>
          <p className="text-xs text-white/45">O cliente toca em “Ver en tu espacio”, permite a câmera e vê o produto em tamanho real na mesa ou na parede. Ideal para quadros, luminárias e figuras.</p>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm text-white">
        <input type="checkbox" checked={cfg.enabled} onChange={(e) => { set({ enabled: e.target.checked }); if (e.target.checked && !cfg.image && productImage) void cut(productImage); }} className="h-4 w-4 accent-green-500" />
        Mostrar “Ver en tu espacio” neste produto
      </label>

      {cfg.enabled && (
        <div className="mt-4 grid gap-4 md:grid-cols-[200px_1fr]">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={async (e) => { e.preventDefault(); setDragging(false); const f = imageFrom(e.dataTransfer.files); if (f) cut(await readFile(f)); }}
            className={`relative mx-auto flex aspect-square w-full max-w-[200px] items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${dragging ? 'border-green-400 bg-green-500/10' : 'border-white/15'}`}
            style={dragging ? undefined : { background: 'radial-gradient(circle at 50% 40%, #2a1640, #0b0614)' }}>
            {cfg.image && !busy
              ? <ArModel3D ar={{ ...cfg }} name="Prévia 3D" className="h-full w-full" />
              : !busy && <span className="px-4 text-center text-xs leading-relaxed text-white/55"><strong className="text-white/80">Cole (Ctrl+V)</strong> ou <strong className="text-white/80">arraste</strong> a foto aqui<br />e ela vira 3D</span>}
            {busy && <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs text-white">Removendo fundo…</span>}
            {dragging && <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold text-green-200">Solte a foto</span>}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {productImage && (
                <button type="button" disabled={busy} onClick={() => cut(productImage)}
                  className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                  Usar a foto principal (remove o fundo)
                </button>
              )}
              <label className="cursor-pointer rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/5">
                Enviar outra foto
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) cut(await readFile(f)); }} />
              </label>
              {cfg.image && <button type="button" onClick={() => set({ image: '' })} className="rounded-lg px-3 py-2 text-xs text-white/50 hover:text-red-300">Remover</button>}
            </div>

            <label className="block">
              <span className="mb-1 flex justify-between text-xs text-white/55"><span>Tolerância do fundo (solte para refazer)</span><span className="tabular-nums text-white">{tolerance}</span></span>
              <input type="range" min={10} max={160} step={5} value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))}
                onMouseUp={() => source.current && cut(source.current)} onTouchEnd={() => source.current && cut(source.current)}
                className="w-full cursor-pointer accent-green-500" />
            </label>

            <div className="grid grid-cols-3 gap-3">
              <label className="block"><span className="mb-1 block text-xs text-white/55">Largura real (cm)</span>
                <input type="number" min={1} max={500} step={0.5} value={cfg.widthCm} onChange={(e) => set({ widthCm: Number(e.target.value) })} className={inputCls} /></label>
              <label className="block"><span className="mb-1 block text-xs text-white/55">Altura real (cm)</span>
                <input type="number" min={1} max={500} step={0.5} value={cfg.heightCm} onChange={(e) => set({ heightCm: Number(e.target.value) })} className={inputCls} /></label>
              <label className="block"><span className="mb-1 block text-xs text-white/55">Espessura 3D (cm)</span>
                <input type="number" min={0} max={50} step={0.5} value={cfg.depthCm || ''} placeholder={`auto ${arDepthCm(cfg)}`} onChange={(e) => set({ depthCm: Number(e.target.value) || 0 })} className={inputCls} /></label>
            </div>

            <div className="flex flex-wrap gap-2">
              {([['floor', 'Mesa / chão (luminária, figura)'], ['wall', 'Parede (quadro)']] as const).map(([v, label]) => (
                <button key={v} type="button" onClick={() => set({ placement: v })}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${cfg.placement === v ? 'border-green-500 bg-green-500/15 text-green-300' : 'border-white/15 text-white/70 hover:bg-white/5'}`}>
                  {label}
                </button>
              ))}
            </div>

            {msg && <p className={`text-xs ${msg.ok ? 'text-green-300' : 'text-red-300'}`}>{msg.text}</p>}
            <p className="text-[11px] leading-snug text-white/40">Funciona melhor com foto em fundo liso (branco ou uma cor só). Com fundo bagunçado, envie um PNG já sem fundo (ex.: remove.bg). Use as medidas reais: é o tamanho que o cliente vai ver.</p>
          </div>
        </div>
      )}
    </section>
  );
}
