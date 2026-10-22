'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { type Product } from '@/lib/products';
import { DEFAULT_NAME_COLORS, LINK_TYPES, cleanCustomText, fontCss, lineTotalFor, minQtyFor, packOf, parsePersonalize, unitPriceFor, type Personalize } from '@/lib/personalize';

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
export function NamePersonalizer({ product, look = 'llaveros', compact, onAdded, name: nameProp, onName, color: colorProp, onColor, showPreview = true, variant, basePrice, blocked }: {
  product: Product;
  look?: PersonalizerLook;
  compact?: boolean;
  onAdded?: () => void;
  // Pagina do produto: o nome e controlado por ela (aparece na propria foto
  // do produto) e o personalizador fica so com o campo + quantidade.
  name?: string;
  onName?: (v: string) => void;
  // Cor escolhida pelo cliente (hex), quando o produto oferece cores.
  color?: string;
  onColor?: (hex: string) => void;
  showPreview?: boolean;
  // Pagina do produto: cor/tamanho escolhidos la em cima, preco do tamanho e
  // o que falta escolher (ex: "Elige una talla") antes de adicionar.
  variant?: { color?: string; size?: string; note?: string };
  basePrice?: number;
  blocked?: string;
}) {
  const base = parsePersonalize(product.personalize);
  // Sem cores cadastradas: oferece as cores padrao de filamento.
  const cfg = base.colors.length ? base : { ...base, colors: DEFAULT_NAME_COLORS };
  const L = LOOK[look] ?? LOOK.llaveros;
  const packInfo = packOf(base);
  const step = packInfo?.qty ?? 1;
  const minQty = Math.max(step, minQtyFor(base));
  const promo = base.packPercent > 0;

  const { addItem } = useCart();
  const [ownName, setOwnName] = useState('');
  const name = nameProp ?? ownName;
  const setName = (v: string) => { if (onName) onName(v); else setOwnName(v); };
  const [qty, setQty] = useState(minQty);
  // Dados extras (chaveiro NFC etc.): telefone e links que o cliente quer.
  const [wantPhone, setWantPhone] = useState(false);
  const [phone, setPhone] = useState('');
  const [links, setLinks] = useState<{ type: string; value: string }[]>([{ type: 'WhatsApp', value: '' }]);
  const note = [
    base.askPhone && wantPhone && phone.trim() ? `Tel: ${phone.trim()}` : '',
    ...(base.askLinks ? links.filter((l) => l.value.trim()).map((l) => `${l.type}: ${l.value.trim()}`) : []),
  ].filter(Boolean).join(' · ');
  const [added, setAdded] = useState(false);
  const [swing, setSwing] = useState(0);
  const text = cleanCustomText(name, cfg.maxLength);
  const [ownColor, setOwnColor] = useState(cfg.colors[0]?.hex ?? '');
  const color = colorProp ?? ownColor;
  const setColor = (hex: string) => { if (onColor) onColor(hex); else setOwnColor(hex); };
  const chosen = cfg.colors.find((c) => c.hex === color) ?? cfg.colors[0];

  // A cada letra, o chaveiro balanca de novo.
  useEffect(() => { setSwing((n) => n + 1); }, [text]);

  function add() {
    if (!text || blocked) return;
    // A cor escolhida vai junto (carrinho, checkout e pedido: "Color: Negro").
    // Produto com cores proprias: a cor e a do produto; a das letras vai na nota.
    const letters = variant?.color && chosen ? `Letras: ${chosen.name}` : '';
    addItem(product, { text, color: variant?.color || chosen?.name, size: variant?.size, note: [letters, variant?.note, note].filter(Boolean).join(' · ') || undefined }, qty);
    setAdded(true);
    onAdded?.();
    setTimeout(() => { setAdded(false); setName(''); setQty(minQty); }, 1600);
  }

  return (
    <div className={`grid gap-5 ${compact || !showPreview ? '' : 'lg:grid-cols-2 lg:items-center lg:gap-8'}`}>
      {showPreview && <NamePreview cfg={chosen ? { ...cfg, color: chosen.hex } : cfg} product={product} text={text} placeholder={L.sample} swingKey={swing} stage={L.stage} />}

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

        {cfg.colors.length > 0 && (
          <div className="mt-4">
            <span className="mb-2 block text-sm font-extrabold" style={{ color: L.ink }}>
              Color del nombre: <span className="font-semibold">{chosen?.name}</span>
            </span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color del nombre">
              {cfg.colors.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  role="radio"
                  aria-checked={chosen?.hex === c.hex}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => setColor(c.hex)}
                  className="h-11 w-11 cursor-pointer rounded-full border-2 transition-transform hover:scale-105"
                  style={{ background: c.hex, borderColor: chosen?.hex === c.hex ? L.ink : 'rgba(0,0,0,.15)', boxShadow: chosen?.hex === c.hex ? `0 0 0 3px #fff, 0 0 0 5px ${L.ink}` : undefined }}
                />
              ))}
            </div>
          </div>
        )}

        {(base.askPhone || base.askLinks) && (
          <div className="mt-4 space-y-3 rounded-2xl border-2 p-4" style={{ borderColor: L.field }}>
            {base.askPhone && (
              <div>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-extrabold" style={{ color: L.ink }}>
                  <input type="checkbox" checked={wantPhone} onChange={(e) => setWantPhone(e.target.checked)} className="h-4 w-4" />
                  Añadir número de teléfono
                </label>
                {wantPhone && (
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.slice(0, 30))}
                    placeholder="+34 600 000 000"
                    className="mt-2 h-12 w-full rounded-xl px-4 text-base font-semibold outline-none"
                    style={{ background: L.field, color: L.ink }}
                  />
                )}
              </div>
            )}
            {base.askLinks && (
              <div>
                <span className="mb-2 block text-sm font-extrabold" style={{ color: L.ink }}>¿Qué enlace quieres en tu llavero?</span>
                <div className="space-y-2">
                  {links.map((l, i) => (
                    <div key={i} className="flex gap-2">
                      <select
                        value={l.type}
                        onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}
                        className="h-12 shrink-0 rounded-xl px-2 text-sm font-bold outline-none"
                        style={{ background: L.field, color: L.ink }}
                        aria-label="Tipo de enlace"
                      >
                        {LINK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input
                        value={l.value}
                        onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, value: e.target.value.slice(0, 120) } : x)))}
                        placeholder={l.type === 'Instagram' ? '@tuusuario' : l.type === 'Bizum' || l.type === 'WhatsApp' ? 'Número' : l.type === 'Ubicación' ? 'Dirección o enlace de Maps' : 'Enlace o dato'}
                        className="h-12 min-w-0 flex-1 rounded-xl px-3 text-sm font-semibold outline-none"
                        style={{ background: L.field, color: L.ink }}
                      />
                      {links.length > 1 && (
                        <button type="button" aria-label="Quitar enlace" onClick={() => setLinks(links.filter((_, j) => j !== i))} className="h-12 w-10 shrink-0 cursor-pointer rounded-xl text-lg font-bold" style={{ color: L.muted }}>×</button>
                      )}
                    </div>
                  ))}
                </div>
                {links.length < 5 && (
                  <button type="button" onClick={() => setLinks([...links, { type: 'Instagram', value: '' }])} className="mt-2 cursor-pointer text-sm font-extrabold underline" style={{ color: L.ink }}>
                    + Añadir otro enlace
                  </button>
                )}
                <p className="mt-3 rounded-xl px-3 py-2 text-xs font-semibold" style={{ background: L.field, color: L.muted }}>
                  Después de la compra, nuestro equipo de soporte se pondrá en contacto contigo para configurar todos los enlaces.
                </p>
              </div>
            )}
          </div>
        )}

        {base.freeShipQty > 0 && (
          <p className="mt-4 rounded-2xl px-4 py-2.5 text-sm font-extrabold" style={{ background: '#DBEAFE', color: '#1E3A8A' }}>
            🚚 Envío gratis a partir de {base.freeShipQty} unidades{qty >= base.freeShipQty ? ' — ¡ya lo tienes!' : ` (te faltan ${base.freeShipQty - qty})`}
          </p>
        )}
        {packInfo && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3" style={{ background: L.field }}>
            {product.price * packInfo.qty > packInfo.price && (
              <span className="rounded-full px-2.5 py-1 text-sm font-extrabold text-white" style={{ background: '#16a34a' }}>-{Math.round((1 - packInfo.price / (product.price * packInfo.qty)) * 100)}%</span>
            )}
            <span className="text-sm font-bold" style={{ color: L.ink }}>
              Pack de {packInfo.qty}: {product.price * packInfo.qty > packInfo.price && <s className="mr-1 font-semibold opacity-60">{(product.price * packInfo.qty).toFixed(2)}€</s>}
              <span className="text-base font-extrabold">{packInfo.price.toFixed(2)}€</span>
            </span>
            <span className="w-full text-xs font-semibold" style={{ color: L.muted }}>{(packInfo.price / packInfo.qty).toFixed(2)}€ por unidad · se vende en packs de {packInfo.qty}</span>
          </div>
        )}
        {!packInfo && (promo || minQty > 1) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3" style={{ background: L.field }}>
            {promo && (
              <span className="rounded-full px-2.5 py-1 text-sm font-extrabold text-white" style={{ background: '#16a34a' }}>-{Math.round(base.packPercent)}%</span>
            )}
            <span className="text-sm font-bold" style={{ color: L.ink }}>
              {minQty > 1 ? `Pack de ${minQty}: ` : 'Promoción: '}
              {promo && <s className="mr-1 font-semibold opacity-60">{(product.price * minQty).toFixed(2)}€</s>}
              <span className="text-base font-extrabold">{(unitPriceFor(product.price, base, minQty) * minQty).toFixed(2)}€</span>
            </span>
            {minQty > 1 && <span className="w-full text-xs font-semibold" style={{ color: L.muted }}>Pedido mínimo {minQty} unidades · {unitPriceFor(product.price, base, minQty).toFixed(2)}€ cada una</span>}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="inline-flex h-12 items-center rounded-full border-2" style={{ borderColor: L.ink, color: L.ink }}>
            <button type="button" aria-label="Menos" onClick={() => setQty((q) => Math.max(minQty, q - step))} className="flex h-12 w-12 cursor-pointer items-center justify-center"><Minus className="h-4 w-4" /></button>
            <span className="min-w-8 px-1 text-center text-lg font-extrabold" aria-live="polite">{packInfo ? `${qty / step} pack${qty / step > 1 ? 's' : ''}` : qty}</span>
            <button type="button" aria-label="Más" onClick={() => setQty((q) => Math.min(500, q + step))} className="flex h-12 w-12 cursor-pointer items-center justify-center"><Plus className="h-4 w-4" /></button>
          </div>
          <button
            type="button"
            onClick={add}
            disabled={!text || Boolean(blocked)}
            className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-6 text-base font-extrabold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: added ? '#15803d' : L.cta, color: L.ctaText }}
            onMouseEnter={(e) => { if (!added && text) e.currentTarget.style.background = L.ctaHover; }}
            onMouseLeave={(e) => { if (!added) e.currentTarget.style.background = L.cta; }}
          >
            {added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
            {added ? '¡Añadido!' : blocked && text ? blocked : `Añadir · ${lineTotalFor(basePrice ?? product.price, base, qty).toFixed(2)}€`}
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
  // Nome comprido: diminui a letra pra caber na largura maxima (fitW).
  const fontSize = fitSize(shown, fontCss(cfg.font), cfg.size, cfg.fitW || 60);
  // rotate + skew + scaleY: acompanha a peca inclinada em perspectiva.
  const tf = `translate(-50%, -50%) rotate(${cfg.rotate || 0}deg) skewX(${cfg.skew || 0}deg) scaleY(${(cfg.squash || 100) / 100})`;
  const font = fontCss(cfg.font);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative overflow-hidden rounded-[28px]" style={{ background: stage, aspectRatio: '1 / 1', containerType: 'inline-size' }}>
      {cfg.previewImage ? (
        <div key={swingKey} className="np-swing absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cfg.previewImage} alt={product ? `Modelo de ${product.name}` : 'Modelo'} className="h-full w-full object-contain" />
          {cfg.cover && (
            // cobre o nome que ja vem impresso na foto
            <span
              className="pointer-events-none absolute"
              style={{
                left: `${cfg.x}%`,
                top: `${cfg.y}%`,
                width: `${cfg.coverW}%`,
                height: `${cfg.coverH}%`,
                transform: tf,
                background: cfg.coverColor,
                borderRadius: '999px',
                boxShadow: `0 0 10px 6px ${cfg.coverColor}`,
              }}
              aria-hidden="true"
            />
          )}
          <span
            className="np-pop pointer-events-none absolute whitespace-nowrap font-bold leading-none"
            style={{
              left: `${cfg.x}%`,
              top: `${cfg.y}%`,
              transform: tf,
              fontSize: `${fontSize}cqw`,
              color: cfg.color,
              fontFamily: font,
              opacity: text ? 1 : 0.45,
              // relevo: filamento em alto-relevo (borda escura + sombra), ou leve.
              textShadow: cfg.relief
                ? '0.035em 0.035em 0 rgba(0,0,0,.55), 0.07em 0.07em 0.08em rgba(0,0,0,.35), -0.02em -0.02em 0 rgba(255,255,255,.25)'
                : '0 1px 0 rgba(255,255,255,.35), 0 2px 3px rgba(0,0,0,.25)',
              letterSpacing: cfg.font === 'negrita' ? '0.02em' : undefined,
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

// Mede o texto (canvas) e devolve o tamanho (em % da largura) que cabe em maxW.
let measureCtx: CanvasRenderingContext2D | null = null;
export function fitSize(text: string, font: string, size: number, maxW: number) {
  if (typeof document === 'undefined' || !text) return size;
  measureCtx ??= document.createElement('canvas').getContext('2d');
  if (!measureCtx) return size;
  measureCtx.font = `bold 100px ${font}`;
  const w = (measureCtx.measureText(text).width / 100) * size; // largura em "cqw"
  return w > maxW ? Math.max(2, (size * maxW) / w) : size;
}
