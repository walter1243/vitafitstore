'use client';

// Modelo 3D real do produto (arquivo 3MF/STL convertido no painel), aberto pelo
// mesmo ícone da câmera que fica na foto do produto.
// • Aparelho com AR (Android Chrome com ARCore / iPhone Safari): abre a câmera em
//   AR nativa com ar-scale="fixed" → produto em tamanho real 1:1, sem aumentar/diminuir.
// • Sem AR (computador, navegador do Instagram, aparelho sem ARCore): abre a câmera
//   do navegador com o modelo 3D por cima (gira com o dedo, sem zoom).
// Só aparece em produto com modelo publicado e validado (lib/product-models.ts).

import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CameraDot, loadModelViewer } from '@/components/ar/ar-viewer';
import { fmtCm, type Dims, type Placement } from '@/lib/product-models-shared';

export type PublicModel = { glbUrl: string; usdzUrl: string; measured: Dims; placement: Placement };

type MV = HTMLElement & { canActivateAR?: boolean; activateAR?: () => Promise<void> };

const inApp = () => typeof navigator !== 'undefined' && /Instagram|FBAN|FBAV|TikTok|Line\//i.test(navigator.userAgent);

// Caixa 3D (câmera sem AR e prévia do painel). Quem chama define a posição/tamanho
// em className (ex.: "relative aspect-square" ou "absolute inset-0").
export function ModelBox({ src, iosSrc, name, placement = 'floor', ar = false, arModes = 'webxr scene-viewer quick-look', zoom = true, autoRotate = true, transparent = false, mvRef, className = 'relative' }: {
  src: string; iosSrc?: string; name: string; placement?: Placement; ar?: boolean; arModes?: string; zoom?: boolean; autoRotate?: boolean; transparent?: boolean;
  mvRef?: React.MutableRefObject<MV | null>; className?: string;
}) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [defined, setDefined] = useState(false);

  useEffect(() => { let on = true; loadModelViewer().then(() => on && setDefined(true)).catch(() => on && setError('No se pudo cargar el visor 3D.')); return () => { on = false; }; }, []);
  useEffect(() => { setReady(false); setProgress(0); setError(''); }, [src]);

  const attach = useCallback((el: MV | null) => {
    if (mvRef) mvRef.current = el;
    if (!el) return;
    el.addEventListener('progress', (e: Event) => setProgress(Math.round(((e as CustomEvent).detail?.totalProgress ?? 0) * 100)));
    el.addEventListener('load', () => setReady(true));
    el.addEventListener('error', () => setError('No se pudo cargar el modelo 3D. Revisa tu conexión e inténtalo de nuevo.'));
  }, [mvRef]);

  const props: Record<string, unknown> = {
    ref: attach,
    src,
    alt: `Modelo 3D de ${name}`,
    'camera-controls': '',
    'touch-action': 'pan-y',
    'shadow-intensity': '1',
    'shadow-softness': '0.9',
    exposure: '1',
    'environment-image': 'neutral',
    'interaction-prompt': 'none',
    loading: 'eager',
    style: { position: 'absolute', inset: 0, width: '100%', height: '100%', background: transparent ? 'transparent' : 'radial-gradient(circle at 50% 35%, #2a1640, #0b0614)', ['--poster-color' as string]: 'transparent' },
  };
  if (!zoom) props['disable-zoom'] = '';
  if (autoRotate) { props['auto-rotate'] = ''; props['auto-rotate-delay'] = '1500'; props['rotation-per-second'] = '20deg'; }
  if (ar) {
    props.ar = '';
    props['ar-modes'] = arModes;
    props['ar-scale'] = 'fixed'; // tamanho real 1:1 travado (sem pinça para aumentar/diminuir)
    props['ar-placement'] = placement;
    if (iosSrc) props['ios-src'] = iosSrc;
  }

  return (
    <div translate="no" className={`notranslate overflow-hidden ${className}`}>
      {defined && !error && createElement('model-viewer', props, createElement('span', { slot: 'ar-button', style: { display: 'none' } }))}
      {!ready && !error && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-white transition-[width] duration-200" style={{ width: `${Math.max(6, progress)}%` }} /></div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70 drop-shadow">Cargando 3D… {progress ? `${progress}%` : ''}</p>
        </div>
      )}
      {error && <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-white/80">{error}</p>}
    </div>
  );
}

