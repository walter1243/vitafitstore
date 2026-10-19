'use client';
import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, ExternalLink, Mail, Send, Truck, X } from 'lucide-react';

export type TrackingOrder = {
  id: number;
  customer: string;
  customerEmail?: string;
  product: string;
  status: 'pending' | 'shipped' | 'delivered';
  tracking: string;
  trackingUrl?: string;
  trackingSentAt?: string | null;
  seen?: boolean;
  dateTime?: string;
  date: string;
};

// Pedido que ainda precisa do link de rastreio enviado ao cliente.
export const needsTracking = (o: TrackingOrder) => !o.trackingSentAt && o.status === 'pending';
// Aviso novo (pisca ate o admin abrir).
export const isNewAlert = (o: TrackingOrder) => needsTracking(o) && !o.seen;

// Admin → Rastreio: cada compra nova aparece como um aviso piscando com o
// nome e o e-mail do cliente. Ao clicar, abre so o campo pra colar o link da
// transportadora; "Enviar" manda ao cliente o e-mail (espanhol) com o link.
export function TrackingSection({ orders, onChanged, notify }: {
  orders: TrackingOrder[];
  onChanged: () => Promise<void> | void;
  notify: (type: 'success' | 'error', msg: string) => void;
}) {
  const [open, setOpen] = useState<TrackingOrder | null>(null);
  const [code, setCode] = useState('');
  const pending = orders.filter(needsTracking);
  const sent = orders.filter(o => o.trackingSentAt).slice(0, 15);

  async function openAlert(o: TrackingOrder) {
    setOpen(o);
    if (!o.seen) {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seen', id: o.id }),
      }).catch(() => {});
      void onChanged();
    }
  }

  return (
    <div className="space-y-5 text-white">
      <section className="rounded-2xl border border-white/10 bg-[#161b28] p-5 sm:p-6">
        <div className="mb-1 flex items-center gap-2">
          <Bell size={16} className={pending.some(isNewAlert) ? 'animate-bounce text-red-400' : 'text-green-500'} />
          <h2 className="font-semibold">Enviar rastreio aos clientes</h2>
          {pending.length > 0 && (
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-300">{pending.length} pendente{pending.length > 1 ? 's' : ''}</span>
          )}
        </div>
        <p className="mb-4 text-sm text-white/60">
          Cada compra nova aparece aqui piscando. Quando a transportadora mandar o link, clique no aviso, cole o link e envie — o cliente recebe um e-mail em espanhol com o link de rastreio.
        </p>

        {pending.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0f1117] px-4 py-5 text-sm text-white/50">
            <CheckCircle2 size={16} className="text-green-500" /> Nenhum envio pendente.
          </div>
        ) : (
          <ul className="grid gap-2">
            {pending.map(o => {
              const fresh = isNewAlert(o);
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => openAlert(o)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      fresh ? 'admin-alert-blink border-red-400/60 bg-red-500/10' : 'border-amber-400/30 bg-amber-500/5 hover:bg-amber-500/10'
                    }`}
                  >
                    <span className={`relative flex h-3 w-3 shrink-0`}>
                      {fresh && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />}
                      <span className={`relative inline-flex h-3 w-3 rounded-full ${fresh ? 'bg-red-500' : 'bg-amber-400'}`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{o.customer || 'Cliente'} <span className="font-normal text-white/40">· pedido #{o.id}</span></span>
                      <span className="flex items-center gap-1 truncate text-sm text-white/60"><Mail size={12} /> {o.customerEmail || 'sem e-mail'}</span>
                    </span>
                    <span className="hidden shrink-0 text-right text-xs text-white/50 sm:block">
                      <span className="block">{o.product}</span>
                      <span className="block">{o.dateTime || o.date}</span>
                    </span>
                    <span className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${fresh ? 'bg-red-500 text-white' : 'bg-white/10 text-white/80'}`}>
                      {fresh ? 'Novo!' : 'Enviar link'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {sent.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-[#161b28] p-5 sm:p-6">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><Send size={15} className="text-green-500" /> Rastreios enviados</h2>
          <ul className="divide-y divide-white/10 text-sm">
            {sent.map(o => (
              <li key={o.id} className="flex items-center gap-3 py-2.5">
                <CheckCircle2 size={15} className="shrink-0 text-green-500" />
                <span className="min-w-0 flex-1 truncate">{o.customer} <span className="text-white/40">· {o.customerEmail}</span></span>
                {o.trackingUrl && (
                  <a href={o.trackingUrl} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1 text-xs text-green-400 hover:underline">
                    <ExternalLink size={12} /> link
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="max-w-lg rounded-2xl border border-white/10 bg-[#161b28] p-5 sm:p-6">
        <h2 className="mb-1 flex items-center gap-2 font-semibold"><Truck size={16} className="text-green-500" />Consultar envio (Correos)</h2>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.trim())}
            placeholder="Ex: ES123456789ES"
            onKeyDown={e => { if (e.key === 'Enter' && code) window.open(`https://www.correos.es/es/es/herramientas/localizador/envios?numero=${code}`, '_blank'); }}
            className="flex-1 rounded-lg border border-white/10 bg-[#1c2236] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
          />
          <a
            href={code ? `https://www.correos.es/es/es/herramientas/localizador/envios?numero=${code}` : undefined}
            target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition-colors ${code ? 'cursor-pointer hover:bg-white/15' : 'pointer-events-none opacity-40'}`}
          >
            <ExternalLink size={14} />Rastrear
          </a>
        </div>
      </section>

      {open && (
        <SendTrackingPopup
          order={open}
          onClose={() => setOpen(null)}
          onSent={async (email) => {
            setOpen(null);
            notify('success', `E-mail de rastreio enviado para ${email}.`);
            await onChanged();
          }}
        />
      )}
    </div>
  );
}

function SendTrackingPopup({ order, onClose, onSent }: {
  order: TrackingOrder;
  onClose: () => void;
  onSent: (email: string) => void;
}) {
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function send() {
    const url = link.trim();
    if (!url) { setError('Cole o link de rastreio.'); return; }
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendTracking', id: order.id, trackingUrl: url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.error ?? 'Falha ao enviar.'); return; }
      onSent(data.sentTo ?? order.customerEmail ?? '');
    } catch {
      setError('Erro de conexão. Tente de novo.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Enviar link de rastreio"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161b28] p-5 text-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold">Cole o link de rastreio</h3>
            <p className="truncate text-xs text-white/50">{order.customer} · {order.customerEmail || 'sem e-mail'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); void send(); }} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="url"
            inputMode="url"
            value={link}
            onChange={e => { setLink(e.target.value); setError(''); }}
            placeholder="https://..."
            className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/40"
          />
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={sending || !link.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={15} /> {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}
