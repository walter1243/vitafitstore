'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { type Product } from '@/lib/products';
import { cleanCustomText, fontCss, parsePersonalize, type Personalize } from '@/lib/personalize';

// Visual de cada setor pro personalizador (botao, destaques).
export type PersonalizerLook = 'llaveros' | 'mascotas' | 'infantil' | 'hogar';
const LOOK: Record<PersonalizerLook, { ink: string; muted: string; field: string; cta: string; ctaHover: string; ctaText: string; stage: string; sample: string }> = {
  llaveros: { ink: '#1E1B4B', muted: '#4B4A72', field: '#EEF2FF', cta: '#EA580C', ctaHover: '#C2410C', ctaText: '#fff', stage: 'linear-gradient(160deg,#EEF2FF 0%,#E0E7FF 55%,#FFE7D6 100%)', sample: 'Lucía' },
  mascotas: { ink: '#451A03', muted: '#78350F', field: '#FEF3C7', cta: '#78350F', ctaHover: '#5B2A0B', ctaText: '#fff', stage: 'linear-gradient(160deg,#FFF7ED 0%,#FEF3C7 60%,#FDE68A 100%)', sample: 'Toby' },
  infantil: { ink: '#1E1B4B', muted: '#4B4A72', field: '#F2F4FA', cta: '#EA580C', ctaHover: '#C2410C', ctaText: '#fff', stage: 'linear-gradient(160deg,#FFF8EF,#FFE8C2)', sample: 'Lucía' },
  hogar: { ink: '#2b2620', muted: '#5f574e', field: '#f3ece2', cta: '#2b2620', ctaHover: '#4a4238', ctaText: '#fff', stage: 'linear-gradient(160deg,#fbf8f3,#ece3d6)', sample: 'Casa' },
};

// "Ponle su nombre": o cliente escreve e ve o nome no MESMO modelo do
// produto na hora (o chaveiro balanca, as letras "pulam"), escolhe a
// quantidade e adiciona. Cada nome vira uma linha no carrinho/pedido.
export function NamePersonalizer({ product, look = 'llaveros', compact, onAdded }: {
  product: Product;
  look?: PersonalizerLook;
  compact?: boolean;
  onAdded?: () => void;
}) {
  const cfg = parsePersonalize(product.personalize);
  const L = LOOK[look];
  const { addItem } = useCart();
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [swing, setSwing] = useState(0);
  const text = cleanCustomText(name, cfg.maxLength);

  // A cada letra, o chaveiro balanca de novo.
  useEffect(() => { setSwing((n) => n + 1); }, [text]);

  function add() {
    if (!text) return;
    addItem(product, { text }, qty);
    setAdded(true);
    onAdded?.();
    setTimeout(() => { setAdded(false); setName(''); setQty(1); }, 1600);
  }

  return (
    <div className={`grid gap-5 ${compact ? '' : 'lg:grid-cols-2 lg:items-center lg:gap-8'}`}>
      <NamePreview cfg={cfg} product={product} text={text} placeholder={L.sample} swingKey={swing} stage={L.stage} />

      <div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-extrabold" style={{ color: L.ink }}>{cfg.label}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
            maxLength={cfg.maxLength + 4}
            placeholder={`Escribe aquí… (ej: ${L.sample})`}
            autoComplete="off"
            className="h-14 w-full rounded-2xl border-2 px-4 text-lg font-bold outline-none transition-colors focus:border-current"
            style={{ background: L.field, borderColor: 'transparent', color: L.ink }}
          />
        </label>
        <p className="mt-1.5 text-xs font-semibold" style={{ color: L.muted }}>
          {text.length}/{cfg.maxLength} letras · lo imprimimos tal cual lo ves
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="inline-flex h-12 items-center rounded-full border-2" style={{ borderColor: L.ink, color: L.ink }}>
            <button type="button" aria-label="Menos" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-12 w-12 cursor-pointer items-center justify-center"><Minus className="h-4 w-4" /></button>
            <span className="min-w-8 text-center text-lg font-extrabold" aria-live="polite">{qty}</span>
            <button type="button" aria-label="Más" onClick={() => setQty((q) => Math.min(20, q + 1))} className="flex h-12 w-12 cursor-pointer items-center justify-center"><Plus className="h-4 w-4" /></button>
          </div>
          <button
            type="button"
            onClick={add}
            disabled={!text}
            className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-6 text-base font-extrabold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: added ? '#15803d' : L.cta, color: L.ctaText }}
            onMouseEnter={(e) => { if (!added && text) e.currentTarget.style.background = L.ctaHover; }}
            onMouseLeave={(e) => { if (!added) e.currentTarget.style.background = L.cta; }}
          >
            {added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
            {added ? '¡Añadido!' : `Añadir · ${(product.price * qty).toFixed(2)}€`}
          </button>
        </div>
        {!text && <p className="mt-3 text-sm" style={{ color: L.muted }}>Escribe el nombre para poder añadirlo.</p>}
      </div>
    </div>
  );
}

