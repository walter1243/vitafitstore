'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from 'lucide-react';

// Cores da logo (laranja, azul, vermelho, verde, roxo) — faixa do topo e fundo.
const BRAND_STRIPE = 'linear-gradient(90deg,#F59E0B 0%,#2563EB 25%,#EF4444 50%,#22C55E 75%,#8B5CF6 100%)';

// Campo com icone; o autofill do Chrome nao pinta o fundo de azul.
const fieldBox =
  'group flex h-12 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100';
const fieldInput =
  'h-full w-full bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400 autofill:shadow-[inset_0_0_0_1000px_#fff] autofill:[-webkit-text-fill-color:#0f172a]';

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
        body: JSON.stringify({ username, password, rememberMe }),
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
    <div className="relative min-h-screen overflow-hidden bg-[#F7F7FB] font-[Nunito,Raleway,system-ui,sans-serif]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-amber-300/25 blur-3xl" />
        <div className="absolute -right-24 top-1/4 h-[380px] w-[380px] rounded-full bg-violet-300/25 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[420px] w-[420px] rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#0f172a0d_1px,transparent_1px)] [background-size:22px_22px]" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-10">
        <div className="w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.18)] backdrop-blur">
          <div className="h-1.5 w-full" style={{ background: BRAND_STRIPE }} />

          <div className="px-6 pb-8 pt-7 sm:px-9">
            <div className="flex justify-center">
              <Image
                src="/images/logo-kitoys-3d.png"
                alt="Kitoys 3D"
                width={468}
                height={312}
                priority
                className="h-auto w-40 select-none drop-shadow-sm"
              />
            </div>

            <div className="mt-5 text-center">
              <h1 className="font-kids text-[28px] font-bold text-slate-900">Bem-vindo de volta</h1>
              <p className="mt-1.5 text-sm text-slate-500">Entre para gerenciar a loja Kitoys 3D.</p>
            </div>

            <form onSubmit={onSubmit} className="mt-7 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Usuário</span>
                <div className={fieldBox}>
                  <User size={17} className="shrink-0 text-slate-400 transition group-focus-within:text-violet-500" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={fieldInput}
                    placeholder="Seu usuário"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Senha</span>
                <div className={fieldBox}>
                  <Lock size={17} className="shrink-0 text-slate-400 transition group-focus-within:text-violet-500" />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    className={fieldInput}
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="-mr-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              <label className="flex cursor-pointer select-none items-center gap-2.5 pt-0.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-violet-600"
                />
                Manter conectado neste dispositivo
              </label>

              {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-[15px] font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" /> Entrando…
                  </>
                ) : (
                  <>
                    Entrar no painel
                    <ArrowRight size={17} className="transition group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-6 flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck size={14} className="text-emerald-600" />
          Acesso restrito a usuários autorizados
        </p>
      </main>
    </div>
  );
}
