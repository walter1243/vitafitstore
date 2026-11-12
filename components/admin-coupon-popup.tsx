'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Eye, Loader2, Monitor, MousePointerClick, ShoppingBag, Smartphone, Tag, Trash2, X } from 'lucide-react';
import { dataUrlToBlobUrl, isDataUrl } from '@/lib/upload-data-url';
import { useHoverPaste } from '@/lib/use-hover-paste';

// Admin → Editar loja → "Pop-up de cupom de desconto".
// Liga/desliga a campanha, cadastra o cupom no sistema de descontos
// (lib/coupons.ts — e isso que faz os 15% valerem no pagamento), troca as
// imagens do computador e do celular e mostra os cliques do pop-up.

type Cfg = {
  enabled: boolean;
  code: string;
  percent: number;
  firstPurchaseOnly: boolean;
  minSubtotal: number;
  endsAt: string | null;
  delaySec: number;
  reshowDays: number;
  imageDesktop: string;
  imageMobile: string;
};

type Stats = {
  days: number;
  view: { total: number; people: number };
  copy: { total: number; people: number };
  buy: { total: number; people: number };
  close: { total: number; people: number };
  orders: number;
  discount: number;
  revenue: number;
};

const DEFAULT_MOBILE = '/images/cupom-bienvenidos15.webp';
const inputCls = 'w-full rounded-lg border border-white/10 bg-[#1c2236] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40';
const labelCls = 'mb-1.5 block text-xs font-medium text-white/50';

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function ImageSlot({ kind, value, onChange }: { kind: 'desktop' | 'mobile'; value: string; onChange: (v: string) => void }) {
  const isDesk = kind === 'desktop';
  const accept = (t: string) => /^image\/(jpeg|png|webp|avif)$/.test(t);
  const take = useCallback(async (files: File[]) => { if (files[0]) onChange(await readAsDataUrl(files[0])); }, [onChange]);
  const { ref } = useHoverPaste<HTMLDivElement>(accept, take);

  return (
    <div ref={ref} className="flex flex-col rounded-xl border border-white/10 bg-[#0f1117] p-3">
      <div className="mb-2 flex items-center gap-2">
        {isDesk ? <Monitor size={15} className="text-white/60" /> : <Smartphone size={15} className="text-white/60" />}
        <p className="text-sm font-semibold text-white">{isDesk ? 'Computador' : 'Celular'}</p>
        <span className="text-[11px] text-white/40">{isDesk ? 'horizontal · ex. 1600×900' : 'vertical · ex. 900×1200'}</span>
      </div>

      {/* moldura no formato da tela */}
      <div className={`relative mx-auto flex w-full items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#1c2236] ${isDesk ? 'aspect-[16/10]' : 'aspect-[3/4] max-w-[220px]'}`}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-contain" />
        ) : isDesk ? (
          <div className="grid h-full w-full grid-cols-2 gap-1 p-2 text-[10px] text-white/50">
            <div className="overflow-hidden rounded bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={DEFAULT_MOBILE} alt="" className="h-full w-full object-cover object-top opacity-80" />
            </div>
            <div className="flex flex-col justify-center gap-1 rounded bg-white/5 p-2">
              <span className="font-bold text-orange-300">-15%</span>
              <span className="h-3 rounded border border-dashed border-orange-300/50" />
              <span className="h-3 rounded bg-[#1d3263]" />
            </div>
          </div>
        ) : (
          <span className="px-3 text-center text-xs text-white/40">Sem imagem</span>
        )}
        {value && (
          <button type="button" onClick={() => onChange('')} title="Remover imagem"
            className="absolute right-1.5 top-1.5 rounded-lg bg-black/60 p-1.5 text-white/80 hover:bg-red-600">
            <Trash2 size={13} />
          </button>
        )}
      </div>
      {!value && isDesk && (
        <p className="mt-2 text-[11px] leading-snug text-white/45">Sem imagem própria: o site monta sozinho — a imagem do celular de um lado e o cupom com os botões do outro.</p>
      )}

      <div
        tabIndex={0}
        onPaste={async (e) => {
          const f = Array.from(e.clipboardData.files).find((x) => accept(x.type));
          if (f) { e.preventDefault(); onChange(await readAsDataUrl(f)); }
        }}
        className="mt-3 rounded-lg border border-dashed border-white/15 px-3 py-2 text-xs text-white/60 outline-none focus:border-green-500/40 focus:ring-2 focus:ring-green-500/30"
      >
        Cole a imagem aqui com Ctrl+V (ou passe o mouse por cima e cole).
      </div>
      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={async (e) => { const f = e.target.files?.[0]; if (f) onChange(await readAsDataUrl(f)); e.target.value = ''; }}
        className="mt-2 w-full text-xs text-white/60" />
    </div>
  );
}

