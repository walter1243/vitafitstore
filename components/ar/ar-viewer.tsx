'use client';

// Botão "Ver en tu espacio" + janela de realidade aumentada (lib/ar.ts).
// Monta o modelo 3D (com volume) na hora a partir da foto recortada e abre no
// <model-viewer>: no celular, "Abrir cámara y colocar" pede a câmera e o cliente
// toca na mesa/parede para colocar o produto em tamanho real. No computador o
// modelo gira com o mouse. ArModel3D também é usado na prévia do painel.

import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { arDepthCm, buildArGlb, loadArBitmap, type ArConfig } from '@/lib/ar';

const MODEL_VIEWER_SRC = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';

export function loadModelViewer(): Promise<void> {
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
export function CameraDot() {
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

// ─── Câmera do navegador com o produto por cima ──────────────────────────────
// Abre a câmera traseira direto no navegador (pede a permissão do próprio
// navegador) e mostra o produto recortado sobre a imagem ao vivo. O cliente
// arrasta para posicionar, faz pinça para aumentar/girar e pode tirar uma foto.
// Funciona em qualquer celular com câmera (inclusive iPhone e o navegador do
// Instagram, quando ele libera a câmera); não depende de ARCore/ARKit.
type Pose = { x: number; y: number; s: number; r: number };

function cameraError(e: any): string {
  const n = e?.name || '';
  if (typeof window !== 'undefined' && !window.isSecureContext) return 'La cámara solo funciona en una conexión segura (https).';
  if (n === 'NotAllowedError' || n === 'SecurityError') return 'Permiso de cámara denegado. Actívalo en los ajustes del navegador para este sitio y vuelve a intentarlo.';
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return 'No encontramos ninguna cámara en este dispositivo.';
  if (n === 'NotReadableError') return 'La cámara está siendo usada por otra aplicación. Ciérrala y vuelve a intentarlo.';
  if (!navigator.mediaDevices?.getUserMedia) return 'Este navegador no permite abrir la cámara. Abre la página en Chrome o Safari.';
  return 'No se pudo abrir la cámara. Inténtalo de nuevo.';
}

function CameraTryOn({ name, ar, onClose, onOpen3d }: { name: string; ar: ArConfig; onClose: () => void; onOpen3d: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);
  const [pose, setPose] = useState<Pose>({ x: 0, y: 40, s: 1, r: 0 });
  const [flash, setFlash] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef<{ pose: Pose; dist: number; ang: number; cx: number; cy: number } | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let alive = true;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
        if (!alive) { stream.getTracks().forEach((t) => t.stop()); return; }
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play().catch(() => {});
        setLive(true);
      } catch (e) { if (alive) setError(cameraError(e)); }
    })();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      alive = false;
      stream?.getTracks().forEach((t) => t.stop());
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // gestos: 1 dedo arrasta; 2 dedos aumentam/diminuem e giram
  const measure = () => {
    const pts = [...pointers.current.values()];
    if (pts.length < 2) return { dist: 0, ang: 0, cx: pts[0]?.x ?? 0, cy: pts[0]?.y ?? 0 };
    const [a, b] = pts;
    return { dist: Math.hypot(b.x - a.x, b.y - a.y), ang: Math.atan2(b.y - a.y, b.x - a.x), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
  };
  const onDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    start.current = { pose, ...measure() };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !start.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const m = measure();
    const s0 = start.current;
    const next: Pose = { ...s0.pose, x: s0.pose.x + (m.cx - s0.cx), y: s0.pose.y + (m.cy - s0.cy) };
    if (m.dist && s0.dist) {
      next.s = Math.min(4, Math.max(0.25, s0.pose.s * (m.dist / s0.dist)));
      next.r = s0.pose.r + ((m.ang - s0.ang) * 180) / Math.PI;
    }
    setPose(next);
  };
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    start.current = pointers.current.size ? { pose, ...measure() } : null;
  };
  const onWheel = (e: React.WheelEvent) => setPose((p) => ({ ...p, s: Math.min(4, Math.max(0.25, p.s * (e.deltaY < 0 ? 1.08 : 0.93))) }));

  // Foto: imagem da câmera + produto na mesma posição → compartilhar ou baixar.
  const snap = async () => {
    const v = videoRef.current, box = boxRef.current, img = imgRef.current;
    if (!v || !box || !img || !v.videoWidth) return;
    const W = box.clientWidth, H = box.clientHeight, k = 2;
    const cv = document.createElement('canvas');
    cv.width = W * k; cv.height = H * k;
    const ctx = cv.getContext('2d')!;
    ctx.scale(k, k);
    const cover = Math.max(W / v.videoWidth, H / v.videoHeight);
    const vw = v.videoWidth * cover, vh = v.videoHeight * cover;
    ctx.drawImage(v, (W - vw) / 2, (H - vh) / 2, vw, vh);
    ctx.save();
    ctx.translate(W / 2 + pose.x, H / 2 + pose.y);
    ctx.rotate((pose.r * Math.PI) / 180);
    ctx.scale(pose.s, pose.s);
    ctx.drawImage(img, -img.offsetWidth / 2, -img.offsetHeight / 2, img.offsetWidth, img.offsetHeight);
    ctx.restore();
    setFlash(true); setTimeout(() => setFlash(false), 180);
    const blob = await new Promise<Blob | null>((r) => cv.toBlob(r, 'image/jpeg', 0.9));
    if (!blob) return;
    const file = new File([blob], `${name.replace(/[^\w-]+/g, '-').slice(0, 40) || 'producto'}-en-mi-espacio.jpg`, { type: 'image/jpeg' });
    const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
    if (nav.canShare?.({ files: [file] })) { try { await nav.share({ files: [file], title: name }); return; } catch { /* cancelado */ } }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Ver ${name} con la cámara`} translate="no" className="notranslate fixed inset-0 z-[2147483000] bg-black text-white">
      <div ref={boxRef} className="absolute inset-0 touch-none select-none overflow-hidden"
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel}>
        <video ref={videoRef} playsInline muted autoPlay className="absolute inset-0 h-full w-full object-cover" />
        {live && (
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={imgRef} src={ar.image} alt={name} crossOrigin="anonymous" draggable={false}
            className="pointer-events-none absolute left-1/2 top-1/2 w-[62vw] max-w-[440px] drop-shadow-[0_18px_24px_rgba(0,0,0,0.55)]"
            style={{ transform: `translate(-50%, -50%) translate(${pose.x}px, ${pose.y}px) rotate(${pose.r}deg) scale(${pose.s})` }} />
        )}
        {flash && <div className="pointer-events-none absolute inset-0 bg-white/80" />}
        {!live && !error && <p className="absolute inset-0 flex items-center justify-center text-sm text-white/70">Abriendo la cámara…</p>}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="max-w-sm text-sm leading-relaxed text-white/85">{error}</p>
            <button type="button" onClick={onOpen3d} className="h-12 cursor-pointer rounded-md bg-white px-6 text-sm font-bold uppercase tracking-[0.12em] text-[#0b0614]">Ver en 3D</button>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold uppercase tracking-[0.14em]">{name}</p>
          {live && <p className="mt-0.5 text-xs text-white/70">Arrastra para colocarlo · pellizca para ajustar el tamaño</p>}
        </div>
        <button type="button" onClick={onClose} className="pointer-events-auto h-10 shrink-0 cursor-pointer rounded-full bg-black/50 px-4 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur hover:bg-black/70">Cerrar</button>
      </div>

      {live && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-6 bg-gradient-to-t from-black/70 to-transparent p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={() => setPose({ x: 0, y: 40, s: 1, r: 0 })} className="h-11 cursor-pointer rounded-full bg-black/50 px-4 text-xs font-semibold uppercase tracking-[0.14em] backdrop-blur">Centrar</button>
          <button type="button" onClick={snap} aria-label="Tomar foto" className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-white/25 transition-transform active:scale-90">
            <span className="h-11 w-11 rounded-full bg-white" />
          </button>
          <button type="button" onClick={onOpen3d} className="h-11 cursor-pointer rounded-full bg-black/50 px-4 text-xs font-semibold uppercase tracking-[0.14em] backdrop-blur">3D / AR</button>
        </div>
      )}
    </div>
  );
}

export function ArViewer({ name, ar, theme = 'dark', variant = 'button', className = '' }: { name: string; ar: ArConfig; theme?: 'dark' | 'light'; variant?: 'button' | 'icon'; className?: string }) {
  // camera = câmera do navegador com o produto por cima (o que abre ao tocar);
  // open = janela 3D com o botão de AR nativo (fixar na superfície).
  const [camera, setCamera] = useState(false);
  const [open, setOpen] = useState(false);
  const closeCamera = useCallback(() => setCamera(false), []);
  const open3d = useCallback(() => { setCamera(false); setOpen(true); }, []);

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
        <button type="button" onClick={() => setCamera(true)} aria-label="Ver en tu espacio con la cámara" title="Ver en tu espacio"
          className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-[0_6px_24px_rgba(0,0,0,0.45)] backdrop-blur transition-transform hover:scale-105 active:scale-95 ${className}`}>
          <CameraDot />
        </button>
      ) : (
        <button type="button" onClick={() => setCamera(true)}
          className={`mt-3 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-bold uppercase tracking-[0.12em] transition-colors ${trigger} ${className}`}>
          <span aria-hidden className="rounded border border-current px-1.5 py-0.5 text-[10px] leading-none">AR</span>
          Ver en tu espacio
        </button>
      )}

      {/* no <body>: acima do cabeçalho, do aviso de cookies e de qualquer camada da página */}
      {camera && createPortal(<CameraTryOn name={name} ar={ar} onClose={closeCamera} onOpen3d={open3d} />, document.body)}

      {open && createPortal(
        <div className="fixed inset-0 z-[2147483000] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
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
        </div>,
        document.body,
      )}
    </>
  );
}
