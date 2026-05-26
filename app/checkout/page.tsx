'use client';
import CheckoutForm from '../../components/stripe-checkout-form';

export default function CheckoutPage() {
  return (
    <div style={{ background: '#0a0f0a', minHeight: '100vh' }}>
      <CheckoutForm />
    </div>
  );
}
