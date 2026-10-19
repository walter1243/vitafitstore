import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Diagnostico das chaves do Stripe — NUNCA devolve as chaves, so de qual
// conta elas sao (o id da conta aparece dentro de toda chave do Stripe) e
// quais metodos de pagamento estao ativos. Serve pra conferir que a chave
// secreta e a publica sao da MESMA conta: se nao forem, o checkout falha.
export async function GET() {
  const secret = process.env.STRIPE_SECRET_KEY || '';
  const publishable = process.env.STRIPE_KEY_PUBLIC || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  const out: Record<string, unknown> = {
    secretKeyType: secret.slice(0, 8) || null,
    publishableKeyType: publishable.slice(0, 8) || null,
  };
  try {
    const account = await new Stripe(secret).accounts.retrieve();
    const fragment = account.id.replace(/^acct_1/, '');
    out.account = { id: account.id, country: account.country, name: account.settings?.dashboard?.display_name ?? null };
    out.publishableMatchesSecret = Boolean(publishable) && publishable.includes(fragment);
    out.paymentMethods = Object.entries(account.capabilities ?? {})
      .filter(([, v]) => v === 'active')
      .map(([k]) => k.replace(/_payments$/, ''));
    out.bizum = account.capabilities && 'bizum_payments' in account.capabilities
      ? (account.capabilities as Record<string, string>).bizum_payments
      : 'no habilitado en la cuenta';
  } catch (err: any) {
    out.error = err?.message ?? 'No se pudo consultar Stripe.';
  }
  // Cache de 10 min na CDN: o rodape usa isto pra mostrar so os logos dos
  // metodos de pagamento ativos, sem chamar o Stripe a cada visita.
  return NextResponse.json(out, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } });
}
