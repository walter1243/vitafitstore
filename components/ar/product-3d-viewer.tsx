'use client';

// Product3DViewer — o modelo 3D real do produto (arquivo 3MF/STL convertido no painel).
// • Explorar: gira 360°, zoom com os dedos/mouse, sombra e luz realistas.
// • "VER EN MI ESPACIO": abre a AR nativa (Android: WebXR/Scene Viewer · iPhone: Quick Look)
//   com ar-scale="fixed": o produto fica em tamanho real 1:1 e o cliente NÃO consegue
//   aumentar nem diminuir. Sem AR no aparelho: câmera do navegador com o modelo por cima
//   (sem zoom; avisa que o tamanho exato precisa de AR).
// Só aparece em produto com modelo publicado e validado (lib/product-models.ts).

import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { loadModelViewer } from '@/components/ar/ar-viewer';
import { fmtCm, type Dims, type Placement } from '@/lib/product-models-shared';

export type PublicModel = { glbUrl: string; usdzUrl: string; measured: Dims; placement: Placement };

type MV = HTMLElement & { canActivateAR?: boolean; activateAR?: () => Promise<void> };

const inApp = () => typeof navigator !== 'undefined' && /Instagram|FBAN|FBAV|TikTok|Line\//i.test(navigator.userAgent);

// Caixa 3D (usada na página do produto, na tela cheia e na prévia do painel).
export function ModelBox({ src, iosSrc, name, placement = 'floor', ar = false, zoom = true, autoRotate = true, transparent = false, onReady, mvRef, className = '' }: {
  src: string; iosSrc?: string; name: string; placement?: Placement; ar?: boolean; zoom?: boolean; autoRotate?: boolean; transparent?: boolean;
  onReady?: (mv: MV) => void; mvRef?: React.MutableRefObject<MV | null>; className?: string;
}) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [defined, setDefined] = useState(false);
  const elRef = useRef<MV | null>(null);

  useEffect(() => { let on = true; loadModelViewer().then(() => on && setDefined(true)).catch(() => on && setError('No se pudo cargar el visor 3D.')); return () => { on = false; }; }, []);
  useEffect(() => { setReady(false); setProgress(0); setError(''); }, [src]);

  const attach = useCallback((el: MV | null) => {
    elRef.current = el;
    if (mvRef) mvRef.current = el;
    if (!el) return;
    const onProg = (e: Event) => setProgress(Math.round(((e as CustomEvent).detail?.totalProgress ?? 0) * 100));
    const onLoad = () => { setReady(true); onReady?.(el); };
    const onErr = () => setError('No se pudo cargar el modelo 3D. Revisa tu conexión e inténtalo de nuevo.');
    el.addEventListener('progress', onProg);
    el.addEventListener('load', onLoad);
    el.addEventListener('error', onErr);
  }, [mvRef, onReady]);

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
    'interaction-prompt': 'auto',
    loading: 'eager',
    reveal: 'auto',
    'min-camera-orbit': 'auto auto 5%',
    style: { width: '100%', height: '100%', background: transparent ? 'transparent' : 'radial-gradient(circle at 50% 35%, #2a1640, #0b0614)', ['--poster-color' as string]: 'transparent' },
  };
  if (!zoom) props['disable-zoom'] = '';
  if (autoRotate) { props['auto-rotate'] = ''; props['auto-rotate-delay'] = '1500'; props['rotation-per-second'] = '20deg'; }
  if (ar) {
    props.ar = '';
    props['ar-modes'] = 'webxr scene-viewer quick-look';
    props['ar-scale'] = 'fixed'; // escala 1:1 travada (sem pinça para aumentar/diminuir)
    props['ar-placement'] = placement;
    if (iosSrc) props['ios-src'] = iosSrc;
  }

  return (
    <div translate="no" className={`notranslate relative overflow-hidden ${className}`}>
      {defined && !error && createElement('model-viewer', props, createElement('span', { slot: 'ar-button', style: { display: 'none' } }))}
      {!ready && !error && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-white transition-[width] duration-200" style={{ width: `${Math.max(6, progress)}%` }} /></div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Cargando 3D… {progress ? `${progress}%` : ''}</p>
        </div>
      )}
      {error && <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-white/75">{error}</p>}
    </div>
  );
}

