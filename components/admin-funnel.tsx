'use client';
import { useEffect, useState } from 'react';
import { Filter, Monitor, Smartphone, Layers } from 'lucide-react';

// Funil de compra (Dashboard): pessoas em cada passo, onde mais gente desiste e por quê
// procurar ali. Dados de app/api/analytics/funnel.
type Funnel = { visited: number; product: number; cart: number; checkout: number; payment: number; purchase: number };
type Data = {
  funnel: Funnel;
  sources: { source: string; visited: number; product: number; cart: number; purchase: number }[];
  devices: { device: string; visited: number; purchase: number }[];
  methods: { method: string; n: number }[];
  products: { id: number; name: string; opened: number; carted: number }[];
};

const STEPS: { key: keyof Funnel; label: string; hint: string; fix: string }[] = [
  { key: 'visited', label: 'Visitou a loja', hint: 'qualquer página', fix: '' },
  { key: 'product', label: 'Abriu um produto', hint: 'página de produto', fix: 'Entram e saem sem abrir produto: a primeira tela não mostra algo que interesse. Destaque 3–5 produtos fortes no topo, com foto real e preço.' },
  { key: 'cart', label: 'Pôs no carrinho', hint: 'Añadir al carrito', fix: 'Abrem o produto e não compram: confira preço, fotos, prazo de entrega e o valor do frete na página do produto.' },
  { key: 'checkout', label: 'Abriu o checkout', hint: 'página de pagamento', fix: 'Põem no carrinho e não seguem: o frete ou o total no carrinho pode estar assustando. Veja o carrinho no celular.' },
  { key: 'payment', label: 'Começou a pagar', hint: 'clicou em pagar', fix: 'Chegam ao checkout e não pagam: muitos campos, frete que só aparece no fim ou falta do método que querem (Bizum, PayPal).' },
  { key: 'purchase', label: 'Compra confirmada', hint: 'pagamento aprovado', fix: 'Começam a pagar e não terminam: pagamento recusado ou o cliente desistiu no banco/Bizum. Veja os erros no Stripe.' },
];

const DEVICES = [
  { id: 'all', label: 'Todos', icon: Layers },
  { id: 'mobile', label: 'Celular', icon: Smartphone },
  { id: 'desktop', label: 'Computador', icon: Monitor },
] as const;

const METHOD_LABEL: Record<string, string> = { card: 'Cartão / Apple Pay / Google Pay', bizum: 'Bizum', paypal: 'PayPal', klarna: 'Klarna', link: 'Link (Stripe)', mb_way: 'MB Way', apple_pay: 'Apple Pay', google_pay: 'Google Pay' };
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