function StatTile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f1117] p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-white/50">{icon}{label}</div>
      <p className="mt-1 text-xl font-bold tabular-nums text-white">{value}</p>
      {sub && <p className="text-[11px] text-white/40">{sub}</p>}
    </div>
  );
}

const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—');

export default function AdminCouponPopup() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [ended, setEnded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetch('/api/coupon-popup', { cache: 'no-store' }).then((r) => r.json()).then((d) => {
      setEnded(Boolean(d.ended));
      setCfg({
        enabled: Boolean(d.configuredEnabled ?? d.enabled),
        code: d.code ?? 'BIENVENIDOS15',
        percent: Number(d.percent ?? 15),
        firstPurchaseOnly: d.firstPurchaseOnly !== false,
        minSubtotal: Number(d.minSubtotal ?? 0),
        endsAt: d.endsAt ?? null,
        delaySec: Number(d.delaySec ?? 3),
        reshowDays: Number(d.reshowDays ?? 0),
        imageDesktop: d.imageDesktop ?? '',
        imageMobile: d.imageMobile ?? DEFAULT_MOBILE,
      });
    }).catch(() => setMsg({ ok: false, text: 'Não foi possível carregar o cupom.' }));
  }, []);

  useEffect(() => {
    fetch(`/api/coupon-popup/stats?days=${days}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null)).then((d) => d && !d.error && setStats(d)).catch(() => {});
  }, [days]);

  const up = <K extends keyof Cfg>(k: K, v: Cfg[K]) => setCfg((c) => (c ? { ...c, [k]: v } : c));
  const setDesk = useCallback((v: string) => up('imageDesktop', v), []);
  const setMob = useCallback((v: string) => up('imageMobile', v), []);

  async function save() {
    if (!cfg) return;
    setSaving(true);
    setMsg(null);
    try {
      const imageDesktop = isDataUrl(cfg.imageDesktop) ? await dataUrlToBlobUrl(cfg.imageDesktop, 'cupom') : cfg.imageDesktop;
      const imageMobile = isDataUrl(cfg.imageMobile) ? await dataUrlToBlobUrl(cfg.imageMobile, 'cupom') : cfg.imageMobile;
      const res = await fetch('/api/coupon-popup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cfg, imageDesktop, imageMobile }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || 'Erro ao salvar.');
      setCfg((c) => (c ? { ...c, code: d.code, percent: d.percent, imageDesktop: d.imageDesktop, imageMobile: d.imageMobile, endsAt: d.endsAt } : c));
      setEnded(d.endsAt ? Date.parse(d.endsAt) < Date.now() : false);
      setMsg({ ok: true, text: `Salvo. Cupom ${d.code} (−${d.percent}%) ${d.enabled ? 'ativo na loja' : 'desligado'}.` });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || 'Erro ao salvar.' });
    } finally {
      setSaving(false);
    }
  }

  if (!cfg) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#161b28] p-5 text-sm text-white/60">
        <Loader2 size={16} className="animate-spin" /> Carregando pop-up de cupom…
      </div>
    );
  }

  const endDate = cfg.endsAt ? cfg.endsAt.slice(0, 10) : '';

  return (
    <div className="rounded-2xl border border-white/10 bg-[#161b28] p-5 shadow-none">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-white"><Tag size={16} className="text-orange-400" /> Pop-up de cupom de desconto</h2>
          <p className="mt-0.5 text-xs text-white/50">Aparece {cfg.delaySec}s depois que o cliente entra na loja. Copiar ou clicar em “¡Compra ahora!” já deixa o cupom aplicado no checkout; fechar no X = sem cupom.</p>
        </div>
        <button type="button" onClick={() => up('enabled', !cfg.enabled)}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${cfg.enabled ? 'border-green-500/50 bg-green-500/15 text-green-300' : 'border-white/15 bg-white/5 text-white/60'}`}>
          <span className={`h-2 w-2 rounded-full ${cfg.enabled ? 'bg-green-400' : 'bg-white/30'}`} />
          {cfg.enabled ? 'Campanha ligada' : 'Campanha desligada'}
        </button>
      </div>
      {cfg.enabled && ended && (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">A data de fim já passou: o pop-up não aparece e o cupom não vale mais. Mude ou apague a data.</p>
      )}

      {/* imagens: computador de um lado, celular do outro */}
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
        <ImageSlot kind="desktop" value={cfg.imageDesktop} onChange={setDesk} />
        <ImageSlot kind="mobile" value={cfg.imageMobile} onChange={setMob} />
      </div>

      {/* regras do cupom */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={labelCls}>Código do cupom</label>
          <input value={cfg.code} onChange={(e) => up('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} className={`${inputCls} font-mono uppercase`} />
        </div>
        <div>
          <label className={labelCls}>Desconto (%)</label>
          <input type="number" min={1} max={90} value={cfg.percent} onChange={(e) => up('percent', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Pedido mínimo (€) · 0 = sem mínimo</label>
          <input type="number" min={0} step="0.01" value={cfg.minSubtotal} onChange={(e) => up('minSubtotal', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Termina em (opcional)</label>
          <div className="flex gap-1.5">
            <input type="date" value={endDate}
              onChange={(e) => up('endsAt', e.target.value ? new Date(`${e.target.value}T23:59:59`).toISOString() : null)}
              className={`${inputCls} [color-scheme:dark]`} />
            {endDate && (
              <button type="button" onClick={() => up('endsAt', null)} title="Sem data de fim" className="rounded-lg border border-white/10 px-2 text-white/60 hover:bg-white/10"><X size={14} /></button>
            )}
          </div>
        </div>
        <div>
          <label className={labelCls}>Aparece depois de (segundos)</label>
          <input type="number" min={0} max={60} value={cfg.delaySec} onChange={(e) => up('delaySec', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Mostrar de novo após (dias) · 0 = nunca</label>
          <input type="number" min={0} max={365} value={cfg.reshowDays} onChange={(e) => up('reshowDays', Number(e.target.value))} className={inputCls} />
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-[#1c2236] px-3 py-2 text-sm text-white/80 sm:col-span-2">
          <input type="checkbox" checked={cfg.firstPurchaseOnly} onChange={(e) => up('firstPurchaseOnly', e.target.checked)} className="h-4 w-4 accent-green-500" />
          Só na primeira compra (conferido pelo e-mail do pedido)
        </label>
      </div>

      <ul className="mt-4 space-y-1 text-[11px] leading-snug text-white/45">
        <li>• O desconto vale só sobre os produtos, não sobre o frete, e é conferido de novo no servidor na hora do pagamento.</li>
        <li>• Confira se a margem dos produtos aguenta −{cfg.percent}%. Só coloque data de fim se a promoção acabar mesmo nesse dia (não anuncie “tempo limitado” sem data real).</li>
        <li>• Quem já comprou com o cupom não vê mais o pop-up.</li>
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Salvar pop-up e cupom
        </button>
        {msg && <span className={`text-xs ${msg.ok ? 'text-green-300' : 'text-red-300'}`}>{msg.text}</span>}
      </div>

      {/* cliques do pop-up */}
      <div className="mt-6 border-t border-white/10 pt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">Resultado do pop-up</h3>
          <div className="flex gap-1">
            {[7, 30, 90].map((d) => (
              <button key={d} type="button" onClick={() => setDays(d)}
                className={`rounded-lg px-2.5 py-1 text-xs ${days === d ? 'bg-white/15 text-white' : 'text-white/50 hover:bg-white/5'}`}>{d} dias</button>
            ))}
          </div>
        </div>
        {stats ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile icon={<Eye size={12} />} label="Viram o pop-up" value={stats.view.people} sub={`${stats.view.total} vezes`} />
            <StatTile icon={<Copy size={12} />} label="Copiaram o código" value={stats.copy.people} sub={`${pct(stats.copy.people, stats.view.people)} de quem viu`} />
            <StatTile icon={<MousePointerClick size={12} />} label="Clicaram “Compra ahora”" value={stats.buy.people} sub={`${pct(stats.buy.people, stats.view.people)} de quem viu`} />
            <StatTile icon={<X size={12} />} label="Fecharam sem cupom" value={stats.close.people} sub={`${pct(stats.close.people, stats.view.people)} de quem viu`} />
            <StatTile icon={<ShoppingBag size={12} />} label="Pedidos com cupom" value={stats.orders} />
            <StatTile icon={<Tag size={12} />} label="Desconto dado" value={`€${stats.discount.toFixed(2)}`} />
            <StatTile icon={<ShoppingBag size={12} />} label="Vendido com cupom" value={`€${stats.revenue.toFixed(2)}`} />
            <StatTile icon={<MousePointerClick size={12} />} label="Viu → comprou" value={pct(stats.orders, stats.view.people)} />
          </div>
        ) : (
          <p className="text-xs text-white/40">Sem dados ainda.</p>
        )}
        <p className="mt-2 text-[11px] text-white/35">Pessoas = visitantes diferentes por dia. Você logado no painel não conta.</p>
      </div>
    </div>
  );
}