// Sem AR no aparelho: câmera do navegador com o modelo 3D por cima (gira, sem zoom).
function CameraFallback({ model, name, onClose }: { model: PublicModel; name: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let stream: MediaStream | null = null;
    let alive = true;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((s) => { if (!alive) { s.getTracks().forEach((t) => t.stop()); return; } stream = s; const v = videoRef.current!; v.srcObject = s; v.play().catch(() => {}); })
      .catch((e) => alive && setErr(e?.name === 'NotAllowedError' ? 'Permiso de cámara denegado. Actívalo en los ajustes del navegador para este sitio.' : 'No se pudo abrir la cámara en este navegador.'));
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { alive = false; stream?.getTracks().forEach((t) => t.stop()); document.body.style.overflow = prev; };
  }, []);
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Ver ${name} con la cámara`} translate="no" className="notranslate fixed inset-0 z-[2147483000] bg-black text-white">
      <video ref={videoRef} playsInline muted autoPlay className="absolute inset-0 h-full w-full object-cover" />
      {!err && <ModelBox src={model.glbUrl} name={name} zoom={false} autoRotate={false} transparent className="absolute inset-x-0 bottom-[14%] top-[18%]" />}
      {err && <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm">{err}</p>}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/75 to-transparent p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="min-w-0 text-xs leading-relaxed text-white/80">
          <p className="truncate text-sm font-bold uppercase tracking-[0.14em] text-white">{name}</p>
          <p>Tu dispositivo no admite realidad aumentada a tamaño real. Gira el producto con el dedo.</p>
          {inApp() && <p className="mt-1 font-semibold text-white">Para verlo a tamaño real, abre esta página en Chrome (Android) o Safari (iPhone).</p>}
        </div>
        <button type="button" onClick={onClose} className="h-10 shrink-0 cursor-pointer rounded-full bg-black/50 px-4 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur">Cerrar</button>
      </div>
    </div>,
    document.body,
  );
}

export function Product3DViewer({ model, name, theme = 'dark' }: { model: PublicModel; name: string; theme?: 'dark' | 'light' }) {
  const inlineMv = useRef<MV | null>(null);
  const [full, setFull] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [arMsg, setArMsg] = useState('');
  const m = model.measured;
  const dims = `${fmtCm(m.w)} × ${fmtCm(m.h)} × ${fmtCm(m.d)}`;

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [full]);

  // AR nativa com escala fixa; se o aparelho não suporta, câmera do navegador.
  const startAr = async () => {
    setArMsg('');
    try {
      await loadModelViewer();
      const mv = inlineMv.current;
      if (mv && mv.canActivateAR && mv.activateAR) { await mv.activateAR(); return; }
    } catch { /* cai na câmera */ }
    if (!window.isSecureContext) { setArMsg('La realidad aumentada necesita una conexión segura (https).'); return; }
    setFallback(true);
  };

  const outline = theme === 'dark' ? 'border border-white/70 text-white hover:bg-white hover:text-[#0b0614]' : 'border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white';
  const solid = theme === 'dark' ? 'bg-white text-[#0b0614] hover:bg-white/85' : 'bg-slate-900 text-white hover:bg-slate-700';

  return (
    <section aria-label={`${name} en 3D`} className="mt-4">
      <ModelBox src={model.glbUrl} iosSrc={model.usdzUrl || undefined} name={name} placement={model.placement} ar mvRef={inlineMv} className="aspect-square w-full rounded-lg" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setFull(true)} className={`flex h-12 cursor-pointer items-center justify-center rounded-md text-xs font-bold uppercase tracking-[0.12em] transition-colors sm:text-sm ${outline}`}>Explorar en 3D</button>
        <button type="button" onClick={startAr} className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md text-xs font-bold uppercase tracking-[0.12em] transition-colors sm:text-sm ${solid}`}>
          <span aria-hidden className="rounded border border-current px-1 py-0.5 text-[9px] leading-none">AR</span> Ver en mi espacio
        </button>
      </div>
      <p className={`mt-2 text-xs ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
        Medidas reales: <strong className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{dims}</strong> (ancho × alto × fondo). En realidad aumentada se muestra a tamaño real 1:1; la precisión también depende de la calibración y los sensores de tu dispositivo.
      </p>
      {arMsg && <p className="mt-2 text-xs text-red-300">{arMsg}</p>}

      {full && createPortal(
        <div role="dialog" aria-modal="true" aria-label={`Explorar ${name} en 3D`} className="fixed inset-0 z-[2147483000] flex flex-col bg-[#0b0614] text-white">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <p className="truncate text-sm font-bold uppercase tracking-[0.14em]">{name}</p>
            <button type="button" onClick={() => setFull(false)} className="h-10 shrink-0 cursor-pointer px-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70 hover:text-white">Cerrar</button>
          </div>
          <ModelBox src={model.glbUrl} name={name} autoRotate={false} className="min-h-0 flex-1" />
          <div className="flex items-center justify-between gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-xs text-white/60">
            <span>Arrastra para girar · pellizca o usa la rueda para acercar</span>
            <button type="button" onClick={() => { setFull(false); void startAr(); }} className="h-10 shrink-0 cursor-pointer rounded-md bg-white px-4 font-bold uppercase tracking-[0.12em] text-[#0b0614]">Ver en mi espacio</button>
          </div>
        </div>,
        document.body,
      )}
      {fallback && <CameraFallback model={model} name={name} onClose={() => setFallback(false)} />}
    </section>
  );
}
