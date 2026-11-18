'use client';

// Botão "Ver en tu espacio" + janela de realidade aumentada (lib/ar.ts).
// Monta o modelo 3D na hora a partir da foto recortada e abre no <model-viewer>:
// no celular, a câmera abre e o cliente toca na mesa/parede para colocar o
// produto em tamanho real. No computador mostra o modelo e pede para abrir no celular.

import { createElement, useEffect, useState } from 'react';
import { buildArGlb, type ArConfig } from '@/lib/ar';

const MODEL_VIEWER_SRC = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';

function loadModelViewer(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (customElements.get('model-viewer')) return Promise.resolve();
  if (!document.querySelector(`script[src="${MODEL_VIEWER_SRC}"]`)) {
    const s = document.createElement('script');
    s.type = 'module';
    s.src = MODEL_VIEWER_SRC;
    document.head.appendChild(s);
  }
  return customElements.whenDefined('model-viewer').then(() => undefined);
}

// Foto → PNG (até 1024px). Imagens de outro domínio passam pelo /_next/image
// (mesmo domínio), então o navegador deixa ler os pixels.
async function toPngBytes(src: string): Promise<ArrayBuffer> {
  const url = /^https?:\/\//i.test(src) ? `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=90` : src;
  const res = await fetch(url, { headers: { Accept: 'image/png' } });
  if (!res.ok) throw new Error('img');
  const bmp = await createImageBitmap(await res.blob());
  const scale = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * scale);
  cv.height = Math.round(bmp.height * scale);
  cv.getContext('2d')!.drawImage(bmp, 0, 0, cv.width, cv.height);
  const blob = await new Promise<Blob | null>((r) => cv.toBlob(r, 'image/png'));
  if (!blob) throw new Error('png');
  return blob.arrayBuffer();
}

export function ArViewer({ name, ar, theme = 'dark' }: { name: string; ar: ArConfig; theme?: 'dark' | 'light' }) {
  const [open, setOpen] = useState(false);
  const [glbUrl, setGlbUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let alive = true;
    let made = '';
    setError('');
    Promise.all([loadModelViewer(), toPngBytes(ar.image)])
      .then(([, png]) => {
        if (!alive) return;
        const glb = buildArGlb(png, ar.widthCm / 100, ar.heightCm / 100);
        made = URL.createObjectURL(new Blob([glb], { type: 'model/gltf-binary' }));
        setGlbUrl(made);
      })
      .catch(() => alive && setError('No se pudo abrir la vista en tu espacio. Inténtalo de nuevo.'));
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => { alive = false; document.removeEventListener('keydown', onKey); if (made) URL.revokeObjectURL(made); setGlbUrl(''); };
  }, [open, ar.image, ar.widthCm, ar.heightCm]);

  const trigger = theme === 'dark'
    ? 'border border-white/70 text-white hover:bg-white hover:text-[#0b0614]'
    : 'bg-slate-900 text-white hover:bg-slate-700';
  const where = ar.placement === 'wall' ? 'la pared' : 'una mesa o el suelo';

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className={`mt-3 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-bold uppercase tracking-[0.12em] transition-colors ${trigger}`}>
        <span aria-hidden className="rounded border border-current px-1.5 py-0.5 text-[10px] leading-none">AR</span>
        Ver en tu espacio
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-label={`Ver ${name} en tu espacio`} className="w-full max-w-xl overflow-hidden rounded-t-2xl bg-[#0b0614] text-white sm:rounded-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <p className="text-sm font-bold uppercase tracking-[0.14em]">Ver en tu espacio</p>
              <button type="button" onClick={() => setOpen(false)} className="h-10 cursor-pointer px-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/60 hover:text-white">Cerrar</button>
            </div>
            <div className="relative h-[60vh] max-h-[520px] bg-[radial-gradient(circle_at_50%_40%,#2a1640,#0b0614)]">
              {error ? (
                <p className="flex h-full items-center justify-center px-8 text-center text-sm text-white/70">{error}</p>
              ) : !glbUrl ? (
                <p className="flex h-full items-center justify-center text-sm text-white/60">Preparando…</p>
              ) : (
                createElement('model-viewer', {
                  src: glbUrl,
                  alt: name,
                  ar: '',
                  'ar-modes': 'webxr scene-viewer quick-look',
                  'ar-placement': ar.placement,
                  'ar-scale': 'fixed',
                  'camera-controls': '',
                  'touch-action': 'pan-y',
                  'shadow-intensity': '0.8',
                  'environment-image': 'neutral',
                  style: { width: '100%', height: '100%', background: 'transparent' },
                }, createElement('button', {
                  slot: 'ar-button',
                  className: 'absolute inset-x-4 bottom-4 h-14 cursor-pointer rounded-md bg-white text-sm font-bold uppercase tracking-[0.12em] text-[#0b0614]',
                }, 'Abrir cámara y colocar'))
              )}
            </div>
            <div className="space-y-1.5 px-5 py-4 text-sm text-white/70">
              <p>Toca <strong className="text-white">“Abrir cámara y colocar”</strong>, permite la cámara y apunta a {where}. Toca la superficie para colocar <strong className="text-white">{name}</strong> en tamaño real ({ar.widthCm} × {ar.heightCm} cm).</p>
              <p className="text-xs text-white/45">En el ordenador puedes girarlo con el ratón; para verlo en tu casa abre esta página en el móvil (Android con Chrome o iPhone con Safari).</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