// Sem AR nativa: câmera do navegador com o modelo 3D por cima (gira, sem zoom).
function CameraWithModel({ model, name, onClose }: { model: PublicModel; name: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let stream: MediaStream | null = null;
    let alive = true;
    if (!navigator.mediaDevices?.getUserMedia) setErr('Este navegador no permite abrir la cámara. Abre la página en Chrome o Safari.');
    else navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((s) => { if (!alive) { s.getTracks().forEach((t) => t.stop()); return; } stream = s; const v = videoRef.current!; v.srcObject = s; v.play().catch(() => {}); })
      .catch((e) => alive && setErr(e?.name === 'NotAllowedError' ? 'Permiso de cámara denegado. Actívalo en los ajustes del navegador para este sitio.' : 'No se pudo abrir la cámara en este navegador.'));
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { alive = false; stream?.getTracks().forEach((t) => t.stop()); document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  const m = model.measured;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Ver ${name} con la cámara`} translate="no" className="notranslate fixed inset-0 z-[2147483000] bg-black text-white">
      <video ref={videoRef} playsInline muted autoPlay className="absolute inset-0 h-full w-full object-cover" />
      {/* o produto em 3D por cima da câmera (o fundo do visor é transparente) */}
      <ModelBox src={model.glbUrl} name={name} zoom={false} autoRotate={false} transparent className="absolute inset-x-0 bottom-[12%] top-[16%]" />
      {err && <p className="absolute inset-x-6 bottom-28 rounded-xl bg-black/60 px-4 py-3 text-center text-sm backdrop-blur">{err}</p>}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/75 to-transparent p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="min-w-0 text-xs leading-relaxed text-white/80">
          <p className="truncate text-sm font-bold uppercase tracking-[0.14em] text-white">{name}</p>
          <p>Gira el producto con el dedo · medidas reales {fmtCm(m.w)} × {fmtCm(m.h)} × {fmtCm(m.d)}</p>
          <p className="text-white/60">{inApp() ? 'Para colocarlo a tamaño real, abre esta página en Chrome (Android) o Safari (iPhone).' : 'Este dispositivo no tiene realidad aumentada a tamaño real; en un móvil compatible el producto se coloca 1:1.'}</p>
        </div>
        <button type="button" onClick={onClose} className="h-10 shrink-0 cursor-pointer rounded-full bg-black/50 px-4 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur">Cerrar</button>
      </div>
    </div>,
    document.body,
  );
}

// Ícone da câmera (na foto do produto) ou botão: abre a AR do modelo 3D.
export function ModelArLauncher({ model, name, variant = 'icon', theme = 'dark', className = '' }: { model: PublicModel; name: string; variant?: 'icon' | 'button'; theme?: 'dark' | 'light'; className?: string }) {
  const mv = useRef<MV | null>(null);
  const [camera, setCamera] = useState(false);
  const close = useCallback(() => setCamera(false), []);

  const start = async () => {
    try { await loadModelViewer(); } catch { /* sem visor: câmera do navegador */ }
    const el = mv.current;
    if (el?.canActivateAR && el.activateAR) {
      try { await el.activateAR(); return; } catch { /* cai na câmera do navegador */ }
    }
    setCamera(true);
  };

  const trigger = theme === 'dark'
    ? 'border border-white/70 text-white hover:bg-white hover:text-[#0b0614]'
    : 'bg-slate-900 text-white hover:bg-slate-700';

  return (
    <>
      {/* visor invisível: é ele que abre a AR nativa (Scene Viewer / Quick Look / WebXR) */}
      <ModelBox src={model.glbUrl} iosSrc={model.usdzUrl || undefined} name={name} placement={model.placement} ar arModes="scene-viewer webxr quick-look" autoRotate={false}
        mvRef={mv} className="pointer-events-none fixed left-0 top-0 h-px w-px opacity-0" />
      {variant === 'icon' ? (
        <button type="button" onClick={start} aria-label="Ver en tu espacio con la cámara" title="Ver en tu espacio"
          className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-[0_6px_24px_rgba(0,0,0,0.45)] backdrop-blur transition-transform hover:scale-105 active:scale-95 ${className}`}>
          <CameraDot />
        </button>
      ) : (
        <button type="button" onClick={start}
          className={`mt-3 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-bold uppercase tracking-[0.12em] transition-colors ${trigger} ${className}`}>
          <span aria-hidden className="rounded border border-current px-1.5 py-0.5 text-[10px] leading-none">AR</span>
          Ver en tu espacio
        </button>
      )}
      {camera && <CameraWithModel model={model} name={name} onClose={close} />}
    </>
  );
}
