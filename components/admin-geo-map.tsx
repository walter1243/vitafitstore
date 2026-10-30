'use client';
import { useMemo, useState } from 'react';
import { Clock, Globe2, MapPin } from 'lucide-react';

export type GeoRow = { country: string | null; city: string; lat: number | null; lng: number | null; visitors: number; views: number };
export type PurchaseRow = { country: string; city: string; lat: number | null; lng: number | null; orders: number; revenue: number };
export type HourRow = { hour: number; views: number };
export type RecentRow = { when: string; country: string | null; city: string | null; path: string };

// Mapa = public/images/mapa-europa.jpg (1024×559, Europa inclinada). A matriz
// leva latitude/longitude (Mercator) pro pixel da imagem; foi ajustada com 21
// pontos da costa, entao a posicao e aproximada (erro de ~20 px).
const H = [20.51764085, 5.75409055, 170.41191752, -0.33937822, -11.66405823, 1119.15815429, -0.0035849, 0.00840576];
const MAP_W = 1024;
const MAP_H = 559;

function project(lat: number, lng: number) {
  if (lat < 34 || lat > 71.5 || lng < -25 || lng > 45) return null;
  const v = (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 180) / Math.PI;
  const w = H[6] * lng + H[7] * v + 1;
  const x = (H[0] * lng + H[1] * v + H[2]) / w;
  const y = (H[3] * lng + H[4] * v + H[5]) / w;
  return x >= 0 && x <= MAP_W && y >= 0 && y <= MAP_H ? { x, y } : null;
}

const countryName = (cc: string) => {
  if (!/^[A-Z]{2}$/.test(cc)) return 'Desconhecido';
  try { return new Intl.DisplayNames(['pt-BR'], { type: 'region' }).of(cc) ?? cc; } catch { return cc; }
};

function Flag({ cc }: { cc: string }) {
  if (!/^[A-Z]{2}$/.test(cc)) return <Globe2 size={14} className="text-white/40" aria-hidden="true" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`https://flagcdn.com/w20/${cc.toLowerCase()}.png`} alt="" width={16} height={12} className="h-3 w-4 rounded-[2px] object-cover" loading="lazy" />;
}

type Spot = { key: string; country: string; city: string; lat: number | null; lng: number | null; value: number; extra: string };

