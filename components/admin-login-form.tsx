'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Lock, User } from 'lucide-react';

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? 'Falha no login.');
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch {
      setError('Erro de conexão ao efetuar login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060a14]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-[-120px] h-[360px] w-[360px] rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-[-120px] top-1/3 h-[420px] w-[420px] rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-[-180px] left-1/3 h-[460px] w-[460px] rounded-full bg-green-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl gap-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_40px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:grid-cols-[1.2fr_0.8fr]">
          <div className="hidden border-r border-white/10 bg-gradient-to-br from-emerald-600/25 via-emerald-500/10 to-transparent p-10 text-white lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
              <Leaf size={14} /> VitaFit Security
            </div>
            <h1 className="mt-6 text-4xl font-black leading-tight">Painel Admin Seguro</h1>
            <p className="mt-4 max-w-md text-sm text-white/80">
              Acesso protegido por sessão segura, usuários individualizados e controle de permissões.
            </p>
            <div className="mt-8 rounded-2xl border border-white/15 bg-black/25 p-4 text-sm text-white/80">
              Use suas credenciais para entrar. Você poderá criar novos usuários, trocar foto e sair da sessão atual.
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <h2 className="text-2xl font-bold text-white">Entrar no Admin</h2>
            <p className="mt-1 text-sm text-white/60">Acesse com usuário e senha autorizados.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Usuário</span>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#12182a] px-3">
                  <User size={15} className="text-white/45" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                    placeholder="Digite seu usuário"
                    autoComplete="username"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Senha</span>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#12182a] px-3">
                  <Lock size={15} className="text-white/45" />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                  />
                </div>
              </label>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Entrando...' : 'Entrar no painel'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
