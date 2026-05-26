'use client';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { useCart } from '@/lib/cart-context';

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { items, totalPrice, clearCart } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    const card = elements.getElement(CardElement);
    if (!card) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Criar PaymentIntent no servidor
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice > 0 ? totalPrice : 1.00,
          customerName: customerName.trim() || 'Anônimo',
          productId: items[0]?.product.id ?? null,
        }),
      });

      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg ?? 'Erro ao iniciar pagamento');
      }

      const { clientSecret } = await res.json();

      // 2. Confirmar pagamento com Stripe
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (stripeError) {
        throw new Error(stripeError.message ?? 'Pagamento recusado');
      }

      clearCart();
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-10 space-y-3">
        <div className="text-6xl">✅</div>
        <h2 className="text-xl font-bold text-green-700">Pagamento realizado!</h2>
        <p className="text-slate-500 text-sm">Obrigado pela compra. Receberá a confirmação por email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Resumo do pedido */}
      {items.length > 0 && (
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Resumo</p>
          {items.map(item => (
            <div key={item.product.id} className="flex justify-between text-sm text-slate-700">
              <span>{item.product.name} × {item.quantity}</span>
              <span className="font-medium">€{(item.product.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-800">
            <span>Total</span>
            <span>€{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Nome */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">Nome completo</label>
        <input
          type="text"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          placeholder="Ex: Maria Silva"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
        />
      </div>

      {/* Cartão */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">Dados do cartão</label>
        <div className="border border-slate-200 rounded-lg px-4 py-3 bg-white focus-within:ring-2 focus-within:ring-green-500/30 focus-within:border-green-500 transition-all">
          <CardElement
            options={{
              style: {
                base: { fontSize: '15px', color: '#1e293b', '::placeholder': { color: '#94a3b8' } },
                invalid: { color: '#ef4444' },
              },
            }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1.5">Pagamento seguro via Stripe • SSL</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading || items.length === 0}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {loading
          ? 'Processando...'
          : `Pagar €${(totalPrice > 0 ? totalPrice : 1.00).toFixed(2)}`}
      </button>

      {items.length === 0 && (
        <p className="text-center text-slate-400 text-xs">O carrinho está vazio.</p>
      )}
    </form>
  );
}
