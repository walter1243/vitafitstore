'use client';

// Botão "Ver en tu espacio" + janela de realidade aumentada (lib/ar.ts).
// Monta o modelo 3D (com volume) na hora a partir da foto recortada e abre no
// <model-viewer>: no celular, "Abrir cámara y colocar" pede a câmera e o cliente
// toca na mesa/parede para colocar o produto em tamanho real. No computador o
// modelo gira com o mouse. ArModel3D também é usado na prévia do painel.

import { createElement, useEffect, useState } from 'react';
import { arDepthCm, buildArGlb, loadArBitmap, type ArConfig } from '@/lib/ar';

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
  return Promise.race([
    customElements.whenDefined('model-viewer').then(() => undefined),
    new Promise<void>((_, rej) => setTimeout(() => rej(new Error('model-viewer não carregou')), 20000)),
  ]);
}

// Foto → PNG (até 1024px), pronta para virar textura do modelo.
async function toPngBytes(src: string): Promise<ArrayBuffer> {
  const bmp = await loadArBitmap(src);
  const scale = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(bmp.width * scale));
  cv.height = Math.max(1, Math.round(bmp.height * scale));
  cv.getContext('2d')!.drawImage(bmp, 0, 0, cv.width, cv.height);
  const blob = await new Promise<Blob | null>((r) => cv.toBlob(r, 'image/png'));
  if (!blob) throw new Error('png');
  return blob.arrayBuffer();
}

// Monta o .glb do produto e devolve um blob: URL (some quando desmonta).
function useArGlb(ar: Pick<ArConfig, 'image' | 'widthCm' | 'heightCm' | 'depthCm' | 'placement'>, active: boolean) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const depth = arDepthCm(ar);
  useEffect(() => {
    if (!active || !ar.image) return;
    let alive = true;
    let made = '';
    setError(''); setUrl('');
    Promise.all([loadModelViewer(), toPngBytes(ar.image)])
      .then(([, png]) => {
        if (!alive) return;
        const glb = buildArGlb(png, ar.widthCm / 100, ar.heightCm / 100, depth / 100, ar.placement);
        made = URL.createObjectURL(new Blob([glb], { type: 'model/gltf-binary' }));
        setUrl(made);
      })
      .catch((e) => { console.error('[ar]', e); if (alive) setError('No se pudo preparar el modelo 3D. Inténtalo de nuevo.'); });
    return () => { alive = false; if (made) URL.revokeObjectURL(made); };
  }, [active, ar.image, ar.widthCm, ar.heightCm, depth, ar.placement]);
  return { url, error };
}

// O modelo 3D girando (sem botão de câmera) — prévia do painel e base da janela AR.
export function ArModel3D({ ar, name, withAr = false, autoRotate = true, className = '' }: {
  ar: Pick<ArConfig, 'image' | 'widthCm' | 'heightCm' | 'depthCm' | 'placement'>; name: string; withAr?: boolean; autoRotate?: boolean; className?: string;
}) {
  const { url, error } = useArGlb(ar, true);
  if (error) return <p className={`flex items-center justify-center px-6 text-center text-sm text-white/70 ${className}`}>{error}</p>;
  if (!url) return <p className={`flex items-center justify-center text-sm text-white/60 ${className}`}>Preparando 3D…</p>;
  const props: Record<string, unknown> = {
    src: url,
    alt: name,
    'camera-controls': '',
    'touch-action': 'pan-y',
    'shadow-intensity': '1',
    'shadow-softness': '0.8',
    'camera-orbit': '25deg 75deg auto',
    'interaction-prompt': 'none',
    class: className,
    style: { width: '100%', height: '100%', background: 'transparent' },
  };
  if (autoRotate) { props['auto-rotate'] = ''; props['rotation-per-second'] = '24deg'; }
  if (withAr) {
    props.ar = '';
    props['ar-modes'] = 'webxr scene-viewer quick-look';
    props['ar-placement'] = ar.placement;
    props['ar-scale'] = 'fixed';
  }
  return createElement('model-viewer', props, withAr ? createElement('button', {
    slot: 'ar-button',
    className: 'absolute inset-x-4 bottom-4 h-14 cursor-pointer rounded-md bg-white text-sm font-bold uppercase tracking-[0.12em] text-[#0b0614]',
  }, 'Abrir cámara y colocar') : null);
}

// Câmera com a bolinha piscando (indica "ao vivo"): botão redondo sobre a foto do produto.
function CameraDot() {
  return (
    <span aria-hidden className="relative block h-6 w-6">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M4 8h3l1.6-2.2A1.5 1.5 0 0 1 9.8 5h4.4a1.5 1.5 0 0 1 1.2.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
        <circle cx="12" cy="13.2" r="3.4" />
      </svg>
      <span className="absolute -right-1 -top-1 flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff2d9b] opacity-75 motion-reduce:hidden" />
        <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-[#0b0614] bg-[#ff2d9b]" />
      </span>
    </span>
  );
}

export function ArViewer({ name, ar, theme = 'dark', variant = 'button', className = '' }: { name: string; ar: ArConfig; theme?: 'dark' | 'light'; variant?: 'button' | 'icon'; className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const trigger = theme === 'dark'
    ? 'border border-white/70 text-white hover:bg-white hover:text-[#0b0614]'
    : 'bg-slate-900 text-white hover:bg-slate-700';
  const where = ar.placement === 'wall' ? 'la pared' : 'una mesa o el suelo';

  return (
    <>
      {variant === 'icon' ? (
        <button type="button" onClick={() => setOpen(true)} aria-label="Ver en tu espacio con la cámara" title="Ver en tu espacio"
          className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-[0_6px_24px_rgba(0,0,0,0.45)] backdrop-blur transition-transform hover:scale-105 active:scale-95 ${className}`}>
          <CameraDot />
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)}
          className={`mt-3 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-bold uppercase tracking-[0.12em] transition-colors ${trigger} ${className}`}>
          <span aria-hidden className="rounded border border-current px-1.5 py-0.5 text-[10px] leading-none">AR</span>
          Ver en tu espacio
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-label={`Ver ${name} en tu espacio`} className="w-full max-w-xl overflow-hidden rounded-t-2xl bg-[#0b0614] text-white sm:rounded-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <p className="text-sm font-bold uppercase tracking-[0.14em]">Ver en tu espacio</p>
              <button type="button" onClick={() => setOpen(false)} className="h-10 cursor-pointer px-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/60 hover:text-white">Cerrar</button>
            </div>
            <div className="relative h-[60vh] max-h-[520px] bg-[radial-gradient(circle_at_50%_40%,#2a1640,#0b0614)]">
              <ArModel3D ar={ar} name={name} withAr className="h-full w-full" />
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
