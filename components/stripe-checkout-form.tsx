'use client';
import { useEffect, useState } from 'react';
import { PickupPoints, ShipOptionsList, loadMethod, loadZip, saveMethod, saveZip, type PickupPoint, type ShipMethod, type ShipQuote } from '@/components/shipping/shipping-options';
import {
  ShieldCheck, Lock, Truck, RotateCcw,
  Package, ChevronRight, ChevronLeft,
  Loader2, User, MapPin,
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { packOf, qtyLabel } from '@/lib/personalize';
import Link from 'next/link';
import Image from 'next/image';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Chave publica vem de STRIPE_KEY_PUBLIC (ou da antiga NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
// — ver `env` em next.config.mjs.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK ?? '');

// ─── Stripe appearance (tema infantil da vitrine) ────────────────────────────

const stripeAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary:     '#c2410c',
    colorBackground:  '#FFFFFF',
    colorText:        '#23263f',
    colorTextSecondary: '#565a78',
    colorDanger:      '#f87171',
    borderRadius:     '16px',
    fontFamily:       'system-ui, -apple-system, sans-serif',
    fontSizeBase:     '15px',
    spacingUnit:      '4px',
  },
  rules: {
    '.Input': {
      backgroundColor: '#FFFFFF',
      border: '2px solid #efe7da',
      color: '#23263f',
      padding: '12px 16px',
    },
    '.Input:focus': {
      border: '2px solid #23263f',
      boxShadow: 'none',
    },
    '.Input--invalid': {
      border: '1px solid #f87171',
    },
    '.Label': {
      color: '#23263f',
      fontSize: '13px',
      fontWeight: '700',
    },
    '.Tab': {
      backgroundColor: '#FFFFFF',
      border: '2px solid #efe7da',
      color: '#565a78',
    },
    '.Tab:hover': {
      color: '#0f172a',
    },
    '.Tab--selected': {
      backgroundColor: '#FFF4E0',
      border: '2px solid #c2410c',
      color: '#c2410c',
    },
    '.TabIcon--selected': { fill: '#c2410c' },
    '.TabLabel--selected': { color: '#c2410c' },
    '.Block': {
      backgroundColor: '#FFFFFF',
      border: '2px solid #efe7da',
    },
  },
};

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

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({ name, storeName }: { name: string; storeName: string }) {
  return (
    <>
      <style>{`
        @keyframes fadeInUp    { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes productFall { 0%{opacity:0;transform:translateY(-60px) scale(0.7)} 60%{opacity:1;transform:translateY(10px) scale(1.05)} 100%{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes slideDelivery{ 0%{opacity:1;transform:translateX(0)} 80%{opacity:1;transform:translateX(0)} 100%{opacity:0;transform:translateX(200px)} }
        @keyframes checkPop    { 0%{opacity:0;transform:scale(0) rotate(-30deg)} 70%{transform:scale(1.15) rotate(5deg)} 100%{opacity:1;transform:scale(1) rotate(0deg)} }
        @keyframes trailDots   { 0%,80%{opacity:0} 85%{opacity:1} 100%{opacity:0} }
        .anim-product { animation: productFall    0.7s cubic-bezier(.34,1.56,.64,1) 0.3s both; }
        .anim-box     { animation: slideDelivery  3s  ease-out                     1.2s both; }
        .anim-check   { animation: checkPop       0.6s cubic-bezier(.34,1.56,.64,1) 1.5s both; }
        .anim-text    { animation: fadeInUp       0.6s ease                        2s   both; }
        .anim-dots    { animation: trailDots      3s  ease-out                     1.2s both; }
      `}</style>
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
        style={{ background: '#FAF8F5' }}>
        <div className="relative flex flex-col items-center mb-8">
          <div className="anim-dots absolute right-[-40px] top-[60px] flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-700"
                style={{ animationDelay:`${1.3+i*0.1}s` }} />
            ))}
          </div>
          <div className="anim-box flex flex-col items-center">
            <div className="anim-product text-3xl mb-0.5">📦</div>
            <div className="relative w-24 h-20 rounded-xl flex items-end justify-center pb-2"
              style={{ background:'linear-gradient(135deg,#9a3412,#047857)' }}>
              <div className="absolute -top-3 left-0 right-0 h-5 rounded-t-xl flex items-center justify-center"
                style={{ background:'#c2410c' }}>
                <div className="w-8 h-0.5 rounded-full bg-orange-700" />
              </div>
              <span className="text-xs font-bold text-white/90 tracking-wider uppercase truncate max-w-[70px]">{storeName}</span>
              <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full opacity-50"
                style={{ background:'#fbbf24' }} />
            </div>
            <div className="flex gap-12 -mt-1">
              <div className="w-4 h-4 rounded-full border-2 border-orange-700" style={{ background:'#FAF8F5' }} />
              <div className="w-4 h-4 rounded-full border-2 border-orange-700" style={{ background:'#FAF8F5' }} />
            </div>
          </div>
          <div className="anim-check absolute -bottom-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background:'#c2410c', boxShadow:'0 0 20px rgba(194,65,12,0.5)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <div className="anim-text space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">¡Pedido confirmado!</h2>
          <p className="text-orange-600 font-semibold">
            ¡Gracias por tu compra{name ? `, ${name.split(' ')[0]}` : ''}!
          </p>
          <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
            Tu pedido está siendo preparado y saldrá en camino muy pronto.
            Recibirás un email de confirmación en breve.
          </p>
          <div className="flex items-center justify-center gap-2 pt-4">
            {['Confirmado','Preparando','En camino'].map((s,i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background:i===0?'#c2410c':'rgba(194,65,12,0.15)', color:i===0?'white':'#c2410c', border:'1px solid rgba(194,65,12,0.3)' }}>
                    {i===0?'✓':i+1}
                  </div>
                  <span className="text-[9px] text-slate-500 font-medium">{s}</span>
                </div>
                {i<2 && <div className="w-6 h-px bg-orange-100 mb-4" />}
              </div>
            ))}
          </div>
          <Link href="/" className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl font-bold text-sm text-white"
            style={{ background:'#c2410c', boxShadow:'0 8px 24px rgba(194,65,12,0.3)' }}>
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
      {[{ n:1, label:'Datos' },{ n:2, label:'Pago' }].map((s,i,arr) => (
        <div key={s.n} className={`flex items-center ${i<arr.length-1?'flex-1':''}`}>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold transition-all duration-400"
              style={{ background:step>=s.n?'#c2410c':'#FFFFFF', color:step>=s.n?'white':'#565a78', boxShadow:'none', border: step>=s.n ? 'none' : '2px solid #efe7da' }}>
              {step>s.n?'✓':s.n}
            </div>
            <span className={`font-kids text-lg font-bold hidden sm:block ${step>=s.n?'text-[#23263f]':'text-[#565a78]'}`}>{s.label}</span>
          </div>
          {i<arr.length-1 && (
            <div className="flex-1 mx-3 h-1 rounded-full transition-all duration-500"
              style={{ background:step>1?'#c2410c':'#efe7da' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label:string; error?:string; children:React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold text-[#23263f]">{label}</label>
      {children}
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  );
}

const inputCls = [
  'w-full min-h-12 rounded-2xl px-4 py-3 text-base text-[#23263f]',
  'placeholder:text-[#9a9db5] outline-none transition-all',
  'bg-white border-2 border-[#efe7da]',
  'focus:border-[#23263f]',
].join(' ');

// ─── Order Summary ────────────────────────────────────────────────────────────

function OrderSummary({ items, totalPrice, shipping, total, shipLabel }: {
  items:any[]; totalPrice:number; shipping:number; total:number; shipLabel?:string;
}) {
  const { lineTotal, totalItems } = useCart();
  return (
    <div className="space-y-4">
      <div className="rounded-[28px] p-5 space-y-4"
        style={{ background:'#FFFFFF', border:'none', boxShadow:'0 6px 24px rgba(35,38,63,0.06)' }}>
        <div className="flex items-center justify-between">
          <p className="font-kids text-xl font-bold text-[#23263f]">Tu pedido</p>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-[#9a3412]"
            style={{ background:'rgba(194,65,12,0.12)' }}>
            {totalItems} item(s)
          </span>
        </div>
        <div className="space-y-3">
          {items.map((item:any) => (
            <div key={item.product.id} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background:'#F8FAFC', border:'1px solid rgba(194,65,12,0.12)' }}>
                {item.product.image
                  ? <Image src={item.product.image} alt={item.product.name} width={44} height={44} className="object-cover" />
                  : <span className="text-lg">{item.product.emoji||'📦'}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#23263f] text-sm font-bold truncate">{item.product.name}</p>
                {(item.selectedColor || item.selectedSize || item.customText) ? (
                  <p className="text-[10px] font-medium text-orange-700">
                    {[item.customText && `Nombre: «${item.customText}»`, item.customNote, item.selectedColor && `Color: ${item.selectedColor}`, item.selectedSize && `Talla: ${item.selectedSize}`].filter(Boolean).join(' - ')}
                  </p>
                ) : item.product.shortDescription && (
                  <p className="text-[10px] text-slate-500 line-clamp-2">{item.product.shortDescription}</p>
                )}
                <p className="text-slate-500 text-xs">× {packOf(item.product.personalize) ? `${qtyLabel(item.product.personalize, item.quantity)} (${item.quantity} uds)` : item.quantity}</p>
              </div>
              <p className="text-[#23263f] font-extrabold text-sm shrink-0">
                €{lineTotal(item).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 space-y-2" style={{ borderColor:'rgba(194,65,12,0.1)' }}>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Subtotal</span>
            <span className="text-slate-900">€{totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Envío{shipLabel ? ` · ${shipLabel}` : ''}</span>
            {shipping===0
              ? <span className="text-orange-600 font-medium flex items-center gap-1"><Truck size={10}/> Gratis</span>
              : <span className="text-slate-900">€{shipping.toFixed(2)}</span>}
          </div>
          <div className="border-t pt-2.5" style={{ borderColor:'rgba(194,65,12,0.1)' }}>
            <div className="flex justify-between">
              <span className="font-bold text-slate-900 text-sm">Total</span>
              <span className="font-kids text-2xl font-bold text-[#23263f]">€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-[28px] p-4 grid grid-cols-2 gap-2"
        style={{ background:'#FFFFFF', border:'none', boxShadow:'0 6px 24px rgba(35,38,63,0.06)' }}>
        {[
          { icon:<Truck size={14} className="text-orange-700"/>, label:'Envío', sub:'Calculado al finalizar' },
          { icon:<RotateCcw size={14} className="text-orange-700"/>, label:'Devolución', sub:'14 días' },
          { icon:<Lock size={14} className="text-orange-700"/>, label:'SSL 256-bit', sub:'Seguro' },
          { icon:<Package size={14} className="text-orange-700"/>, label:'Pago', sub:'Tarjeta y Bizum' },
        ].map(b => (
          <div key={b.label} className="flex items-center gap-2 p-2 rounded-xl"
            style={{ background:'rgba(194,65,12,0.04)' }}>
            {b.icon}
            <div>
              <p className="text-slate-900 text-[10px] font-semibold">{b.label}</p>
              <p className="text-slate-500 text-[9px]">{b.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stripe error → Spanish ───────────────────────────────────────────────────

const STRIPE_ES: Record<string, string> = {
  card_declined:                    'Tu tarjeta fue rechazada.',
  insufficient_funds:               'Fondos insuficientes en la tarjeta.',
  lost_card:                        'Esta tarjeta ha sido reportada como perdida.',
  stolen_card:                      'Esta tarjeta ha sido reportada como robada.',
  expired_card:                     'La tarjeta ha caducado.',
  incorrect_cvc:                    'El código de seguridad (CVV) es incorrecto.',
  incorrect_number:                 'El número de tarjeta es incorrecto.',
  invalid_number:                   'El número de tarjeta no es válido.',
  invalid_expiry_month:             'El mes de vencimiento no es válido.',
  invalid_expiry_year:              'El año de vencimiento no es válido.',
  invalid_cvc:                      'El código de seguridad (CVV) no es válido.',
  authentication_required:          'Tu banco requiere autenticación adicional. Inténtalo de nuevo.',
  do_not_honor:                     'Tu banco rechazó el pago. Contacta con tu banco.',
  generic_decline:                  'Pago rechazado. Contacta con tu banco.',
  call_issuer:                      'Contacta con tu banco para autorizar este pago.',
  restricted_card:                  'Tarjeta restringida para pagos internacionales.',
  blocked:                          'Pago bloqueado por tu banco.',
  withdrawal_count_limit_exceeded:  'Has superado el límite de transacciones de tu tarjeta.',
  try_again_later:                  'Error temporal. Inténtalo de nuevo en unos minutos.',
  processing_error:                 'Error al procesar el pago. Inténtalo de nuevo.',
  payment_intent_authentication_failure: 'Autenticación fallida. Inténtalo de nuevo.',
};

function stripeErrorES(err: { code?: string; decline_code?: string; message?: string }): string {
  return (
    (err.decline_code && STRIPE_ES[err.decline_code]) ||
    (err.code         && STRIPE_ES[err.code])         ||
    err.message                                        ||
    'Error al procesar el pago. Inténtalo de nuevo.'
  );
}

// ─── Payment Step (inside nested Elements with clientSecret) ──────────────────

interface PaymentStepProps {
  total: number;
  name: string; email: string; phone: string;
  street: string; streetN: string; postal: string; city: string; country: string;
  checkoutItems: Array<{ productId: number; quantity: number; color?: string; size?: string }>;
  clearCart: () => void;
  setSuccess: (v: boolean) => void;
  onBack: () => void;
  quoteError: string;
}

function PaymentStepInner({
  total, name, email, phone, street, streetN, postal, city, country,
  checkoutItems, clearCart, setSuccess, onBack, quoteError,
}: PaymentStepProps) {
  const stripe   = useStripe();
  const elements = useElements();

  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setApiError('');

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setApiError(stripeErrorES(submitError));
        return;
      }

      try { sessionStorage.setItem('kitoys_checkout_name', name.trim()); } catch {}
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout?confirmed=1`,
          payment_method_data: {
            // O Payment Element nao coleta esses dados (fields: 'never'), entao
            // a Stripe exige TODOS os campos aqui — vazio ('') e aceito,
            // undefined nao (some do envio e a Stripe recusa o pagamento).
            billing_details: {
              name:  name.trim(),
              email: email.trim(),
              phone: phone.trim(),
              address: {
                line1:       `${street.trim()} ${streetN.trim()}`.trim(),
                line2:       '',
                postal_code: postal.trim(),
                city:        city.trim(),
                state:       '',
                country:     country || 'ES',
              },
            },
          },
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setApiError(stripeErrorES(result.error));
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        fetch('/api/checkout/save-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: result.paymentIntent.id }),
        }).catch(() => {});
        clearCart();
        setSuccess(true);
        return;
      }

      setApiError(`Estado de pago inesperado: ${result.paymentIntent?.status ?? 'desconocido'}`);
    } catch (err: any) {
      console.error('[checkout] confirmPayment error:', err);
      setApiError(stripeErrorES(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Payment Element */}
      <div className="rounded-[28px] p-5 sm:p-6 space-y-4"
        style={{ background:'#FFFFFF', border:'none', boxShadow:'0 6px 24px rgba(35,38,63,0.06)' }}>
        <div className="flex items-center justify-between mb-2">
          <p className="font-kids text-xl font-bold text-[#23263f]">¿Cómo quieres pagar?</p>
          <div className="flex gap-1.5"><VisaLogo /><MastercardLogo /></div>
        </div>

        <PaymentElement
          options={{
            layout: 'tabs',
            // Stripe only ever shows a method here if it's both listed and
            // actually enabled on the account's Dashboard — listing more
            // than "card" is safe even before the rest are turned on there,
            // it just won't show them until they are.
            paymentMethodOrder: ['card', 'paypal', 'bizum', 'apple_pay', 'google_pay'],
            fields: {
              billingDetails: {
                name: 'never',
                email: 'never',
                phone: 'never',
                address: 'never',
              },
            },
          }}
        />

        <p className="text-slate-500 text-xs flex items-center gap-1.5 pt-1">
          <Lock size={11} /> Pago procesado de forma segura · SSL 256-bit
        </p>
      </div>

      {apiError && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2"
          style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
          <ShieldCheck size={15} /> {apiError}
        </div>
      )}
      {quoteError && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2"
          style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
          <ShieldCheck size={15} /> {quoteError}
        </div>
      )}

      <div className="hidden sm:flex gap-3">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 px-5 py-4 rounded-xl font-semibold text-sm text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
          style={{ background:'#F8FAFC', border:'1px solid #E2E8F0' }}>
          <ChevronLeft size={16} /> Volver
        </button>
        <button type="submit" disabled={loading || !stripe || !elements}
          className="flex-1 flex min-h-[56px] items-center justify-center gap-2 rounded-2xl font-extrabold text-base text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors bg-[#c2410c] hover:bg-[#9a3412]">
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Procesando...</>
            : <><Lock size={16} /> Pagar €{total.toFixed(2)}</>}
        </button>
      </div>

      {/* Mobile sticky total + CTA, same pattern as step 1 — type="submit"
         still works here since this whole block renders inside the <form>. */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t bg-white px-4 py-3"
        style={{ borderColor: 'rgba(194,65,12,0.12)', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
        <button type="button" onClick={onBack}
          className="flex shrink-0 items-center justify-center rounded-xl p-3.5 text-slate-400 cursor-pointer"
          style={{ background:'#F8FAFC', border:'1px solid #E2E8F0' }}
          aria-label="Volver">
          <ChevronLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-slate-500">Total</p>
          <p className="font-kids text-xl font-bold text-[#23263f] truncate">€{total.toFixed(2)}</p>
        </div>
        <button type="submit" disabled={loading || !stripe || !elements}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-5 py-3.5 font-bold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
          style={{ background:'#c2410c' }}>
          {loading
            ? <Loader2 size={18} className="animate-spin" />
            : <><Lock size={14} /> Pagar</>}
        </button>
      </div>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const BRANDING_CACHE_KEY = 'store_branding_cache';

function readCachedBranding() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(BRANDING_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function CheckoutFormInner() {
  const { items, totalPrice, clearCart } = useCart();

  // Same branding cache the header writes to — without it this previously
  // hardcoded "V" / "Nuestra Tienda", never reflecting the real store name
  // or logo (including seasonal ones set from the admin panel).
  const cachedBranding = readCachedBranding();
  const [storeName, setStoreName] = useState(cachedBranding?.storeName ?? 'Nuestra Tienda');
  const [logoUrl, setLogoUrl] = useState(cachedBranding?.logoUrl ?? '');
  const [themeColor, setThemeColor] = useState(cachedBranding?.themeColor ?? '#c2410c');

  useEffect(() => {
    fetch('/api/store-settings', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setStoreName(data.storeName ?? 'Nuestra Tienda');
        setLogoUrl(data.logoUrl ?? '');
        setThemeColor(data.themeColor ?? '#c2410c');
      })
      .catch(() => {});
  }, []);

  const [step, setStep] = useState<1 | 2>(1);
  const [clientSecret,   setClientSecret]   = useState<string | null>(null);
  const [intentLoading,  setIntentLoading]  = useState(false);
  const [intentError,    setIntentError]    = useState('');

  // Personal
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Address
  const [street,  setStreet]  = useState('');
  const [streetN, setStreetN] = useState('');
  const [postal,  setPostal]  = useState('');
  const [city,    setCity]    = useState('');
  const [country, setCountry] = useState('ES');

  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError,   setQuoteError]   = useState('');
  const [quote, setQuote] = useState<{ subtotal:number; shipping:number; total:number; method?:ShipMethod; options?:ShipQuote|null }|null>(null);
  // Envio Packlink: ponto de recogida (padrao, mais barato) ou domicilio.
  const [shipMethod, setShipMethod] = useState<ShipMethod>('pickup');
  const [pickupPoint, setPickupPoint] = useState<PickupPoint | null>(null);
  useEffect(() => { setShipMethod(loadMethod()); const z = loadZip(); if (z) setPostal((p) => p || z); }, []);

  const [errors,  setErrors]  = useState<Record<string,string>>({});
  const [success, setSuccess] = useState(false);
  const [returnMsg, setReturnMsg] = useState('');

  // Volta do Bizum, Klarna, banco... (pagamentos que saem do site): a Stripe
  // devolve pra /checkout?payment_intent=...&redirect_status=... e o pedido
  // so era salvo quando o pagamento terminava sem sair da pagina.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const pi = q.get('payment_intent');
    const status = q.get('redirect_status');
    if (!pi || !status) return;
    window.history.replaceState(null, '', '/checkout');
    if (status === 'succeeded' || status === 'processing') {
      try { const saved = sessionStorage.getItem('kitoys_checkout_name'); if (saved) setName(saved); } catch {}
      // Bizum pode levar uns segundos pra confirmar: tenta de novo ate ~30 s.
      (async () => {
        for (let i = 0; i < 10; i++) {
          try {
            const r = await fetch('/api/checkout/save-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentIntentId: pi }),
            });
            if (r.ok || r.status !== 402) return;
          } catch {}
          await new Promise((res) => setTimeout(res, 3000));
        }
      })();
      clearCart();
      setSuccess(true);
    } else {
      setReturnMsg('El pago no se completó. Puedes intentarlo de nuevo con otro método.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkoutItems = items.map(item => ({
    productId: item.product.id,
    quantity: item.quantity,
    color: item.selectedColor,
    size: item.selectedSize,
    text: item.customText,
    note: item.customNote,
  }));

  // Quote (for sidebar display)
  useEffect(() => {
    if (checkoutItems.length === 0) { setQuote(null); setQuoteError(''); return; }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const res = await fetch('/api/checkout/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: checkoutItems, country, postalCode: postal, shippingMethod: shipMethod }),
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (!res.ok) { setQuote(null); setQuoteError(data?.error ?? 'No se pudo calcular el checkout.'); return; }
        setQuoteError('');
        setQuote({ subtotal:Number(data.subtotal??0), shipping:Number(data.shipping??0), total:Number(data.total??0), method:data.shippingMethod, options:data.shippingOptions ?? null });
      } catch (err:any) {
        if (err?.name==='AbortError') return;
        setQuote(null); setQuoteError('No se pudo calcular el checkout.');
      } finally { setQuoteLoading(false); }
    }, 150);
    return () => { ctrl.abort(); clearTimeout(timer); };
  }, [country, postal, items, shipMethod]);

  const shipping = quote?.shipping ?? 0;
  const total    = quote?.total    ?? totalPrice;
  const subtotal = quote?.subtotal ?? totalPrice;
  const zip5 = postal.replace(/\D/g, '');
  const shipOpts = quote?.options ?? null;
  const activeMethod: ShipMethod = quote?.method ?? shipMethod;
  const needsPoint = !!shipOpts && activeMethod === 'pickup' && !!shipOpts.pickup;
  const shipLabel = shipOpts ? (activeMethod === 'pickup' ? 'Recoger en punto' : 'A domicilio') : '';
  function chooseMethod(m: ShipMethod) { setShipMethod(m); saveMethod(m); }
  // O ponto so vale pro CP e servico de agora.
  useEffect(() => { setPickupPoint(null); }, [zip5, shipOpts?.pickup?.serviceId]);

  function validateStep1() {
    const e: Record<string,string> = {};
    if (!name.trim())   e.name   = 'Nombre obligatorio';
    if (!email.trim())  e.email  = 'Email obligatorio';
    if (!street.trim()) e.street = 'Dirección obligatoria';
    if (!postal.trim()) e.postal = 'Código postal obligatorio';
    if (!city.trim())   e.city   = 'Ciudad obligatoria';
    if (needsPoint && !pickupPoint) e.point = 'Elige el punto de recogida';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function goToStep2() {
    if (!validateStep1()) return;
    setIntentLoading(true);
    setIntentError('');
    try {
      const res = await fetch('/api/checkout/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: checkoutItems,
          country,
          postalCode: postal,
          customerName:  name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          addressLine:   `${street.trim()} ${streetN.trim()}`.trim(),
          city:          city.trim(),
          shippingMethod: activeMethod,
          pickupPoint:    needsPoint ? pickupPoint : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'No se pudo iniciar el pago.');
      setClientSecret(data.clientSecret);
      setStep(2);
      window.scrollTo({ top:0, behavior:'smooth' });
    } catch (err:any) {
      setIntentError(err?.message ?? 'No se pudo iniciar el pago.');
    } finally {
      setIntentLoading(false);
    }
  }

  function handleBack() {
    setStep(1);
    setClientSecret(null);
    setIntentError('');
  }

  // Empty cart
  if (items.length === 0 && !success) {
    return (
      <div className="kids min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4"
        style={{ background:'#FFF8EF' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background:'rgba(194,65,12,0.1)', border:'1px solid rgba(194,65,12,0.2)' }}>
          <Package size={36} className="text-orange-700" />
        </div>
        {returnMsg && <p className="max-w-sm rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{returnMsg}</p>}
        <h2 className="text-3xl font-bold text-[#23263f]">¡Tu carrito está vacío!</h2>
        <p className="text-slate-500 text-sm max-w-xs">Añade productos antes de finalizar la compra.</p>
        <Link href="/#colecciones"
          className="inline-flex min-h-12 items-center gap-2 px-7 rounded-2xl font-extrabold text-base text-white bg-[#c2410c] hover:bg-[#9a3412]">
          Ver juguetes
        </Link>
      </div>
    );
  }

  if (success) return <SuccessScreen name={name} storeName={storeName} />;

  // ── Step 1 ──────────────────────────────────────────────────
  const step1 = (
    <div className="space-y-4">
      <div className="rounded-[28px] p-5 sm:p-6 space-y-4"
        style={{ background:'#FFFFFF', border:'none', boxShadow:'0 6px 24px rgba(35,38,63,0.06)' }}>
        <div className="flex items-center gap-2">
          <User size={18} className="text-[#c2410c]" />
          <p className="font-kids text-xl font-bold text-[#23263f]">¿Quién hace el pedido?</p>
        </div>
        <Field label="Nombre completo *" error={errors.name}>
          <input className={inputCls} placeholder="María Silva" value={name}
            onChange={e => setName(e.target.value)} style={errors.name?{borderColor:'#f87171'}:{}} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Email *" error={errors.email}>
            <input className={inputCls} type="email" placeholder="maria@ejemplo.es" value={email}
              onChange={e => setEmail(e.target.value)} style={errors.email?{borderColor:'#f87171'}:{}} />
          </Field>
          <Field label="Teléfono">
            <input className={inputCls} type="tel" inputMode="numeric" placeholder="+34 612 345 678"
              value={phone} onChange={e => setPhone(e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="rounded-[28px] p-5 sm:p-6 space-y-4"
        style={{ background:'#FFFFFF', border:'none', boxShadow:'0 6px 24px rgba(35,38,63,0.06)' }}>
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-[#c2410c]" />
          <p className="font-kids text-xl font-bold text-[#23263f]">¿Dónde lo enviamos?</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="Calle / Dirección *" error={errors.street}>
              <input className={inputCls} placeholder="Calle Mayor" value={street}
                onChange={e => setStreet(e.target.value)} style={errors.street?{borderColor:'#f87171'}:{}} />
            </Field>
          </div>
          <Field label="Número">
            <input className={inputCls} placeholder="13" value={streetN}
              inputMode="numeric" onChange={e => setStreetN(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Código Postal *" error={errors.postal}>
            <input className={inputCls} placeholder="28001" value={postal}
              inputMode="numeric" onChange={e => { setPostal(e.target.value); const z = e.target.value.replace(/\D/g, ''); if (z.length === 5) saveZip(z); }}
              style={errors.postal?{borderColor:'#f87171'}:{}} />
          </Field>
          <Field label="Ciudad *" error={errors.city}>
            <input className={inputCls} placeholder="Madrid" value={city}
              onChange={e => setCity(e.target.value)} style={errors.city?{borderColor:'#f87171'}:{}} />
          </Field>
        </div>
        <Field label="País">
          <select className={inputCls} value={country} onChange={e => setCountry(e.target.value)}
            style={{ appearance:'none' }}>
            <option value="ES">🇪🇸 España</option>
            <option value="PT">🇵🇹 Portugal</option>
            <option value="BR">🇧🇷 Brasil</option>
            <option value="FR">🇫🇷 Francia</option>
            <option value="DE">🇩🇪 Alemania</option>
          </select>
        </Field>
      </div>

      {country === 'ES' && (
        <div className="rounded-[28px] p-5 sm:p-6 space-y-3"
          style={{ background:'#FFFFFF', border:'none', boxShadow:'0 6px 24px rgba(35,38,63,0.06)' }}>
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-[#c2410c]" />
            <p className="font-kids text-xl font-bold text-[#23263f]">¿Cómo lo recibes?</p>
          </div>
          {zip5.length !== 5 ? (
            <p className="text-sm text-slate-500">Escribe tu código postal para ver las opciones de envío.</p>
          ) : (
            <>
              <ShipOptionsList quote={shipOpts} method={activeMethod} onMethod={chooseMethod} loading={quoteLoading} />
              {needsPoint && shipOpts?.pickup && (
                <div>
                  <p className="mt-2 text-sm font-bold text-[#23263f]">Elige tu punto de recogida</p>
                  <PickupPoints serviceId={shipOpts.pickup.serviceId} zip={zip5} value={pickupPoint} onChange={setPickupPoint} />
                  {errors.point && <p className="mt-1 text-xs font-semibold text-red-600">{errors.point}</p>}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {intentError && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2"
          style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
          <ShieldCheck size={15} /> {intentError}
        </div>
      )}

      <button type="button" onClick={goToStep2} disabled={intentLoading}
        className="hidden sm:flex w-full min-h-[56px] items-center justify-center gap-2 rounded-2xl font-extrabold text-base text-white disabled:opacity-60 cursor-pointer transition-colors bg-[#c2410c] hover:bg-[#9a3412]">
        {intentLoading
          ? <><Loader2 size={18} className="animate-spin" /> Preparando pago...</>
          : <>Continuar al Pago <ChevronRight size={18} /></>}
      </button>

      {/* Mobile sticky total + CTA — on a tall form, the price and the next
         step used to be scrolled far out of view; this keeps both visible
         the whole time, same pattern as most mobile checkout flows. */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t bg-white px-4 py-3"
        style={{ borderColor: 'rgba(194,65,12,0.12)', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
        <div className="min-w-0">
          <p className="text-[10px] text-slate-500">Total</p>
          <p className="font-kids text-2xl font-bold text-[#23263f]">€{total.toFixed(2)}</p>
        </div>
        <button type="button" onClick={goToStep2} disabled={intentLoading}
          className="flex flex-1 min-h-12 items-center justify-center gap-2 rounded-2xl font-extrabold text-sm text-white disabled:opacity-60 cursor-pointer transition-colors bg-[#c2410c] hover:bg-[#9a3412]">
          {intentLoading
            ? <Loader2 size={18} className="animate-spin" />
            : <>Continuar al Pago <ChevronRight size={16} /></>}
        </button>
      </div>
    </div>
  );

  // ── Step 2 — nested Elements with clientSecret ───────────────────────────
  const step2 = clientSecret ? (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: stripeAppearance, locale: 'es' }}
    >
      <PaymentStepInner
        total={total}
        name={name} email={email} phone={phone}
        street={street} streetN={streetN} postal={postal} city={city} country={country}
        checkoutItems={checkoutItems}
        clearCart={clearCart}
        setSuccess={setSuccess}
        onBack={handleBack}
        quoteError={quoteError}
      />
    </Elements>
  ) : (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={24} className="animate-spin text-orange-700" />
    </div>
  );

  // ── Layout ──────────────────────────────────────────────────
  return (
    <div className="kids min-h-screen py-6 pb-28 sm:pb-12 sm:py-10 px-4" style={{ background:'#FFF8EF' }}>

      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Link href="/" className="flex items-center" aria-label={storeName}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-kitoys-3d.png" alt="Kitoys 3D" className="h-16 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-[#15803d] bg-[#EAF6EF]">
            <ShieldCheck size={16} /> Pago 100% seguro
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-10">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#23263f] mb-6">¡Ya casi es tuyo!</h1>
            <StepIndicator step={step} />
            {step===1 ? step1 : step2}
          </div>
          <div className="lg:sticky lg:top-8 lg:self-start">
            <OrderSummary items={items} totalPrice={subtotal} shipping={shipping} total={total} shipLabel={shipLabel} />
            {quoteLoading && <p className="mt-2 text-center text-xs text-slate-500">Actualizando total...</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutForm() {
  if (!process.env.NEXT_PUBLIC_STRIPE_PK) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background:'#FAF8F5' }}>
        <div className="rounded-xl px-4 py-3 text-sm text-red-600"
          style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
          Clave pública de Stripe no configurada (STRIPE_KEY_PUBLIC).
        </div>
      </div>
    );
  }
  return (
    <Elements stripe={stripePromise} options={{ locale: 'es' }}>
      <CheckoutFormInner />
    </Elements>
  );
}
