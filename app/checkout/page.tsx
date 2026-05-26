'use client';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../../components/stripe-checkout-form';

const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pubKey ? loadStripe(pubKey) : null;

export default function CheckoutPage() {
  if (!pubKey) {
    return (
      <div className="max-w-lg mx-auto p-8 text-center">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-6">
          <p className="font-semibold mb-1">Checkout indisponível</p>
          <p className="text-sm">
            A chave pública do Stripe não está configurada.<br />
            Adicione <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> nas variáveis de ambiente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 sm:p-8">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Finalizar Compra</h1>
      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    </div>
  );
}
