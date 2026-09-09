'use client';
import CheckoutForm from '../../components/stripe-checkout-form';

export default function CheckoutPage() {
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <CheckoutForm />
    </div>
  );
}
