'use client';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, ExternalLink, Loader2, MapPin, Package, Search } from 'lucide-react';

type OrderStatus = {
  id: number;
  status: 'pending' | 'shipped' | 'delivered';
  date: string;
  total: number;
  method: 'pickup' | 'home';
  point: { name: string; address: string; zipCity: string } | null;
  trackingUrl: string | null;
  items: { name: string; quantity: number }[];
};

const INPUT = 'w-full rounded-xl border border-[#e4dccf] bg-white px-4 py-3 text-base text-[#23263f] outline-none placeholder:text-[#9a97ab] focus:border-[#23263f] focus:ring-2 focus:ring-[#23263f]/15';

// /pedido: o cliente digita o numero do pedido + e-mail e ve em que etapa
// esta (Preparando → En camino → En tu punto / Entregado).
export function OrderStatusView() {
  const params = useSearchParams();
  const [num, setNum] = useState(params.get('n') ?? '');
  const [email, setEmail] = useState(params.get('e') ?? '');
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = useCallback(async (n: string, e: string) => {
    const id = n.replace(/\D/g, '');
    if (!id || !e.trim()) { setError('Escribe el número de pedido y tu e-mail.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/status?n=${id}&e=${encodeURIComponent(e.trim())}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setOrder(null); setError(data?.error ?? 'No encontramos ese pedido.'); return; }
      setOrder(data);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Link do e-mail (?n=…&e=…) ja abre o pedido.
  useEffect(() => {
    const n = params.get('n'); const e = params.get('e');
    if (n && e) void lookup(n, e);
  }, [params, lookup]);

  return (
    <div className="text-[#23263f]">
      <h1 className="mb-2 text-3xl font-bold">Mi pedido</h1>
      <p className="mb-6 text-[#565a78]">Consulta en qué paso está tu pedido con el número que te enviamos por e-mail.</p>

      <form onSubmit={(e) => { e.preventDefault(); void lookup(num, email); }} className="mb-8 grid gap-3 rounded-2xl border border-[#efe7da] bg-white p-4 sm:grid-cols-[120px_1fr_auto] sm:p-5">
        <label className="text-sm font-semibold">Nº de pedido
          <input className={`${INPUT} mt-1`} inputMode="numeric" placeholder="123" value={num} onChange={(e) => setNum(e.target.value)} />
        </label>
        <label className="text-sm font-semibold">E-mail de la compra
          <input className={`${INPUT} mt-1`} type="email" autoComplete="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button type="submit" disabled={loading} className="flex min-h-12 cursor-pointer items-center justify-center gap-2 self-end rounded-xl bg-[#23263f] px-5 font-bold text-white transition-colors hover:bg-[#363a5c] disabled:opacity-60">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />} Ver
        </button>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-3" role="alert">{error}</p>}
      </form>

      {order && <OrderCard order={order} />}
    </div>
  );
}

function OrderCard({ order }: { order: OrderStatus }) {
  const pickup = order.method === 'pickup';
  const steps = [
    { label: 'Pedido recibido', hint: order.date },
    { label: 'Preparando', hint: 'Lo estamos imprimiendo y preparando en nuestro taller.' },
    { label: 'En camino', hint: 'Ya lo tiene la empresa de transporte.' },
    { label: pickup ? 'En tu punto de recogida' : 'Entregado', hint: pickup ? 'Ya puedes ir a buscarlo con tu DNI/NIE y el número de pedido.' : '¡Que lo disfrutéis!' },
  ];
  const current = order.status === 'delivered' ? 3 : order.status === 'shipped' ? 2 : 1;

  return (
    <section className="rounded-2xl border border-[#efe7da] bg-white p-5 sm:p-6" aria-live="polite">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold">Pedido #{order.id}</h2>
        <span className="text-sm text-[#565a78]">€{order.total.toFixed(2)}</span>
      </div>

      <ol className="mb-6">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.label} className="relative flex gap-3 pb-5 last:pb-0">
              {i < steps.length - 1 && <span className={`absolute left-[15px] top-8 h-[calc(100%-32px)] w-0.5 ${i < current ? 'bg-[#15803d]' : 'bg-[#e4dccf]'}`} aria-hidden="true" />}
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                done ? 'bg-[#15803d] text-white' : active ? 'bg-[#23263f] text-white ring-4 ring-[#23263f]/15' : 'bg-[#f1ece4] text-[#9a97ab]'
              }`}>
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className="pt-1">
                <span className={`block font-semibold ${active ? 'text-[#23263f]' : done ? 'text-[#23263f]' : 'text-[#9a97ab]'}`}>{s.label}</span>
                {(active || i === 0) && <span className="block text-sm text-[#565a78]">{s.hint}</span>}
              </span>
            </li>
          );
        })}
      </ol>

      {order.trackingUrl && order.status !== 'pending' && (
        <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="mb-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c2410c] px-4 font-bold text-white transition-colors hover:bg-[#9a3412]">
          <ExternalLink className="h-4 w-4" /> Seguir el envío
        </a>
      )}

      {order.point && (
        <div className="mb-5 rounded-xl bg-[#FFF4E0] p-4">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#9a3412]"><MapPin className="h-3.5 w-3.5" /> Punto de recogida</p>
          <p className="font-semibold">{order.point.name}</p>
          <p className="text-sm text-[#565a78]">{order.point.address}{order.point.zipCity ? ` · ${order.point.zipCity}` : ''}</p>
        </div>
      )}

      {order.items.length > 0 && (
        <ul className="space-y-1.5 border-t border-[#efe7da] pt-4 text-sm">
          {order.items.map((it, i) => (
            <li key={i} className="flex items-center gap-2 text-[#565a78]">
              <Package className="h-4 w-4 shrink-0" /> <span className="min-w-0 flex-1 truncate">{it.name}</span> <span>×{it.quantity}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
