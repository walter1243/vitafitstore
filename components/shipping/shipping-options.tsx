'use client';
import { useEffect, useState } from 'react';
import { Home, Loader2, MapPin, Store } from 'lucide-react';

// Frete pela Packlink: "Recoger en punto" (mais barato) ou "Entrega a
// domicilio". O CP e o metodo escolhidos ficam guardados no navegador e
// sao usados no carrinho e no checkout.
export type ShipMethod = 'home' | 'pickup';
type Opt = { serviceId: string; carrier: string; service: string; price: number; charged: number; type: ShipMethod } | null;
export type ShipQuote = { free: boolean; home: Opt; pickup: Opt; error?: string };

const ZIP_KEY = 'kitoys_zip';
const METHOD_KEY = 'kitoys_ship_method';
export const SAMPLE_ZIP = '28001';

export function loadZip() { try { return localStorage.getItem(ZIP_KEY) || ''; } catch { return ''; } }
export function saveZip(z: string) { try { localStorage.setItem(ZIP_KEY, z); } catch {} }
export function loadMethod(): ShipMethod { try { return localStorage.getItem(METHOD_KEY) === 'home' ? 'home' : 'pickup'; } catch { return 'pickup'; } }
export function saveMethod(m: ShipMethod) { try { localStorage.setItem(METHOD_KEY, m); } catch {} }

export function useShipQuote(items: { productId: number; quantity: number; size?: string }[], zip: string) {
  const [quote, setQuote] = useState<ShipQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify(items) + zip;
  useEffect(() => {
    const z = zip.replace(/\D/g, '');
    if (z.length !== 5 || items.length === 0) { setQuote(null); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/shipping/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, zip: z }), signal: ctrl.signal });
        const d = await r.json();
        setQuote(r.ok ? d : null);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setQuote(null);
      } finally { setLoading(false); }
    }, 250);
    return () => { ctrl.abort(); clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { quote, loading };
}

const money = (o: Opt) => (o ? (o.charged === 0 ? 'Gratis' : `${o.charged.toFixed(2)}€`) : '—');

// As duas opcoes, como botoes de escolha.
export function ShipOptionsList({ quote, method, onMethod, loading }: { quote: ShipQuote | null; method: ShipMethod; onMethod: (m: ShipMethod) => void; loading?: boolean }) {
  if (loading && !quote) return <p className="flex items-center gap-2 py-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Calculando envío…</p>;
  if (!quote || (!quote.home && !quote.pickup)) return null;
  const rows: { m: ShipMethod; o: Opt; title: string; Icon: typeof Home }[] = [
    { m: 'pickup', o: quote.pickup, title: 'Recoger en punto', Icon: Store },
    { m: 'home', o: quote.home, title: 'Entrega a domicilio', Icon: Home },
  ];
  return (
    <div className="grid gap-2" role="radiogroup" aria-label="Forma de envío">
      {rows.filter((r) => r.o).map(({ m, o, title, Icon }) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={method === m}
          onClick={() => onMethod(m)}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-colors ${method === m ? 'border-[#c2410c] bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
        >
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${method === m ? 'border-[#c2410c]' : 'border-slate-300'}`}>
            {method === m && <span className="h-2.5 w-2.5 rounded-full bg-[#c2410c]" />}
          </span>
          <Icon className="h-5 w-5 shrink-0 text-slate-700" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-slate-900">{title}</span>
            <span className="block truncate text-xs text-slate-500">{o!.carrier}</span>
          </span>
          <span className={`shrink-0 text-sm font-extrabold ${o!.charged === 0 ? 'text-emerald-700' : 'text-slate-900'}`}>{money(o)}</span>
        </button>
      ))}
    </div>
  );
}

// Pagina do produto: CP + as opcoes com preco da Packlink.
// `onShipping`: avisa a pagina o frete da opcao escolhida (pro total com envio).
export function ProductShipping({ productId, quantity, size, onShipping }: { productId: number; quantity: number; size?: string; onShipping?: (charged: number | null) => void }) {
  const [zip, setZip] = useState('');
  const [method, setMethod] = useState<ShipMethod>('pickup');
  useEffect(() => { setZip(loadZip()); setMethod(loadMethod()); }, []);
  const z = zip.replace(/\D/g, '');
  const { quote, loading } = useShipQuote([{ productId, quantity, size }], z.length === 5 ? z : SAMPLE_ZIP);
  const chosen = quote ? (quote[method] ?? quote.pickup ?? quote.home) : null;
  const charged = chosen ? chosen.charged : null;
  useEffect(() => { onShipping?.(charged); }, [charged, onShipping]);
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-900">Envío</p>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          <input
            value={zip}
            inputMode="numeric"
            maxLength={5}
            placeholder="Tu código postal"
            onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 5); setZip(v); if (v.length === 5) saveZip(v); }}
            className="h-8 w-32 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 outline-none focus:border-[#c2410c]"
          />
        </label>
      </div>
      <ShipOptionsList quote={quote} method={method} onMethod={(m) => { setMethod(m); saveMethod(m); }} loading={loading} />
      <p className="mt-2 text-[11px] text-slate-500">
        {z.length === 5 ? `Precio para ${z}.` : `Precio de referencia (${SAMPLE_ZIP}). Escribe tu código postal para el tuyo.`} Envío gratis en pedidos +50€.
      </p>
    </div>
  );
}

// Checkout: puntos de recogida cerca del CP.
export type PickupPoint = { id: string; name: string; address: string; city: string; zip: string };
export function PickupPoints({ serviceId, zip, value, onChange }: { serviceId: string; zip: string; value: PickupPoint | null; onChange: (p: PickupPoint) => void }) {
  const [points, setPoints] = useState<PickupPoint[] | null>(null);
  useEffect(() => {
    if (!serviceId || zip.length !== 5) return;
    setPoints(null);
    fetch(`/api/shipping/points?service=${encodeURIComponent(serviceId)}&zip=${zip}`).then((r) => r.json()).then((d) => setPoints(Array.isArray(d?.points) ? d.points : [])).catch(() => setPoints([]));
  }, [serviceId, zip]);
  if (points === null) return <p className="flex items-center gap-2 py-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Buscando puntos de recogida…</p>;
  if (points.length === 0) return <p className="py-2 text-sm text-red-600">No encontramos puntos cerca de {zip}. Elige entrega a domicilio.</p>;
  return (
    <div className="mt-2 max-h-64 space-y-1.5 overflow-y-auto pr-1" role="radiogroup" aria-label="Punto de recogida">
      {points.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={value?.id === p.id}
          onClick={() => onChange(p)}
          className={`flex w-full cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-left ${value?.id === p.id ? 'border-[#c2410c] bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
        >
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#c2410c]" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-900">{p.name}</span>
            <span className="block text-xs text-slate-500">{p.address} · {p.zip} {p.city}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
