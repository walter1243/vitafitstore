'use client';
import { useState } from 'react';
import {
  ShieldCheck, Lock, Truck, RotateCcw,
  Package, ChevronRight, ChevronLeft,
  Loader2, User, MapPin,
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import Link from 'next/link';
import Image from 'next/image';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

// ─── Utils ───────────────────────────────────────────────────────────────────

function detectBrand(num: string): string {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  if (/^6/.test(n)) return 'discover';
  return 'unknown';
}

function formatNumber(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(val: string): string {
  const d = val.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
}

function cardDisplayNumber(rawDigits: string): string {
  const padded = rawDigits.padEnd(16, '•');
  return [padded.slice(0, 4), padded.slice(4, 8), padded.slice(8, 12), padded.slice(12)].join(' ');
}

// ─── Brand logos ──────────────────────────────────────────────────────────────

function VisaLogo({ w = 40, h = 25 }: { w?: number; h?: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 34 22" fill="none">
      <rect width="34" height="22" rx="3" fill="#1A1F71"/>
      <path d="M13.5 15.5L14.9 6.5H17.1L15.7 15.5H13.5Z" fill="white"/>
      <path d="M22.8 6.7C22.3 6.5 21.5 6.3 20.5 6.3C18.1 6.3 16.4 7.5 16.4 9.2C16.4 10.4 17.4 11.1 18.2 11.5C19 11.9 19.3 12.2 19.3 12.6C19.3 13.2 18.6 13.5 17.9 13.5C16.9 13.5 16.4 13.3 15.5 12.9L15.2 12.8L14.8 15.1C15.4 15.4 16.5 15.6 17.6 15.6C20.2 15.6 21.8 14.4 21.8 12.6C21.8 11.6 21.2 10.8 19.9 10.2C19.1 9.8 18.7 9.5 18.7 9.1C18.7 8.7 19.1 8.3 19.9 8.3C20.6 8.3 21.1 8.4 21.5 8.6L21.7 8.7L22.1 6.5L22.8 6.7Z" fill="white"/>
      <path d="M26 6.5H24.2C23.7 6.5 23.3 6.6 23.1 7.1L19.9 15.5H22.5L23 14H26.1L26.4 15.5H28.7L26 6.5ZM23.7 12.1C23.9 11.5 24.8 9.2 24.8 9.2C24.8 9.2 25 8.7 25.1 8.3L25.3 9.1C25.3 9.1 25.9 11.6 26 12.1H23.7Z" fill="white"/>
      <path d="M11.5 6.5L9.2 12.5L9 11.5C8.5 9.8 7 8.2 5.3 7.3L7.4 15.5H10.1L14.2 6.5H11.5Z" fill="white"/>
      <path d="M6.8 6.5H2.8L2.8 6.7C5.8 7.4 7.8 9.2 8.5 11.5L7.7 7.1C7.6 6.6 7.2 6.5 6.8 6.5Z" fill="#F9A51A"/>
    </svg>
  );
}

function MastercardLogo({ w = 40, h = 25 }: { w?: number; h?: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 34 22" fill="none">
      <rect width="34" height="22" rx="3" fill="#252525"/>
      <circle cx="13" cy="11" r="6" fill="#EB001B"/>
      <circle cx="21" cy="11" r="6" fill="#F79E1B"/>
      <path d="M17 7.5A6 6 0 0 1 21 11 6 6 0 0 1 17 14.5 6 6 0 0 1 13 11 6 6 0 0 1 17 7.5Z" fill="#FF5F00"/>
    </svg>
  );
}

function BrandOnCard({ brand }: { brand: string }) {
  if (brand === 'visa') return <VisaLogo w={44} h={28} />;
  if (brand === 'mastercard') return <MastercardLogo w={44} h={28} />;
  if (brand === 'amex') return (
    <div className="px-2 py-0.5 rounded text-xs font-black text-white" style={{ background: '#0077CC' }}>AMEX</div>
  );
  if (brand === 'discover') return (
    <div className="px-2 py-0.5 rounded text-xs font-black text-white" style={{ background: '#FF6000' }}>DISC</div>
  );
  return (
    <svg width="36" height="24" viewBox="0 0 36 24" fill="none" opacity="0.3">
      <rect x="1" y="1" width="34" height="22" rx="3" stroke="white" strokeWidth="1.5"/>
      <rect x="1" y="8" width="34" height="5" fill="white" opacity="0.4"/>
    </svg>
  );
}

// ─── Credit Card Visual ───────────────────────────────────────────────────────

function CreditCardVisual({
  name, number, expiry, cvv, flipped, brand,
}: {
  name: string; number: string; expiry: string; cvv: string;
  flipped: boolean; brand: string;
}) {
  const rawDigits = number.replace(/\s/g, '');
  const displayNum = cardDisplayNumber(rawDigits);
  const displayName = name.trim().toUpperCase() || 'SEU NOME AQUI';
  const displayExpiry = expiry || 'MM/AA';

  return (
    <div className="mx-auto select-none w-full" style={{ maxWidth: 300, height: 182, perspective: '1200px' }}>
      <div
        className="relative w-full h-full transition-all duration-700"
        style={{
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* FRONT */}
        <div
          className="absolute inset-0 rounded-2xl p-4 flex flex-col justify-between shadow-2xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #059669 0%, #047857 40%, #0f2027 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-20"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 55%)' }} />

          <div className="relative flex justify-between items-start z-10">
            {/* Chip */}
            <div className="w-9 h-6 rounded-md"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)' }}>
              <div className="w-full h-full flex">
                <div className="flex-1 border-r border-yellow-700/30" />
              </div>
            </div>
            <BrandOnCard brand={brand} />
          </div>

          {/* Card number */}
          <div className="relative z-10 text-white font-mono text-sm sm:text-base tracking-[0.18em] text-center drop-shadow">
            {displayNum}
          </div>

          <div className="relative z-10 flex justify-between items-end">
            <div>
              <p className="text-white/50 text-[9px] uppercase tracking-widest mb-0.5">Titular do cartão</p>
              <p className="text-white font-semibold text-xs tracking-wide truncate max-w-[170px]">{displayName}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[9px] uppercase tracking-widest mb-0.5">Validade</p>
              <p className="text-white font-semibold text-xs">{displayExpiry}</p>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          }}
        >
          <div className="w-full h-9 mt-6" style={{ background: '#0a0a0a' }} />
          <div className="px-4 mt-3">
            <p className="text-white/40 text-[9px] uppercase tracking-widest mb-1">CVV / CVC</p>
            <div className="rounded-lg h-8 flex items-center justify-end px-3"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <span className="text-white/70 tracking-widest text-sm font-mono">
                {cvv ? cvv.replace(/./g, '•') : '•••'}
              </span>
            </div>
          </div>
          <div className="absolute bottom-3 left-0 right-0 flex justify-between px-4 items-center">
            <p className="text-white/20 text-[9px]">VitaFit Store</p>
            <div className="flex gap-0.5">
              <div className="w-5 h-5 rounded-full bg-red-500/70" />
              <div className="w-5 h-5 rounded-full bg-amber-400/70 -ml-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Success Animation ────────────────────────────────────────────────────────

function SuccessScreen({ name }: { name: string }) {
  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes productFall {
          0%   { opacity: 0; transform: translateY(-60px) scale(0.7); }
          60%  { opacity: 1; transform: translateY(10px) scale(1.05); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes boxClose {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-8px); }
        }
        @keyframes slideDelivery {
          0%   { opacity: 1; transform: translateX(0); }
          80%  { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(200px); }
        }
        @keyframes checkPop {
          0%   { opacity: 0; transform: scale(0) rotate(-30deg); }
          70%  { transform: scale(1.15) rotate(5deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes trailDots {
          0%,80%  { opacity: 0; }
          85%     { opacity: 1; }
          100%    { opacity: 0; }
        }
        .anim-product { animation: productFall 0.7s cubic-bezier(.34,1.56,.64,1) 0.3s both; }
        .anim-box     { animation: slideDelivery 3s ease-out 1.2s both; }
        .anim-check   { animation: checkPop 0.6s cubic-bezier(.34,1.56,.64,1) 1.5s both; }
        .anim-text    { animation: fadeInUp 0.6s ease 2s both; }
        .anim-dots    { animation: trailDots 3s ease-out 1.2s both; }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
        style={{ background: '#0a0f0a' }}
      >
        {/* Scene */}
        <div className="relative flex flex-col items-center mb-8">
          {/* Truck / delivery trail dots */}
          <div className="anim-dots absolute right-[-40px] top-[60px] flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                style={{ animationDelay: `${1.3 + i * 0.1}s` }} />
            ))}
          </div>

          {/* Delivery box scene */}
          <div className="anim-box flex flex-col items-center">
            {/* Product drops in */}
            <div className="anim-product text-3xl mb-0.5">📦</div>

            {/* Box */}
            <div
              className="relative w-24 h-20 rounded-xl flex items-end justify-center pb-2"
              style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
            >
              {/* Box lid */}
              <div
                className="absolute -top-3 left-0 right-0 h-5 rounded-t-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                <div className="w-8 h-0.5 rounded-full bg-white/30" />
              </div>
              <span className="text-xs font-bold text-white/80 tracking-wider">VITAFIT</span>

              {/* Tape strip */}
              <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full opacity-50"
                style={{ background: '#fbbf24' }} />
            </div>

            {/* Wheels */}
            <div className="flex gap-12 -mt-1">
              <div className="w-4 h-4 rounded-full border-2 border-emerald-500"
                style={{ background: '#0a0f0a' }} />
              <div className="w-4 h-4 rounded-full border-2 border-emerald-500"
                style={{ background: '#0a0f0a' }} />
            </div>
          </div>

          {/* Check */}
          <div
            className="anim-check absolute -bottom-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: '#10b981', boxShadow: '0 0 20px rgba(16,185,129,0.5)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="anim-text space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            ¡Pedido confirmado!
          </h2>
          <p className="text-emerald-400 font-semibold">
            ¡Gracias por tu compra{name ? `, ${name.split(' ')[0]}` : ''}!
          </p>
          <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
            Tu pedido está siendo preparado y saldrá en camino muy pronto.
            Recibirás un email de confirmación en breve.
          </p>

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {['Confirmado', 'Preparando', 'En camino'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: i === 0 ? '#10b981' : 'rgba(16,185,129,0.15)',
                      color: i === 0 ? 'white' : '#10b981',
                      border: '1px solid rgba(16,185,129,0.3)',
                    }}
                  >
                    {i === 0 ? '✓' : i + 1}
                  </div>
                  <span className="text-[9px] text-gray-600 font-medium">{step}</span>
                </div>
                {i < 2 && <div className="w-6 h-px bg-emerald-900 mb-4" />}
              </div>
            ))}
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: '#10b981', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}
          >
            Seguir comprando <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center mb-7">
      {[{ n: 1, label: 'Datos' }, { n: 2, label: 'Pago' }].map((s, i, arr) => (
        <div key={s.n} className={`flex items-center ${i < arr.length - 1 ? 'flex-1' : ''}`}>
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-400"
              style={{
                background: step >= s.n ? '#10b981' : 'rgba(255,255,255,0.06)',
                color: step >= s.n ? 'white' : '#4b5563',
                boxShadow: step === s.n ? '0 0 16px rgba(16,185,129,0.5)' : 'none',
              }}
            >
              {step > s.n ? '✓' : s.n}
            </div>
            <span className={`text-xs font-semibold hidden sm:block ${step >= s.n ? 'text-emerald-400' : 'text-gray-600'}`}>
              {s.label}
            </span>
          </div>
          {i < arr.length - 1 && (
            <div className="flex-1 mx-3 h-px transition-all duration-500"
              style={{ background: step > 1 ? '#10b981' : 'rgba(255,255,255,0.08)' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

const inputCls = [
  'w-full rounded-xl px-4 py-3 text-sm text-white',
  'placeholder:text-gray-600 outline-none transition-all',
  'bg-white/[0.05] border border-emerald-500/20',
  'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30',
  'autofill:bg-transparent',
].join(' ');

// ─── Order Summary ────────────────────────────────────────────────────────────

function OrderSummary({ items, totalPrice, shipping, total, FREE_SHIP }: {
  items: any[]; totalPrice: number; shipping: number; total: number; FREE_SHIP: number;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 space-y-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.12)' }}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">Resumen del Pedido</p>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-emerald-400"
            style={{ background: 'rgba(16,185,129,0.12)' }}>
            {items.reduce((s: number, i: any) => s + i.quantity, 0)} item(s)
          </span>
        </div>

        <div className="space-y-3">
          {items.map((item: any) => (
            <div key={item.product.id} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}>
                {item.product.image
                  ? <Image src={item.product.image} alt={item.product.name} width={44} height={44} className="object-cover" />
                  : <span className="text-lg">{item.product.emoji || '📦'}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{item.product.name}</p>
                <p className="text-gray-500 text-xs">× {item.quantity}</p>
              </div>
              <p className="text-emerald-400 font-semibold text-xs shrink-0">
                €{(item.product.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 space-y-2" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-white">€{totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Envío</span>
            {shipping === 0
              ? <span className="text-emerald-400 font-medium flex items-center gap-1"><Truck size={10} /> Gratis</span>
              : <span className="text-white">€{shipping.toFixed(2)}</span>}
          </div>
          {totalPrice < FREE_SHIP && (
            <p className="text-[10px] text-gray-600 flex items-center gap-1">
              <Truck size={9} /> +€{(FREE_SHIP - totalPrice).toFixed(2)} para envío gratis
            </p>
          )}
          <div className="border-t pt-2.5" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
            <div className="flex justify-between">
              <span className="font-bold text-white text-sm">Total</span>
              <span className="text-lg font-bold text-emerald-400">€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-4 grid grid-cols-2 gap-2"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(16,185,129,0.08)' }}>
        {[
          { icon: <Truck size={14} className="text-emerald-500" />, label: 'Envío Gratis', sub: '+€50' },
          { icon: <RotateCcw size={14} className="text-emerald-500" />, label: 'Devolución', sub: '30 días' },
          { icon: <Lock size={14} className="text-emerald-500" />, label: 'SSL 256-bit', sub: 'Seguro' },
          { icon: <Package size={14} className="text-emerald-500" />, label: 'Entrega', sub: '2–3 días' },
        ].map(b => (
          <div key={b.label} className="flex items-center gap-2 p-2 rounded-xl"
            style={{ background: 'rgba(16,185,129,0.04)' }}>
            {b.icon}
            <div>
              <p className="text-white text-[10px] font-semibold">{b.label}</p>
              <p className="text-gray-600 text-[9px]">{b.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function CheckoutFormInner() {
  const { items, totalPrice, clearCart } = useCart();
  const stripe = useStripe();
  const elements = useElements();

  const FREE_SHIP = 50;
  const shipping  = totalPrice >= FREE_SHIP ? 0 : 4.99;
  const total     = totalPrice + shipping;

  const [step, setStep] = useState<1 | 2>(1);

  // Card visual state (live)
  const [cardFlipped, setCardFlipped] = useState(false);
  const [cardBrand,   setCardBrand]   = useState('unknown');
  const [cardNumber,  setCardNumber]  = useState('');
  const [expiry,      setExpiry]      = useState('');
  const [cvv,         setCvv]         = useState('');

  // Personal
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Address
  const [street,  setStreet]  = useState('');
  const [streetN, setStreetN] = useState('');
  const [postal,  setPostal]  = useState('');
  const [city,    setCity]    = useState('');
  const [country, setCountry] = useState('PT');

  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [apiError, setApiError] = useState('');
  const [cardReady, setCardReady] = useState(false);

  // ── Input handlers ──────────────────────────────────────────
  function handleCardNumber(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatNumber(e.target.value);
    setCardNumber(formatted);
    setCardBrand(detectBrand(formatted));
  }

  function handleExpiry(e: React.ChangeEvent<HTMLInputElement>) {
    const prev = expiry;
    const raw = e.target.value.replace(/\D/g, '');
    // Allow backspace over slash
    if (prev.length === 3 && e.target.value.length === 2) {
      setExpiry(raw.slice(0, 1));
    } else {
      setExpiry(formatExpiry(e.target.value));
    }
  }

  // ── Validation ──────────────────────────────────────────────
  function validateStep1() {
    const e: Record<string, string> = {};
    if (!name.trim())   e.name   = 'Nome obrigatório';
    if (!email.trim())  e.email  = 'Email obrigatório';
    if (!street.trim()) e.street = 'Morada obrigatória';
    if (!postal.trim()) e.postal = 'Código postal obrigatório';
    if (!city.trim())   e.city   = 'Cidade obrigatória';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (!cardReady) e.card = 'Complete os dados do cartão.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goToStep2() {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ── Submit ──────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setApiError('');

    try {
      if (!stripe || !elements) throw new Error('Stripe ainda está carregando. Tente novamente.');
      const card = elements.getElement(CardElement);
      if (!card) throw new Error('Campo de cartão indisponível.');

      const pmResult = await stripe.createPaymentMethod({
        type: 'card',
        card,
        billing_details: {
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: {
            line1: street.trim() ? `${street.trim()} ${streetN.trim()}`.trim() : undefined,
            postal_code: postal.trim() || undefined,
            city: city.trim() || undefined,
            country: country || undefined,
          },
        },
      });

      if (pmResult.error || !pmResult.paymentMethod?.id) {
        throw new Error(pmResult.error?.message ?? 'Não foi possível validar os dados do cartão.');
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount:       total,
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          addressLine: `${street.trim()} ${streetN.trim()}`.trim(),
          postalCode: postal.trim(),
          city: city.trim(),
          country,
          productId:    items[0]?.product.id ?? null,
          paymentMethodId: pmResult.paymentMethod.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Error al procesar el pago');
      if (!data.success) throw new Error(data?.error ?? 'Pago no completado');

      clearCart();
      setSuccess(true);
    } catch (err: any) {
      setApiError(err?.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  // ── Empty cart ─────────────────────────────────────────────
  if (items.length === 0 && !success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4"
        style={{ background: '#0a0f0a' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <Package size={36} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">Carrito vacío</h2>
        <p className="text-gray-500 text-sm max-w-xs">Añade productos antes de finalizar la compra.</p>
        <Link href="/#productos"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white"
          style={{ background: '#10b981' }}>
          Ver Productos <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────
  if (success) return <SuccessScreen name={name} />;

  // ── Step 1 ──────────────────────────────────────────────────
  const step1 = (
    <div className="space-y-4">
      {/* Personal */}
      <div className="rounded-2xl p-5 sm:p-6 space-y-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.12)' }}>
        <div className="flex items-center gap-2">
          <User size={13} className="text-emerald-400" />
          <p className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">Información Personal</p>
        </div>

        <Field label="Nombre completo *" error={errors.name}>
          <input className={inputCls} placeholder="María Silva" value={name}
            onChange={e => setName(e.target.value)}
            style={errors.name ? { borderColor: '#f87171' } : {}} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Email *" error={errors.email}>
            <input className={inputCls} type="email" placeholder="maria@ejemplo.es" value={email}
              onChange={e => setEmail(e.target.value)}
              style={errors.email ? { borderColor: '#f87171' } : {}} />
          </Field>
          <Field label="Teléfono">
            <input className={inputCls} type="tel" inputMode="numeric" placeholder="+34 612 345 678" value={phone}
              onChange={e => setPhone(e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Address */}
      <div className="rounded-2xl p-5 sm:p-6 space-y-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.12)' }}>
        <div className="flex items-center gap-2">
          <MapPin size={13} className="text-emerald-400" />
          <p className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">Dirección de Entrega</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="Calle / Dirección *" error={errors.street}>
              <input className={inputCls} placeholder="Calle Mayor" value={street}
                onChange={e => setStreet(e.target.value)}
                style={errors.street ? { borderColor: '#f87171' } : {}} />
            </Field>
          </div>
          <Field label="Número">
            <input className={inputCls} placeholder="13" value={streetN}
              inputMode="numeric"
              onChange={e => setStreetN(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Código Postal *" error={errors.postal}>
            <input className={inputCls} placeholder="28001" value={postal}
              inputMode="numeric"
              onChange={e => setPostal(e.target.value)}
              style={errors.postal ? { borderColor: '#f87171' } : {}} />
          </Field>
          <Field label="Ciudad *" error={errors.city}>
            <input className={inputCls} placeholder="Madrid" value={city}
              onChange={e => setCity(e.target.value)}
              style={errors.city ? { borderColor: '#f87171' } : {}} />
          </Field>
        </div>

        <Field label="País">
          <select className={inputCls} value={country} onChange={e => setCountry(e.target.value)}
            style={{ appearance: 'none' }}>
            <option value="ES">🇪🇸 España</option>
            <option value="PT">🇵🇹 Portugal</option>
            <option value="BR">🇧🇷 Brasil</option>
            <option value="FR">🇫🇷 Francia</option>
            <option value="DE">🇩🇪 Alemania</option>
          </select>
        </Field>
      </div>

      <button type="button" onClick={goToStep2}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-base text-white cursor-pointer transition-all"
        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 8px 32px rgba(16,185,129,0.25)' }}>
        Continuar al Pago <ChevronRight size={18} />
      </button>
    </div>
  );

  // ── Step 2 ──────────────────────────────────────────────────
  const step2 = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Visual */}
      <div className="rounded-2xl p-5 sm:p-6 space-y-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.12)' }}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">Tu Tarjeta</p>
          <button type="button" onClick={() => setCardFlipped(f => !f)}
            className="text-xs text-gray-500 hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1">
            <RotateCcw size={11} /> {cardFlipped ? 'Ver frente' : 'Ver reverso (CVV)'}
          </button>
        </div>
        <CreditCardVisual
          name={name}
          number={cardNumber}
          expiry={expiry}
          cvv={cvv}
          flipped={cardFlipped}
          brand={cardBrand}
        />
      </div>

      {/* Card Inputs */}
      <div className="rounded-2xl p-5 sm:p-6 space-y-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.12)' }}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">Datos de la Tarjeta</p>
          <div className="flex gap-1.5">
            <VisaLogo />
            <MastercardLogo />
          </div>
        </div>

        <Field label="Número de Tarjeta" error={errors.cardNumber}>
          <div className={`${inputCls} py-3`} style={errors.card ? { borderColor: '#f87171' } : {}}>
            <CardElement
              options={{
                style: {
                  base: {
                    color: '#ffffff',
                    fontSize: '14px',
                    '::placeholder': { color: '#6b7280' },
                  },
                  invalid: { color: '#f87171' },
                },
              }}
              onChange={(ev) => {
                setCardReady(ev.complete);
                if (ev.brand) setCardBrand(ev.brand);
                if (ev.error?.message) setApiError(ev.error.message);
                else if (apiError) setApiError('');
              }}
            />
          </div>
        </Field>

        {errors.card && <p className="text-red-400 text-xs">{errors.card}</p>}

        <p className="text-gray-600 text-xs flex items-center gap-1.5">
          <Lock size={11} /> Pago procesado de forma segura · SSL 256-bit
        </p>
      </div>

      {apiError && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-400 flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <ShieldCheck size={15} /> {apiError}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => setStep(1)}
          className="flex items-center gap-1.5 px-5 py-4 rounded-xl font-semibold text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <ChevronLeft size={16} /> Volver
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-base text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 8px 32px rgba(16,185,129,0.25)' }}>
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Procesando...</>
            : <><Lock size={16} /> Pagar €{total.toFixed(2)}</>}
        </button>
      </div>
    </form>
  );

  // ── Layout ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-8 sm:py-12 px-4" style={{ background: '#0a0f0a' }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-sm">V</div>
            VitaFit Store
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-emerald-400"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <ShieldCheck size={13} /> Transacción 100% protegida con SSL
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-10">

          {/* LEFT */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase mb-1">Pago Seguro</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">Finalizar Compra</h1>
            <StepIndicator step={step} />
            {step === 1 ? step1 : step2}
          </div>

          {/* RIGHT */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <OrderSummary items={items} totalPrice={totalPrice} shipping={shipping} total={total} FREE_SHIP={FREE_SHIP} />
          </div>

        </div>
      </div>
    </div>
  );
}

export default function CheckoutForm() {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0f0a' }}>
        <div className="rounded-xl px-4 py-3 text-sm text-red-400"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não configurada.
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutFormInner />
    </Elements>
  );
}