// Previa: foto do modelo com o nome por cima (posicao/tamanho/cor/fonte do
// Admin) ou, sem foto, o desenho padrao do formato (chaveiro ou placa).
export function NamePreview({ cfg, product, text, placeholder, swingKey, stage }: {
  cfg: Personalize;
  product?: Product;
  text: string;
  placeholder: string;
  swingKey: number;
  stage: string;
}) {
  const shown = text || placeholder;
  const font = fontCss(cfg.font);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative overflow-hidden rounded-[28px]" style={{ background: stage, aspectRatio: '1 / 1', containerType: 'inline-size' }}>
      {cfg.previewImage ? (
        <div key={swingKey} className="np-swing absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cfg.previewImage} alt={product ? `Modelo de ${product.name}` : 'Modelo'} className="h-full w-full object-contain" />
          <span
            className="np-pop pointer-events-none absolute whitespace-nowrap font-bold leading-none"
            style={{
              left: `${cfg.x}%`,
              top: `${cfg.y}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: `${cfg.size}cqw`,
              color: cfg.color,
              fontFamily: font,
              opacity: text ? 1 : 0.45,
              textShadow: '0 1px 0 rgba(255,255,255,.35), 0 2px 3px rgba(0,0,0,.25)',
            }}
          >
            {shown}
          </span>
        </div>
      ) : (
        <ShapeSvg shape={cfg.shape} text={shown} faded={!text} color={cfg.color} font={font} swingKey={swingKey} />
      )}
    </div>
  );
}

// Desenho padrao: chaveiro (placa com argola) ou placa de pet (osso).
function ShapeSvg({ shape, text, faded, color, font, swingKey }: { shape: 'llavero' | 'chapa'; text: string; faded: boolean; color: string; font: string; swingKey: number }) {
  const len = Math.max(3, text.length);
  const w = Math.min(330, Math.max(170, len * 30 + 70));
  const x = 200 - w / 2;
  const fs = Math.min(64, Math.max(30, 300 / len));
  return (
    <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" role="img" aria-label={`Vista previa: ${text}`}>
      <defs>
        <linearGradient id="np-plate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9e7f5" />
        </linearGradient>
      </defs>
      {/* argola */}
      <circle cx="200" cy="70" r="34" fill="none" stroke="#9ca3af" strokeWidth="9" />
      <circle cx="200" cy="70" r="34" fill="none" stroke="#e5e7eb" strokeWidth="3" />
      <g key={swingKey} className="np-swing" style={{ transformOrigin: '200px 104px' }}>
        <line x1="200" y1="104" x2="200" y2="150" stroke="#9ca3af" strokeWidth="6" />
        {shape === 'chapa' ? (
          <g>
            {/* osso */}
            <path
              d={`M${x + 40} 180 h${w - 80} a32 32 0 1 1 22 52 a32 32 0 1 1 -22 52 h-${w - 80} a32 32 0 1 1 -22 -52 a32 32 0 1 1 22 -52z`}
              fill="url(#np-plate)" stroke="#d6d3e8" strokeWidth="4"
            />
            <circle cx="200" cy="165" r="9" fill="#fff" stroke="#9ca3af" strokeWidth="4" />
          </g>
        ) : (
          <g>
            <rect x={x} y="150" width={w} height="150" rx="40" fill="#1E1B4B" opacity="0.18" transform="translate(6 8)" />
            <rect x={x} y="150" width={w} height="150" rx="40" fill="url(#np-plate)" stroke="#d6d3e8" strokeWidth="4" />
            <circle cx="200" cy="172" r="9" fill="#fff" stroke="#9ca3af" strokeWidth="4" />
          </g>
        )}
        {/* nome com "relevo" de impressao 3D */}
        <text x="203" y={shape === 'chapa' ? 252 : 248} textAnchor="middle" fontFamily={font} fontWeight="800" fontSize={fs} fill="#000" opacity="0.18">{text}</text>
        <text className="np-pop" x="200" y={shape === 'chapa' ? 248 : 244} textAnchor="middle" fontFamily={font} fontWeight="800" fontSize={fs} fill={color} opacity={faded ? 0.4 : 1}>{text}</text>
      </g>
    </svg>
  );
}
