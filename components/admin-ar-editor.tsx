'use client';

// Produtos → "Realidade aumentada (ver no espaço)". Liga o recurso, tira o fundo
// da foto (aqui mesmo, sem serviço pago), define o tamanho real e onde o
// produto fica (mesa/chão ou parede). O resultado é salvo em products.ar.
// Remoção de fundo: funciona bem com foto em fundo liso. PNG já transparente é usado como está.

import { useCallback, useRef, useState } from 'react';
import { parseAr, type ArConfig } from '@/lib/ar';

const CARD = 'rounded-2xl border border-white/10 bg-[#0f1117] p-5';
const inputCls = 'w-full rounded-xl border border-white/10 bg-[#1c2236] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40';

async function loadCanvas(src: string, max = 1200): Promise<HTMLCanvasElement> {
  const url = /^https?:\/\//i.test(src) ? `/_next/image?url=${encodeURIComponent(src)}&w=1200&q=95` : src;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Não foi possível ler a foto.'));
    i.src = url;
  });
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const cv = document.createElement('canvas');
  cv.width = Math.round(img.naturalWidth * scale);
  cv.height = Math.round(img.naturalHeight * scale);
  cv.getContext('2d', { willReadFrequently: true })!.drawImage(img, 0, 0, cv.width, cv.height);
  return cv;
}

// Fundo liso: parte das bordas e apaga o que tem a cor do fundo e encosta na
// borda (flood fill), com borda suave no recorte; depois corta as sobras.
async function removeBackground(src: string, tolerance: number): Promise<{ png: string; hadAlpha: boolean }> {
  const cv = await loadCanvas(src);
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  const { width: w, height: h } = cv;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  let transparent = 0;
  for (let i = 3; i < d.length; i += 4 * 7) if (d[i] < 20) transparent++;
  const hadAlpha = transparent > (w * h) / 7 / 50;

  if (!hadAlpha) {
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
  return { png: out.toDataURL('image/png'), hadAlpha };
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
      const { png, hadAlpha } = await removeBackground(src, tolerance);
      onChange(JSON.stringify({ ...parseAr(value), enabled: true, image: png }));
      setMsg({ ok: true, text: hadAlpha ? 'A foto já tinha fundo transparente: usada como está.' : 'Fundo removido. Se sobrou fundo, aumente a tolerância; se comeu o produto, diminua.' });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || 'Não foi possível remover o fundo desta foto.' });
    } finally { setBusy(false); }
  }, [onChange, tolerance, value]);

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
        <input type="checkbox" checked={cfg.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="h-4 w-4 accent-green-500" />
        Mostrar “Ver en tu espacio” neste produto
      </label>

      {cfg.enabled && (
        <div className="mt-4 grid gap-4 md:grid-cols-[200px_1fr]">
          <div className="relative mx-auto flex aspect-square w-full max-w-[200px] items-center justify-center overflow-hidden rounded-xl border border-white/10"
            style={{ backgroundImage: 'conic-gradient(#2a2f3d 25%, #1c2236 0 50%, #2a2f3d 0 75%, #1c2236 0)', backgroundSize: '18px 18px' }}>
            {cfg.image
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={cfg.image} alt="" className="max-h-full max-w-full object-contain" />
              : <span className="px-4 text-center text-xs text-white/45">Sem foto recortada ainda</span>}
            {busy && <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs text-white">Removendo fundo…</span>}
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

            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1 block text-xs text-white/55">Largura real (cm)</span>
                <input type="number" min={1} max={500} step={0.5} value={cfg.widthCm} onChange={(e) => set({ widthCm: Number(e.target.value) })} className={inputCls} /></label>
              <label className="block"><span className="mb-1 block text-xs text-white/55">Altura real (cm)</span>
                <input type="number" min={1} max={500} step={0.5} value={cfg.heightCm} onChange={(e) => set({ heightCm: Number(e.target.value) })} className={inputCls} /></label>
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
