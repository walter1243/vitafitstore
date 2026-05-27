'use client';

import { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

type ValidateSuccess = {
  valid: true;
  order: {
    orderId: number;
    customerName: string;
    customerEmail: string;
    createdAt: string;
    totalAmount: number;
    productName: string;
  };
};

type ValidateError = {
  valid: false;
  reason?: string;
  error?: string;
};

function reasonToMessage(reason?: string) {
  switch (reason) {
    case 'token_not_found':
      return 'Token nao encontrado. Verifique o codigo recebido.';
    case 'token_inactive':
      return 'Esse token esta inativo. Solicite um novo acesso.';
    case 'token_expired':
      return 'Esse token expirou. Solicite um novo acesso.';
    default:
      return 'Nao foi possivel validar o token.';
  }
}

function AcessoPageContent() {
  const searchParams = useSearchParams();
  const initialToken = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);

  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ValidateSuccess['order'] | null>(null);

  useEffect(() => {
    if (!initialToken) return;
    setToken(initialToken);
  }, [initialToken]);

  async function validateToken(tokenValue?: string) {
    const normalized = String(tokenValue ?? token).trim();
    if (!normalized) {
      setError('Informe o token para continuar.');
      setData(null);
      return;
    }

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch('/api/access/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: normalized }),
      });

      const payload = (await res.json().catch(() => ({}))) as ValidateSuccess | ValidateError;

      if (!res.ok || !('valid' in payload) || payload.valid !== true) {
        const message = 'reason' in payload ? reasonToMessage(payload.reason) : payload.error ?? 'Erro ao validar token.';
        setError(message);
        return;
      }

      setData(payload.order);
    } catch {
      setError('Falha de conexao ao validar token. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!initialToken) return;
    void validateToken(initialToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  return (
    <main className="min-h-screen bg-[#0f1117] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-[#1a1d27] p-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-300">
            <ShieldCheck size={14} />
            Area de acesso segura
          </div>
          <h1 className="text-xl font-semibold sm:text-2xl">Validar token do pedido</h1>
          <p className="mt-2 text-sm text-white/65">
            Cole o token recebido no WhatsApp para acessar os dados vinculados ao seu pedido.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-[#1a1d27] p-6">
          <label className="mb-2 block text-sm text-white/70">Token de acesso</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={token}
              onChange={e => setToken(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !loading) {
                  void validateToken();
                }
              }}
              placeholder="Cole aqui o token"
              className="w-full rounded-xl border border-white/10 bg-[#22263a] px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => void validateToken()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? 'Validando...' : 'Validar token'}
            </button>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {data && (
            <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
              <div className="mb-3 flex items-center gap-2 text-green-200">
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium">Token valido</span>
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-white/55">Pedido</dt>
                  <dd className="font-medium text-white">#{data.orderId}</dd>
                </div>
                <div>
                  <dt className="text-white/55">Cliente</dt>
                  <dd className="font-medium text-white">{data.customerName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-white/55">Produto</dt>
                  <dd className="font-medium text-white">{data.productName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-white/55">Valor</dt>
                  <dd className="font-medium text-white">EUR {Number(data.totalAmount || 0).toFixed(2)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-white/55">Email</dt>
                  <dd className="font-medium text-white">{data.customerEmail || '-'}</dd>
                </div>
              </dl>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function AcessoPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0f1117] px-4 py-10 text-white sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-center rounded-2xl border border-white/10 bg-[#1a1d27] p-8">
          <Loader2 size={18} className="animate-spin" />
          <span className="ml-2 text-sm text-white/70">Carregando acesso...</span>
        </div>
      </main>
    }>
      <AcessoPageContent />
    </Suspense>
  );
}
