'use client';
import { useState } from 'react';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  ShieldCheck, Lock, Truck, RotateCcw,
  Package, ChevronRight, ChevronLeft, Loader2,
  CheckCircle2, User, MapPin,
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import Link from 'next/link';
import Image from 'next/image';

// ─── Brand logos ──────────────────────────────────────────────────────────────

function VisaLogo({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const w = size === 'lg' ? 48 : 36;
  const h = size === 'lg' ? 30 : 22;
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

function MastercardLogo({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const w = size === 'lg' ? 48 : 36;
  const h = size === 'lg' ? 30 : 22;
  return (
    <svg width={w} height={h} viewBox="0 0 34 22" fill="none">
      <rect width="34" height="22" rx="3" fill="#252525"/>
      <circle cx="13" cy="11" r="6" fill="#EB001B"/>
      <circle cx="21" cy="11" r="6" fill="#F79E1B"/>
      <path d="M17 7.5A6 6 0 0 1 21 11 6 6 0 0 1 17 14.5 6 6 0 0 1 13 11 6 6 0 0 1 17 7.5Z" fill="#FF5F00"/>
    </svg>
  );
}

function GenericCardLogo() {
  return (
    <div className="opacity-30">
      <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
        <rect x="1" y="1" width="34" height="20" rx="3" stroke="white" strokeWidth="1.5"/>
        <rect x="1" y="7" width="34" height="4" fill="white" opacity="0.4"/>
      </svg>
    </div>
  );
}

function BrandDisplay({ brand }: { brand: string }) {
  if (brand === 'visa') return <VisaLogo size="lg" />;
  if (brand === 'mastercard') return <MastercardLogo size="lg" />;
  if (brand === 'amex') return (
    <div className="px-2 py-1 rounded text-xs font-black text-white" style={{ background: '#007BC1' }}>AMEX</div>
  );
  return <GenericCardLogo />;
}

// ─── Visual Credit Card ───────────────────────────────────────────────────────

function CreditCardVisual({
  name, flipped, brand,
}: {
  name: string; flipped: boolean; brand: string;
}) {
  const displayName = name.trim().toUpperCase() || 'SEU NOME AQUI';

  return (
    <div
      className="mx-auto select-none w-full"
      style={{ maxWidth: 320, height: 190, perspective: '1200px' }}
    >
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
          className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between shadow-2xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #059669 0%, #047857 40%, #0f2027 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-20"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 60%)' }} />

          <div className="relative flex justify-between items-start z-10">
            <div className="w-10 h-7 rounded-md overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)' }}>
              <div className="w-full h-full flex">
                <div className="flex-1 border-r border-yellow-700/40" />
                <div className="flex-1" />
              </div>
            </div>
            <BrandDisplay brand={brand} />
          </div>

          <div className="relative z-10 text-white font-mono text-base tracking-[0.2em] text-center drop-shadow">
            •••• •••• •••• ••••
          </div>

          <div className="relative z-10 flex justify-between items-end">
            <div>
              <p className="text-white/50 text-[9px] uppercase tracking-widest mb-0.5">Titular do cartão</p>
              <p className="text-white font-semibold text-sm tracking-wide truncate max-w-[190px]">{displayName}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[9px] uppercase tracking-widest mb-0.5">Validade</p>
              <p className="text-white font-semibold text-sm">MM/AA</p>
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
          <div className="w-full h-10 mt-7" style={{ background: '#0a0a0a' }} />
          <div className="px-5 mt-4">
            <p className="text-white/40 text-[9px] uppercase tracking-widest mb-1.5">CVV / CVC</p>
            <div className="rounded-lg h-9 flex items-center px-4"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-white/60 tracking-[0.35em] text-sm">• • •</span>
            </div>
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-between px-5 items-center">
            <p className="text-white/20 text-[10px]">VitaFit Store</p>
            <div className="flex gap-1">
              <div className="w-6 h-6 rounded-full bg-red-500/70" />
              <div className="w-6 h-6 rounded-full bg-amber-400/70 -ml-2.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center mb-7">
      {[
        { n: 1, label: 'Dados Pessoais' },
        { n: 2, label: 'Pagamento' },
      ].map((s, i, arr) => (
        <div key={s.n} className={`flex items-center ${i < arr.length - 1 ? 'flex-1' : ''}`}>
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={{
                background: step >= s.n ? '#10b981' : 'rgba(255,255,255,0.06)',
                color: step >= s.n ? 'white' : '#4b5563',
                boxShadow: step === s.n ? '0 0 14px rgba(16,185,129,0.5)' : 'none',
              }}
            >
              {step > s.n ? '✓' : s.n}
            </div>
            <span className={`text-xs font-semibold hidden sm:block transition-colors ${step >= s.n ? 'text-emerald-400' : 'text-gray-600'}`}>
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
].join(' ');

const stripeStyle = {
  style: {
    base: {
      fontSize: '15px',
      color: '#ffffff',
      backgroundColor: 'transparent',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      '::placeholder': { color: '#4b5563' },
      iconColor: '#10b981',
    },
    invalid: { color: '#f87171', iconColor: '#f87171' },
  },
};

const stripeWrap: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(16,185,129,0.2)',
  borderRadius: '12px',
  padding: '14px 16px',
};

// ─── Order summary sidebar ────────────────────────────────────────────────────

function OrderSummary({
  items, totalPrice, shipping, total, FREE_SHIP,
}: {
  items: any[]; totalPrice: number; shipping: number; total: number; FREE_SHIP: number;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 space-y-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.12)' }}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">Resumo do Pedido</p>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-emerald-400"
            style={{ background: 'rgba(16,185,129,0.12)' }}>
            {items.reduce((s: number, i: any) => s + i.quantity, 0)} item(s)
          </span>
        </div>

        <div className="space-y-3">
          {items.map((item: any) => (
            <div key={item.product.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}>
                {item.product.image ? (
                  <Image src={item.product.image} alt={item.product.name} width={48} height={48} className="object-cover rounded-xl" />
                ) : (
                  <span className="text-lg">{item.product.emoji || '📦'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{item.product.name}</p>
                <p className="text-gray-500 text-xs">× {item.quantity}</p>
              </div>
              <p className="text-emerald-400 font-semibold text-sm shrink-0">
                €{(item.product.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 space-y-2" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-white">€{totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Envio</span>
            {shipping === 0
              ? <span className="text-emerald-400 font-medium flex items-center gap-1"><Truck size={11} /> Grátis</span>
              : <span className="text-white">€{shipping.toFixed(2)}</span>}
          </div>
          {totalPrice < FREE_SHIP && (
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <Truck size={10} /> +€{(FREE_SHIP - totalPrice).toFixed(2)} para envio grátis
            </p>
          )}
          <div className="border-t pt-3" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
            <div className="flex justify-between">
              <span className="font-bold text-white">Total</span>
              <span className="text-xl font-bold text-emerald-400">€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5 space-y-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.12)' }}>
        <p className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">Compra Segura</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { icon: <Truck size={15} className="text-emerald-500" />, label: 'Envio Grátis', sub: '+€50' },
            { icon: <RotateCcw size={15} className="text-emerald-500" />, label: 'Devolução', sub: '30 dias' },
            { icon: <Lock size={15} className="text-emerald-500" />, label: 'SSL 256-bit', sub: 'Encriptado' },
            { icon: <Package size={15} className="text-emerald-500" />, label: 'Entrega', sub: '2–3 dias' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-2 p-2.5 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.09)' }}>
              {b.icon}
              <div>
                <p className="text-white text-xs font-semibold">{b.label}</p>
                <p className="text-gray-600 text-[10px]">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CheckoutForm() {
  const stripe   = useStripe();
  const elements = useElements();
  const { items, totalPrice, clearCart } = useCart();

  const FREE_SHIP = 50;
  const shipping  = totalPrice >= FREE_SHIP ? 0 : 4.99;
  const total     = totalPrice + shipping;

  const [step, setStep] = useState<1 | 2>(1);

  // Card visual
  const [cardFlipped, setCardFlipped] = useState(false);
  const [cardName,    setCardName]    = useState('');
  const [cardBrand,   setCardBrand]   = useState('unknown');

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

  function goToStep2() {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    setLoading(true);
    setApiError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount:       total,
          customerName: name.trim(),
          productId:    items[0]?.product.id ?? null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Erro ao iniciar pagamento');

      const { error: stripeError } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: { name: name.trim(), email: email.trim() },
        },
      });

      if (stripeError) throw new Error(stripeError.message ?? 'Pagamento recusado');

      clearCart();
      setSuccess(true);
    } catch (err: any) {
      setApiError(err?.message ?? 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  // ── Empty cart ────────────────────────────────────────────────
  if (items.length === 0 && !success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4"
        style={{ background: '#0a0f0a' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <Package size={36} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">Carrinho vazio</h2>
        <p className="text-gray-500 text-sm max-w-xs">Adiciona produtos ao carrinho antes de finalizar a compra.</p>
        <Link href="/#productos"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white"
          style={{ background: '#10b981' }}>
          Ver Produtos <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4"
        style={{ background: '#0a0f0a' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold text-white">Pagamento confirmado!</h2>
        <p className="text-gray-400 text-sm max-w-sm">
          Obrigado pela sua compra. Receberá a confirmação por email em breve.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white"
          style={{ background: '#10b981' }}>
          Voltar à loja <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  // ── Step 1: Dados pessoais + endereço ────────────────────────
  const step1 = (
    <div className="space-y-4">
      {/* Personal info */}
      <div className="rounded-2xl p-5 sm:p-6 space-y-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.12)' }}>
        <div className="flex items-center gap-2">
          <User size={13} className="text-emerald-400" />
          <p className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">Informações Pessoais</p>
        </div>

        <Field label="Nome completo *" error={errors.name}>
          <input
            className={inputCls}
            placeholder="Maria Silva"
            value={name}
            onChange={e => { setName(e.target.value); setCardName(e.target.value); }}
            style={errors.name ? { borderColor: '#f87171' } : {}}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email *" error={errors.email}>
            <input
              className={inputCls}
              type="email"
              placeholder="maria@exemplo.pt"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={errors.email ? { borderColor: '#f87171' } : {}}
            />
          </Field>
          <Field label="Telefone">
            <input
              className={inputCls}
              type="tel"
              inputMode="numeric"
              placeholder="+351 912 345 678"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Address */}
      <div className="rounded-2xl p-5 sm:p-6 space-y-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.12)' }}>
        <div className="flex items-center gap-2">
          <MapPin size={13} className="text-emerald-400" />
          <p className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">Endereço de Entrega</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="Morada / Rua *" error={errors.street}>
              <input
                className={inputCls}
                placeholder="Rua das Flores"
                value={street}
                onChange={e => setStreet(e.target.value)}
                style={errors.street ? { borderColor: '#f87171' } : {}}
              />
            </Field>
          </div>
          <Field label="Número">
            <input
              className={inputCls}
              placeholder="13"
              value={streetN}
              inputMode="numeric"
              onChange={e => setStreetN(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Código Postal *" error={errors.postal}>
            <input
              className={inputCls}
              placeholder="1000-001"
              value={postal}
              inputMode="numeric"
              onChange={e => setPostal(e.target.value)}
              style={errors.postal ? { borderColor: '#f87171' } : {}}
            />
          </Field>
          <Field label="Cidade *" error={errors.city}>
            <input
              className={inputCls}
              placeholder="Lisboa"
              value={city}
              onChange={e => setCity(e.target.value)}
              style={errors.city ? { borderColor: '#f87171' } : {}}
            />
          </Field>
        </div>

        <Field label="País">
          <select
            className={inputCls}
            value={country}
            onChange={e => setCountry(e.target.value)}
            style={{ appearance: 'none' }}
          >
            <option value="PT">🇵🇹 Portugal</option>
            <option value="ES">🇪🇸 Espanha</option>
            <option value="BR">🇧🇷 Brasil</option>
            <option value="FR">🇫🇷 França</option>
            <option value="DE">🇩🇪 Alemanha</option>
          </select>
        </Field>
      </div>

      <button
        type="button"
        onClick={goToStep2}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-base text-white transition-all duration-200 cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          boxShadow: '0 8px 32px rgba(16,185,129,0.25)',
        }}
      >
        Continuar para Pagamento <ChevronRight size={18} />
      </button>
    </div>
  );

  // ── Step 2: Cartão + pagamento ────────────────────────────────
  const step2 = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card visual */}
      <div className="rounded-2xl p-5 sm:p-6 space-y-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.12)' }}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">Pré-visualização</p>
          <button
            type="button"
            onClick={() => setCardFlipped(f => !f)}
            className="text-xs text-gray-500 hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
          >
            <RotateCcw size={11} />
            {cardFlipped ? 'Ver frente' : 'Ver verso (CVV)'}
          </button>
        </div>
        <CreditCardVisual name={cardName} flipped={cardFlipped} brand={cardBrand} />
      </div>

      {/* Stripe fields */}
      <div className="rounded-2xl p-5 sm:p-6 space-y-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.12)' }}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">Dados do Cartão</p>
          <div className="flex gap-1.5 items-center">
            <VisaLogo />
            <MastercardLogo />
          </div>
        </div>

        <Field label="Número do Cartão">
          <div style={stripeWrap}>
            <CardNumberElement
              options={stripeStyle}
              onChange={e => {
                if (e.brand) setCardBrand(e.brand);
                setCardFlipped(false);
              }}
              onFocus={() => setCardFlipped(false)}
            />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Validade">
            <div style={stripeWrap}>
              <CardExpiryElement
                options={stripeStyle}
                onFocus={() => setCardFlipped(false)}
              />
            </div>
          </Field>
          <Field label="CVV">
            <div style={stripeWrap}>
              <CardCvcElement
                options={stripeStyle}
                onFocus={() => setCardFlipped(true)}
                onBlur={() => setCardFlipped(false)}
              />
            </div>
          </Field>
        </div>

        <p className="text-gray-600 text-xs flex items-center gap-1.5">
          <Lock size={11} /> Pagamento processado de forma segura via Stripe · SSL 256-bit
        </p>
      </div>

      {apiError && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-400 flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <ShieldCheck size={15} /> {apiError}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex items-center gap-1.5 px-5 py-4 rounded-xl font-semibold text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <ChevronLeft size={16} /> Voltar
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-base text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: '0 8px 32px rgba(16,185,129,0.25)',
          }}
        >
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Processando...</>
            : <><Lock size={16} /> Pagar €{total.toFixed(2)}</>}
        </button>
      </div>
    </form>
  );

  // ── Layout principal ──────────────────────────────────────────
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
            <ShieldCheck size={13} /> Transação 100% protegida com SSL
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-10">

          {/* LEFT */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase mb-1">Pagamento Seguro</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">Finalizar Compra</h1>
            <StepIndicator step={step} />
            {step === 1 ? step1 : step2}
          </div>

          {/* RIGHT */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <OrderSummary
              items={items}
              totalPrice={totalPrice}
              shipping={shipping}
              total={total}
              FREE_SHIP={FREE_SHIP}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
