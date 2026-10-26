'use client';
import { useEffect, useState } from 'react';
import { BarChart3, Eye, MousePointerClick, RotateCcw, ShoppingCart, Users } from 'lucide-react';

type Stats = {
  days: number;
  totals: { views: number; visitors: number; productViews: number; productClicks: number; addToCart: number };
  today: { views: number; visitors: number };
  orders: { count: number; revenue: number };
  daily: { day: string; views: number; visitors: number }[];
  products: { id: number; name: string; views: number; clicks: number; carts: number }[];
  pages: { path: string; views: number }[];
};

// 1 = hoje (desde a meia-noite de Madri).
const RANGES = [1, 7, 30, 90] as const;

// Dashboard → estatisticas da loja (app/api/analytics). Visitantes = pessoas
// diferentes por dia (sem cookies), somadas no periodo.
export function AnalyticsPanel() {
  const [days, setDays] = useState<number>(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [resetting, setResetting] = useState(false);

  async function resetStats() {
    if (!confirm('Zerar todas as estatísticas (visitantes, visualizações, cliques e carrinho)? Os pedidos não são apagados. Isso não pode ser desfeito.')) return;
    setResetting(true);
    try {
      const r = await fetch('/api/analytics', { method: 'DELETE' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d?.error ?? 'Falha ao zerar estatísticas.'); return; }
      setReload(n => n + 1);
    } catch {
      setError('Falha ao zerar estatísticas.');
    } finally {
      setResetting(false);
    }
  }

  useEffect(() => {
    let alive = true;
    setError('');
    fetch(`/api/analytics?days=${days}`, { cache: 'no-store' })
      .then(async r => {
        const d = await r.json().catch(() => ({}));
        if (!alive) return;
        if (r.ok) setStats(d); else setError(d?.error ?? 'Falha ao carregar estatísticas.');
      })
      .catch(() => alive && setError('Falha ao carregar estatísticas.'));
    return () => { alive = false; };
  }, [days, reload]);

  const t = stats?.totals;
  const conversion = t && t.visitors ? (stats!.orders.count / t.visitors) * 100 : 0;
  const tiles = [
    { label: 'Visitantes', value: t?.visitors, sub: `hoje: ${stats?.today.visitors ?? '–'}`, icon: <Users size={18} className="text-sky-400" />, bg: 'bg-sky-500/10' },
    { label: 'Visualizações', value: t?.views, sub: `hoje: ${stats?.today.views ?? '–'}`, icon: <Eye size={18} className="text-violet-400" />, bg: 'bg-violet-500/10' },
    { label: 'Cliques em produtos', value: t?.productClicks, sub: `${t?.productViews ?? '–'} páginas de produto vistas`, icon: <MousePointerClick size={18} className="text-amber-400" />, bg: 'bg-amber-500/10' },
    { label: 'Add. ao carrinho', value: t?.addToCart, sub: `${stats?.orders.count ?? '–'} pedidos · conversão ${conversion.toFixed(1)}%`, icon: <ShoppingCart size={18} className="text-green-400" />, bg: 'bg-green-500/10' },
  ];
  const maxDay = Math.max(1, ...(stats?.daily.map(d => d.views) ?? [1]));

  return (
    <section className="rounded-2xl border border-white/10 bg-[#161b28] p-4 text-white sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold"><BarChart3 size={16} className="text-green-500" /> Estatísticas da loja</h2>
        <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={resetStats}
          disabled={resetting}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
        >
          <RotateCcw size={13} /> {resetting ? 'Zerando…' : 'Zerar estatísticas'}
        </button>
        <div className="flex rounded-lg border border-white/10 p-0.5 text-xs">
          {RANGES.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setDays(r)}
              className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${days === r ? 'bg-green-600 text-white' : 'text-white/60 hover:bg-white/5'}`}
            >
              {r === 1 ? 'Hoje' : `${r} dias`}
            </button>
          ))}
        </div>
        </div>
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map(s => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0f1117] p-3 sm:p-4">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.bg}`}>{s.icon}</div>
            <div className="min-w-0">
              <div className="text-lg font-bold sm:text-xl">{s.value ?? '–'}</div>
              <div className="text-xs leading-tight text-white/60">{s.label}</div>
              <div className="mt-0.5 text-[11px] leading-tight text-white/40">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {stats && (
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Visualizações — últimos 14 dias</h3>
            <div className="flex h-36 items-end gap-1 rounded-xl sm:gap-1.5 border border-white/10 bg-[#0f1117] p-3">
              {stats.daily.map(d => (
                <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.day.slice(8, 10)}/${d.day.slice(5, 7)}: ${d.views} visualizações, ${d.visitors} visitantes`}>
                  <div className="w-full rounded-t bg-green-500/70 transition-colors group-hover:bg-green-400" style={{ height: `${Math.max(2, (d.views / maxDay) * 100)}%` }} />
                  <span className="mt-1 text-center text-[9px] text-white/40">{d.day.slice(8, 10)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Produtos mais vistos</h3>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-[#0f1117] text-[11px] uppercase tracking-wider text-white/45">
                  <tr><th className="px-3 py-2 text-left">Produto</th><th className="px-1.5 py-2 text-right sm:px-2">Vistas</th><th className="px-1.5 py-2 text-right sm:px-2">Cliques</th><th className="px-3 py-2 text-right"><span className="sm:hidden">Carr.</span><span className="hidden sm:inline">Carrinho</span></th></tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {stats.products.map(p => (
                    <tr key={p.id}>
                      <td className="max-w-[120px] truncate px-3 py-2 sm:max-w-[200px]">{p.name}</td>
                      <td className="px-1.5 py-2 text-right text-white/80 sm:px-2">{p.views}</td>
                      <td className="px-1.5 py-2 text-right text-white/80 sm:px-2">{p.clicks}</td>
                      <td className="px-3 py-2 text-right text-green-400">{p.carts}</td>
                    </tr>
                  ))}
                  {stats.products.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-xs text-white/40">Ainda sem dados — as estatísticas começam a contar a partir de agora.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {stats && stats.pages.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Páginas mais visitadas</h3>
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-1.5 sm:grid-cols-[repeat(2,minmax(0,1fr))]">
            {stats.pages.map(p => (
              <li key={p.path} className="flex items-center justify-between gap-3 rounded-lg bg-[#0f1117] px-3 py-2 text-sm">
                <span className="min-w-0 truncate text-white/70" title={p.path}>{p.path === '/' ? 'Início' : p.path}</span>
                <span className="shrink-0 font-semibold">{p.views}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
