'use client';
import CheckoutForm from '../../components/stripe-checkout-form';

export default function CheckoutPage() {
  return (
    <div style={{ background: '#FFF8EF', minHeight: '100vh' }}>
      <CheckoutForm />
    </div>
  );
}