export function GeoHeatPanel({ geo, purchases, hours, recent }: { geo: GeoRow[]; purchases: PurchaseRow[]; hours: HourRow[]; recent: RecentRow[] }) {
  const [mode, setMode] = useState<'visits' | 'orders'>('visits');

  const spots: Spot[] = useMemo(() => mode === 'visits'
    ? geo.map((g) => ({ key: `${g.country}-${g.city}`, country: g.country ?? '', city: g.city, lat: g.lat, lng: g.lng, value: g.visitors, extra: `${g.views} visualizações` }))
    : purchases.map((p) => ({ key: `${p.country}-${p.city}`, country: p.country, city: p.city, lat: p.lat, lng: p.lng, value: p.orders, extra: `€${p.revenue.toFixed(2)}` })), [mode, geo, purchases]);

  const unit = mode === 'visits' ? 'visitantes' : 'pedidos';
  const total = spots.reduce((s, x) => s + x.value, 0);
  const max = Math.max(1, ...spots.map((s) => s.value));
  const plotted = spots.flatMap((s) => {
    const p = s.lat != null && s.lng != null ? project(s.lat, s.lng) : null;
    return p ? [{ ...s, ...p }] : [];
  });
  const outside = total - plotted.reduce((n, s) => n + s.value, 0);

  const countries = Object.values(spots.reduce<Record<string, { cc: string; value: number }>>((acc, s) => {
    const cc = s.country || '??';
    (acc[cc] ??= { cc, value: 0 }).value += s.value;
    return acc;
  }, {})).sort((a, b) => b.value - a.value).slice(0, 8);
  const cities = [...spots].filter((s) => s.city).sort((a, b) => b.value - a.value).slice(0, 6);

  const byHour = Array.from({ length: 24 }, (_, h) => hours.find((x) => x.hour === h)?.views ?? 0);
  const maxHour = Math.max(1, ...byHour);
  const peak = byHour.some(Boolean) ? byHour.indexOf(Math.max(...byHour)) : null;

  return (
    <div className="mt-5 space-y-5">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/50"><MapPin size={13} /> Mapa de calor</h3>
          <div className="flex rounded-lg border border-white/10 p-0.5 text-xs">
            {([['visits', 'Acessos'], ['orders', 'Compras']] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setMode(k)} aria-pressed={mode === k} className={`cursor-pointer rounded-md px-3 py-1.5 font-semibold transition-colors ${mode === k ? 'bg-green-600 text-white' : 'text-white/60 hover:bg-white/5'}`}>{l}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
          <div>
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0f1117]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/mapa-europa.jpg" alt="Mapa da Europa" width={MAP_W} height={MAP_H} className="block h-auto w-full" />
              <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="absolute inset-0 h-full w-full" role="img" aria-label={`Mapa de calor de ${unit}`}>
                <defs>
                  <radialGradient id="geo-heat">
                    <stop offset="0%" stopColor="#ff2a2a" stopOpacity="0.85" />
                    <stop offset="35%" stopColor="#ff5a1f" stopOpacity="0.5" />
                    <stop offset="70%" stopColor="#ffb020" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#ffb020" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {plotted.map((s) => <circle key={`h-${s.key}`} cx={s.x} cy={s.y} r={22 + 46 * Math.sqrt(s.value / max)} fill="url(#geo-heat)" style={{ mixBlendMode: 'screen' }} />)}
                {plotted.map((s) => (
                  <circle key={`d-${s.key}`} cx={s.x} cy={s.y} r={3.5 + 3 * Math.sqrt(s.value / max)} fill="#ff1f1f" stroke="#fff" strokeWidth={1}>
                    <title>{`${s.city || countryName(s.country)}: ${s.value} ${unit} · ${s.extra}`}</title>
                  </circle>
                ))}
              </svg>
              {plotted.length === 0 && (
                <p className="absolute inset-x-0 bottom-3 mx-auto w-fit max-w-[90%] rounded-lg bg-black/70 px-3 py-1.5 text-center text-xs text-white/80">
                  {mode === 'visits' ? 'Os próximos acessos aparecem aqui.' : 'As próximas compras aparecem aqui.'}
                </p>
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-white/40">
              Posição aproximada, por cidade.{outside > 0 ? ` ${outside} ${unit} fora da Europa ou sem localização (veja na lista de países).` : ''}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/45">Países</h4>
              <ul className="space-y-1.5">
                {countries.map((c) => (
                  <li key={c.cc} className="rounded-lg bg-[#0f1117] px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Flag cc={c.cc} />
                      <span className="min-w-0 flex-1 truncate text-white/80">{countryName(c.cc)}</span>
                      <span className="font-semibold">{c.value}</span>
                      <span className="w-9 text-right text-xs text-white/40">{Math.round((c.value / Math.max(1, total)) * 100)}%</span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-red-500" style={{ width: `${(c.value / countries[0].value) * 100}%` }} /></div>
                  </li>
                ))}
                {countries.length === 0 && <li className="rounded-lg bg-[#0f1117] px-3 py-4 text-center text-xs text-white/40">Ainda sem dados.</li>}
              </ul>
            </div>
            {cities.length > 0 && (
              <div>
                <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/45">Cidades</h4>
                <ul className="space-y-1">
                  {cities.map((c) => (
                    <li key={c.key} className="flex items-center gap-2 px-1 text-sm">
                      <Flag cc={c.country} />
                      <span className="min-w-0 flex-1 truncate text-white/75">{c.city}</span>
                      <span className="font-semibold">{c.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/50">
            <Clock size={13} /> Horário dos acessos (Madri){peak != null && <span className="font-normal normal-case tracking-normal text-white/40">· pico às {peak}h</span>}
          </h3>
          <div className="flex h-32 items-end gap-0.5 rounded-xl border border-white/10 bg-[#0f1117] p-3 sm:gap-1">
            {byHour.map((v, h) => (
              <div key={h} className="group flex h-full min-w-0 flex-1 flex-col justify-end" title={`${h}h: ${v} visualizações`}>
                <div className={`w-full rounded-t transition-colors ${h === peak ? 'bg-red-500' : 'bg-sky-500/60 group-hover:bg-sky-400'}`} style={{ height: `${Math.max(2, (v / maxHour) * 100)}%` }} />
                <span className="mt-1 text-center text-[8px] text-white/40 sm:text-[9px]">{h % 3 === 0 ? h : ''}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Últimos acessos</h3>
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-[#0f1117] p-2">
            {recent.map((r, i) => (
              <li key={i} className="flex items-center gap-2 px-1 py-0.5 text-xs">
                <span className="shrink-0 tabular-nums text-white/45">{r.when}</span>
                {r.country && <Flag cc={r.country} />}
                <span className="shrink-0 text-white/75">{r.city || (r.country ? countryName(r.country) : '—')}</span>
                <span className="min-w-0 flex-1 truncate text-right text-white/40" title={r.path}>{r.path === '/' ? 'Início' : r.path}</span>
              </li>
            ))}
            {recent.length === 0 && <li className="px-1 py-3 text-center text-xs text-white/40">Ainda sem acessos neste período.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
