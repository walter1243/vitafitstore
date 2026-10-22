'use client';
import { useEffect, useState } from 'react';
import { Home, Loader2, LocateFixed, MapPin, Store } from 'lucide-react';

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
  // "Usar mi ubicación": GPS do navegador → CP pelo endereco.
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  function locate() {
    setGeoError('');
    if (!navigator.geolocation) { setGeoError('Tu navegador no permite ubicación. Escribe el código postal.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const r = await fetch(`/api/shipping/geo?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
        const d = await r.json();
        if (!r.ok || !d?.zip) throw new Error(d?.error || 'No encontramos tu código postal.');
        setZip(d.zip); saveZip(d.zip);
      } catch (e: any) {
        setGeoError(e?.message || 'No encontramos tu código postal.');
      } finally { setLocating(false); }
    }, () => { setLocating(false); setGeoError('Permite la ubicación o escribe el código postal.'); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
  }
  const z = zip.replace(/\D/g, '');
  const { quote, loading } = useShipQuote([{ productId, quantity, size }], z.length === 5 ? z : SAMPLE_ZIP);
  const chosen = quote ? (quote[method] ?? quote.pickup ?? quote.home) : null;
  const charged = chosen ? chosen.charged : null;
  useEffect(() => { onShipping?.(charged); }, [charged, onShipping]);
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="mb-2 text-sm font-bold text-slate-900">Envío</p>
      <div className="mb-3 flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Código postal</span>
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            value={zip}
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            placeholder="Tu código postal"
            onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 5); setZip(v); if (v.length === 5) saveZip(v); }}
            className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-center text-base font-semibold tracking-wider text-slate-900 outline-none transition-colors placeholder:font-normal placeholder:tracking-normal focus:border-[#c2410c]"
          />
        </label>
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition-colors hover:border-[#c2410c] hover:text-[#c2410c] disabled:cursor-wait disabled:opacity-60"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LocateFixed className="h-4 w-4" aria-hidden="true" />}
          <span className="hidden sm:inline">Usar mi ubicación</span>
          <span className="sm:hidden">Ubicación</span>
        </button>
      </div>
      {geoError && <p className="-mt-1 mb-2 text-xs font-medium text-red-600">{geoError}</p>}
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