export function FunnelPanel({ days }: { days: number }) {
  const [device, setDevice] = useState<'all' | 'mobile' | 'desktop'>('all');
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setError('');
    fetch(`/api/analytics/funnel?days=${days}&device=${device}`, { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!alive) return;
        if (r.ok) setData(d); else setError(d?.error ?? 'Falha ao carregar o funil.');
      })
      .catch(() => alive && setError('Falha ao carregar o funil.'));
    return () => { alive = false; };
  }, [days, device]);

  const f = data?.funnel;
  const top = Math.max(1, f?.visited ?? 1);
  // maior perda entre dois passos seguidos (só com gente suficiente para dizer algo)
  let worst = -1, worstLoss = 0;
  if (f) STEPS.forEach((s, i) => {
    if (i === 0) return;
    const prev = f[STEPS[i - 1].key], cur = f[s.key];
    const loss = prev - cur;
    if (prev >= 3 && loss > worstLoss) { worstLoss = loss; worst = i; }
  });

  return (
    <div className="mt-5 rounded-xl border border-white/10 bg-[#0f1117] p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Filter size={15} className="text-green-400" /> Funil de compra</h3>
        <div className="flex rounded-lg border border-white/10 p-0.5 text-xs">
          {DEVICES.map((d) => {
            const Icon = d.icon;
            return (
              <button key={d.id} type="button" onClick={() => setDevice(d.id)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-semibold transition-colors ${device === d.id ? 'bg-green-600 text-white' : 'text-white/60 hover:bg-white/5'}`}>
                <Icon size={13} /> {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
      {!f && !error && <p className="text-xs text-white/50">Carregando…</p>}

      {f && (
        <>
          <ol className="space-y-2">
            {STEPS.map((s, i) => {
              const v = f[s.key];
              const prev = i > 0 ? f[STEPS[i - 1].key] : v;
              const isWorst = i === worst;
              return (
                <li key={s.key}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate"><b className="text-white">{i + 1}. {s.label}</b> <span className="text-white/40">· {s.hint}</span></span>
                    <span className="shrink-0 tabular-nums text-white/80">
                      <b className="text-white">{v}</b> {i > 0 && <span className={isWorst ? 'text-red-300' : 'text-white/40'}>({pct(v, prev)}% do passo anterior)</span>}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/5">
                    <div className={`h-full rounded-full ${isWorst ? 'bg-red-400/80' : i === STEPS.length - 1 ? 'bg-green-500' : 'bg-sky-500/80'}`} style={{ width: `${Math.max(v > 0 ? 2 : 0, pct(v, top))}%` }} />
                  </div>
                </li>
              );
            })}
          </ol>

          <div className={`mt-3 rounded-lg px-3 py-2 text-xs leading-relaxed ${worst > 0 ? 'bg-red-500/10 text-red-200' : 'bg-white/5 text-white/60'}`}>
            {f.visited < 30
              ? `Ainda há poucas visitas (${f.visited}) para tirar conclusões firmes. Mesmo assim, olhe onde as pessoas param.`
              : null}
            {worst > 0 && <> <b>Maior perda: entre &quot;{STEPS[worst - 1].label}&quot; e &quot;{STEPS[worst].label}&quot;</b> ({worstLoss} pessoas). {STEPS[worst].fix}</>}
            {worst <= 0 && f.visited >= 30 && ' Sem uma perda que se destaque.'}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">De onde vêm</p>
              <table className="w-full text-xs">
                <thead className="text-white/40"><tr><th className="py-1 text-left font-medium">Origem</th><th className="text-right font-medium">Visitas</th><th className="text-right font-medium">Produto</th><th className="text-right font-medium">Carrinho</th><th className="text-right font-medium">Compras</th></tr></thead>
                <tbody>
                  {data!.sources.map((r) => (
                    <tr key={r.source} className="border-t border-white/5">
                      <td className="py-1 capitalize">{r.source}</td>
                      <td className="text-right tabular-nums">{r.visited}</td>
                      <td className="text-right tabular-nums text-white/70">{pct(r.product, r.visited)}%</td>
                      <td className="text-right tabular-nums text-white/70">{pct(r.cart, r.visited)}%</td>
                      <td className="text-right tabular-nums font-semibold text-green-300">{r.purchase}</td>
                    </tr>
                  ))}
                  {data!.sources.length === 0 && <tr><td colSpan={5} className="py-2 text-white/40">Sem visitas no período.</td></tr>}
                </tbody>
              </table>
              <p className="mt-1 text-[11px] text-white/35">&quot;sem dado&quot; = visitas antes desta medição. Em anúncios, use links com ?utm_source=nome.</p>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">Produtos: abriram × puseram no carrinho</p>
              <table className="w-full text-xs">
                <tbody>
                  {data!.products.map((p) => (
                    <tr key={p.id} className="border-t border-white/5 first:border-t-0">
                      <td className="max-w-0 truncate py-1 pr-2">{p.name}</td>
                      <td className="whitespace-nowrap text-right tabular-nums">{p.opened} → {p.carted}</td>
                      <td className={`w-12 text-right tabular-nums ${p.opened >= 5 && p.carted === 0 ? 'text-red-300' : 'text-white/60'}`}>{pct(p.carted, p.opened)}%</td>
                    </tr>
                  ))}
                  {data!.products.length === 0 && <tr><td className="py-2 text-white/40">Nenhum produto aberto no período.</td></tr>}
                </tbody>
              </table>
              <p className="mt-1 text-[11px] text-white/35">Em vermelho: muita gente abre e ninguém põe no carrinho (preço, foto ou frete).</p>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">Aparelho</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {data!.devices.map((d) => (
                  <span key={d.device} className="rounded-lg bg-white/5 px-2.5 py-1.5">
                    {d.device === 'mobile' ? 'Celular' : d.device === 'desktop' ? 'Computador' : d.device === 'tablet' ? 'Tablet' : 'Sem dado'}: <b>{d.visited}</b> visitas · <b className="text-green-300">{d.purchase}</b> compras
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">Método de pagamento escolhido</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {data!.methods.map((m) => (
                  <span key={m.method} className="rounded-lg bg-white/5 px-2.5 py-1.5">{METHOD_LABEL[m.method] ?? m.method}: <b>{m.n}</b></span>
                ))}
                {data!.methods.length === 0 && <span className="text-white/40">Ninguém começou a pagar no período.</span>}
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-white/35">Pessoas = visitantes diferentes por dia (sem cookies). Seus aparelhos não contam depois de abrir o Dashboard neles.</p>
        </>
      )}
    </div>
  );
}
