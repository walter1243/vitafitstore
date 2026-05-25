import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!stripe || !elements) return;

    // Simulação: normalmente você criaria um PaymentIntent no backend
    // Aqui apenas simula sucesso
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
    }, 1500);
  }

  if (success) {
    return <div className="text-green-600 font-bold">Pagamento realizado com sucesso!</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement className="border p-3 rounded" />
      {error && <div className="text-red-600">{error}</div>}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        disabled={!stripe || loading}
      >
        {loading ? 'Processando...' : 'Pagar'}
      </button>
    </form>
  );
}
